const crypto = require('crypto');
const mongoose = require('mongoose');
const emailService = require('../email.service');
const authService = require('../authService');
const { Organization, User, Course, Invite, ActivityLog } = require('../../models');
const { paginate, getSortOptions } = require('../../utils/pagination');

function buildDefaultPlatformControls() {
  return {
    permissions: {
      canCreateCourses: true,
      canCreateInstructors: true,
      canAccessMarketplace: true,
      canViewFinancials: true,
      canManageChat: true,
      canManageAttendance: true,
      canEnterOrgContext: true
    },
    limits: {
      maxUsers: null,
      maxStudents: null,
      maxInstructors: null,
      maxCourses: null,
      storageMb: null
    },
    features: {
      liveClasses: true,
      chat: true,
      aiAssistant: false,
      marketplace: true
    },
    finance: {
      canViewFinancials: true,
      canEditFees: false,
      canViewInstructorSalary: false,
      revenueSharePercent: 15
    },
    marketplace: {
      enabled: true,
      approvalRequired: true,
      revenueSharePercent: 15
    },
    ghostMode: {
      readOnly: true,
      override: true
    },
    updatedBy: null,
    updatedAt: null
  };
}

function mergeDeep(base = {}, patch = {}) {
  const output = { ...base };
  Object.keys(patch || {}).forEach((key) => {
    const value = patch[key];
    if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      output[key] = mergeDeep(base[key] || {}, value);
    } else if (value !== undefined) {
      output[key] = value;
    }
  });
  return output;
}

function normalizePlatformControls(existing = {}, patch = {}) {
  const merged = mergeDeep(buildDefaultPlatformControls(), existing || {});
  const source = patch.platformControls || patch.controls || patch || {};
  return mergeDeep(merged, source);
}

function getObjectId(id) {
  return new mongoose.Types.ObjectId(String(id));
}

async function buildFinancialSummary(orgId) {
  const Fee = mongoose.model('Fee');
  const Enrollment = mongoose.model('Enrollment');
  const objectId = getObjectId(orgId);

  const [summaryRows, recentFees, marketplaceRevenueRows] = await Promise.all([
    Fee.aggregate([
      { $match: { organization_id: objectId, is_active: true } },
      {
        $group: {
          _id: null,
          totalBilled: { $sum: '$amount' },
          totalPaid: {
            $sum: {
              $cond: [{ $in: ['$status', ['paid', 'partially_paid']] }, '$amount', 0]
            }
          },
          pendingAmount: {
            $sum: {
              $cond: [{ $in: ['$status', ['pending', 'overdue']] }, '$amount', 0]
            }
          },
          paidFees: {
            $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] }
          },
          pendingFees: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          overdueFees: {
            $sum: { $cond: [{ $eq: ['$status', 'overdue'] }, 1, 0] }
          }
        }
      }
    ]),
    Fee.find({ organization_id: orgId, is_active: true })
      .sort({ due_date: -1 })
      .limit(5)
      .populate('student_id', 'name email')
      .populate('course_id', 'title')
      .lean(),
    Enrollment.aggregate([
      { $match: { organization_id: objectId, enrollmentType: 'marketplace' } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$payment.amount' },
          totalEnrollments: { $sum: 1 }
        }
      }
    ])
  ]);

  const summary = summaryRows[0] || {};
  return {
    feeSummary: {
      totalBilled: summary.totalBilled || 0,
      totalCollected: summary.totalPaid || 0,
      pendingAmount: summary.pendingAmount || 0,
      paidFees: summary.paidFees || 0,
      pendingFees: summary.pendingFees || 0,
      overdueFees: summary.overdueFees || 0
    },
    recentFees,
    marketplaceRevenue: marketplaceRevenueRows[0]?.totalRevenue || 0,
    marketplaceEnrollments: marketplaceRevenueRows[0]?.totalEnrollments || 0
  };
}

