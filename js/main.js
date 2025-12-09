// Utilitaires généraux pour Pay Fusion

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    // Vérifier l'authentification
    checkAuth();
    
    // Initialiser les tooltips
    initTooltips();
    
    // Initialiser les modals
    initModals();
    
    // Initialiser les formulaires
    initForms();
    
    // Initialiser les notifications
    initNotifications();
});

// Fonctions d'authentification
function checkAuth() {
    const token = localStorage.getItem('payfusion_token');
    const user = localStorage.getItem('payfusion_user');
    
    if (token && user) {
        // Mettre à jour l'interface pour l'utilisateur connecté
        updateUIForLoggedInUser(JSON.parse(user));
        
        // Vérifier si c'est l'admin
        checkAdminStatus(JSON.parse(user));
    }
}

function updateUIForLoggedInUser(user) {
    const authButtons = document.querySelector('.auth-buttons');
    if (authButtons) {
        authButtons.innerHTML = `
            <a href="/account.html" class="btn btn-outline">Mon Compte</a>
            <button onclick="logout()" class="btn btn-primary">Déconnexion</button>
        `;
    }
    
    // Mettre à jour le nom d'utilisateur dans la page account
    const userNameElement = document.getElementById('user-name');
    const userEmailElement = document.getElementById('user-email');
    
    if (userNameElement && user) {
        userNameElement.textContent = `${user.firstName} ${user.lastName}`;
    }
    
    if (userEmailElement && user) {
        userEmailElement.textContent = user.email;
    }
}

function logout() {
    localStorage.removeItem('payfusion_token');
    localStorage.removeItem('payfusion_user');
    window.location.href = '/';
}

function checkAdminStatus(user) {
    if (user.email === 'kenshinworkspace@gmail.com') {
        // Charger le script admin si nécessaire
        loadAdminScript();
    }
}

function loadAdminScript() {
    // Vérifier si le script admin est déjà chargé
    if (!document.querySelector('script[src="/js/admin.js"]')) {
        const script = document.createElement('script');
        script.src = '/js/admin.js';
        script.onload = function() {
            // Initialiser l'admin après chargement
            if (window.initAdmin) {
                window.initAdmin();
            }
        };
        document.head.appendChild(script);
    }
}

// Tooltips
function initTooltips() {
    const tooltips = document.querySelectorAll('[data-tooltip]');
    
    tooltips.forEach(element => {
        element.addEventListener('mouseenter', showTooltip);
        element.addEventListener('mouseleave', hideTooltip);
    });
}

function showTooltip(e) {
    const tooltipText = e.target.getAttribute('data-tooltip');
    if (!tooltipText) return;
    
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    tooltip.textContent = tooltipText;
    tooltip.style.position = 'absolute';
    tooltip.style.background = '#333';
    tooltip.style.color = 'white';
    tooltip.style.padding = '0.5rem 0.75rem';
    tooltip.style.borderRadius = '4px';
    tooltip.style.fontSize = '0.875rem';
    tooltip.style.zIndex = '1000';
    tooltip.style.maxWidth = '200px';
    tooltip.style.wordWrap = 'break-word';
    
    document.body.appendChild(tooltip);
    
    const rect = e.target.getBoundingClientRect();
    tooltip.style.left = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2) + 'px';
    tooltip.style.top = rect.top - tooltip.offsetHeight - 5 + 'px';
    
    e.target._tooltip = tooltip;
}

function hideTooltip(e) {
    if (e.target._tooltip) {
        e.target._tooltip.remove();
        delete e.target._tooltip;
    }
}

// Modals
function initModals() {
    const modals = document.querySelectorAll('.modal');
    
    modals.forEach(modal => {
        const closeBtn = modal.querySelector('.close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                closeModal(modal.id);
            });
        }
        
        // Fermer la modal en cliquant en dehors
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal(modal.id);
            }
        });
    });
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// Formulaires
function initForms() {
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
        // Validation front-end
        form.addEventListener('submit', function(e) {
            if (!validateForm(this)) {
                e.preventDefault();
            }
        });
        
        // Validation en temps réel
        const inputs = form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('blur', () => {
                validateField(input);
            });
            
            input.addEventListener('input', () => {
                clearFieldError(input);
            });
        });
    });
}

function validateForm(form) {
    let isValid = true;
    const inputs = form.querySelectorAll('input, select, textarea');
    
    inputs.forEach(input => {
        if (!validateField(input)) {
            isValid = false;
        }
    });
    
    return isValid;
}

function validateField(field) {
    const value = field.value.trim();
    const isRequired = field.hasAttribute('required');
    const type = field.type;
    const pattern = field.getAttribute('pattern');
    
    // Réinitialiser l'erreur
    clearFieldError(field);
    
    // Validation du champ requis
    if (isRequired && !value) {
        setFieldError(field, 'Ce champ est obligatoire');
        return false;
    }
    
    // Validation spécifique par type
    if (value) {
        switch (type) {
            case 'email':
                if (!isValidEmail(value)) {
                    setFieldError(field, 'Veuillez entrer une adresse email valide');
                    return false;
                }
                break;
                
            case 'tel':
                if (!isValidPhone(value)) {
                    setFieldError(field, 'Veuillez entrer un numéro de téléphone valide');
                    return false;
                }
                break;
                
            case 'password':
                if (field.id === 'password' || field.id === 'new-password') {
                    if (!isStrongPassword(value)) {
                        setFieldError(field, 'Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre');
                        return false;
                    }
                }
                break;
        }
        
        // Validation par pattern
        if (pattern && !new RegExp(pattern).test(value)) {
            const fieldName = field.name || 'ce champ';
            setFieldError(field, `Le format de ${fieldName} est invalide`);
            return false;
        }
    }
    
    // Validation spéciale pour confirmation de mot de passe
    if (field.id === 'confirm-password' || field.id === 'confirm_password') {
        const passwordField = document.getElementById('password') || 
                            document.getElementById('new-password');
        if (passwordField && passwordField.value !== value) {
            setFieldError(field, 'Les mots de passe ne correspondent pas');
            return false;
        }
    }
    
    setFieldSuccess(field);
    return true;
}

