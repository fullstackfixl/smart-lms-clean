const BaseController = require('../core/BaseController');
const Department = require('../models/Department');

class DepartmentController extends BaseController {
    constructor() {
        super(Department);
        this.create = this.create.bind(this);
        this.getAll = this.getAll.bind(this);
        this.getById = this.getById.bind(this);
        this.update = this.update.bind(this);
        this.delete = this.delete.bind(this);
    }

    /**
     * Create a department
     */
    async create(req, res) {
        try {
            console.log('🚀 [DepartmentController] create called');
            console.log('   User Org ID:', req.user.organization_id?._id || req.user.organization_id);
            req.body.organization_id = req.user.organization_id?._id || req.user.organization_id;
            const department = new Department(req.body);
            console.log('   Saving department...');
            await department.save();
            console.log('✅ Department saved');
            return this.sendSuccess(res, department, 'Department created successfully', 201);
        } catch (error) {
            console.error('❌ Department create error:', error);
            return this.sendError(res, error.message);
        }
    }

    /**
     * Get all departments for the organization
     */
    async getAll(req, res) {
        try {
            const filter = { organization_id: req.user.organization_id };
            const departments = await Department.find(filter).sort({ name: 1 });
            return this.sendSuccess(res, departments);
        } catch (error) {
            return this.sendError(res, error.message);
        }
    }

    /**
     * Get single department
     */
    async getById(req, res) {
        try {
            const department = await Department.findOne({
                _id: req.params.id,
                organization_id: req.user.organization_id
            });

            if (!department) {
                return this.sendError(res, 'Department not found', 404);
            }

            return this.sendSuccess(res, department);
        } catch (error) {
            return this.sendError(res, error.message);
        }
    }

    /**
     * Update department
     */
    async update(req, res) {
        try {
            const department = await Department.findOneAndUpdate(
                { _id: req.params.id, organization_id: req.user.organization_id },
                req.body,
                { new: true, runValidators: true }
            );

            if (!department) {
                return this.sendError(res, 'Department not found', 404);
            }

            return this.sendSuccess(res, department, 'Department updated successfully');
        } catch (error) {
            return this.sendError(res, error.message);
        }
    }

    /**
     * Delete department
     */
    async delete(req, res) {
        try {
            const department = await Department.findOneAndDelete({
                _id: req.params.id,
                organization_id: req.user.organization_id
            });

            if (!department) {
                return this.sendError(res, 'Department not found', 404);
            }

            return this.sendSuccess(res, null, 'Department deleted successfully');
        } catch (error) {
            return this.sendError(res, error.message);
        }
    }
}

module.exports = new DepartmentController();
