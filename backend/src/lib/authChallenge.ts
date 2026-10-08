import { createHmac, randomInt, randomUUID, timingSafeEqual } from 'crypto';
import { prisma } from './prisma';
import { config } from '../config';
import { EmailService } from './email';

const lifetimeMs = 10 * 60 * 1000;
const resendDelayMs = 60 * 1000;
const maxAttempts = 5;
const maxResends = 3;

const digest = (id: string, code: string) =>
  createHmac('sha256', config.jwt.secret).update(`${id}:${code}`).digest('hex');

const makeCode = () => randomInt(0, 1_000_000).toString().padStart(6, '0');
const unavailable = (missingConfiguration = false) => Object.assign(
  new Error(missingConfiguration
    ? (config.nodeEnv === 'production'
      ? 'Email sign-in is temporarily unavailable. Please contact support.'
      : 'Email sign-in needs SMTP setup. Add a valid SMTP_PASSWORD to backend/.env.local, restart the backend, and use an email inbox you can access.')
    : 'Verification email could not be delivered. Please try again later.'),
  { statusCode: 503 }
);

export async function startAuthChallenge(user: { id: string; email: string }, purpose: 'LOGIN' | 'SIGNUP' | 'RESET') {
  if (!EmailService.isConfigured) throw unavailable(true);
  const code = makeCode();
  const now = new Date();
  const existing = await prisma.authChallenge.findUnique({ where: { userId: user.id } });
  // Keep a live challenge stable so a repeated password submission cannot bypass resend cooldown.
  if (existing && existing.purpose === purpose && existing.expiresAt > now && existing.lastSentAt.getTime() + resendDelayMs > now.getTime()) {
    return { challengeId: existing.id, email: user.email, expiresIn: Math.max(0, Math.ceil((existing.expiresAt.getTime() - now.getTime()) / 1000)), resendAfter: Math.ceil((existing.lastSentAt.getTime() + resendDelayMs - now.getTime()) / 1000) };
  }
  const id = existing?.id ?? randomUUID();
  const challenge = await prisma.authChallenge.upsert({
    where: { userId: user.id },
    create: { id, userId: user.id, purpose, codeHash: digest(id, code), expiresAt: new Date(now.getTime() + lifetimeMs), lastSentAt: now },
    update: { purpose, codeHash: digest(id, code), expiresAt: new Date(now.getTime() + lifetimeMs), lastSentAt: now, attempts: 0, resendCount: 0 },
  });
  try {
    await EmailService.sendVerificationCode(user.email, code, purpose);
  } catch (error) {
    await prisma.authChallenge.deleteMany({ where: { id: challenge.id, codeHash: challenge.codeHash } });
    if ((error as any)?.statusCode === 503) throw error;
    throw unavailable();
  }
  return { challengeId: challenge.id, email: user.email, expiresIn: 600, resendAfter: 60 };
}

export async function resendAuthChallenge(challengeId: string) {
  const challenge = await prisma.authChallenge.findUnique({ where: { id: challengeId }, include: { user: true } });
  const now = new Date();
  if (!challenge || challenge.expiresAt <= now || challenge.attempts >= maxAttempts) {
    throw Object.assign(new Error('Verification expired. Please start again.'), { statusCode: 400 });
  }
  if (challenge.lastSentAt.getTime() + resendDelayMs > now.getTime()) {
    throw Object.assign(new Error('Please wait before requesting another code.'), { statusCode: 429 });
  }
  if (challenge.resendCount >= maxResends) {
    throw Object.assign(new Error('Resend limit reached. Please start again.'), { statusCode: 429 });
  }
  const code = makeCode();
  const codeHash = digest(challenge.id, code);
  const changed = await prisma.authChallenge.updateMany({
    where: { id: challenge.id, codeHash: challenge.codeHash, lastSentAt: { lte: new Date(now.getTime() - resendDelayMs) }, resendCount: { lt: maxResends } },
    data: { codeHash, lastSentAt: now, expiresAt: new Date(now.getTime() + lifetimeMs), attempts: 0, resendCount: { increment: 1 } },
  });
  if (!changed.count) throw Object.assign(new Error('Please wait before requesting another code.'), { statusCode: 429 });
  try {
    await EmailService.sendVerificationCode(challenge.user.email, code, challenge.purpose as 'LOGIN' | 'SIGNUP' | 'RESET');
  } catch (error) {
    await prisma.authChallenge.deleteMany({ where: { id: challenge.id, codeHash } });
    if ((error as any)?.statusCode === 503) throw error;
    throw unavailable();
  }
  return { challengeId: challenge.id, email: challenge.user.email, expiresIn: 600, resendAfter: 60 };
}

export async function consumeAuthChallenge(challengeId: string, code: string, allowedPurposes: readonly string[] = ['LOGIN', 'SIGNUP']) {
  const challenge = await prisma.authChallenge.findUnique({ where: { id: challengeId }, include: { user: true } });
  const now = new Date();
  if (!challenge || !allowedPurposes.includes(challenge.purpose) || challenge.expiresAt <= now || challenge.attempts >= maxAttempts) {
    throw Object.assign(new Error('Verification expired. Please start again.'), { statusCode: 400 });
  }
  const actual = Buffer.from(digest(challenge.id, code), 'hex');
  const expected = Buffer.from(challenge.codeHash, 'hex');
  if (!timingSafeEqual(actual, expected)) {
    await prisma.authChallenge.updateMany({
      where: { id: challenge.id, codeHash: challenge.codeHash, purpose: challenge.purpose, attempts: { lt: maxAttempts } },
      data: { attempts: { increment: 1 } },
    });
    throw Object.assign(new Error('Incorrect verification code.'), { statusCode: 400 });
  }
  const consumed = await prisma.authChallenge.deleteMany({
    where: { id: challenge.id, codeHash: challenge.codeHash, purpose: challenge.purpose, expiresAt: { gt: now }, attempts: { lt: maxAttempts } },
  });
  if (!consumed.count) throw Object.assign(new Error('Verification expired. Please start again.'), { statusCode: 400 });
  return { user: challenge.user, purpose: challenge.purpose };
}
