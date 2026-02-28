const Razorpay = require('razorpay');
const crypto = require('crypto');

// Initialize Razorpay conditionally
let razorpay = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });
} else {
  console.warn('⚠️ Razorpay keys missing. Payment features will not work.');
}

// Create order
const createOrder = async (amount, currency = 'INR', receipt, notes = {}) => {
  try {
    if (!razorpay) throw new Error('Razorpay is not configured');

    const options = {
      amount: amount * 100, // Amount in paise
      currency,
      receipt,
      notes
    };

    const order = await razorpay.orders.create(options);
    return order;
  } catch (error) {
    console.error('Razorpay create order error:', error);
    throw error;
  }
};

// Verify payment signature
const verifyPaymentSignature = (orderId, paymentId, signature) => {
  const body = orderId + '|' + paymentId;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest('hex');

  return expectedSignature === signature;
};

// Verify webhook signature
const verifyWebhookSignature = (body, signature) => {
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(body)
    .digest('hex');

  return expectedSignature === signature;
};

const getPayment = async (paymentId) => {
  try {
    if (!razorpay) throw new Error('Razorpay is not configured');
    const payment = await razorpay.payments.fetch(paymentId);
    return payment;
  } catch (error) {
    console.error('Razorpay get payment error:', error);
    throw error;
  }
};

const refundPayment = async (paymentId, amount, notes = {}) => {
  try {
    if (!razorpay) throw new Error('Razorpay is not configured');
    const refund = await razorpay.payments.refund(paymentId, {
      amount: amount * 100, // Amount in paise
      notes
    });
    return refund;
  } catch (error) {
    console.error('Razorpay refund error:', error);
    throw error;
  }
};

module.exports = {
  razorpay,
  createOrder,
  verifyPaymentSignature,
  verifyWebhookSignature,
  getPayment,
  refundPayment
};