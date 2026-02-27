const BaseController = require('../core/BaseController');
const Department = require('../models/Department');

class DepartmentController extends BaseController {
    constructor() {
        super(Department);
    }

    /**
     * Create a department
     */
    async create(req, res) {
        req.body.organization_id = req.user.organization_id;
        return super.create(req, res);
    }

    /**
     * Get all departments for the organization
     */
    async getAll(req, res) {
        const filter = { organization_id: req.user.organization_id };
        const departments = await Department.find(filter).sort({ name: 1 });
        return res.success(departments);
    }

    /**
     * Get single department
     */
    async getById(req, res) {
        const department = await Department.findOne({
            _id: req.params.id,
            organization_id: req.user.organization_id
        });

        if (!department) {
            return res.error('Department not found', 'Not Found', 404);
        }

        return res.success(department);
    }

    /**
     * Update department
     */
    async update(req, res) {
        const department = await Department.findOneAndUpdate(
            { _id: req.params.id, organization_id: req.user.organization_id },
            req.body,
            { new: true, runValidators: true }
        );

        if (!department) {
            return res.error('Department not found', 'Not Found', 404);
        }

        return res.success(department);
    }

    /**
     * Delete department
     */
    async delete(req, res) {
        const department = await Department.findOneAndDelete({
            _id: req.params.id,
            organization_id: req.user.organization_id
        });

        if (!department) {
            return res.error('Department not found', 'Not Found', 404);
        }

        return res.success(null, 'Department deleted successfully');
    }
}

module.exports = new DepartmentController();
