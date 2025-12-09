const express = require('express');
const router = express.Router();
const cryptoController = require('../controllers/cryptoController');
const { authenticate } = require('../middlewares/auth');
const { validateCryptoDeposit } = require('../middlewares/validation');
const upload = require('../middlewares/upload');

// Routes publiques
router.get('/address', cryptoController.getDepositAddress);
router.get('/rates', cryptoController.getExchangeRates);

// Routes protégées
router.post('/deposit',
  authenticate,
  upload.single('proof'),
  validateCryptoDeposit,
  cryptoController.submitDeposit
);

router.get('/deposits', authenticate, cryptoController.getDepositHistory);
router.get('/deposits/:depositId', authenticate, cryptoController.getDepositDetails);

// Routes admin
router.get('/admin/pending', authenticate, cryptoController.getPendingDeposits);
router.post('/admin/:depositId/verify', authenticate, cryptoController.verifyDeposit);
router.post('/admin/:depositId/reject', authenticate, cryptoController.rejectDeposit);
router.post('/admin/rates', authenticate, cryptoController.updateExchangeRates);

module.exports = router;