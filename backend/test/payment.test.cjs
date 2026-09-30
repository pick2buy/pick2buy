const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');

process.env.RAZORPAY_KEY_ID = 'rzp_test_unit';
process.env.RAZORPAY_KEY_SECRET = 'unit-test-secret';
const { PaymentService } = require('../dist/lib/payment');

test('Razorpay signature accepts only the matching order and payment IDs', () => {
  const signed = {
    razorpayOrderId: 'order_unit',
    razorpayPaymentId: 'pay_unit',
    razorpaySignature: crypto.createHmac('sha256', 'unit-test-secret')
      .update('order_unit|pay_unit').digest('hex'),
  };
  assert.equal(PaymentService.verifySignature(signed), true);
  assert.equal(PaymentService.verifySignature({ ...signed, razorpayOrderId: 'order_other' }), false);
  assert.equal(PaymentService.verifySignature({ ...signed, razorpayPaymentId: 'pay_other' }), false);
  assert.equal(PaymentService.verifySignature({ ...signed, razorpaySignature: 'simulated_signature_valid' }), false);
});
