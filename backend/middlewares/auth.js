// backend/middlewares/auth.js
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'payfusion-vercel-secret-2024';

// Base de données en mémoire pour Vercel
const usersMemory = [
  {
    id: 'admin_001',
    email: 'kenshinworkspace@gmail.com',
    password: '$2a$10$examplehash', // admin123 hashé
    firstName: 'Admin',
    lastName: 'PayFusion',
    phone: '+50939442808',
    country: 'HT',
    role: 'admin',
    verified: true,
    locked: false,
    deleted: false
  }
];

const sessionsMemory = [];

// Middleware d'authentification simplifié pour Vercel
async function authenticate(req, res, next) {
  try {
    // Récupérer le token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Token d\'authentification manquant'
      });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Vérifier le token JWT
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Chercher l'utilisateur en mémoire
    const user = usersMemory.find(u => u.id === decoded.userId);
    
    if (!user || user.deleted) {
      return res.status(401).json({
        success: false,
        error: 'Utilisateur non trouvé'
      });
    }
    
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
    
    // Mettre à jour la session en mémoire
    const sessionIndex = sessionsMemory.findIndex(s => s.token === token);
    if (sessionIndex !== -1) {
      sessionsMemory[sessionIndex].lastActivity = new Date();
    }
    
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

// Middleware simplifié (désactivé pour le moment)
async function require2FA(req, res, next) {
  // Pour Vercel, on ignore la 2FA temporairement
  next();
}

// Middleware de rate limiting
function userRateLimit(windowMs = 15 * 60 * 1000, maxRequests = 100) {
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