const { Course } = require('../../models');
const { paginate, getSortOptions } = require('../../utils/pagination');

exports.listCourses = async (params) => {
  const { organization, instructor, status, search, page, limit, sort } = params;
  
  const query = { is_deleted: { $ne: true } };
  
  if (organization) query.organization_id = organization;
  if (instructor) query.instructor_id = instructor;
  if (status) query.status = status;
  
  if (search) {
    query.title = { $regex: search, $options: 'i' };
  }
  
  const sortOptions = getSortOptions(sort);
  
  const result = await paginate(Course, query, { 
    page, 
    limit, 
    sort: sortOptions,
    populate: [
      { path: 'organization_id', select: 'name' },
      { path: 'instructor_id', select: 'name email' }
    ]
  });

  // Calculate stats
  const totalCount = await Course.countDocuments(query);
  const publishedCount = await Course.countDocuments({ ...query, status: 'published' });
  
  return {
    courses: result.data,
    stats: {
      total: totalCount,
      published: publishedCount,
      enrollments: 0 // Would need Enrollment model to calculate
    },
    pagination: result.pagination
  };
};

exports.suspendCourse = async (courseId) => {
  const course = await Course.findById(courseId);
  if (!course || course.is_deleted) {
    throw new Error('Course not found');
  }
  
  course.status = 'suspended';
  await course.save();
  return course;
};
