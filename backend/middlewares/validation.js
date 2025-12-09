const { body, param, query, validationResult } = require('express-validator');
const { isValidEmail, isValidPhone, isStrongPassword } = require('../utils/validators');

// Validation d'inscription
const validateRegistration = [
    body('firstName')
        .trim()
        .notEmpty().withMessage('Le prénom est requis')
        .isLength({ min: 2, max: 50 }).withMessage('Le prénom doit contenir entre 2 et 50 caractères'),
    
    body('lastName')
        .trim()
        .notEmpty().withMessage('Le nom est requis')
        .isLength({ min: 2, max: 50 }).withMessage('Le nom doit contenir entre 2 et 50 caractères'),
    
    body('email')
        .trim()
        .notEmpty().withMessage('L\'email est requis')
        .isEmail().withMessage('Email invalide')
        .custom(isValidEmail).withMessage('Format d\'email invalide'),
    
    body('phone')
        .trim()
        .notEmpty().withMessage('Le téléphone est requis')
        .custom(isValidPhone).withMessage('Format de téléphone invalide. Utilisez le format: +509XXXXXXXX'),
    
    body('password')
        .notEmpty().withMessage('Le mot de passe est requis')
        .isLength({ min: 8 }).withMessage('Le mot de passe doit contenir au moins 8 caractères')
        .custom(isStrongPassword).withMessage('Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre'),
    
    body('country')
        .trim()
        .notEmpty().withMessage('Le pays est requis')
        .isLength({ min: 2, max: 2 }).withMessage('Code pays invalide'),
    
    body('newsletter')
        .optional()
        .isBoolean().withMessage('Newsletter doit être un booléen'),
    
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }
        next();
    }
];

// Validation de connexion
const validateLogin = [
    body('email')
        .trim()
        .notEmpty().withMessage('L\'email est requis')
        .isEmail().withMessage('Email invalide'),
    
    body('password')
        .notEmpty().withMessage('Le mot de passe est requis'),
    
    body('remember')
        .optional()
        .isBoolean().withMessage('Remember doit être un booléen'),
    
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }
        next();
    }
];

// Validation de paiement
const validatePayment = [
    body('fullName')
        .trim()
        .notEmpty().withMessage('Le nom complet est requis')
        .isLength({ min: 3, max: 100 }).withMessage('Le nom doit contenir entre 3 et 100 caractères'),
    
    body('phoneNumber')
        .trim()
        .notEmpty().withMessage('Le numéro de téléphone est requis')
        .custom(isValidPhone).withMessage('Format de téléphone invalide'),
    
    body('paymentMethod')
        .trim()
        .notEmpty().withMessage('La méthode de paiement est requise')
        .isIn(['moncash', 'natcash']).withMessage('Méthode de paiement invalide'),
    
    body('amount')
        .notEmpty().withMessage('Le montant est requis')
        .isFloat({ min: 100, max: 1000000 }).withMessage('Le montant doit être entre 100 et 1,000,000 HTG'),
    
    body('transactionNumber')
        .trim()
        .notEmpty().withMessage('Le numéro de transaction est requis')
        .isLength({ min: 3, max: 50 }).withMessage('Le numéro de transaction doit contenir entre 3 et 50 caractères'),
    
    body('orderId')
        .optional()
        .isLength({ min: 5, max: 50 }).withMessage('ID de commande invalide'),
    
    body('notes')
        .optional()
        .isLength({ max: 500 }).withMessage('Les notes ne doivent pas dépasser 500 caractères'),
    
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }
        next();
    }
];

// Validation de dépôt
const validateDeposit = [
    body('currency')
        .trim()
        .notEmpty().withMessage('La devise est requise')
        .isIn(['HTG', 'USD', 'CAD']).withMessage('Devise invalide'),
    
    body('amount')
        .notEmpty().withMessage('Le montant est requis')
        .isFloat({ min: 1 }).withMessage('Montant minimum: 1'),
    
    body('method')
        .trim()
        .notEmpty().withMessage('La méthode de paiement est requise')
        .isIn(['moncash', 'natcash', 'bank', 'crypto']).withMessage('Méthode de paiement invalide'),
    
    body('reference')
        .trim()
        .notEmpty().withMessage('La référence est requise')
        .isLength({ min: 3, max: 100 }).withMessage('La référence doit contenir entre 3 et 100 caractères'),
    
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }
        next();
    }
];

