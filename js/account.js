// Gestionnaire de Compte

document.addEventListener('DOMContentLoaded', function() {
    // Initialiser les sections du compte
    initAccountSections();
    
    // Charger les données du profil
    loadProfileData();
    
    // Initialiser les formulaires
    initAccountForms();
    
    // Initialiser les modals
    initAccountModals();
    
    // Vérifier l'authentification
    checkAccountAuth();
});

function initAccountSections() {
    // Gérer la navigation entre sections
    const navLinks = document.querySelectorAll('.account-nav a');
    const sections = document.querySelectorAll('.account-section');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            if (this.getAttribute('href').startsWith('#')) {
                e.preventDefault();
                
                const sectionId = this.getAttribute('href').substring(1);
                
                // Mettre à jour la navigation active
                navLinks.forEach(l => l.classList.remove('active'));
                this.classList.add('active');
                
                // Afficher la section correspondante
                sections.forEach(section => {
                    if (section.id === `${sectionId}-section`) {
                        section.classList.add('active');
                    } else {
                        section.classList.remove('active');
                    }
                });
                
                // Sauvegarder la section active
                localStorage.setItem('account_active_section', sectionId);
            }
        });
    });
    
    // Restaurer la section active
    const activeSection = localStorage.getItem('account_active_section') || 'profile';
    const activeLink = document.querySelector(`.account-nav a[href="#${activeSection}"]`);
    if (activeLink) {
        activeLink.click();
    }
}

function showSection(sectionId) {
    const sections = document.querySelectorAll('.account-section');
    const navLinks = document.querySelectorAll('.account-nav a');
    
    // Mettre à jour la navigation active
    navLinks.forEach(link => {
        if (link.getAttribute('href') === `#${sectionId}`) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
    
    // Afficher la section correspondante
    sections.forEach(section => {
        if (section.id === `${sectionId}-section`) {
            section.classList.add('active');
        } else {
            section.classList.remove('active');
        }
    });
    
    // Sauvegarder la section active
    localStorage.setItem('account_active_section', sectionId);
}

function loadProfileData() {
    // Charger les données de l'utilisateur
    const userData = JSON.parse(localStorage.getItem('payfusion_user') || '{}');
    
    // Remplir le formulaire de profil
    const firstNameInput = document.getElementById('first-name');
    const lastNameInput = document.getElementById('last-name');
    const emailInput = document.getElementById('email');
    const phoneInput = document.getElementById('phone');
    const countrySelect = document.getElementById('country');
    const birthdateInput = document.getElementById('birthdate');
    
    if (firstNameInput && userData.firstName) {
        firstNameInput.value = userData.firstName;
    }
    
    if (lastNameInput && userData.lastName) {
        lastNameInput.value = userData.lastName;
    }
    
    if (emailInput && userData.email) {
        emailInput.value = userData.email;
    }
    
    if (phoneInput && userData.phone) {
        phoneInput.value = userData.phone;
    }
    
    if (countrySelect && userData.country) {
        countrySelect.value = userData.country;
    }
    
    if (birthdateInput && userData.birthdate) {
        birthdateInput.value = userData.birthdate;
    }
    
    // Mettre à jour l'affichage du profil
    const userNameElement = document.getElementById('user-name');
    const userEmailElement = document.getElementById('user-email');
    
    if (userNameElement && userData.firstName && userData.lastName) {
        userNameElement.textContent = `${userData.firstName} ${userData.lastName}`;
    }
    
    if (userEmailElement && userData.email) {
        userEmailElement.textContent = userData.email;
    }
}

function initAccountForms() {
    // Formulaire de profil
    const profileForm = document.getElementById('profile-form');
    if (profileForm) {
        profileForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveProfile();
        });
    }
    
    // Formulaire de notifications
    const notificationsForm = document.getElementById('notifications-form');
    if (notificationsForm) {
        notificationsForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveNotificationPreferences();
        });
    }
    
    // Formulaire de préférences
    const preferencesForm = document.getElementById('preferences-form');
    if (preferencesForm) {
        preferencesForm.addEventListener('submit', function(e) {
            e.preventDefault();
            savePreferences();
        });
    }
    
    // Formulaire de changement de mot de passe
    const passwordForm = document.getElementById('password-form');
    if (passwordForm) {
        passwordForm.addEventListener('submit', function(e) {
            e.preventDefault();
            changePassword();
        });
    }
}

function initAccountModals() {
    // Modal de changement de mot de passe
    const passwordModal = document.getElementById('password-modal');
    if (passwordModal) {
        const closeBtn = passwordModal.querySelector('.close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                closeModal('password-modal');
            });
        }
    }
}