async function buildMarketplaceSummary(orgId) {
  const objectId = getObjectId(orgId);
  const marketplaceCourses = await Course.find({
    organization_id: objectId,
    is_deleted: { $ne: true },
    isPublishedToMarketplace: true
  })
    .select('title marketplacePrice marketplaceStatus rating enrollmentCount updatedAt')
    .sort({ updatedAt: -1 })
    .limit(6)
    .lean();

  const counts = await Course.aggregate([
    {
      $match: {
        organization_id: objectId,
        is_deleted: { $ne: true }
      }
    },
    {
      $group: {
        _id: null,
        totalCourses: { $sum: 1 },
        publishedToMarketplace: {
          $sum: { $cond: [{ $eq: ['$isPublishedToMarketplace', true] }, 1, 0] }
        },
        globallyPublished: {
          $sum: { $cond: [{ $eq: ['$isGloballyPublished', true] }, 1, 0] }
        }
      }
    }
  ]);

  const row = counts[0] || {};
  return {
    totalCourses: row.totalCourses || 0,
    publishedToMarketplace: row.publishedToMarketplace || 0,
    globallyPublished: row.globallyPublished || 0,
    courses: marketplaceCourses
  };
}

function normalizeEmbeddedDocument(value) {
  if (!value) return null;
  if (typeof value !== 'object') {
    return { _id: value };
  }

  return {
    _id: value._id || value.id || null,
    id: value.id || value._id || null,
    name: value.name || value.title || null,
    code: value.code || null,
    year: value.year ?? null,
    semester: value.semester ?? null,
    duration_years: value.duration_years ?? null,
    total_semesters: value.total_semesters ?? null
  };
}

function normalizeUserProfile(user) {
  const profile = user.profile || {};
  const avatar = user.profilePicture || profile.pic_url || profile.avatar || null;

  return {
    ...profile,
    photoUrl: avatar,
    bio: profile.bio || '',
    phone: profile.phone || '',
    rollNumber: profile.rollNumber || '',
    expertise: profile.expertise || '',
    batch: normalizeEmbeddedDocument(profile.batch),
    program: normalizeEmbeddedDocument(profile.program_id),
    department: normalizeEmbeddedDocument(profile.department)
  };
}

async function buildStudentSnapshot(user, orgId) {
  const Attendance = mongoose.model('Attendance');
  const GradeSummary = mongoose.model('GradeSummary');
  const Submission = mongoose.model('Submission');

  const [attendance, gpa, submissionStats] = await Promise.all([
    Attendance.getStudentAttendanceSummary(user._id, orgId).catch(() => null),
    GradeSummary.getStudentGPA(user._id, orgId).catch(() => null),
    Promise.all([
      Submission.countDocuments({ organization_id: orgId, student_id: user._id, is_active: true }),
      Submission.countDocuments({ organization_id: orgId, student_id: user._id, is_active: true, status: 'graded' })
    ]).then(([total, graded]) => ({ total, graded })).catch(() => ({ total: 0, graded: 0 }))
  ]);

  return {
    ...user,
    profile: normalizeUserProfile(user),
    academic: {
      attendance,
      gradeSummary: gpa,
      submissions: submissionStats
    }
  };
}

