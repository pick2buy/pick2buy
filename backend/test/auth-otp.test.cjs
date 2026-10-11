const test = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { prisma } = require('../dist/lib/prisma');
const { EmailService } = require('../dist/lib/email');
const { config } = require('../dist/config');
const { startAuthChallenge, resendAuthChallenge, consumeAuthChallenge } = require('../dist/lib/authChallenge');
const { AuthController } = require('../dist/controllers/auth.controller');
const { authenticateJwt } = require('../dist/middlewares/auth');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

async function call(action, body, user) {
  let status = 200;
  let result;
  let failure;
  const response = {
    status(value) { status = value; return this; },
    json(value) { result = value; return this; },
  };
  await action({ body, user }, response, (error) => { failure = error; });
  if (failure) throw failure;
  return { status, result };
}

test('email code is required, expires, resends, and can only be used once', async () => {
  const sent = [];
  const original = EmailService.sendVerificationCode;
  const originalPassword = config.email.password;
  config.email.password = 'test-only-mail-password';
  EmailService.sendVerificationCode = async (_email, code) => { sent.push(code); return true; };
  const user = await prisma.user.create({
    data: { email: `otp-test-${randomUUID()}@example.com`, name: 'OTP Test', passwordHash: 'unused' },
  });
  try {
    const first = await startAuthChallenge(user, 'SIGNUP');
    assert.equal(sent.length, 1);
    assert.match(sent[0], /^\d{6}$/);
    assert.notEqual(first.challengeId, sent[0]);
    const record = await prisma.authChallenge.findUniqueOrThrow({ where: { id: first.challengeId } });
    assert.notEqual(record.codeHash, sent[0]);
    await assert.rejects(consumeAuthChallenge(first.challengeId, '999999' === sent[0] ? '000000' : '999999'), /Incorrect/);
    const afterWrong = await prisma.authChallenge.findUniqueOrThrow({ where: { id: first.challengeId } });
    assert.equal(afterWrong.attempts, 1);
    await assert.rejects(resendAuthChallenge(first.challengeId), /wait/);
    await prisma.authChallenge.update({
      where: { id: first.challengeId },
      data: { lastSentAt: new Date(Date.now() - 61_000) },
    });
    await resendAuthChallenge(first.challengeId);
    assert.equal(sent.length, 2);
    await assert.rejects(consumeAuthChallenge(first.challengeId, sent[0]), /Incorrect/);
    const result = await consumeAuthChallenge(first.challengeId, sent[1]);
    assert.equal(result.user.id, user.id);
    await assert.rejects(consumeAuthChallenge(first.challengeId, sent[1]), /expired/);
    const expiring = await startAuthChallenge(user, 'LOGIN');
    await prisma.authChallenge.update({ where: { id: expiring.challengeId }, data: { expiresAt: new Date(Date.now() - 1000) } });
    await assert.rejects(consumeAuthChallenge(expiring.challengeId, sent[2]), /expired/);
  } finally {
    EmailService.sendVerificationCode = original;
    config.email.password = originalPassword;
    await prisma.user.delete({ where: { id: user.id } });
    await prisma.$disconnect();
  }
});

test('profile edits keep the role fixed and email changes require a code sent to the new address', async () => {
  const originalSend = EmailService.sendVerificationCode;
  const originalMail = EmailService.sendMail;
  const originalPassword = config.email.password;
  const sent = [];
  config.email.password = 'test-only-mail-password';
  EmailService.sendVerificationCode = async (to, code, purpose) => { sent.push({ to, code, purpose }); return true; };
  EmailService.sendMail = async () => true;
  const user = await prisma.user.create({ data: {
    email: `profile-old-${randomUUID()}@example.com`, name: 'Original Name', passwordHash: 'unused', role: 'CUSTOMER', isEmailVerified: true,
  } });
  const newEmail = `profile-new-${randomUUID()}@example.com`;
  try {
    await assert.rejects(call(AuthController.updateProfile, { name: 'Changed Name', role: 'ADMIN' }, user), (error) => error?.issues?.some((issue) => issue.code === 'unrecognized_keys'));
    const avatarUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+nmN8AAAAASUVORK5CYII=';
    const updated = await call(AuthController.updateProfile, { name: 'Changed Name', phone: '9876543210', avatarUrl }, user);
    assert.equal(updated.result.data.user.name, 'Changed Name');
    assert.equal(updated.result.data.user.role, 'CUSTOMER');
    assert.equal(updated.result.data.user.phone, '9876543210');
    assert.equal(updated.result.data.user.avatarUrl, avatarUrl);

    const pending = await call(AuthController.requestEmailChange, { email: newEmail }, user);
    assert.equal(pending.result.data.email, newEmail);
    assert.equal(sent[0].to, newEmail);
    assert.equal(sent[0].purpose, 'EMAIL_CHANGE');
    assert.equal((await prisma.user.findUniqueOrThrow({ where: { id: user.id } })).email, user.email);
    await assert.rejects(call(AuthController.confirmEmailChange, { challengeId: pending.result.data.challengeId, code: '999999' === sent[0].code ? '000000' : '999999' }, user), /Incorrect/);
    const confirmed = await call(AuthController.confirmEmailChange, { challengeId: pending.result.data.challengeId, code: sent[0].code }, user);
    assert.equal(confirmed.result.data.user.email, newEmail);
    assert.equal(confirmed.result.data.user.role, 'CUSTOMER');
    const replay = await call(AuthController.confirmEmailChange, { challengeId: pending.result.data.challengeId, code: sent[0].code }, user);
    assert.equal(replay.status, 400);
  } finally {
    EmailService.sendVerificationCode = originalSend;
    EmailService.sendMail = originalMail;
    config.email.password = originalPassword;
    await prisma.user.delete({ where: { id: user.id } });
    await prisma.$disconnect();
  }
});

