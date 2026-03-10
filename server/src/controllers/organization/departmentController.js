const { Department, OrgAuditLog } = require('../../models');
const { paginate, getSortOptions } = require('../../utils/pagination');

exports.getDepartments = async (req, res) => {
  try {
    const { organization_id } = req.user;
    const { search, page, limit, sort } = req.query;
    
    const query = { organization_id, isActive: true };
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    
    const sortOptions = getSortOptions(sort);
    const result = await paginate(Department, query, { page, limit, sort: sortOptions });
    
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getDepartmentById = async (req, res) => {
  try {
    const { organization_id } = req.user;
    const department = await Department.findOne({ _id: req.params.id, organization_id, isActive: true });
    if (!department) return res.status(404).json({ success: false, message: "Department not found" });
    res.status(200).json({ success: true, data: department });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createDepartment = async (req, res) => {
  try {
    const { organization_id } = req.user;
    const { name, code, description } = req.body;
    
    const department = new Department({
      organization_id,
      name,
      code,
      description,
      createdBy: req.user._id
    });
    
    await department.save();
    
    await new OrgAuditLog({
      organization_id,
      user_id: req.user._id,
      action: 'department_created',
      entityType: 'Department',
      entityId: department._id,
      details: { name, code },
      ipAddress: req.ip
    }).save();
    
    res.status(201).json({ success: true, data: department });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.updateDepartment = async (req, res) => {
  try {
    const { organization_id } = req.user;
    const department = await Department.findOneAndUpdate(
      { _id: req.params.id, organization_id },
      req.body,
      { new: true }
    );
    
    if (!department) return res.status(404).json({ success: false, message: "Department not found" });
    
    res.status(200).json({ success: true, data: department });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.deleteDepartment = async (req, res) => {
  try {
    const { organization_id } = req.user;
    const department = await Department.findOneAndUpdate(
      { _id: req.params.id, organization_id },
      { isActive: false },
      { new: true }
    );
    
    if (!department) return res.status(404).json({ success: false, message: "Department not found" });
    
    res.status(200).json({ success: true, message: "Department deleted" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
