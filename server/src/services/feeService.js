const BaseService = require('../core/BaseService');

class FeeService extends BaseService {
  async setFees(feeData, organizationId) {
    feeData.status = 'pending';
    return await this.repository.create(feeData, organizationId);
  }

  async getFeeDetails(studentId, organizationId) {
    return await this.repository.findAll({ student_id: studentId }, {}, organizationId);
  }

  async recordPayment(feeId, paymentData, organizationId) {
    return await this.repository.update(feeId, {
      status: 'paid',
      paid_amount: paymentData.amount,
      paid_at: new Date(),
      payment_id: paymentData.payment_id
    }, organizationId);
  }

  async getPendingFees(organizationId) {
    return await this.repository.findAll({ status: 'pending' }, {}, organizationId);
  }

  async getPaymentHistory(studentId, organizationId) {
    return await this.repository.findAll({ 
      student_id: studentId,
      status: 'paid'
    }, {}, organizationId);
  }

  async sendReminder(studentId, organizationId) {
    return { success: true, message: 'Reminder sent' };
  }
}

module.exports = new FeeService();
