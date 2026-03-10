const { TrainingAssignment, Skill, OrgAuditLog, User } = require('../../models');

exports.getCompanyDepartments = async (req, res) => {
  try {
    const { organization_id } = req.user;
    const users = await User.find({ organization_id, is_deleted: { $ne: true } });
    const departments = [...new Set(users.map(u => u.profile?.department).filter(Boolean))];
    res.status(200).json({ success: true, data: departments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.assignTraining = async (req, res) => {
  try {
    const { organization_id } = req.user;
    const assignment = new TrainingAssignment({ ...req.body, organization_id, assignedBy: req.user._id });
    await assignment.save();
    
    await new OrgAuditLog({
      organization_id,
      user_id: req.user._id,
      action: 'training_assigned',
      entityType: 'TrainingAssignment',
      entityId: assignment._id,
      ipAddress: req.ip
    }).save();
    
    res.status(201).json({ success: true, data: assignment });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getSkills = async (req, res) => {
  try {
    const { organization_id } = req.user;
    const skills = await Skill.find({ organization_id, isActive: true });
    res.status(200).json({ success: true, data: skills });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createSkill = async (req, res) => {
  try {
    const { organization_id } = req.user;
    const skill = new Skill({ ...req.body, organization_id });
    await skill.save();
    
    await new OrgAuditLog({
      organization_id,
      user_id: req.user._id,
      action: 'skill_created',
      entityType: 'Skill',
      entityId: skill._id,
      ipAddress: req.ip
    }).save();
    
    res.status(201).json({ success: true, data: skill });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