function saveProfile() {
    const firstName = document.getElementById('first-name').value.trim();
    const lastName = document.getElementById('last-name').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const country = document.getElementById('country').value;
    const birthdate = document.getElementById('birthdate').value;
    
    // Validation
    if (!firstName || !lastName) {
        showNotification('Veuillez remplir tous les champs obligatoires', 'error');
        return;
    }
    
    if (phone && !/^\+509[0-9]{8}$/.test(phone)) {
        showNotification('Numéro de téléphone invalide. Format: +509XXXXXXXX', 'error');
        return;
    }
    
    // Charger les données utilisateur existantes
    let userData = JSON.parse(localStorage.getItem('payfusion_user') || '{}');
    
    // Mettre à jour les données
    userData.firstName = firstName;
    userData.lastName = lastName;
    userData.phone = phone;
    userData.country = country;
    userData.birthdate = birthdate;
    userData.updatedAt = new Date().toISOString();
    
    // Sauvegarder
    localStorage.setItem('payfusion_user', JSON.stringify(userData));
    
    // Mettre à jour l'affichage
    loadProfileData();
    
    showNotification('Profil mis à jour avec succès!', 'success');
}

function saveNotificationPreferences() {
    // Récupérer les préférences
    const notifications = {
        security: document.querySelector('input[name="security"]')?.checked || false,
        transactions: document.querySelector('input[name="transactions"]')?.checked || false,
        promotions: document.querySelector('input[name="promotions"]')?.checked || false,
        push_important: document.querySelector('input[name="push_important"]')?.checked || false,
        push_alerts: document.querySelector('input[name="push_alerts"]')?.checked || false
    };
    
    // Sauvegarder
    localStorage.setItem('notification_preferences', JSON.stringify(notifications));
    
    showNotification('Préférences de notification enregistrées!', 'success');
}

function savePreferences() {
    const language = document.getElementById('language').value;
    const currencyDefault = document.getElementById('currency-default').value;
    const timezone = document.getElementById('timezone').value;
    const autoLogout = document.getElementById('auto-logout').checked;
    const showTutorials = document.getElementById('show-tutorials').checked;
    
    const preferences = {
        language: language,
        currencyDefault: currencyDefault,
        timezone: timezone,
        autoLogout: autoLogout,
        showTutorials: showTutorials
    };
    
    // Sauvegarder
    localStorage.setItem('user_preferences', JSON.stringify(preferences));
    
    showNotification('Préférences enregistrées!', 'success');
}

function openPasswordModal() {
    openModal('password-modal');
}

function changePassword() {
    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    
    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
        showNotification('Veuillez remplir tous les champs', 'error');
        return;
    }
    
    // Vérifier l'ancien mot de passe
    const userData = JSON.parse(localStorage.getItem('payfusion_user') || '{}');
    if (!userData.password || userData.password !== hashPassword(currentPassword)) {
        showNotification('Mot de passe actuel incorrect', 'error');
        return;
    }
    
    // Vérifier la force du nouveau mot de passe
    if (!isStrongPassword(newPassword)) {
        showNotification('Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre', 'error');
        return;
    }
    
    // Vérifier la confirmation
    if (newPassword !== confirmPassword) {
        showNotification('Les mots de passe ne correspondent pas', 'error');
        return;
    }
    
    // Vérifier que le nouveau mot de passe est différent de l'ancien
    if (currentPassword === newPassword) {
        showNotification('Le nouveau mot de passe doit être différent de l\'ancien', 'error');
        return;
    }
    
    // Mettre à jour le mot de passe
    userData.password = hashPassword(newPassword);
    userData.passwordChangedAt = new Date().toISOString();
    
    localStorage.setItem('payfusion_user', JSON.stringify(userData));
    
    // Enregistrer l'activité
    addActivity({
        type: 'password_change',
        description: 'Changement de mot de passe',
        status: 'success',
        timestamp: new Date().toISOString()
    });
    
    // Fermer la modal et réinitialiser le formulaire
    closeModal('password-modal');
    document.getElementById('password-form').reset();
    
    showNotification('Mot de passe changé avec succès!', 'success');
}