async function buildInstructorSnapshot(user, orgId) {
  const Attendance = mongoose.model('Attendance');
  const Subject = mongoose.model('Subject');
  const Quiz = mongoose.model('Quiz');
  const LiveClass = mongoose.model('LiveClass');
  const Enrollment = mongoose.model('Enrollment');
  const courseIds = await Course.distinct('_id', { organization_id: orgId, instructor_id: user._id, is_deleted: { $ne: true } });

  const [courses, subjects, liveClasses, quizzes, taughtSessions, enrollments] = await Promise.all([
    Course.find({ organization_id: orgId, instructor_id: user._id, is_deleted: { $ne: true } })
      .select('title status enrollmentCount isPublished isPublishedToMarketplace marketplaceStatus subject_id updatedAt')
      .sort({ updatedAt: -1 })
      .limit(10)
      .lean(),
    Subject.find({ organizationId: orgId, instructorId: user._id, isActive: true })
      .populate('batchId', 'name code year semester')
      .populate('programId', 'name code duration_years total_semesters')
      .select('name code semester batchId programId contentCourseId')
      .lean(),
    LiveClass.countDocuments({ organization_id: orgId, instructor_id: user._id, is_active: true }),
    Quiz.countDocuments({ organization_id: orgId, instructor_id: user._id, is_active: true }),
    Attendance.countDocuments({ organization_id: orgId, instructor_id: user._id, is_active: true }),
    Enrollment.aggregate([
      {
        $match: {
          organization_id: getObjectId(orgId),
          course_id: { $in: courseIds }
        }
      },
      { $group: { _id: null, totalStudents: { $sum: 1 } } }
    ]).catch(() => [])
  ]);

  return {
    ...user,
    profile: normalizeUserProfile(user),
    academic: {
      courseCount: courses.length,
      subjects,
      liveClasses,
      quizzes,
      taughtSessions,
      totalStudents: enrollments[0]?.totalStudents || 0,
      courses
    }
  };
}

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
  orgObj.platformControls = normalizePlatformControls(orgObj.platformControls || {});
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
  const populate = [
    { path: 'profile.batch', select: 'name code year semester programId departmentId organizationId' },
    { path: 'profile.program_id', select: 'name code duration_years total_semesters organization_id' },
    { path: 'profile.department', select: 'name code organization_id' }
  ];

  const result = await paginate(User, query, { 
    page, 
    limit, 
    sort: sortOptions,
    select: '-password_hash',
    populate
  });

  const enrichers = role === 'student'
    ? buildStudentSnapshot
    : buildInstructorSnapshot;

  const data = await Promise.all((result.data || []).map((user) => enrichers(user, orgId)));

  return {
    ...result,
    data
  };
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

