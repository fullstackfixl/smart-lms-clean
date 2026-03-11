const { Program, OrgAuditLog } = require('../../models');

exports.getPrograms = async (req, res) => {
  try {
    const { organization_id } = req.user;
    const programs = await Program.find({ organization_id, isActive: true }).populate('department_id', 'name');
    res.status(200).json({ success: true, data: programs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getProgramById = async (req, res) => {
  try {
    const { organization_id } = req.user;
    const program = await Program.findOne({ _id: req.params.id, organization_id, isActive: true }).populate('department_id', 'name');
    if (!program) return res.status(404).json({ success: false, message: "Program not found" });
    res.status(200).json({ success: true, data: program });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createProgram = async (req, res) => {
  try {
    const { organization_id } = req.user;
    const program = new Program({ ...req.body, organization_id, createdBy: req.user._id });
    await program.save();
    
    await new OrgAuditLog({
      organization_id,
      user_id: req.user._id,
      action: 'program_created',
      entityType: 'Program',
      entityId: program._id,
      ipAddress: req.ip
    }).save();
    
    res.status(201).json({ success: true, data: program });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.updateProgram = async (req, res) => {
  try {
    const { organization_id } = req.user;

    const program = await Program.findOne({
      _id: req.params.id,
      organization_id,
      isActive: true
    });

    if (!program) {
      return res.status(404).json({ success: false, message: 'Program not found' });
    }

    Object.assign(program, req.body);
    await program.save();

    await new OrgAuditLog({
      organization_id,
      user_id: req.user._id,
      action: 'program_updated',
      entityType: 'Program',
      entityId: program._id,
      ipAddress: req.ip
    }).save();

    res.status(200).json({ success: true, data: program });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.deleteProgram = async (req, res) => {
  try {
    const { organization_id } = req.user;

    const program = await Program.findOne({
      _id: req.params.id,
      organization_id,
      isActive: true
    });

    if (!program) {
      return res.status(404).json({ success: false, message: 'Program not found' });
    }

    program.isActive = false;
    await program.save();

    await new OrgAuditLog({
      organization_id,
      user_id: req.user._id,
      action: 'program_deleted',
      entityType: 'Program',
      entityId: program._id,
      ipAddress: req.ip
    }).save();

    res.status(200).json({ success: true, message: 'Program deleted successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