function enable2FA() {
    if (confirm('Voulez-vous activer l\'authentification à deux facteurs?\n\nVous devrez configurer une application d\'authentification comme Google Authenticator.')) {
        // Simuler l'activation de la 2FA
        showLoading();
        
        setTimeout(() => {
            hideLoading();
            
            // Générer une clé secrète (en production, cela viendrait du serveur)
            const secretKey = generateSecretKey();
            
            // Afficher les instructions
            const instructions = `
                Configuration de l'authentification à deux facteurs:
                
                1. Installez Google Authenticator ou une application similaire
                2. Ajoutez une nouvelle clé en scannant le QR code
                3. Entrez le code à 6 chiffres généré
                
                Votre clé secrète: ${secretKey}
                (Gardez cette clé en lieu sûr)
                
                QR Code: https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=otpauth://totp/PayFusion?secret=${secretKey}
            `;
            
            if (confirm(instructions + '\n\nVoulez-vous afficher le QR code?')) {
                window.open(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=otpauth://totp/PayFusion?secret=${secretKey}`, '_blank');
            }
            
            // Demander le code de vérification
            const verificationCode = prompt('Entrez le code à 6 chiffres de votre application d\'authentification:');
            
            if (verificationCode && verificationCode.length === 6 && /^\d+$/.test(verificationCode)) {
                // En production, vérifier le code avec le serveur
                localStorage.setItem('2fa_enabled', 'true');
                localStorage.setItem('2fa_secret', secretKey);
                
                showNotification('Authentification à deux facteurs activée avec succès!', 'success');
                
                // Enregistrer l'activité
                addActivity({
                    type: '2fa_enabled',
                    description: 'Authentification à deux facteurs activée',
                    status: 'success',
                    timestamp: new Date().toISOString()
                });
            } else {
                showNotification('Code de vérification invalide', 'error');
            }
            
        }, 1500);
    }
}

function viewSessions() {
    // Récupérer les sessions actives
    const sessions = JSON.parse(localStorage.getItem('active_sessions') || '[]');
    
    if (sessions.length === 0) {
        alert('Aucune session active trouvée.');
        return;
    }
    
    let sessionsList = 'Sessions actives:\n\n';
    
    sessions.forEach((session, index) => {
        sessionsList += `${index + 1}. ${session.browser} sur ${session.os}\n`;
        sessionsList += `   Adresse IP: ${session.ip}\n`;
        sessionsList += `   Dernière activité: ${new Date(session.lastActivity).toLocaleString('fr-FR')}\n`;
        sessionsList += `   Location: ${session.location}\n\n`;
    });
    
    sessionsList += 'Voulez-vous terminer toutes les autres sessions?';
    
    if (confirm(sessionsList)) {
        // Terminer toutes les autres sessions
        const currentSession = sessions[0]; // Garder la session actuelle
        
        localStorage.setItem('active_sessions', JSON.stringify([currentSession]));
        
        showNotification('Toutes les autres sessions ont été terminées.', 'success');
        
        // Enregistrer l'activité
        addActivity({
            type: 'sessions_ended',
            description: 'Toutes les autres sessions terminées',
            status: 'success',
            timestamp: new Date().toISOString()
        });
    }
}

function deleteAccount() {
    if (confirm('⚠️ ATTENTION: Cette action est IRREVERSIBLE!\n\nToutes vos données seront supprimées définitivement.\nVos fonds restants seront perdus.\n\nVoulez-vous vraiment supprimer votre compte?')) {
        const confirmation = prompt('Tapez "SUPPRIMER" pour confirmer la suppression:');
        
        if (confirmation === 'SUPPRIMER') {
            showLoading();
            
            setTimeout(() => {
                hideLoading();
                
                // En production, envoyer une requête au serveur
                
                // Nettoyer le localStorage
                localStorage.removeItem('payfusion_token');
                localStorage.removeItem('payfusion_user');
                localStorage.removeItem('payfusion_balance');
                localStorage.removeItem('payfusion_transactions');
                localStorage.removeItem('payfusion_payments');
                localStorage.removeItem('freefire_orders');
                localStorage.removeItem('notification_preferences');
                localStorage.removeItem('user_preferences');
                localStorage.removeItem('2fa_enabled');
                localStorage.removeItem('2fa_secret');
                localStorage.removeItem('active_sessions');
                
                // Rediriger vers la page d'accueil
                window.location.href = '/';
                
                showNotification('Compte supprimé avec succès. Au revoir!', 'info');
                
            }, 2000);
        } else {
            showNotification('Suppression annulée. Le compte n\'a pas été supprimé.', 'warning');
        }
    }
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

function hashPassword(password) {
    // En production, utiliser Argon2id ou bcrypt côté serveur
    // Pour la démo, utiliser une simple hash (ne pas utiliser en production!)
    return btoa(password); // Très basique, juste pour la démo
}

function generateSecretKey() {
    // Générer une clé secrète pour la 2FA
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let key = '';
    for (let i = 0; i < 32; i++) {
        key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return key;
}

function isStrongPassword(password) {
    // Au moins 8 caractères, une majuscule, une minuscule, un chiffre
    const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    return re.test(password);
}

function checkAccountAuth() {
    const token = localStorage.getItem('payfusion_token');
    if (!token) {
        // Si non connecté, rediriger vers login
        window.location.href = `/login.html?return=${encodeURIComponent(window.location.pathname)}`;
    }
}

// Fonctions utilitaires
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

// Exporter les fonctions globales
window.showSection = showSection;
window.openPasswordModal = openPasswordModal;
window.enable2FA = enable2FA;
window.viewSessions = viewSessions;
window.deleteAccount = deleteAccount;