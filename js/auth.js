// Gestionnaire d'Authentification

document.addEventListener('DOMContentLoaded', function() {
    // Initialiser les formulaires d'authentification
    initAuthForms();
    
    // Vérifier l'authentification existante
    checkExistingAuth();
    
    // Initialiser les modals
    initAuthModals();
});

function initAuthForms() {
    // Formulaire de connexion
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            processLogin();
        });
        
        // Toggle pour afficher/masquer le mot de passe
        const toggleBtn = loginForm.querySelector('.toggle-btn');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', togglePasswordVisibility);
        }
    }
    
    // Formulaire d'inscription
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            processRegistration();
        });
        
        // Validation en temps réel du mot de passe
        const passwordInput = registerForm.querySelector('#password');
        if (passwordInput) {
            passwordInput.addEventListener('input', function() {
                checkPasswordStrength(this.value);
            });
        }
        
        // Validation de la confirmation du mot de passe
        const confirmPasswordInput = registerForm.querySelector('#confirm-password');
        if (confirmPasswordInput) {
            confirmPasswordInput.addEventListener('input', function() {
                validatePasswordConfirmation();
            });
        }
    }
    
    // Formulaire de réinitialisation de mot de passe
    const resetForm = document.getElementById('reset-password-form');
    if (resetForm) {
        resetForm.addEventListener('submit', function(e) {
            e.preventDefault();
            processPasswordReset();
        });
    }
}

function initAuthModals() {
    // Modal de réinitialisation de mot de passe
    const forgotPasswordLink = document.querySelector('.forgot-password');
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', function(e) {
            e.preventDefault();
            openModal('forgot-password-modal');
        });
    }
}

function checkExistingAuth() {
    const token = localStorage.getItem('payfusion_token');
    const user = localStorage.getItem('payfusion_user');
    
    if (token && user) {
        // Rediriger vers la page d'accueil ou la page demandée
        const returnUrl = localStorage.getItem('return_url') || '/';
        if (window.location.pathname.includes('login') || 
            window.location.pathname.includes('register')) {
            window.location.href = returnUrl;
        }
    }
}

function processLogin() {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const remember = document.getElementById('remember')?.checked || false;
    
    // Validation basique
    if (!email || !password) {
        showNotification('Veuillez remplir tous les champs', 'error');
        return;
    }
    
    if (!isValidEmail(email)) {
        showNotification('Adresse email invalide', 'error');
        return;
    }
    
    // Simuler l'authentification
    showLoading();
    
    setTimeout(() => {
        hideLoading();
        
        // En production, envoyer une requête au serveur
        // Pour la démo, vérifier contre les données stockées
        
        // Charger les utilisateurs existants
        let users = JSON.parse(localStorage.getItem('payfusion_users') || '[]');
        const user = users.find(u => u.email === email);
        
        // Vérifier le mot de passe
        if (user && user.password === hashPassword(password)) {
            // Authentification réussie
            createSession(user, remember);
            
            // Vérifier si c'est l'admin
            if (email === 'kenshinworkspace@gmail.com') {
                localStorage.setItem('payfusion_is_admin', 'true');
            }
            
            showNotification('Connexion réussie!', 'success');
            
            // Rediriger
            const returnUrl = localStorage.getItem('return_url') || '/';
            setTimeout(() => {
                window.location.href = returnUrl;
            }, 1500);
            
        } else {
            showNotification('Email ou mot de passe incorrect', 'error');
        }
        
    }, 1500);
}

