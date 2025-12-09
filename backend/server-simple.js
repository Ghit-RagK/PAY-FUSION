const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Route de connexion simple
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  console.log('Login attempt:', email);
  
  // Admin
  if (email === 'kenshinworkspace@gmail.com' && password === 'admin123') {
    return res.json({
      success: true,
      message: 'Connexion admin réussie',
      token: 'admin_token_vercel',
      user: {
        id: 'admin_001',
        firstName: 'Admin',
        lastName: 'PayFusion',
        email: email,
        phone: '+50939442808',
        country: 'HT',
        role: 'admin'
      }
    });
  }
  
  // Utilisateur test
  if (password === 'test123') {
    return res.json({
      success: true,
      message: 'Connexion réussie',
      token: 'user_token_' + Date.now(),
      user: {
        id: 'user_' + Date.now(),
        firstName: email.split('@')[0],
        lastName: 'Test',
        email: email,
        phone: '+509' + Math.floor(10000000 + Math.random() * 90000000),
        country: 'HT',
        role: 'user'
      }
    });
  }
  
  res.status(401).json({
    success: false,
    error: 'Email ou mot de passe incorrect'
  });
});

// Route d'inscription simple
app.post('/api/auth/register', (req, res) => {
  const { firstName, lastName, email, phone, password } = req.body;
  
  console.log('Register:', email);
  
  res.json({
    success: true,
    message: 'Inscription réussie sur Vercel',
    token: 'new_user_token_' + Date.now(),
    user: {
      id: 'user_' + Date.now(),
      firstName,
      lastName,
      email,
      phone,
      country: 'HT',
      role: 'user'
    }
  });
});

// Servir les fichiers statiques
const path = require('path');
app.use(express.static(__dirname + '/..'));

app.listen(PORT, () => {
  console.log(`✅ Serveur Vercel simple démarré sur le port ${PORT}`);
});