const express = require('express');
const router = express.Router();
const instituteController = require('../../controllers/organization/instituteController');
const { createBatchValidator } = require('../../validators/organization/featureValidator');
const validate = require('../../middleware/validate');
const { authMiddleware, requireRole } = require('../../middleware/auth');


router.use(authMiddleware);
router.use(requireRole(['org_admin', 'instructor']));


// Batches
router.get('/batches', instituteController.getBatches);
router.post('/batches', createBatchValidator, validate, instituteController.createBatch);
router.post('/batches/:batchId/enroll', instituteController.enrollInBatch);

// Certificates
router.post('/certificates', instituteController.issueCertificate);
router.get('/certificates', async (req, res) => {
  const { Certificate } = require('../../models');
  const certificates = await Certificate.find({ organization_id: req.user.organization_id });
  res.status(200).json({ success: true, data: certificates });
});

module.exports = router;