function processRegistration() {
    const firstName = document.getElementById('first-name').value.trim();
    const lastName = document.getElementById('last-name').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const country = document.getElementById('country').value;
    const terms = document.getElementById('terms').checked;
    const newsletter = document.getElementById('newsletter')?.checked || false;
    
    // Validation
    if (!firstName || !lastName || !email || !phone || !password || !confirmPassword || !country) {
        showNotification('Veuillez remplir tous les champs obligatoires', 'error');
        return;
    }
    
    if (!isValidEmail(email)) {
        showNotification('Adresse email invalide', 'error');
        return;
    }
    
    if (!isValidPhone(phone)) {
        showNotification('Numéro de téléphone invalide. Format: +509XXXXXXXX', 'error');
        return;
    }
    
    if (!isStrongPassword(password)) {
        showNotification('Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showNotification('Les mots de passe ne correspondent pas', 'error');
        return;
    }
    
    if (!terms) {
        showNotification('Veuillez accepter les conditions d\'utilisation', 'error');
        return;
    }
    
    // Vérifier si l'email existe déjà
    let users = JSON.parse(localStorage.getItem('payfusion_users') || '[]');
    if (users.some(u => u.email === email)) {
        showNotification('Cet email est déjà utilisé', 'error');
        return;
    }
    
    // Simuler l'inscription
    showLoading();
    
    setTimeout(() => {
        hideLoading();
        
        // Créer l'utilisateur
        const userId = 'USER_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        const user = {
            id: userId,
            firstName: firstName,
            lastName: lastName,
            email: email,
            phone: phone,
            password: hashPassword(password),
            country: country,
            newsletter: newsletter,
            verified: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        // Ajouter à la liste des utilisateurs
        users.push(user);
        localStorage.setItem('payfusion_users', JSON.stringify(users));
        
        // Créer une session
        createSession(user, false);
        
        // Créer un wallet vide
        const balance = {
            HTG: 0,
            USD: 0,
            CAD: 0
        };
        localStorage.setItem('payfusion_balance', JSON.stringify(balance));
        
        // Enregistrer l'activité
        addActivity({
            type: 'registration',
            description: 'Nouvel utilisateur inscrit',
            status: 'success',
            timestamp: new Date().toISOString()
        });
        
        showNotification('Inscription réussie! Bienvenue sur Pay Fusion.', 'success');
        
        // Rediriger vers la page d'accueil
        setTimeout(() => {
            window.location.href = '/';
        }, 1500);
        
    }, 2000);
}

function processPasswordReset() {
    const email = document.getElementById('reset-email').value.trim();
    
    if (!email || !isValidEmail(email)) {
        showNotification('Veuillez entrer une adresse email valide', 'error');
        return;
    }
    
    // Vérifier si l'email existe
    let users = JSON.parse(localStorage.getItem('payfusion_users') || '[]');
    const userExists = users.some(u => u.email === email);
    
    if (!userExists) {
        showNotification('Aucun compte trouvé avec cet email', 'error');
        return;
    }
    
    // Simuler l'envoi d'email
    showLoading();
    
    setTimeout(() => {
        hideLoading();
        closeModal('forgot-password-modal');
        
        showNotification('Un lien de réinitialisation a été envoyé à votre adresse email.', 'success');
        
        // En production, envoyer un vrai email
        // Pour la démo, générer un token de réinitialisation
        const resetToken = generateResetToken(email);
        console.log('Reset token généré:', resetToken);
        
    }, 1500);
}

function createSession(user, remember) {
    // Générer un token JWT simplifié
    const tokenData = {
        userId: user.id,
        email: user.email,
        role: user.email === 'kenshinworkspace@gmail.com' ? 'admin' : 'user',
        exp: remember ? Date.now() + 30 * 24 * 60 * 60 * 1000 : Date.now() + 24 * 60 * 60 * 1000
    };
    
    const token = btoa(JSON.stringify(tokenData));
    
    // Stocker le token et les données utilisateur
    localStorage.setItem('payfusion_token', token);
    localStorage.setItem('payfusion_user', JSON.stringify({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        country: user.country,
        role: tokenData.role
    }));
    
    // Stocker la session
    const session = {
        id: 'SESS_' + Date.now(),
        userId: user.id,
        browser: navigator.userAgent,
        ip: '127.0.0.1', // En production, récupérer l'IP du serveur
        location: 'Localhost',
        lastActivity: new Date().toISOString()
    };
    
    let sessions = JSON.parse(localStorage.getItem('active_sessions') || '[]');
    sessions.unshift(session);
    localStorage.setItem('active_sessions', JSON.stringify(sessions));
}

function togglePasswordVisibility() {
    const passwordInput = document.getElementById('password');
    const toggleBtn = document.querySelector('.toggle-btn');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleBtn.textContent = 'Masquer';
    } else {
        passwordInput.type = 'password';
        toggleBtn.textContent = 'Afficher';
    }
}

