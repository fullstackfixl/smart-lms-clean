const { Organization, User, Course, Enrollment } = require('../../models');

/**
 * Platform Report Service
 * Synthesizes cross-tenant telemetry into portable data matrices
 */
class ReportService {
  /**
   * Generate thematic ecosystem reports
   */
  async generateReport(type, filters = {}) {
    let data = [];
    switch (type) {
      case 'organizations':
        data = await Organization.find({ is_deleted: { $ne: true } }).lean();
        break;
      case 'users':
        data = await User.find({ is_deleted: { $ne: true } }).select('-password_hash').lean();
        break;
      case 'courses':
        data = await Course.find({ is_deleted: { $ne: true } }).lean();
        break;
      case 'enrollments':
        data = await Enrollment.find({ is_deleted: { $ne: true } }).populate('user_id course_id').lean();
        break;
      default:
        throw new Error(`Invalid report protocol: ${type}`);
    }

    // In a high-fidelity system, we would trigger a background worker here
    // for actual file generation. For now, returning metadata.
    return {
      reportId: `REP-${Date.now()}`,
      type,
      generatedAt: new Date(),
      recordCount: data.length,
      status: 'completed',
      downloadUrl: `/api/platform/reports/download/${type}_${Date.now()}.csv`
    };
  }

  /**
   * Export logic for CSV payload
   * Fetches real data and converts to simple CSV string
   */
  async exportCSV(type) {
    let data = [];
    let headers = '';
    
    switch (type.split('_')[0]) {
      case 'organizations':
        data = await Organization.find({ is_deleted: { $ne: true } }).lean();
        headers = 'id,name,subdomain,status,email,plan,created_at';
        data = data.map(o => `${o._id},"${o.name}",${o.subdomain},${o.status},${o.email},${o.plan},${o.created_at || ''}`);
        break;
      case 'users':
        data = await User.find({ is_deleted: { $ne: true } }).lean();
        headers = 'id,name,email,role,status,created_at';
        data = data.map(u => `${u._id},"${u.name}",${u.email},${u.role},${u.status},${u.created_at || ''}`);
        break;
      case 'courses':
        data = await Course.find({ is_deleted: { $ne: true } }).lean();
        headers = 'id,title,category,status,price,created_at';
        data = data.map(c => `${c._id},"${c.title}",${c.category},${c.status},${c.price},${c.created_at || ''}`);
        break;
      case 'enrollments':
        data = await Enrollment.find({ is_deleted: { $ne: true } }).populate('user_id course_id').lean();
        headers = 'id,user,course,status,created_at';
        data = data.map(e => `${e._id},"${e.user_id?.email || 'N/A'}","${e.course_id?.title || 'N/A'}",${e.status},${e.created_at || ''}`);
        break;
      default:
        return `id,name,timestamp\n1,Generated Report (${type}),${new Date().toISOString()}`;
    }

    return [headers, ...data].join('\n');
  }
}

module.exports = new ReportService();
