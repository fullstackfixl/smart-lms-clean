const { AcademicEnrollment, AcademicProgram, Batch, InstructorAssignment, Notification, Subject, Timetable, User } = require('../models');

async function resolveOrgId(user) {
  return (user.organization_id && user.organization_id._id) ? user.organization_id._id : user.organization_id;
}

async function findAssignedInstructor({ organizationId, batchId, subjectId }) {
  const row = await InstructorAssignment.findOne({
    organizationId,
    batchId,
    subjectId,
    isActive: true
  })
    .select('instructorId')
    .lean();

  return row?.instructorId || null;
}

async function findTimetableInstructor({ organizationId, batchId, programId, subjectId }) {
  const row = await Timetable.findOne({
    organizationId,
    batchId,
    programId,
    subjectId,
    isActive: true
  })
    .select('instructorId')
    .lean();

  return row?.instructorId || null;
}

async function buildEnrollments({ organizationId, studentId, programId, batchId, semester }) {
  const subjects = await Subject.find({
    organizationId,
    programId,
    semester,
    isActive: true
  }).select('_id instructorId').lean();

  if (!subjects.length) return [];

  const docs = [];
  for (const subject of subjects) {
    const instructorId =
      await findAssignedInstructor({ organizationId, batchId, subjectId: subject._id }) ||
      await findTimetableInstructor({ organizationId, batchId, programId, subjectId: subject._id }) ||
      subject.instructorId ||
      null;

    docs.push({
      organizationId,
      studentId,
      programId,
      batchId,
      subjectId: subject._id,
      instructorId: instructorId || null
    });
  }

  return docs;
}

async function assignStudentToProgramBatch({ actorUser, studentId, programId, batchId }) {
  const organizationId = await resolveOrgId(actorUser);

  const [student, program, batch] = await Promise.all([
    User.findOne({ _id: studentId, organization_id: organizationId, role: 'student' }),
    AcademicProgram.findOne({ _id: programId, organizationId, isActive: true }).lean(),
    Batch.findOne({ _id: batchId, organizationId, isActive: true }).lean()
  ]);

  if (!student) {
    const err = new Error('Student not found');
    err.statusCode = 404;
    throw err;
  }
  if (!program) {
    const err = new Error('Program not found');
    err.statusCode = 404;
    throw err;
  }
  if (!batch) {
    const err = new Error('Batch not found');
    err.statusCode = 404;
    throw err;
  }

  if (String(batch.programId) !== String(programId)) {
    const err = new Error('Batch does not belong to the selected program');
    err.statusCode = 400;
    throw err;
  }

  const semester = Number(batch.semester || student?.profile?.current_semester || 1);
  const departmentId = batch.departmentId || program.departmentId || null;

  // Re-assignment handling
  const previousBatchId = student.profile?.batch || null;

  // Update student profile
  student.profile = student.profile || {};
  student.profile.program_id = programId;
  student.profile.department = departmentId;
  student.profile.batch = batchId;
  student.profile.current_semester = semester;
  await student.save();

  // Keep Batch.students mapping aligned
  if (previousBatchId && String(previousBatchId) !== String(batchId)) {
    await Batch.updateOne({ _id: previousBatchId, organizationId }, { $pull: { students: student._id } });
  }
  await Batch.updateOne({ _id: batchId, organizationId }, { $addToSet: { students: student._id } });

  // Delete old academic enrollments and rebuild
  await AcademicEnrollment.deleteMany({ organizationId, studentId: student._id });

  const enrollmentDocs = await buildEnrollments({
    organizationId,
    studentId: student._id,
    programId,
    batchId,
    semester
  });

  if (enrollmentDocs.length) {
    await AcademicEnrollment.insertMany(enrollmentDocs, { ordered: false });
  }

  // In-app notification
  await Notification.create({
    organization_id: organizationId,
    recipient_id: student._id,
    sender_id: actorUser._id,
    type: 'general',
    title: 'Academic assignment updated',
    message: `Assigned to ${program.name} • ${batch.name}`,
    data: { programId, batchId, semester },
    priority: 'medium',
    status: 'sent',
    channels: {
      email: { enabled: false, sent: false },
      push: { enabled: false, sent: false },
      in_app: { enabled: true, read: false }
    }
  });

  return {
    studentId: student._id,
    organizationId,
    programId,
    batchId,
    semester,
    enrollmentCount: enrollmentDocs.length
  };
}

async function syncNewSubjectToStudents({ actorUser, subject }) {
  const organizationId = await resolveOrgId(actorUser);

  if (!subject?.programId || !subject?.semester) return { created: 0 };

  const batches = await Batch.find({
    organizationId,
    programId: subject.programId,
    semester: Number(subject.semester),
    isActive: true
  }).select('_id students').lean();

  if (!batches.length) return { created: 0 };

  let created = 0;
  for (const batch of batches) {
    const studentIds = batch.students || [];
    if (!studentIds.length) continue;

    const instructorId =
      await findAssignedInstructor({ organizationId, batchId: batch._id, subjectId: subject._id }) ||
      await findTimetableInstructor({
        organizationId,
        batchId: batch._id,
        programId: subject.programId,
        subjectId: subject._id
      }) ||
      subject.instructorId ||
      null;

    const docs = studentIds.map((sid) => ({
      organizationId,
      studentId: sid,
      programId: subject.programId,
      batchId: batch._id,
      subjectId: subject._id,
      instructorId: instructorId || null
    }));

    try {
      await AcademicEnrollment.insertMany(docs, { ordered: false });
      created += docs.length;
    } catch {
      // ignore duplicates
    }
  }

  return { created };
}

async function syncInstructorChange({ actorUser, subjectId, instructorId }) {
  const organizationId = await resolveOrgId(actorUser);
  const subject = await Subject.findOne({ _id: subjectId, organizationId }).select('_id programId semester').lean();
  if (!subject) return { updated: 0 };

  const result = await AcademicEnrollment.updateMany(
    { organizationId, subjectId },
    { $set: { instructorId: instructorId || null } }
  );

  return { updated: result.modifiedCount || result.nModified || 0 };
}

module.exports = {
  assignStudentToProgramBatch,
  syncNewSubjectToStudents,
  syncInstructorChange
};
