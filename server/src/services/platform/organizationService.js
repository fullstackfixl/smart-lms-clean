const crypto = require('crypto');
const mongoose = require('mongoose');
const emailService = require('../email.service');
const authService = require('../authService');
const { Organization, User, Course, Invite } = require('../../models');
const { paginate, getSortOptions } = require('../../utils/pagination');

exports.listOrganizations = async (params) => {
  const { search, status, plan, page, limit, sort } = params;
  
  const query = { is_deleted: { $ne: true } };
  
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { code: { $regex: search, $options: 'i' } }
    ];
  }
  
  if (status) query.status = status;
  if (plan) query.plan = plan;
  
  const sortOptions = getSortOptions(sort);
  
  const [paginatedResult, stats] = await Promise.all([
    paginate(Organization, query, { page, limit, sort: sortOptions }),
    (async () => {
      const [total, active, suspended] = await Promise.all([
        Organization.countDocuments({ is_deleted: { $ne: true } }),
        Organization.countDocuments({ is_deleted: { $ne: true }, status: 'active' }),
        Organization.countDocuments({ is_deleted: { $ne: true }, status: 'suspended' })
      ]);
      return { total, active, suspended };
    })()
  ]);

  return {
    organizations: paginatedResult.data,
    pagination: paginatedResult.pagination,
    stats
  };
};

exports.createOrganization = async (data, creatorId) => {
  // 1. Generate unique subdomain (slug) and code if missing
  const orgName = data.name.trim();
  const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  
  // Ensure subdomain uniqueness by appending a small random suffix if needed
  const randomSuffix = Math.random().toString(36).substring(2, 5);
  const finalSubdomain = `${slug}-${randomSuffix}`;

  const organization = new Organization({
    ...data,
    subdomain: finalSubdomain,
    created_by: creatorId,
    status: 'active'
  });
  
  await organization.save();

  // 2. Provision Organization Admin
  const adminEmail = data.email.toLowerCase().trim();
  
  // Create user in 'pending' status
  const orgAdmin = new User({
    name: `${data.name} Admin`,
    email: adminEmail,
    role: 'org_admin',
    organization_id: organization._id,
    status: 'pending'
  });
  await orgAdmin.save();

  // 3. Link Admin to Organization
  organization.admin_user_id = orgAdmin._id;
  await organization.save();

  // 4. Generate Invitation Token
  const token = crypto.randomBytes(32).toString('hex');
  const invite = new Invite({
    email: adminEmail,
    role: 'org_admin',
    organization_id: organization._id,
    token: token,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  });
  await invite.save();

  // 5. Send Invitation Email
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
  const setupLink = `${clientUrl}/accept-invite?token=${token}`;
  
  try {
    await emailService.sendTemplatedEmail({
      to: adminEmail,
      templateName: 'invitation',
      data: {
        organizationName: organization.name,
        setupLink: setupLink
      }
    });
    console.log(`✅ [Service] invitation sent to ${adminEmail}`);
  } catch (emailErr) {
    console.error(`❌ [Service] Failed to send invitation:`, emailErr.message);
  }

  return organization;
};

exports.getOrganizationById = async (orgId) => {
  const organization = await Organization.findById(orgId).populate('created_by', 'name email').populate('admin_user_id', 'name email phone');
  if (!organization || organization.is_deleted) {
    throw new Error('Organization not found');
  }

  // Fetch real-time counts
  const [totalInstructors, totalStudents, activeCourses] = await Promise.all([
    User.countDocuments({ organization_id: orgId, role: 'instructor', is_deleted: { $ne: true } }),
    User.countDocuments({ organization_id: orgId, role: 'student', is_deleted: { $ne: true } }),
    Course.countDocuments({ organization_id: orgId, isPublished: true, is_deleted: { $ne: true } })
  ]);

  const orgObj = organization.toObject();
  orgObj.stats = {
    totalInstructors,
    totalStudents,
    activeCourses
  };

  return orgObj;
};

exports.listOrganizationUsers = async (orgId, role, params) => {
  const { search, page, limit, sort } = params;
  
  const query = { 
    organization_id: orgId, 
    role,
    is_deleted: { $ne: true } 
  };
  
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }
  
  const sortOptions = getSortOptions(sort);
  
  return paginate(User, query, { 
    page, 
    limit, 
    sort: sortOptions,
    select: '-password_hash' 
  });
};

exports.updateOrganization = async (orgId, data) => {
  const organization = await Organization.findByIdAndUpdate(
    orgId,
    { $set: data },
    { new: true, runValidators: true }
  );
  
  if (!organization || organization.is_deleted) {
    throw new Error('Organization not found');
  }
  
  return organization;
};

