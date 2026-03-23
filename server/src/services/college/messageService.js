const User = require('../../models/User');
const InstructorAssignment = require('../../models/InstructorAssignment');
const AcademicEnrollment = require('../../models/AcademicEnrollment');

class MessageService {
  /**
   * Validate if sender can message the receiver based on roles and enrollment
   * @param {Object} sender - The user attempting to send
   * @param {Object} receiver - The target user
   * @throws {Error} If permissions are not met
   */
  async validateMessagingPermission(sender, receiver) {
    if (!sender || !receiver) {
      throw new Error('Sender or receiver not found');
    }

    const senderIdStr = sender._id.toString();
    const receiverIdStr = receiver._id.toString();

    // MANDATORY RULE: No self-chat
    if (senderIdStr === receiverIdStr) {
      throw new Error('You cannot chat with yourself');
    }

    const senderOrgStr = sender.organization_id?._id?.toString() || sender.organization_id?.toString();
    const receiverOrgStr = receiver.organization_id?._id?.toString() || receiver.organization_id?.toString();
    
    // Rule 1: Must be in the same organization
    if (senderOrgStr !== receiverOrgStr) {
      throw new Error('Cross-organization messaging is strictly prohibited');
    }

    // Role combinations
    const senderRole = sender.role;
    const receiverRole = receiver.role;

    // Rule 2: Org Admins can message anyone in their org
    if (['organization_admin', 'org_admin'].includes(senderRole)) {
      return true;
    }
    if (['organization_admin', 'org_admin'].includes(receiverRole)) {
      return true; // Anyone can message org admin back
    }

    // Rule 3: Instructor to Student or Student to Instructor requires active enrollment
    if (senderRole === 'instructor' && receiverRole === 'student') {
      await this.checkInstructorStudentConnection(sender._id, receiver._id, senderOrgStr);
      return true;
    }

    if (senderRole === 'student' && receiverRole === 'instructor') {
      await this.checkInstructorStudentConnection(receiver._id, sender._id, senderOrgStr);
      return true;
    }

    throw new Error('You do not have permission to message this user');
  }

  /**
   * Check if a student is enrolled in any active batch taught by the instructor
   */
  async checkInstructorStudentConnection(instructorId, studentId, organizationId) {
    // Find all active batches the instructor is assigned to
    const assignments = await InstructorAssignment.find({
      instructorId: instructorId,
      organizationId: organizationId,
      isActive: true
    }).select('batchId');

    const batchIds = assignments.map(a => a.batchId);

    if (batchIds.length === 0) {
      throw new Error('Instructor has no active assignments to message from');
    }

    // Check if the student is enrolled in any of these batches
    const enrollment = await AcademicEnrollment.findOne({
      studentId: studentId,
      batchId: { $in: batchIds }
    });

    if (!enrollment) {
      throw new Error('Student is not enrolled in any of your active classes');
    }
  }
}

module.exports = new MessageService();
