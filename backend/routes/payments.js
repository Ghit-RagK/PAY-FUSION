const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticate } = require('../middlewares/auth');
const { validatePayment } = require('../middlewares/validation');
const upload = require('../middlewares/upload');

// Routes protégées
router.post('/submit',
  authenticate,
  upload.single('proof'),
  validatePayment,
  paymentController.submitPayment
);

router.get('/history', authenticate, paymentController.getPaymentHistory);
router.get('/:paymentId', authenticate, paymentController.getPaymentDetails);
router.get('/proof/:paymentId', authenticate, paymentController.getPaymentProof);

// Routes admin
router.get('/admin/pending', authenticate, paymentController.getPendingPayments);
router.post('/admin/:paymentId/approve', authenticate, paymentController.approvePayment);
router.post('/admin/:paymentId/reject', authenticate, paymentController.rejectPayment);

module.exports = router;