test('password recovery uses a reset-only code and revokes older sessions', async () => {
  const sent = [];
  const originalSend = EmailService.sendVerificationCode;
  const originalMail = EmailService.sendMail;
  const originalPassword = config.email.password;
  config.email.password = 'test-only-mail-password';
  EmailService.sendVerificationCode = async (_email, code, purpose) => { sent.push({ code, purpose }); return true; };
  EmailService.sendMail = async () => true;
  const oldPassword = 'OldPassword123!';
  const user = await prisma.user.create({
    data: { email: `otp-reset-${randomUUID()}@example.com`, name: 'Reset Test',
      passwordHash: await bcrypt.hash(oldPassword, 10), isEmailVerified: true },
  });
  try {
    const oldToken = jwt.sign({ id: user.id, tokenVersion: 0 }, config.jwt.secret, { expiresIn: '1h' });
    const activeBefore = { headers: { authorization: `Bearer ${oldToken}` } };
    await authenticateJwt(activeBefore, {}, () => {});
    assert.equal(activeBefore.user.id, user.id);

    const recovery = await call(AuthController.forgotPassword, { email: user.email });
    const unknownRecovery = await call(AuthController.forgotPassword, { email: `unknown-${randomUUID()}@example.com` });
    assert.equal(recovery.result.message, unknownRecovery.result.message);
    for (let attempt = 0; attempt < 20 && sent.length === 0; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, 25));
    }
    const pending = await prisma.authChallenge.findUniqueOrThrow({ where: { userId: user.id } });
    assert.equal(sent[0].purpose, 'RESET');
    await assert.rejects(call(AuthController.verifyCode, { challengeId: pending.id, code: sent[0].code }), /expired/);
    await assert.rejects(call(AuthController.resetPassword, {
      email: user.email, code: sent[0].code === '000000' ? '999999' : '000000', newPassword: 'NewPassword123!',
    }), /Incorrect/);
    const reset = await call(AuthController.resetPassword, { email: user.email, code: sent[0].code, newPassword: 'NewPassword123!' });
    assert.equal(reset.result.success, true);
    const updated = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    assert.equal(await bcrypt.compare('NewPassword123!', updated.passwordHash), true);
    assert.equal(updated.tokenVersion, 1);
    const replay = await call(AuthController.resetPassword, { email: user.email, code: sent[0].code, newPassword: 'AnotherPassword123!' });
    assert.equal(replay.status, 400);
    const activeAfter = { headers: { authorization: `Bearer ${oldToken}` } };
    await authenticateJwt(activeAfter, {}, () => {});
    assert.equal(activeAfter.user, undefined);
  } finally {
    EmailService.sendVerificationCode = originalSend;
    EmailService.sendMail = originalMail;
    config.email.password = originalPassword;
    await prisma.user.delete({ where: { id: user.id } });
    await prisma.$disconnect();
  }
});

test('sign-up and password login issue a session only after email verification', async () => {
  const sent = [];
  const originalSend = EmailService.sendVerificationCode;
  const originalWelcome = EmailService.sendWelcome;
  const originalPassword = config.email.password;
  config.email.password = 'test-only-mail-password';
  EmailService.sendVerificationCode = async (_email, code) => { sent.push(code); return true; };
  EmailService.sendWelcome = async () => true;
  const email = `otp-flow-${randomUUID()}@example.com`;
  let user;
  try {
    const registration = await call(AuthController.register, { name: 'OTP Customer', email, password: 'CorrectHorse123!' });
    assert.equal(registration.status, 201);
    assert.ok(registration.result.data.challengeId);
    assert.equal(registration.result.data.accessToken, undefined);
    user = await prisma.user.findUniqueOrThrow({ where: { email } });
    assert.equal(user.isEmailVerified, false);
    const verified = await call(AuthController.verifyCode, { challengeId: registration.result.data.challengeId, code: sent[0] });
    assert.ok(verified.result.data.accessToken);
    assert.equal(verified.result.data.user.isEmailVerified, true);
    const login = await call(AuthController.login, { email, password: 'CorrectHorse123!' });
    assert.ok(login.result.data.challengeId);
    assert.equal(login.result.data.accessToken, undefined);
    const signedIn = await call(AuthController.verifyCode, { challengeId: login.result.data.challengeId, code: sent[1] });
    assert.ok(signedIn.result.data.accessToken);
  } finally {
    EmailService.sendVerificationCode = originalSend;
    EmailService.sendWelcome = originalWelcome;
    config.email.password = originalPassword;
    if (user) await prisma.user.delete({ where: { id: user.id } });
    await prisma.$disconnect();
  }
});
