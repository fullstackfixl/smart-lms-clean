const mongoose = require('mongoose');
const logger = require('../utils/logger');
const stateManagementService = require('./stateManagementService');

/**
 * Transaction Service
 * Handles atomic database operations with distributed locking
 * Implements section 8.2.2 - Database transactions for critical operations
 */
class TransactionService {
  /**
   * Execute operation within a MongoDB transaction
   * @param {Function} callback - Async function to execute within transaction
   * @param {Object} options - Transaction options
   * @returns {Promise<any>} - Result of the callback
   */
  async executeTransaction(callback, options = {}) {
    const session = await mongoose.startSession();
    
    try {
      session.startTransaction({
        readConcern: { level: 'snapshot' },
        writeConcern: { w: 'majority' },
        ...options
      });

      logger.debug('Transaction started', { sessionId: session.id });

      const result = await callback(session);

      await session.commitTransaction();
      logger.debug('Transaction committed', { sessionId: session.id });

      return result;
    } catch (error) {
      await session.abortTransaction();
      logger.error('Transaction aborted', { 
        sessionId: session.id, 
        error: error.message 
      });
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Execute enrollment with transaction and locking
   * Ensures atomic enrollment with payment verification
   */
  async executeEnrollment(enrollmentData) {
    const { course_id, user_id, organization_id, payment_id } = enrollmentData;
    const lockResource = `enrollment:${user_id}:${course_id}`;

    return await stateManagementService.executeWithLock(
      lockResource,
      async () => {
        return await this.executeTransaction(async (session) => {
          const Course = require('../models/Course');
          const Enrollment = require('../models/Enrollment');
          const User = require('../models/User');

          // Check if already enrolled
          const existingEnrollment = await Enrollment.findOne({
            course_id,
            user_id,
            organization_id
          }).session(session);

          if (existingEnrollment) {
            throw new Error('User is already enrolled in this course');
          }

          // Get course details
          const course = await Course.findOne({
            _id: course_id,
            organization_id
          }).session(session);

          if (!course) {
            throw new Error('Course not found');
          }

          // Check course capacity
          if (course.max_students) {
            const enrollmentCount = await Enrollment.countDocuments({
              course_id,
              organization_id,
              status: 'active'
            }).session(session);

            if (enrollmentCount >= course.max_students) {
              throw new Error('Course is full');
            }
          }

          // Verify payment if required
          if (course.price > 0 && payment_id) {
            const Payment = require('../models/Payment');
            const payment = await Payment.findOne({
              _id: payment_id,
              user_id,
              status: 'completed'
            }).session(session);

            if (!payment) {
              throw new Error('Payment not found or not completed');
            }
          }

          // Create enrollment
          const enrollment = await Enrollment.create([{
            course_id,
            user_id,
            organization_id,
            enrolled_at: new Date(),
            status: 'active',
            progress: 0
          }], { session });

          // Update course enrollment count
          await Course.updateOne(
            { _id: course_id },
            { $inc: { enrollment_count: 1 } }
          ).session(session);

          // Update user enrolled courses
          await User.updateOne(
            { _id: user_id },
            { $addToSet: { enrolled_courses: course_id } }
          ).session(session);

          logger.info('Enrollment completed successfully', {
            enrollmentId: enrollment[0]._id,
            userId: user_id,
            courseId: course_id
          });

          return enrollment[0];
        });
      },
      15000 // 15 second lock timeout
    );
  }

  /**
   * Execute payment processing with transaction
   * Ensures atomic payment recording and order fulfillment
   */
  async executePayment(paymentData) {
    const { user_id, order_id, amount, payment_method, organization_id } = paymentData;
    const lockResource = `payment:${order_id}`;

    return await stateManagementService.executeWithLock(
      lockResource,
      async () => {
        return await this.executeTransaction(async (session) => {
          const Payment = require('../models/Payment');
          const Fee = require('../models/Fee');

          // Check if payment already exists
          const existingPayment = await Payment.findOne({
            order_id,
            organization_id
          }).session(session);

          if (existingPayment) {
            throw new Error('Payment already processed for this order');
          }

          // Create payment record
          const payment = await Payment.create([{
            user_id,
            order_id,
            amount,
            payment_method,
            organization_id,
            status: 'completed',
            paid_at: new Date()
          }], { session });

          // Update fee status if this is a fee payment
          if (paymentData.fee_id) {
            const fee = await Fee.findOne({
              _id: paymentData.fee_id,
              student_id: user_id,
              organization_id
            }).session(session);

            if (!fee) {
              throw new Error('Fee record not found');
            }

            // Update fee payment
            fee.paid_amount = (fee.paid_amount || 0) + amount;
            fee.pending_amount = fee.total_amount - fee.paid_amount;
            fee.status = fee.pending_amount <= 0 ? 'paid' : 'partial';
            fee.last_payment_date = new Date();

            await fee.save({ session });
          }

          logger.info('Payment processed successfully', {
            paymentId: payment[0]._id,
            userId: user_id,
            orderId: order_id,
            amount
          });

          return payment[0];
        });
      },
      20000 // 20 second lock timeout
    );
  }

  /**
   * Execute grade update with transaction
   * Ensures atomic grade update and GPA calculation
   */
  async executeGradeUpdate(gradeData) {
    const { user_id, course_id, organization_id } = gradeData;
    const lockResource = `grade:${user_id}:${course_id}`;

    return await stateManagementService.executeWithLock(
      lockResource,
      async () => {
        return await this.executeTransaction(async (session) => {
          const Grade = require('../models/Grade');
          const GradeSummary = require('../models/GradeSummary');

          // Update or create grade
          const grade = await Grade.findOneAndUpdate(
            {
              user_id,
              course_id,
              organization_id
            },
            {
              ...gradeData,
              updated_at: new Date()
            },
            {
              upsert: true,
              new: true,
              session
            }
          );

          // Recalculate GPA
          const allGrades = await Grade.find({
            user_id,
            organization_id
          }).session(session);

          let totalPoints = 0;
          let totalCredits = 0;

          allGrades.forEach(g => {
            if (g.grade_points && g.credits) {
              totalPoints += g.grade_points * g.credits;
              totalCredits += g.credits;
            }
          });

          const gpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : 0;

          // Update grade summary
          await GradeSummary.findOneAndUpdate(
            {
              user_id,
              organization_id
            },
            {
              user_id,
              organization_id,
              total_courses: allGrades.length,
              total_credits: totalCredits,
              gpa,
              updated_at: new Date()
            },
            {
              upsert: true,
              session
            }
          );

          logger.info('Grade updated successfully', {
            gradeId: grade._id,
            userId: user_id,
            courseId: course_id,
            gpa
          });

          return { grade, gpa };
        });
      },
      10000 // 10 second lock timeout
    );
  }

  /**
   * Execute bulk operation with transaction
   * For operations that need to update multiple documents atomically
   */
  async executeBulkOperation(operations, options = {}) {
    return await this.executeTransaction(async (session) => {
      const results = [];

      for (const operation of operations) {
        const { model, action, query, data } = operation;
        const Model = require(`../models/${model}`);

        let result;
        switch (action) {
          case 'create':
            result = await Model.create([data], { session });
            break;
          case 'update':
            result = await Model.updateOne(query, data).session(session);
            break;
          case 'updateMany':
            result = await Model.updateMany(query, data).session(session);
            break;
          case 'delete':
            result = await Model.deleteOne(query).session(session);
            break;
          case 'deleteMany':
            result = await Model.deleteMany(query).session(session);
            break;
          default:
            throw new Error(`Unknown action: ${action}`);
        }

        results.push(result);
      }

      logger.info('Bulk operation completed', {
        operationCount: operations.length
      });

      return results;
    }, options);
  }

  /**
   * Execute with retry logic
   * Retries transaction on transient errors
   */
  async executeWithRetry(callback, maxRetries = 3, options = {}) {
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.executeTransaction(callback, options);
      } catch (error) {
        lastError = error;
        
        // Check if error is retryable
        const isRetryable = error.hasErrorLabel && 
          error.hasErrorLabel('TransientTransactionError');

        if (!isRetryable || attempt === maxRetries) {
          throw error;
        }

        logger.warn('Transaction failed, retrying', {
          attempt,
          maxRetries,
          error: error.message
        });

        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100));
      }
    }

    throw lastError;
  }

  /**
   * Health check for transaction service
   */
  async healthCheck() {
    try {
      // Test MongoDB connection
      const state = mongoose.connection.readyState;
      const stateMap = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting'
      };

      // Test Redis connection
      const redisHealth = await stateManagementService.healthCheck();

      return {
        status: state === 1 ? 'healthy' : 'unhealthy',
        mongodb: {
          state: stateMap[state],
          connected: state === 1
        },
        redis: redisHealth
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }
}

// Create singleton instance
const transactionService = new TransactionService();

module.exports = transactionService;
