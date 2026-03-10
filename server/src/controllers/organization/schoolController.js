const { GradeLevel, GradeSection, OrgAuditLog } = require('../../models');

exports.getClasses = async (req, res) => {
  try {
    const { organization_id } = req.user;
    const classes = await GradeLevel.find({ organization_id, isActive: true }).sort({ order: 1 });
    res.status(200).json({ success: true, data: classes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createClass = async (req, res) => {
  try {
    const { organization_id } = req.user;
    const gradeLevel = new GradeLevel({ ...req.body, organization_id });
    await gradeLevel.save();
    
    await new OrgAuditLog({
      organization_id,
      user_id: req.user._id,
      action: 'class_created',
      entityType: 'GradeLevel',
      entityId: gradeLevel._id,
      ipAddress: req.ip
    }).save();
    
    res.status(201).json({ success: true, data: gradeLevel });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getSections = async (req, res) => {
  try {
    const { organization_id } = req.user;
    const sections = await GradeSection.find({ organization_id, isActive: true }).populate('grade_level_id', 'name');
    res.status(200).json({ success: true, data: sections });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createSection = async (req, res) => {
  try {
    const { organization_id } = req.user;
    const section = new GradeSection({ ...req.body, organization_id });
    await section.save();
    
    await new OrgAuditLog({
      organization_id,
      user_id: req.user._id,
      action: 'section_created',
      entityType: 'GradeSection',
      entityId: section._id,
      ipAddress: req.ip
    }).save();
    
    res.status(201).json({ success: true, data: section });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
