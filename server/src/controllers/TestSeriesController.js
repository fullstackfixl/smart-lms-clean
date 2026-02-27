const BaseController = require('../core/BaseController');
const TestSeries = require('../models/TestSeries');

class TestSeriesController extends BaseController {
    constructor() {
        super(TestSeries);
    }

    async create(req, res) {
        req.body.organization_id = req.user.organization_id;
        try {
            const testSeries = new TestSeries(req.body);
            await testSeries.save();
            return res.success(testSeries, 'Test Series created successfully', 201);
        } catch (error) {
            return res.error(error.message);
        }
    }

    async getAll(req, res) {
        try {
            const series = await TestSeries.find({ organization_id: req.user.organization_id }).sort({ title: 1 });
            return res.success(series);
        } catch (error) {
            return res.error(error.message);
        }
    }

    async getById(req, res) {
        try {
            const testSeries = await TestSeries.findOne({
                _id: req.params.id,
                organization_id: req.user.organization_id
            });
            if (!testSeries) return res.error('Test Series not found', 'Not Found', 404);
            return res.success(testSeries);
        } catch (error) {
            return res.error(error.message);
        }
    }

    async update(req, res) {
        try {
            const testSeries = await TestSeries.findOneAndUpdate(
                { _id: req.params.id, organization_id: req.user.organization_id },
                req.body,
                { new: true, runValidators: true }
            );
            if (!testSeries) return res.error('Test Series not found', 'Not Found', 404);
            return res.success(testSeries, 'Test Series updated successfully');
        } catch (error) {
            return res.error(error.message);
        }
    }

    async delete(req, res) {
        try {
            const testSeries = await TestSeries.findOneAndDelete({
                _id: req.params.id,
                organization_id: req.user.organization_id
            });
            if (!testSeries) return res.error('Test Series not found', 'Not Found', 404);
            return res.success(null, 'Test Series deleted successfully');
        } catch (error) {
            return res.error(error.message);
        }
    }
}

module.exports = new TestSeriesController();
