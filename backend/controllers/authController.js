const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

// Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'votre-secret-jwt-tres-securise';
const JWT_EXPIRES_IN = '24h';
const SALT_ROUNDS = 12;

// Modèles (à implémenter)
const User = require('../models/User');
const Session = require('../models/Session');
const VerificationToken = require('../models/VerificationToken');

class AuthController {
    // Inscription
    async register(req, res) {
        try {
            const { firstName, lastName, email, phone, password, country, newsletter } = req.body;
            
            // Vérifier si l'utilisateur existe déjà
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    error: 'Cet email est déjà utilisé'
                });
            }
            
            // Hasher le mot de passe
            const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
            
            // Créer l'utilisateur
            const user = new User({
                firstName,
                lastName,
                email,
                phone,
                password: hashedPassword,
                country,
                newsletter: newsletter || false,
                verified: false,
                role: 'user'
            });
            
            await user.save();
            
            // Générer un token de vérification d'email
            const verificationToken = crypto.randomBytes(32).toString('hex');
            const verification = new VerificationToken({
                userId: user._id,
                token: verificationToken,
                type: 'email_verification',
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 heures
            });
            
            await verification.save();
            
            // Envoyer l'email de vérification (à implémenter)
            // await sendVerificationEmail(email, verificationToken);
            
            // Créer le wallet initial
            const wallet = new Wallet({
                userId: user._id,
                balances: {
                    HTG: 0,
                    USD: 0,
                    CAD: 0
                }
            });
            
            await wallet.save();
            
            // Générer le token JWT
            const token = jwt.sign(
                { userId: user._id, email: user.email, role: user.role },
                JWT_SECRET,
                { expiresIn: JWT_EXPIRES_IN }
            );
            
            // Créer une session
            const session = new Session({
                userId: user._id,
                token,
                userAgent: req.get('User-Agent'),
                ipAddress: req.ip,
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
            });
            
            await session.save();
            
            // Journalisation
            await Log.create({
                level: 'info',
                message: `Nouvel utilisateur inscrit: ${email}`,
                userId: user._id,
                details: { action: 'registration' }
            });
            
            res.status(201).json({
                success: true,
                message: 'Inscription réussie. Un email de vérification a été envoyé.',
                data: {
                    token,
                    user: {
                        id: user._id,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        email: user.email,
                        phone: user.phone,
                        country: user.country,
                        role: user.role
                    }
                }
            });
            
        } catch (error) {
            console.error('Erreur d\'inscription:', error);
            res.status(500).json({
                success: false,
                error: 'Erreur lors de l\'inscription'
            });
        }
    }
    
    // Connexion
    async login(req, res) {
        try {
            const { email, password, remember } = req.body;
            
            // Trouver l'utilisateur
            const user = await User.findOne({ email });
            if (!user) {
                return res.status(401).json({
                    success: false,
                    error: 'Email ou mot de passe incorrect'
                });
            }
            
            // Vérifier le mot de passe
            const validPassword = await bcrypt.compare(password, user.password);
            if (!validPassword) {
                return res.status(401).json({
                    success: false,
                    error: 'Email ou mot de passe incorrect'
                });
            }
            
            // Vérifier si le compte est activé
            if (!user.verified) {
                return res.status(403).json({
                    success: false,
                    error: 'Veuillez vérifier votre email avant de vous connecter'
                });
            }
            
            // Vérifier si le compte est bloqué
            if (user.locked) {
                return res.status(403).json({
                    success: false,
                    error: 'Ce compte est temporairement bloqué'
                });
            }
            
            // Durée du token
            const expiresIn = remember ? '30d' : '24h';
            
            // Générer le token JWT
            const token = jwt.sign(
                { userId: user._id, email: user.email, role: user.role },
                JWT_SECRET,
                { expiresIn }
            );
            
            // Créer une session
            const session = new Session({
                userId: user._id,
                token,
                userAgent: req.get('User-Agent'),
                ipAddress: req.ip,
                expiresAt: new Date(Date.now() + (remember ? 30 : 1) * 24 * 60 * 60 * 1000)
            });
            
            await session.save();
            
            // Mettre à jour la dernière connexion
            user.lastLogin = new Date();
            await user.save();
            
            // Journalisation
            await Log.create({
                level: 'info',
                message: `Connexion utilisateur: ${email}`,
                userId: user._id,
                details: { action: 'login', ip: req.ip }
            });
            
            res.json({
                success: true,
                message: 'Connexion réussie',
                data: {
                    token,
                    user: {
                        id: user._id,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        email: user.email,
                        phone: user.phone,
                        country: user.country,
                        role: user.role,
                        has2FA: user.twoFactorSecret ? true : false
                    }
                }
            });
            
        } catch (error) {
            console.error('Erreur de connexion:', error);
            res.status(500).json({
                success: false,
                error: 'Erreur lors de la connexion'
            });
        }
    }
    
    // Récupérer l'utilisateur courant
    async getCurrentUser(req, res) {
        try {
            const user = await User.findById(req.userId).select('-password');
            
            if (!user) {
                return res.status(404).json({
                    success: false,
                    error: 'Utilisateur non trouvé'
                });
            }
            
            res.json({
                success: true,
                data: { user }
            });
            
        } catch (error) {
            console.error('Erreur récupération utilisateur:', error);
            res.status(500).json({
                success: false,
                error: 'Erreur lors de la récupération des données utilisateur'
            });
        }
    }
    
    // Activer la 2FA
    async enable2FA(req, res) {
        try {
            const user = await User.findById(req.userId);
            
            if (!user) {
                return res.status(404).json({
                    success: false,
                    error: 'Utilisateur non trouvé'
                });
            }
            
            // Générer un secret
            const secret = speakeasy.generateSecret({
                name: `Pay Fusion (${user.email})`
            });
            
            // Générer le QR code
            const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);
            
            // Sauvegarder temporairement le secret
            user.twoFactorTempSecret = secret.base32;
            await user.save();
            
            res.json({
                success: true,
                message: 'Scannez le QR code avec votre application d\'authentification',
                data: {
                    secret: secret.base32,
                    qrCode: qrCodeUrl
                }
            });
            
        } catch (error) {
            console.error('Erreur activation 2FA:', error);
            res.status(500).json({
                success: false,
                error: 'Erreur lors de l\'activation de la 2FA'
            });
        }
    }
    
    // Vérifier la 2FA
    async verify2FA(req, res) {
        try {
            const { token } = req.body;
            const user = await User.findById(req.userId);
            
            if (!user) {
                return res.status(404).json({
                    success: false,
                    error: 'Utilisateur non trouvé'
                });
            }
            
            if (!user.twoFactorTempSecret) {
                return res.status(400).json({
                    success: false,
                    error: 'Aucune configuration 2FA en cours'
                });
            }
            
            // Vérifier le token
            const verified = speakeasy.totp.verify({
                secret: user.twoFactorTempSecret,
                encoding: 'base32',
                token: token
            });
            
            if (!verified) {
                return res.status(400).json({
                    success: false,
                    error: 'Token 2FA invalide'
                });
            }
            
            // Activer la 2FA
            user.twoFactorSecret = user.twoFactorTempSecret;
            user.twoFactorTempSecret = undefined;
            user.twoFactorEnabled = true;
            await user.save();
            
            // Journalisation
            await Log.create({
                level: 'info',
                message: `2FA activée pour l'utilisateur: ${user.email}`,
                userId: user._id,
                details: { action: '2fa_enabled' }
            });
            
            res.json({
                success: true,
                message: '2FA activée avec succès'
            });
            
        } catch (error) {
            console.error('Erreur vérification 2FA:', error);
            res.status(500).json({
                success: false,
                error: 'Erreur lors de la vérification de la 2FA'
            });
        }
    }
    
    // Désactiver la 2FA
    async disable2FA(req, res) {
        try {
            const user = await User.findById(req.userId);
            
            if (!user) {
                return res.status(404).json({
                    success: false,
                    error: 'Utilisateur non trouvé'
                });
            }
            
            user.twoFactorSecret = undefined;
            user.twoFactorEnabled = false;
            await user.save();
            
            // Journalisation
            await Log.create({
                level: 'info',
                message: `2FA désactivée pour l'utilisateur: ${user.email}`,
                userId: user._id,
                details: { action: '2fa_disabled' }
            });
            
            res.json({
                success: true,
                message: '2FA désactivée avec succès'
            });
            
        } catch (error) {
            console.error('Erreur désactivation 2FA:', error);
            res.status(500).json({
                success: false,
                error: 'Erreur lors de la désactivation de la 2FA'
            });
        }
    }
    
    // Récupérer les sessions
    async getSessions(req, res) {
        try {
            const sessions = await Session.find({ userId: req.userId })
                .sort({ createdAt: -1 })
                .limit(10);
            
            res.json({
                success: true,
                data: { sessions }
            });
            
        } catch (error) {
            console.error('Erreur récupération sessions:', error);
            res.status(500).json({
                success: false,
                error: 'Erreur lors de la récupération des sessions'
            });
        }
    }
    
    // Révoquer une session
    async revokeSession(req, res) {
        try {
            const { sessionId } = req.params;
            const session = await Session.findOne({ 
                _id: sessionId, 
                userId: req.userId 
            });
            
            if (!session) {
                return res.status(404).json({
                    success: false,
                    error: 'Session non trouvée'
                });
            }
            
            // Ne pas supprimer la session courante
            if (session.token === req.token) {
                return res.status(400).json({
                    success: false,
                    error: 'Impossible de révoquer la session courante'
                });
            }
            
            await session.deleteOne();
            
            // Journalisation
            await Log.create({
                level: 'info',
                message: `Session révoquée pour l'utilisateur: ${req.userId}`,
                userId: req.userId,
                details: { action: 'session_revoked', sessionId }
            });
            
            res.json({
                success: true,
                message: 'Session révoquée avec succès'
            });
            
        } catch (error) {
            console.error('Erreur révocation session:', error);
            res.status(500).json({
                success: false,
                error: 'Erreur lors de la révocation de la session'
            });
        }
    }
    
    // Supprimer le compte
    async deleteAccount(req, res) {
        try {
            const { password } = req.body;
            const user = await User.findById(req.userId);
            
            if (!user) {
                return res.status(404).json({
                    success: false,
                    error: 'Utilisateur non trouvé'
                });
            }
            
            // Vérifier le mot de passe
            const validPassword = await bcrypt.compare(password, user.password);
            if (!validPassword) {
                return res.status(401).json({
                    success: false,
                    error: 'Mot de passe incorrect'
                });
            }
            
            // Marquer le compte comme supprimé (soft delete)
            user.deleted = true;
            user.deletedAt = new Date();
            user.email = `deleted_${user._id}_${user.email}`;
            user.phone = `deleted_${user._id}_${user.phone}`;
            await user.save();
            
            // Supprimer toutes les sessions
            await Session.deleteMany({ userId: req.userId });
            
            // Journalisation
            await Log.create({
                level: 'warning',
                message: `Compte supprimé: ${user.email}`,
                userId: user._id,
                details: { action: 'account_deletion' }
            });
            
            res.json({
                success: true,
                message: 'Compte supprimé avec succès'
            });
            
        } catch (error) {
            console.error('Erreur suppression compte:', error);
            res.status(500).json({
                success: false,
                error: 'Erreur lors de la suppression du compte'
            });
        }
    }
    
    // Mot de passe oublié
    async forgotPassword(req, res) {
        try {
            const { email } = req.body;
            
            const user = await User.findOne({ email });
            if (!user) {
                // Ne pas révéler que l'email n'existe pas
                return res.json({
                    success: true,
                    message: 'Si cet email existe, un lien de réinitialisation a été envoyé'
                });
            }
            
            // Générer un token de réinitialisation
            const resetToken = crypto.randomBytes(32).toString('hex');
            const resetHash = await bcrypt.hash(resetToken, SALT_ROUNDS);
            
            // Sauvegarder le token
            const verification = new VerificationToken({
                userId: user._id,
                token: resetHash,
                type: 'password_reset',
                expiresAt: new Date(Date.now() + 1 * 60 * 60 * 1000) // 1 heure
            });
            
            await verification.save();
            
            // Envoyer l'email de réinitialisation (à implémenter)
            // await sendPasswordResetEmail(email, resetToken);
            
            // Journalisation
            await Log.create({
                level: 'info',
                message: `Demande de réinitialisation de mot de passe pour: ${email}`,
                userId: user._id,
                details: { action: 'password_reset_requested' }
            });
            
            res.json({
                success: true,
                message: 'Si cet email existe, un lien de réinitialisation a été envoyé'
            });
            
        } catch (error) {
            console.error('Erreur mot de passe oublié:', error);
            res.status(500).json({
                success: false,
                error: 'Erreur lors de la demande de réinitialisation'
            });
        }
    }
    
    // Réinitialiser le mot de passe
    async resetPassword(req, res) {
        try {
            const { token, password } = req.body;
            
            // Trouver le token de réinitialisation
            const verification = await VerificationToken.findOne({
                token: { $exists: true },
                type: 'password_reset',
                expiresAt: { $gt: new Date() }
            });
            
            if (!verification) {
                return res.status(400).json({
                    success: false,
                    error: 'Token invalide ou expiré'
                });
            }
            
            // Vérifier le token
            const validToken = await bcrypt.compare(token, verification.token);
            if (!validToken) {
                return res.status(400).json({
                    success: false,
                    error: 'Token invalide ou expiré'
                });
            }
            
            // Trouver l'utilisateur
            const user = await User.findById(verification.userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    error: 'Utilisateur non trouvé'
                });
            }
            
            // Hasher le nouveau mot de passe
            const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
            user.password = hashedPassword;
            user.passwordChangedAt = new Date();
            await user.save();
            
            // Supprimer le token utilisé
            await verification.deleteOne();
            
            // Supprimer toutes les sessions existantes
            await Session.deleteMany({ userId: user._id });
            
            // Journalisation
            await Log.create({
                level: 'info',
                message: `Mot de passe réinitialisé pour: ${user.email}`,
                userId: user._id,
                details: { action: 'password_reset_completed' }
            });
            
            res.json({
                success: true,
                message: 'Mot de passe réinitialisé avec succès'
            });
            
        } catch (error) {
            console.error('Erreur réinitialisation mot de passe:', error);
            res.status(500).json({
                success: false,
                error: 'Erreur lors de la réinitialisation du mot de passe'
            });
        }
    }
}

module.exports = new AuthController();