// Validation de retrait
const validateWithdrawal = [
    body('currency')
        .trim()
        .notEmpty().withMessage('La devise est requise')
        .isIn(['HTG', 'USD', 'CAD']).withMessage('Devise invalide'),
    
    body('amount')
        .notEmpty().withMessage('Le montant est requis')
        .isFloat({ min: 1 }).withMessage('Montant minimum: 1'),
    
    body('method')
        .trim()
        .notEmpty().withMessage('La méthode de retrait est requise')
        .isIn(['moncash', 'natcash', 'bank', 'crypto']).withMessage('Méthode de retrait invalide'),
    
    body('account')
        .trim()
        .notEmpty().withMessage('Le numéro de compte est requis')
        .isLength({ min: 3, max: 100 }).withMessage('Le numéro de compte doit contenir entre 3 et 100 caractères'),
    
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }
        next();
    }
];

// Validation de conversion
const validateConversion = [
    body('fromCurrency')
        .trim()
        .notEmpty().withMessage('La devise source est requise')
        .isIn(['HTG', 'USD', 'CAD']).withMessage('Devise source invalide'),
    
    body('toCurrency')
        .trim()
        .notEmpty().withMessage('La devise cible est requise')
        .isIn(['HTG', 'USD', 'CAD']).withMessage('Devise cible invalide')
        .custom((value, { req }) => value !== req.body.fromCurrency)
        .withMessage('Les devises source et cible doivent être différentes'),
    
    body('amount')
        .notEmpty().withMessage('Le montant est requis')
        .isFloat({ min: 1 }).withMessage('Montant minimum: 1'),
    
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }
        next();
    }
];

// Validation de dépôt crypto
const validateCryptoDeposit = [
    body('network')
        .trim()
        .notEmpty().withMessage('Le réseau est requis')
        .isIn(['TRC20', 'ERC20']).withMessage('Réseau invalide'),
    
    body('amount')
        .notEmpty().withMessage('Le montant est requis')
        .isFloat({ min: 10 }).withMessage('Montant minimum: 10 USDT'),
    
    body('senderAddress')
        .trim()
        .notEmpty().withMessage('L\'adresse expéditeur est requise')
        .isLength({ min: 26, max: 42 }).withMessage('Adresse expéditeur invalide'),
    
    body('transactionHash')
        .trim()
        .notEmpty().withMessage('Le hash de transaction est requis')
        .isLength({ min: 64, max: 66 }).withMessage('Hash de transaction invalide'),
    
    body('orderId')
        .optional()
        .isLength({ min: 5, max: 50 }).withMessage('ID de commande invalide'),
    
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }
        next();
    }
];

// Validation de commande Free Fire
const validateFreeFireOrder = [
    body('playerId')
        .trim()
        .notEmpty().withMessage('L\'ID joueur est requis')
        .matches(/^\d{6,12}$/).withMessage('ID joueur invalide (6-12 chiffres)'),
    
    body('orderType')
        .trim()
        .notEmpty().withMessage('Le type de commande est requis')
        .isIn(['pack', 'weekly', 'monthly', 'levelpass']).withMessage('Type de commande invalide'),
    
    body('packId')
        .if(body('orderType').equals('pack'))
        .notEmpty().withMessage('L\'ID du pack est requis pour les packs')
        .isInt({ min: 1, max: 21 }).withMessage('ID de pack invalide'),
    
    body('paymentMethod')
        .trim()
        .notEmpty().withMessage('La méthode de paiement est requise')
        .isIn(['moncash', 'natcash', 'crypto', 'wallet']).withMessage('Méthode de paiement invalide'),
    
    body('orderId')
        .optional()
        .isLength({ min: 5, max: 50 }).withMessage('ID de commande invalide'),
    
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }
        next();
    }
];

module.exports = {
    validateRegistration,
    validateLogin,
    validatePayment,
    validateDeposit,
    validateWithdrawal,
    validateConversion,
    validateCryptoDeposit,
    validateFreeFireOrder
};