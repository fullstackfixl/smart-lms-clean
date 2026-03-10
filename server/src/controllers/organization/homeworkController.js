const { Homework, OrgAuditLog } = require('../../models');

exports.getHomework = async (req, res) => {
  try {
    const { organization_id } = req.user;
    const homework = await Homework.find({ organization_id })
      .populate('class_id', 'name')
      .populate('section_id', 'name')
      .populate('subject_id', 'name')
      .sort({ dueDate: 1 });
    res.status(200).json({ success: true, data: homework });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createHomework = async (req, res) => {
  try {
    const { organization_id } = req.user;
    const homework = new Homework({ ...req.body, organization_id, assignedBy: req.user._id });
    await homework.save();
    
    await new OrgAuditLog({
      organization_id,
      user_id: req.user._id,
      action: 'homework_created',
      entityType: 'Homework',
      entityId: homework._id,
      ipAddress: req.ip
    }).save();
    
    res.status(201).json({ success: true, data: homework });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
