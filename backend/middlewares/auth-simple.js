const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'payfusion-vercel-secret-2024';

function authenticate(req, res, next) {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Accès non autorisé. Token manquant.'
      });
    }
    
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    req.userEmail = decoded.email;
    req.userRole = decoded.role;
    req.token = token;
    
    next();
  } catch (error) {
    console.error('Erreur d\'authentification:', error);
    res.status(401).json({
      success: false,
      error: 'Token invalide ou expiré'
    });
  }
}

module.exports = { authenticate };