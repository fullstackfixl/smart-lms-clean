const { Semester, OrgAuditLog } = require('../../models');

exports.getSemesters = async (req, res) => {
  try {
    const { organization_id } = req.user;
    const semesters = await Semester.find({ organization_id }).sort({ number: 1 });
    res.status(200).json({ success: true, data: semesters });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createSemester = async (req, res) => {
  try {
    const { organization_id } = req.user;
    const semester = new Semester({ ...req.body, organization_id });
    await semester.save();
    
    await new OrgAuditLog({
      organization_id,
      user_id: req.user._id,
      action: 'semester_created',
      entityType: 'Semester',
      entityId: semester._id,
      ipAddress: req.ip
    }).save();
    
    res.status(201).json({ success: true, data: semester });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getSemesterById = async (req, res) => {
  try {
    const { organization_id } = req.user;
    const semester = await Semester.findOne({ _id: req.params.id, organization_id });
    if (!semester) {
      return res.status(404).json({ success: false, message: 'Semester not found' });
    }
    res.status(200).json({ success: true, data: semester });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.updateSemester = async (req, res) => {
  try {
    const { organization_id } = req.user;
    const semester = await Semester.findOne({ _id: req.params.id, organization_id });
    if (!semester) {
      return res.status(404).json({ success: false, message: 'Semester not found' });
    }

    Object.assign(semester, req.body);
    await semester.save();

    await new OrgAuditLog({
      organization_id,
      user_id: req.user._id,
      action: 'semester_updated',
      entityType: 'Semester',
      entityId: semester._id,
      ipAddress: req.ip
    }).save();

    res.status(200).json({ success: true, data: semester });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.deleteSemester = async (req, res) => {
  try {
    const { organization_id } = req.user;
    const semester = await Semester.findOne({ _id: req.params.id, organization_id });
    if (!semester) {
      return res.status(404).json({ success: false, message: 'Semester not found' });
    }

    await Semester.deleteOne({ _id: semester._id });

    await new OrgAuditLog({
      organization_id,
      user_id: req.user._id,
      action: 'semester_deleted',
      entityType: 'Semester',
      entityId: semester._id,
      ipAddress: req.ip
    }).save();

    res.status(200).json({ success: true, message: 'Semester deleted successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
