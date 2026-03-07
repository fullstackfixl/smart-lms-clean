const Program = require('../models/Program');
const Department = require('../models/Department');

class ProgramController {
    async create(req, res) {
        try {
            const organization_id = req.user.organization_id;
            const { name, code, department_id, duration_years, total_semesters, description, status } = req.body;

            if (!name || !code || !department_id) {
                return res.status(400).json({ success: false, message: 'Name, code and department are required' });
            }

            // Verify department belongs to same org
            const department = await Department.findOne({ _id: department_id, organization_id });
            if (!department) {
                return res.status(404).json({ success: false, message: 'Department not found in your organization' });
            }

            const program = new Program({
                organization_id,
                department_id,
                name,
                code,
                duration_years,
                total_semesters,
                description,
                status: status || 'ACTIVE',
                createdBy: req.user._id
            });

            await program.save();
            res.status(201).json({ success: true, data: program, message: 'Academic Program created successfully' });
        } catch (error) {
            console.error('Create Program Error:', error);
            if (error.code === 11000) {
                return res.status(400).json({ success: false, message: 'Program code already exists' });
            }
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async getAll(req, res) {
        try {
            const organization_id = req.user.organization_id;
            const programs = await Program.find({ organization_id, isActive: true })
                .populate('department_id', 'name code')
                .sort({ createdAt: -1 });

            res.status(200).json({ success: true, data: programs });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async getById(req, res) {
        try {
            const organization_id = req.user.organization_id;
            const program = await Program.findOne({ _id: req.params.id, organization_id })
                .populate('department_id', 'name code');

            if (!program) {
                return res.status(404).json({ success: false, message: 'Program not found' });
            }
            res.status(200).json({ success: true, data: program });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async update(req, res) {
        try {
            const organization_id = req.user.organization_id;
            const updateData = req.body;

            const program = await Program.findOneAndUpdate(
                { _id: req.params.id, organization_id },
                updateData,
                { new: true }
            );

            if (!program) {
                return res.status(404).json({ success: false, message: 'Program not found' });
            }
            res.status(200).json({ success: true, data: program });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async delete(req, res) {
        try {
            const organization_id = req.user.organization_id;
            const program = await Program.findOneAndUpdate(
                { _id: req.params.id, organization_id },
                { isActive: false },
                { new: true }
            );

            if (!program) {
                return res.status(404).json({ success: false, message: 'Program not found' });
            }
            res.status(200).json({ success: true, message: 'Program deleted successfully' });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = new ProgramController();
