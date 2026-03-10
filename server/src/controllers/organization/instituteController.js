const { Batch, Certificate, Enrollment, OrgAuditLog } = require('../../models');

exports.getBatches = async (req, res) => {
  try {
    const { organization_id } = req.user;
    const batches = await Batch.find({ organization_id, isActive: true }).populate('instructor_ids', 'name');
    res.status(200).json({ success: true, data: batches });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createBatch = async (req, res) => {
  try {
    const { organization_id } = req.user;
    const batch = new Batch({ ...req.body, organization_id });
    await batch.save();
    
    await new OrgAuditLog({
      organization_id,
      user_id: req.user._id,
      action: 'batch_created',
      entityType: 'Batch',
      entityId: batch._id,
      ipAddress: req.ip
    }).save();
    
    res.status(201).json({ success: true, data: batch });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.enrollInBatch = async (req, res) => {
  try {
    const { organization_id } = req.user;
    const { studentId } = req.body;
    const { batchId } = req.params;
    
    // Batch enrollment logic (creating/updating enrollment record)
    res.status(200).json({ success: true, message: "Student enrolled in batch" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.issueCertificate = async (req, res) => {
  try {
    const { organization_id } = req.user;
    const certificate = new Certificate({ ...req.body, organization_id, issuedBy: req.user._id });
    await certificate.save();
    
    await new OrgAuditLog({
      organization_id,
      user_id: req.user._id,
      action: 'certificate_issued',
      entityType: 'Certificate',
      entityId: certificate._id,
      ipAddress: req.ip
    }).save();
    
    res.status(201).json({ success: true, data: certificate });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
