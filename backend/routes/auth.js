// backend/routes/auth.js
const express = require('express');
const router = express.Router();

// Utiliser le contrôleur simplifié
const authController = require('../controllers/authController-simple');

// Routes publiques
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// Routes protégées (ajouter middleware plus tard)
router.get('/me', authController.getCurrentUser);

// Routes temporairement désactivées
router.post('/verify-email', (req, res) => res.json({ success: true, message: 'Email vérifié (simulé)' }));
router.put('/profile', (req, res) => res.json({ success: true, message: 'Profil mis à jour (simulé)' }));
router.put('/password', (req, res) => res.json({ success: true, message: 'Mot de passe changé (simulé)' }));

module.exports = router;