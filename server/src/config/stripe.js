const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Create payment intent
const createPaymentIntent = async (amount, currency = 'usd', metadata = {}) => {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // Amount in cents
      currency,
      metadata,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return paymentIntent;
  } catch (error) {
    console.error('Stripe create payment intent error:', error);
    throw error;
  }
};

// Create customer
const createCustomer = async (email, name, metadata = {}) => {
  try {
    const customer = await stripe.customers.create({
      email,
      name,
      metadata
    });

    return customer;
  } catch (error) {
    console.error('Stripe create customer error:', error);
    throw error;
  }
};

// Create subscription
const createSubscription = async (customerId, priceId, metadata = {}) => {
  try {
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      metadata,
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
    });

    return subscription;
  } catch (error) {
    console.error('Stripe create subscription error:', error);
    throw error;
  }
};

// Verify webhook signature
const verifyWebhookSignature = (body, signature) => {
  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    return event;
  } catch (error) {
    console.error('Stripe webhook signature verification failed:', error);
    throw error;
  }
};

// Get payment intent
const getPaymentIntent = async (paymentIntentId) => {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return paymentIntent;
  } catch (error) {
    console.error('Stripe get payment intent error:', error);
    throw error;
  }
};

// Refund payment
const refundPayment = async (paymentIntentId, amount, metadata = {}) => {
  try {
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: amount * 100, // Amount in cents
      metadata
    });

    return refund;
  } catch (error) {
    console.error('Stripe refund error:', error);
    throw error;
  }
};

// Cancel subscription
const cancelSubscription = async (subscriptionId) => {
  try {
    const subscription = await stripe.subscriptions.del(subscriptionId);
    return subscription;
  } catch (error) {
    console.error('Stripe cancel subscription error:', error);
    throw error;
  }
};

module.exports = {
  stripe,
  createPaymentIntent,
  createCustomer,
  createSubscription,
  verifyWebhookSignature,
  getPaymentIntent,
  refundPayment,
  cancelSubscription
};