function setFieldError(field, message) {
    const formGroup = field.closest('.form-group');
    if (!formGroup) return;
    
    formGroup.classList.add('has-error');
    
    let errorElement = formGroup.querySelector('.error-message');
    if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        formGroup.appendChild(errorElement);
    }
    
    errorElement.textContent = message;
}

function clearFieldError(field) {
    const formGroup = field.closest('.form-group');
    if (!formGroup) return;
    
    formGroup.classList.remove('has-error');
    
    const errorElement = formGroup.querySelector('.error-message');
    if (errorElement) {
        errorElement.remove();
    }
}

function setFieldSuccess(field) {
    const formGroup = field.closest('.form-group');
    if (!formGroup) return;
    
    formGroup.classList.remove('has-error');
    formGroup.classList.add('is-valid');
}

function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function isValidPhone(phone) {
    const re = /^\+?[0-9]{10,15}$/;
    return re.test(phone);
}

function isStrongPassword(password) {
    // Au moins 8 caractères, une majuscule, une minuscule, un chiffre
    const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    return re.test(password);
}

// Notifications
function initNotifications() {
    // Charger les notifications depuis localStorage
    loadNotifications();
}

function showNotification(message, type = 'info', duration = 5000) {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Styles de notification
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.right = '20px';
    notification.style.padding = '1rem 1.5rem';
    notification.style.borderRadius = 'var(--border-radius)';
    notification.style.boxShadow = 'var(--shadow)';
    notification.style.zIndex = '10000';
    notification.style.maxWidth = '400px';
    notification.style.wordWrap = 'break-word';
    notification.style.animation = 'slideIn 0.3s ease';
    
    switch (type) {
        case 'success':
            notification.style.backgroundColor = 'var(--success-color)';
            notification.style.color = 'white';
            break;
        case 'error':
            notification.style.backgroundColor = 'var(--danger-color)';
            notification.style.color = 'white';
            break;
        case 'warning':
            notification.style.backgroundColor = 'var(--warning-color)';
            notification.style.color = '#000';
            break;
        default:
            notification.style.backgroundColor = 'var(--info-color)';
            notification.style.color = 'white';
    }
    
    document.body.appendChild(notification);
    
    // Fermer automatiquement
    if (duration > 0) {
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, duration);
    }
    
    // Bouton de fermeture
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '&times;';
    closeBtn.style.background = 'none';
    closeBtn.style.border = 'none';
    closeBtn.style.color = 'inherit';
    closeBtn.style.fontSize = '1.5rem';
    closeBtn.style.position = 'absolute';
    closeBtn.style.top = '0';
    closeBtn.style.right = '5px';
    closeBtn.style.cursor = 'pointer';
    closeBtn.style.padding = '0';
    closeBtn.style.lineHeight = '1';
    
    closeBtn.addEventListener('click', () => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    });
    
    notification.appendChild(closeBtn);
}

function loadNotifications() {
    // Charger les notifications depuis une API ou localStorage
    // Pour l'instant, juste un placeholder
}

// Animations CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Fonctions utilitaires
function formatCurrency(amount, currency = 'HTG') {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
}

function formatDate(date) {
    return new Intl.DateTimeFormat('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(new Date(date));
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Exporter les fonctions globales
window.PayFusion = {
    showNotification,
    formatCurrency,
    formatDate,
    openModal,
    closeModal,
    logout
};
// Menu burger
function initMobileMenu() {
    const menuToggle = document.getElementById('menu-toggle');
    const mainNav = document.getElementById('main-nav');
    const navOverlay = document.getElementById('nav-overlay');
    
    if (!menuToggle || !mainNav || !navOverlay) return;
    
    function toggleMenu() {
        menuToggle.classList.toggle('active');
        mainNav.classList.toggle('active');
        navOverlay.classList.toggle('active');
        document.body.style.overflow = mainNav.classList.contains('active') ? 'hidden' : 'auto';
    }
    
    function closeMenu() {
        menuToggle.classList.remove('active');
        mainNav.classList.remove('active');
        navOverlay.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
    
    menuToggle.addEventListener('click', toggleMenu);
    navOverlay.addEventListener('click', closeMenu);
    
    // Fermer le menu quand on clique sur un lien
    mainNav.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', closeMenu);
    });
    
    // Fermer le menu avec la touche Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && mainNav.classList.contains('active')) {
            closeMenu();
        }
    });
    
    // Mettre à jour le lien actif
    updateActiveNavLink();
}

function updateActiveNavLink() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.main-nav a');
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        
        if (link.getAttribute('href') === currentPath || 
            (currentPath === '/' && link.getAttribute('href') === '/') ||
            (currentPath.includes(link.getAttribute('href').replace('.html', '')) && 
             link.getAttribute('href') !== '/')) {
            link.classList.add('active');
        }
    });
}

// Ajouter dans DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialiser le menu mobile
    initMobileMenu();
    
    // ... le reste de votre code existant ...
});