exports.activateOrganization = async (orgId) => {
  const organization = await Organization.findById(orgId);
  if (!organization || organization.is_deleted) {
    throw new Error('Organization not found');
  }
  
  organization.status = 'active';
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

  const org = await Organization.findById(orgId).select('type is_deleted');
  if (!org || org.is_deleted) {
    throw new Error('Organization not found');
  }

  const orgType = String(org.type || '').toLowerCase();

  if (orgType === 'college') {
    const query = { organizationId: orgId, organizationType: 'college' };
    return paginate(ActivityLog, query, {
      page,
      limit,
      sort: { createdAt: -1 },
      populate: { path: 'userId', select: 'name email role' }
    });
  }

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
    sort: { session_date: -1 },
    populate: [
      { path: 'instructor_id', select: 'name email' },
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

exports.enterOrganizationContext = async (orgId, requesterId) => {
  const organization = await Organization.findById(orgId)
    .populate('admin_user_id', 'name email role')
    .populate('created_by', 'name email');

  if (!organization || organization.is_deleted) {
    throw new Error('Organization not found');
  }

  const context = {
    organizationId: organization._id,
    organizationCode: organization.code,
    organizationName: organization.name,
    organizationType: organization.type,
    status: organization.status,
    platformControls: normalizePlatformControls(organization.platformControls || {}),
    dashboardUrl: `/platform/organizations/${organization._id}`,
    userFilterUrl: `/platform/users?organizationId=${organization._id}`,
    courseFilterUrl: `/platform/courses?organizationId=${organization._id}`
  };

  return {
    success: true,
    message: 'Organization context resolved',
    context,
    organization,
    requestedBy: requesterId
  };
};

exports.getOrganizationControlPanel = async (orgId) => {
  const organization = await Organization.findById(orgId)
    .populate('created_by', 'name email')
    .populate('admin_user_id', 'name email role');

  if (!organization || organization.is_deleted) {
    throw new Error('Organization not found');
  }

  const [financials, marketplace] = await Promise.all([
    buildFinancialSummary(orgId),
    buildMarketplaceSummary(orgId)
  ]);

  const organizationObj = organization.toObject();
  const platformControls = normalizePlatformControls(organizationObj.platformControls || {});
  organizationObj.platformControls = platformControls;

  return {
    organization: organizationObj,
    permissions: platformControls.permissions,
    limits: platformControls.limits,
    features: platformControls.features,
    finance: {
      ...platformControls.finance,
      ...financials,
      canViewFinancials: platformControls.finance.canViewFinancials
    },
    marketplace: {
      ...platformControls.marketplace,
      ...marketplace,
      canAccessMarketplace: platformControls.permissions.canAccessMarketplace
    },
    ghostMode: platformControls.ghostMode
  };
};

exports.updateOrganizationControlPanel = async (orgId, patch = {}, updatedBy = null) => {
  const organization = await Organization.findById(orgId);
  if (!organization || organization.is_deleted) {
    throw new Error('Organization not found');
  }

  const nextControls = normalizePlatformControls(organization.platformControls || {}, patch);

  if (patch.permissions || patch.controls || patch.platformControls) {
    nextControls.permissions = mergeDeep(nextControls.permissions, patch.permissions || patch.controls?.permissions || patch.platformControls?.permissions || {});
  }
  if (patch.features || patch.controls?.features || patch.platformControls?.features) {
    nextControls.features = mergeDeep(nextControls.features, patch.features || patch.controls?.features || patch.platformControls?.features || {});
  }
  if (patch.finance || patch.controls?.finance || patch.platformControls?.finance) {
    nextControls.finance = mergeDeep(nextControls.finance, patch.finance || patch.controls?.finance || patch.platformControls?.finance || {});
  }
  if (patch.marketplace || patch.controls?.marketplace || patch.platformControls?.marketplace) {
    nextControls.marketplace = mergeDeep(nextControls.marketplace, patch.marketplace || patch.controls?.marketplace || patch.platformControls?.marketplace || {});
  }
  if (patch.ghostMode || patch.controls?.ghostMode || patch.platformControls?.ghostMode) {
    nextControls.ghostMode = mergeDeep(nextControls.ghostMode, patch.ghostMode || patch.controls?.ghostMode || patch.platformControls?.ghostMode || {});
  }
  if (patch.limits || patch.controls?.limits || patch.platformControls?.limits) {
    nextControls.limits = mergeDeep(nextControls.limits, patch.limits || patch.controls?.limits || patch.platformControls?.limits || {});
    organization.limits = {
      ...organization.limits,
      max_users: nextControls.limits.maxUsers ?? organization.limits?.max_users,
      max_students: nextControls.limits.maxStudents ?? organization.limits?.max_students,
      max_instructors: nextControls.limits.maxInstructors ?? organization.limits?.max_instructors,
      max_courses: nextControls.limits.maxCourses ?? organization.limits?.max_courses,
      storage_mb: nextControls.limits.storageMb ?? organization.limits?.storage_mb
    };
  }

  if (Array.isArray(patch.modulesEnabled)) {
    organization.modulesEnabled = [...new Set(patch.modulesEnabled.map((moduleName) => String(moduleName).trim()).filter(Boolean))];
  }

  if (patch.plan) {
    organization.plan = patch.plan;
  }

  if (patch.status) {
    organization.status = patch.status;
  }

  if (patch.settings && typeof patch.settings === 'object') {
    organization.settings = { ...organization.settings, ...patch.settings };
  }

  nextControls.updatedBy = updatedBy || null;
  nextControls.updatedAt = new Date();
  organization.platformControls = nextControls;

  await organization.save();
  return exports.getOrganizationControlPanel(orgId);
};
