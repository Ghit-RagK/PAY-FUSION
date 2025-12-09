const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Session = require('../models/Session');

const JWT_SECRET = process.env.JWT_SECRET || 'votre-secret-jwt-tres-securise';

// Middleware d'authentification
async function authenticate(req, res, next) {
  try {
    // Récupérer le token depuis les headers
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Token d\'authentification manquant'
      });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Vérifier la session
    const session = await Session.findOne({ token });
    if (!session || session.expiresAt < new Date()) {
      return res.status(401).json({
        success: false,
        error: 'Session expirée ou invalide'
      });
    }
    
    // Vérifier le token JWT
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Vérifier si l'utilisateur existe toujours
    const user = await User.findById(decoded.userId);
    if (!user || user.deleted) {
      return res.status(401).json({
        success: false,
        error: 'Utilisateur non trouvé'
      });
    }
    
    // Vérifier si le compte est verrouillé
    if (user.locked) {
      return res.status(403).json({
        success: false,
        error: 'Compte temporairement suspendu'
      });
    }
    
    // Attacher l'utilisateur à la requête
    req.userId = decoded.userId;
    req.user = user;
    req.token = token;
    
    // Mettre à jour la dernière activité de la session
    session.lastActivity = new Date();
    await session.save();
    
    next();
    
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Token d\'authentification invalide'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token d\'authentification expiré'
      });
    }
    
    console.error('Erreur d\'authentification:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur d\'authentification'
    });
  }
}

// Middleware d'autorisation admin
function authorizeAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Accès non autorisé. Droits administrateur requis.'
    });
  }
  next();
}

// Middleware de vérification 2FA
async function require2FA(req, res, next) {
  try {
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé'
      });
    }
    
    if (user.twoFactorEnabled && !req.headers['x-2fa-token']) {
      return res.status(403).json({
        success: false,
        error: 'Authentification à deux facteurs requise'
      });
    }
    
    if (user.twoFactorEnabled && req.headers['x-2fa-token']) {
      // Vérifier le token 2FA
      // À implémenter
    }
    
    next();
    
  } catch (error) {
    console.error('Erreur vérification 2FA:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la vérification 2FA'
    });
  }
}

// Middleware de rate limiting par utilisateur
function userRateLimit(windowMs, maxRequests) {
  const requests = new Map();
  
  return (req, res, next) => {
    if (!req.userId) {
      return next();
    }
    
    const now = Date.now();
    const userRequests = requests.get(req.userId) || [];
    
    // Nettoyer les requêtes anciennes
    const recentRequests = userRequests.filter(time => now - time < windowMs);
    
    if (recentRequests.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        error: 'Trop de requêtes. Veuillez réessayer plus tard.'
      });
    }
    
    recentRequests.push(now);
    requests.set(req.userId, recentRequests);
    
    next();
  };
}

module.exports = {
  authenticate,
  authorizeAdmin,
  require2FA,
  userRateLimit
};