exports.suspendOrganization = async (orgId) => {
  const organization = await Organization.findById(orgId);
  if (!organization || organization.is_deleted) {
    throw new Error('Organization not found');
  }
  
  organization.status = 'suspended';
  await organization.save();
  return organization;
};

exports.deleteOrganization = async (orgId, deleterId) => {
  const organization = await Organization.findById(orgId);
  if (!organization || organization.is_deleted) {
    throw new Error('Organization not found');
  }
  
  await organization.softDelete(deleterId);
  return { success: true, message: 'Organization soft-deleted successfully' };
};

exports.getOrganizationStats = async (orgId) => {
  const [
    totalStudents,
    totalInstructors,
    totalCourses,
    totalEnrollments,
    totalLiveClasses,
    totalQuizzes,
    certificatesIssued
  ] = await Promise.all([
    User.countDocuments({ organization_id: orgId, role: 'student', is_deleted: { $ne: true } }),
    User.countDocuments({ organization_id: orgId, role: 'instructor', is_deleted: { $ne: true } }),
    Course.countDocuments({ organization_id: orgId, is_deleted: { $ne: true } }),
    mongoose.model('Enrollment').countDocuments({ organization_id: orgId }),
    mongoose.model('LiveClass').countDocuments({ organization_id: orgId }),
    mongoose.model('Quiz').countDocuments({ organization_id: orgId }),
    mongoose.model('Certificate').countDocuments({ organization_id: orgId })
  ]);

  return {
    totalStudents,
    totalInstructors,
    totalCourses,
    totalEnrollments,
    totalLiveClasses,
    totalQuizzes,
    certificatesIssued
  };
};

exports.listOrganizationCourses = async (orgId, params) => {
  const { search, page, limit, sort } = params;
  
  const query = { 
    organization_id: orgId, 
    is_deleted: { $ne: true } 
  };
  
  if (search) {
    query.title = { $regex: search, $options: 'i' };
  }
  
  const sortOptions = getSortOptions(sort);
  
  return paginate(Course, query, { 
    page, 
    limit, 
    sort: sortOptions,
    populate: { path: 'instructor_id', select: 'name email' }
  });
};

exports.getOrganizationActivity = async (orgId, params) => {
  const { page, limit } = params;
  const AuditLog = mongoose.model('AuditLog');
  
  const query = { organization_id: orgId };
  
  return paginate(AuditLog, query, {
    page,
    limit,
    sort: { timestamp: -1 },
    populate: { path: 'user_id', select: 'name email' }
  });
};

exports.listOrganizationLiveClasses = async (orgId, params) => {
  const { page, limit } = params;
  const LiveClass = mongoose.model('LiveClass');
  const query = { organization_id: orgId };
  
  return paginate(LiveClass, query, {
    page,
    limit,
    sort: { scheduled_at: -1 },
    populate: [
      { path: 'instructor_id', select: 'name email' },
      { path: 'course_id', select: 'title' }
    ]
  });
};

exports.listOrganizationQuizzes = async (orgId, params) => {
  const { page, limit } = params;
  const Quiz = mongoose.model('Quiz');
  const query = { organization_id: orgId };
  
  return paginate(Quiz, query, {
    page,
    limit,
    sort: { created_at: -1 },
    populate: { path: 'course_id', select: 'title' }
  });
};

exports.listOrganizationCertificates = async (orgId, params) => {
  const { page, limit } = params;
  const Certificate = mongoose.model('Certificate');
  const query = { organization_id: orgId };
  
  return paginate(Certificate, query, {
    page,
    limit,
    sort: { issued_at: -1 },
    populate: [
      { path: 'user_id', select: 'name email' },
      { path: 'course_id', select: 'title' }
    ]
  });
};

exports.listOrganizationAttendance = async (orgId, params) => {
  const { page, limit } = params;
  const Attendance = mongoose.model('Attendance');
  const query = { organization_id: orgId };
  
  return paginate(Attendance, query, {
    page,
    limit,
    sort: { date: -1 },
    populate: [
      { path: 'user_id', select: 'name email' },
      { path: 'course_id', select: 'title' }
    ]
  });
};

exports.resetAdminPassword = async (orgId) => {
  const organization = await Organization.findById(orgId).populate('admin_user_id');
  if (!organization || organization.is_deleted) {
    throw new Error('Organization not found');
  }

  const admin = organization.admin_user_id;
  if (!admin) {
    throw new Error('No admin assigned to this organization');
  }

  // Reuse the existing auth password reset flow so that
  // a real reset token and email are generated for the admin.
  await authService.forgotPassword(admin.email);

  return {
    success: true,
    message: 'Password reset link sent to organization admin email'
  };
};