function checkPasswordStrength(password) {
    const strengthElement = document.getElementById('password-strength');
    if (!strengthElement) return;
    
    const strengthBar = strengthElement.querySelector('.strength-bar');
    const strengthText = strengthElement.querySelector('.strength-text');
    
    let strength = 0;
    let text = 'Faible';
    let color = 'var(--danger-color)';
    
    // Critères de force
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    
    switch (strength) {
        case 0:
        case 1:
            text = 'Très faible';
            color = 'var(--danger-color)';
            break;
        case 2:
            text = 'Faible';
            color = 'var(--danger-color)';
            break;
        case 3:
            text = 'Moyen';
            color = 'var(--warning-color)';
            break;
        case 4:
            text = 'Fort';
            color = 'var(--info-color)';
            break;
        case 5:
            text = 'Très fort';
            color = 'var(--success-color)';
            break;
    }
    
    // Mettre à jour l'affichage
    strengthBar.style.width = `${(strength / 5) * 100}%`;
    strengthBar.style.backgroundColor = color;
    strengthText.textContent = text;
    strengthText.style.color = color;
    
    // Mettre à jour les classes
    strengthElement.className = 'password-strength';
    switch (strength) {
        case 0:
        case 1:
            strengthElement.classList.add('very-weak');
            break;
        case 2:
            strengthElement.classList.add('weak');
            break;
        case 3:
            strengthElement.classList.add('medium');
            break;
        case 4:
            strengthElement.classList.add('strong');
            break;
        case 5:
            strengthElement.classList.add('very-strong');
            break;
    }
}

function validatePasswordConfirmation() {
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const confirmInput = document.getElementById('confirm-password');
    
    if (!confirmInput) return;
    
    if (password && confirmPassword) {
        if (password === confirmPassword) {
            confirmInput.style.borderColor = 'var(--success-color)';
        } else {
            confirmInput.style.borderColor = 'var(--danger-color)';
        }
    } else {
        confirmInput.style.borderColor = '';
    }
}

function hashPassword(password) {
    // En production, utiliser Argon2id ou bcrypt côté serveur
    // Pour la démo, utiliser une simple hash (ne pas utiliser en production!)
    return btoa(password); // Très basique, juste pour la démo
}

function generateResetToken(email) {
    const tokenData = {
        email: email,
        purpose: 'password_reset',
        exp: Date.now() + 1 * 60 * 60 * 1000 // 1 heure
    };
    
    return btoa(JSON.stringify(tokenData));
}

function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function isValidPhone(phone) {
    const re = /^\+509[0-9]{8}$/;
    return re.test(phone);
}

function isStrongPassword(password) {
    // Au moins 8 caractères, une majuscule, une minuscule, un chiffre
    const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    return re.test(password);
}

function addActivity(activity) {
    // Générer un ID unique
    activity.id = 'ACT_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    // Charger les activités existantes
    let activities = JSON.parse(localStorage.getItem('user_activities') || '[]');
    
    // Ajouter la nouvelle activité
    activities.unshift(activity);
    
    // Garder seulement les 100 dernières activités
    if (activities.length > 100) {
        activities = activities.slice(0, 100);
    }
    
    // Sauvegarder
    localStorage.setItem('user_activities', JSON.stringify(activities));
}

// Fonctions utilitaires
function showLoading() {
    if (window.showLoading) {
        window.showLoading();
    }
}

function hideLoading() {
    if (window.hideLoading) {
        window.hideLoading();
    }
}

function showNotification(message, type) {
    if (window.PayFusion && window.PayFusion.showNotification) {
        window.PayFusion.showNotification(message, type);
    } else {
        alert(`${type.toUpperCase()}: ${message}`);
    }
}

function openModal(modalId) {
    if (window.PayFusion && window.PayFusion.openModal) {
        window.PayFusion.openModal(modalId);
    }
}

function closeModal(modalId) {
    if (window.PayFusion && window.PayFusion.closeModal) {
        window.PayFusion.closeModal(modalId);
    }
}

// Exporter les fonctions globales
window.togglePassword = togglePasswordVisibility;