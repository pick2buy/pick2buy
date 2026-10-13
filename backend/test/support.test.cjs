const test = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { prisma } = require('../dist/lib/prisma');
const { SupportController } = require('../dist/controllers/support.controller');
const { AdminController } = require('../dist/controllers/admin.controller');

async function call(action, { body = {}, params = {}, user } = {}) {
  let status = 200;
  let result;
  let failure;
  const response = { status(value) { status = value; return this; }, json(value) { result = value; return this; } };
  await action({ body, params, user }, response, error => { failure = error; });
  if (failure) throw failure;
  return { status, result };
}

test('customer tickets reach admin and replies are visible only to their owner', async () => {
  const users = await Promise.all(['CUSTOMER', 'CUSTOMER', 'ADMIN'].map(role =>
    prisma.user.create({ data: { email: `support-${randomUUID()}@example.com`, name: role, passwordHash: 'unused', role } })));
  const [customer, otherCustomer, admin] = users;
  let ticketId;
  try {
    const created = await call(SupportController.create, {
      user: customer, body: { subject: 'Order question', description: 'Please check my order status.' },
    });
    assert.equal(created.status, 201);
    assert.match(created.result.data.ticketNumber, /^P2B-SUP-/);
    const adminList = (await call(AdminController.getSupportTickets, { user: admin })).result.data;
    const ticket = adminList.find(item => item.ticketNumber === created.result.data.ticketNumber);
    assert.equal(ticket.customer.email, customer.email);
    assert.equal(ticket.description, 'Please check my order status.');
    ticketId = ticket.id;

    const reply = await call(AdminController.replySupportTicket, {
      user: admin, params: { ticketId }, body: { message: 'We are checking it now.', status: 'IN_PROGRESS' },
    });
    assert.equal(reply.result.data.status, 'IN_PROGRESS');
    assert.equal(reply.result.data.messages[0].message, 'We are checking it now.');

    const mine = (await call(SupportController.listMine, { user: customer })).result.data;
    assert.equal(mine.find(item => item.id === ticketId).messages[0].message, 'We are checking it now.');
    const theirs = (await call(SupportController.listMine, { user: otherCustomer })).result.data;
    assert.equal(theirs.some(item => item.id === ticketId), false);
  } finally {
    if (ticketId) await prisma.supportTicket.delete({ where: { id: ticketId } });
    await prisma.user.deleteMany({ where: { id: { in: users.map(user => user.id) } } });
    await prisma.$disconnect();
  }
});
