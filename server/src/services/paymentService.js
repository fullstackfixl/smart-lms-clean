const BaseService = require('../core/BaseService');

class PaymentService extends BaseService {
  async createPayment(paymentData, userId, organizationId) {
    paymentData.user_id = userId;
    paymentData.status = 'pending';
    paymentData.transaction_id = `TXN_${Date.now()}`;
    
    return await this.repository.create(paymentData, organizationId);
  }

  async verifyPayment(transactionId, organizationId) {
    const payment = await this.repository.findAll({ transaction_id: transactionId }, {}, organizationId);
    
    if (payment.data.length > 0) {
      return await this.repository.update(payment.data[0]._id, {
        status: 'completed'
      }, organizationId);
    }
    
    throw new Error('Payment not found');
  }

  async processWebhook(webhookData) {
    return { success: true, message: 'Webhook processed' };
  }

  async getPaymentHistory(userId, organizationId) {
    return await this.repository.findAll({ user_id: userId }, {}, organizationId);
  }

  async processRefund(transactionId, organizationId) {
    const payment = await this.repository.findAll({ transaction_id: transactionId }, {}, organizationId);
    
    if (payment.data.length > 0) {
      return await this.repository.update(payment.data[0]._id, {
        status: 'refunded'
      }, organizationId);
    }
    
    throw new Error('Payment not found');
  }
}

module.exports = new PaymentService();
