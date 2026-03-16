const { PlatformReport, User, Organization, Course, Enrollment } = require('../../models');
const path = require('path');
const fs = require('fs').promises;

exports.generateReport = async (data, creatorId) => {
  const { type, format, filters } = data;
  
  const report = new PlatformReport({
    type,
    format,
    filters,
    generatedBy: creatorId,
    status: 'pending'
  });
  
  await report.save();
  
  // In a real application, this would be handled by a worker
  // For now, we'll simulate the generation
  try {
    const dataToReport = await this.fetchDataForReport(type, filters);
    const fileName = `report_${type}_${Date.now()}.${format.toLowerCase()}`;
    const publicPath = path.join(__dirname, '../../../public/reports');
    
    // Ensure directory exists
    await fs.mkdir(publicPath, { recursive: true });
    
    const filePath = path.join(publicPath, fileName);
    
    if (format === 'CSV') {
      await this.generateCSV(dataToReport, filePath);
    } else {
      // PDF generation would require a library like puppeteer or pdfkit
      await fs.writeFile(filePath, 'PDF generation placeholder');
    }
    
    report.status = 'completed';
    report.filePath = `/reports/${fileName}`;
    await report.save();
    
    return report;
  } catch (error) {
    report.status = 'failed';
    await report.save();
    throw error;
  }
};

exports.getReportById = async (reportId) => {
  const report = await PlatformReport.findById(reportId);
  if (!report) throw new Error('Report not found');
  return report;
};

exports.fetchDataForReport = async (type, filters = {}) => {
  switch (type) {
    case 'users':
      return User.find(filters).select('name email role status created_at').lean();
    case 'organizations':
      return Organization.find(filters).select('name email plan status created_at').lean();
    case 'courses':
      return Course.find(filters).select('title organization_id instructor_id status created_at').lean();
    case 'enrollments':
      return Enrollment.find(filters).populate('student_id', 'name').populate('course_id', 'title').lean();
    default:
      return [];
  }
};

exports.generateCSV = async (data, filePath) => {
  if (data.length === 0) {
    await fs.writeFile(filePath, 'No data found');
    return;
  }
  
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(item => {
    return Object.values(item).map(val => {
      if (typeof val === 'object') return JSON.stringify(val);
      return `"${val}"`;
    }).join(',');
  });
  
  const csvContent = [headers, ...rows].join('\n');
  await fs.writeFile(filePath, csvContent);
};

exports.listReports = async (params = {}) => {
  const { page = 1, limit = 20, type, status } = params;
  
  const query = {};
  if (type) query.type = type;
  if (status) query.status = status;
  
  const reports = await PlatformReport.find(query)
    .populate('generatedBy', 'name email')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .lean();
    
  const total = await PlatformReport.countDocuments(query);
  
  return {
    reports,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  };
};
