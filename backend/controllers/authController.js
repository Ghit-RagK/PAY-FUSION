const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'payfusion-vercel-secret-2024';
const JWT_EXPIRES_IN = '24h';
const SALT_ROUNDS = 12;

// Base de données en mémoire pour Vercel
const usersMemory = [];
const sessionsMemory = [];

// Base de données en mémoire (pour Vercel)
const users = [
  {
    id: 'admin_001',
    email: 'kenshinworkspace@gmail.com',
    password: '$2a$10$YourHashedPasswordHere', // V7kR!2mQ9xL8
    firstName: 'Admin',
    lastName: 'PayFusion',
    phone: '+50939442808',
    country: 'HT',
    role: 'admin',
    verified: true
  }
];

const sessions = [];

class AuthController {
  // Inscription simplifiée
  async register(req, res) {
    try {
      const { firstName, lastName, email, phone, password, country } = req.body;
      
      console.log('Inscription Vercel:', email);
      
      // Vérifier si l'utilisateur existe
      if (users.find(u => u.email === email)) {
        return res.status(400).json({
          success: false,
          error: 'Cet email est déjà utilisé'
        });
      }
      
      // Hasher le mot de passe
      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
      
      // Créer l'utilisateur
      const userId = 'user_' + Date.now();
      const newUser = {
        id: userId,
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phone,
        country: country || 'HT',
        role: 'user',
        verified: false,
        createdAt: new Date()
      };
      
      users.push(newUser);
      
      // Générer le token
      const token = jwt.sign(
        { userId, email, role: 'user' },
        JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      // Créer une session
      sessions.push({
        userId,
        token,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        createdAt: new Date()
      });
      
      console.log('Utilisateur créé:', email);
      
      res.status(201).json({
        success: true,
        message: 'Inscription réussie',
        data: {
          token,
          user: {
            id: userId,
            firstName,
            lastName,
            email,
            phone,
            country: newUser.country,
            role: 'user'
          }
        }
      });
      
    } catch (error) {
      console.error('Erreur inscription Vercel:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de l\'inscription'
      });
    }
  }
  
  // Connexion simplifiée
  async login(req, res) {
    try {
      const { email, password } = req.body;
      
      console.log('Connexion Vercel:', email);
      
      // Trouver l'utilisateur
      let user = users.find(u => u.email === email);
      
      // Pour l'admin (mot de passe en clair pour test)
      if (email === 'kenshinworkspace@gmail.com') {
        if (password === 'admin123') {
          user = {
            id: 'admin_001',
            email: 'kenshinworkspace@gmail.com',
            firstName: 'Admin',
            lastName: 'PayFusion',
            phone: '+50939442808',
            country: 'HT',
            role: 'admin',
            verified: true
          };
        }
      } else if (!user) {
        // Pour les tests, créer un utilisateur automatiquement
        const userId = 'test_' + Date.now();
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
        
        user = {
          id: userId,
          email,
          password: hashedPassword,
          firstName: email.split('@')[0],
          lastName: 'Test',
          phone: '+509' + Math.floor(10000000 + Math.random() * 90000000),
          country: 'HT',
          role: 'user',
          verified: true
        };
        
        users.push(user);
      }
      
      // Vérifier le mot de passe pour les utilisateurs existants
      if (user.password) {
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
          return res.status(401).json({
            success: false,
            error: 'Email ou mot de passe incorrect'
          });
        }
      }
      
      // Générer le token
      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      // Créer une session
      sessions.push({
        userId: user.id,
        token,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        createdAt: new Date()
      });
      
      console.log('Connexion réussie:', email);
      
      res.json({
        success: true,
        message: 'Connexion réussie',
        data: {
          token,
          user: {
            id: user.id,
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
      console.error('Erreur connexion Vercel:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la connexion'
      });
    }
  }
  
  // Récupérer l'utilisateur courant (simplifié)
  async getCurrentUser(req, res) {
    try {
      const user = users.find(u => u.id === req.userId);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'Utilisateur non trouvé'
        });
      }
      
      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
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
      console.error('Erreur récupération utilisateur:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur serveur'
      });
    }
  }
  
  // Autres méthodes simplifiées...
  async forgotPassword(req, res) {
    res.json({
      success: true,
      message: 'Email de réinitialisation envoyé (simulé pour Vercel)'
    });
  }
  
  async resetPassword(req, res) {
    res.json({
      success: true,
      message: 'Mot de passe réinitialisé (simulé pour Vercel)'
    });
  }
}

module.exports = new AuthController();