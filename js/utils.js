// Utilitaires généraux pour Pay Fusion

/**
 * Formate un montant en devise
 * @param {number} amount - Le montant à formater
 * @param {string} currency - La devise (HTG, USD, CAD)
 * @returns {string} Le montant formaté
 */
function formatCurrency(amount, currency = 'HTG') {
    const formatter = new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
    
    return formatter.format(amount);
}

/**
 * Formate une date
 * @param {Date|string} date - La date à formater
 * @param {boolean} includeTime - Inclure l'heure
 * @returns {string} La date formatée
 */
function formatDate(date, includeTime = true) {
    const dateObj = new Date(date);
    
    const options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    };
    
    if (includeTime) {
        options.hour = '2-digit';
        options.minute = '2-digit';
    }
    
    return dateObj.toLocaleDateString('fr-FR', options);
}

/**
 * Formate un numéro de téléphone
 * @param {string} phone - Le numéro de téléphone
 * @returns {string} Le numéro formaté
 */
function formatPhone(phone) {
    if (!phone) return '';
    
    // Format Haïtien: +509 XX XX XXXX
    const cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.startsWith('509') && cleaned.length === 11) {
        return `+509 ${cleaned.substring(3, 5)} ${cleaned.substring(5, 7)} ${cleaned.substring(7)}`;
    }
    
    return phone;
}

/**
 * Vérifie si un email est valide
 * @param {string} email - L'email à vérifier
 * @returns {boolean} True si l'email est valide
 */
function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

/**
 * Vérifie si un numéro de téléphone est valide
 * @param {string} phone - Le numéro à vérifier
 * @returns {boolean} True si le numéro est valide
 */
function isValidPhone(phone) {
    const re = /^\+?[0-9]{10,15}$/;
    return re.test(phone.replace(/\s/g, ''));
}

/**
 * Vérifie si un mot de passe est fort
 * @param {string} password - Le mot de passe à vérifier
 * @returns {boolean} True si le mot de passe est fort
 */
function isStrongPassword(password) {
    // Au moins 8 caractères, une majuscule, une minuscule, un chiffre
    const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    return re.test(password);
}

/**
 * Calcule la force d'un mot de passe
 * @param {string} password - Le mot de passe à évaluer
 * @returns {number} Score de 0 à 5
 */
function getPasswordStrength(password) {
    let score = 0;
    
    if (!password) return score;
    
    // Longueur minimale
    if (password.length >= 8) score++;
    
    // Contient une minuscule
    if (/[a-z]/.test(password)) score++;
    
    // Contient une majuscule
    if (/[A-Z]/.test(password)) score++;
    
    // Contient un chiffre
    if (/[0-9]/.test(password)) score++;
    
    // Contient un caractère spécial
    if (/[^A-Za-z0-9]/.test(password)) score++;
    
    return score;
}

/**
 * Génère un ID unique
 * @param {string} prefix - Préfixe pour l'ID
 * @returns {string} ID unique
 */
function generateId(prefix = '') {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 9);
    return `${prefix}${timestamp}_${random}`.toUpperCase();
}

/**
 * Génère un ID de commande
 * @param {string} type - Type de commande (PAY, FF, CRYPTO, etc.)
 * @returns {string} ID de commande
 */
function generateOrderId(type = 'PAY') {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 9000) + 1000;
    return `${type}-${timestamp}-${random}`;
}

/**
 * Formate un montant pour l'affichage
 * @param {number} amount - Le montant
 * @param {number} decimals - Nombre de décimales
 * @returns {string} Montant formaté
 */
function formatAmount(amount, decimals = 2) {
    return parseFloat(amount).toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

/**
 * Convertit une devise à une autre
 * @param {number} amount - Montant à convertir
 * @param {string} from - Devise source
 * @param {string} to - Devise cible
 * @returns {number} Montant converti
 */
function convertCurrency(amount, from, to) {
    const rates = {
        USD: { HTG: 157, CAD: 1.36 },
        HTG: { USD: 1/157, CAD: 1/115 },
        CAD: { HTG: 115, USD: 1/1.36 }
    };
    
    if (from === to) return amount;
    
    if (rates[from] && rates[from][to]) {
        return amount * rates[from][to];
    }
    
    // Conversion via USD si pas de taux direct
    if (rates[from] && rates[from].USD && rates.USD[to]) {
        return amount * rates[from].USD * rates.USD[to];
    }
    
    return amount; // Retourner le montant original si conversion impossible
}

/**
 * Valide un fichier uploadé
 * @param {File} file - Le fichier à valider
 * @param {Array} allowedTypes - Types MIME autorisés
 * @param {number} maxSize - Taille maximale en octets
 * @returns {Object} Résultat de validation
 */
function validateFile(file, allowedTypes = [], maxSize = 5 * 1024 * 1024) {
    const result = {
        valid: true,
        errors: []
    };
    
    // Vérifier le type
    if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
        result.valid = false;
        result.errors.push(`Type de fichier non supporté. Types autorisés: ${allowedTypes.join(', ')}`);
    }
    
    // Vérifier la taille
    if (file.size > maxSize) {
        result.valid = false;
        const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(2);
        result.errors.push(`Fichier trop volumineux. Maximum: ${maxSizeMB} Mo`);
    }
    
    return result;
}

/**
 * Lit un fichier comme URL data
 * @param {File} file - Le fichier à lire
 * @returns {Promise<string>} Promise avec l'URL data
 */
function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
    });
}

/**
 * Tronque un texte
 * @param {string} text - Texte à tronquer
 * @param {number} maxLength - Longueur maximale
 * @returns {string} Texte tronqué
 */
function truncateText(text, maxLength = 100) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

/**
 * Copie du texte dans le presse-papier
 * @param {string} text - Texte à copier
 * @returns {Promise<boolean>} True si réussi
 */
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (err) {
        console.error('Erreur de copie:', err);
        
        // Méthode de fallback
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            document.execCommand('copy');
            document.body.removeChild(textArea);
            return true;
        } catch (err2) {
            console.error('Fallback erreur:', err2);
            document.body.removeChild(textArea);
            return false;
        }
    }
}

/**
 * Débounce une fonction
 * @param {Function} func - Fonction à débouncer
 * @param {number} wait - Temps d'attente en ms
 * @returns {Function} Fonction débouncée
 */
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

/**
 * Throttle une fonction
 * @param {Function} func - Fonction à throttler
 * @param {number} limit - Limite en ms
 * @returns {Function} Fonction throttlée
 */
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

/**
 * Affiche un indicateur de chargement
 * @param {string} message - Message à afficher
 */
function showLoader(message = 'Chargement...') {
    // Vérifier si un loader existe déjà
    let loader = document.getElementById('global-loader');
    
    if (!loader) {
        loader = document.createElement('div');
        loader.id = 'global-loader';
        loader.style.position = 'fixed';
        loader.style.top = '0';
        loader.style.left = '0';
        loader.style.right = '0';
        loader.style.bottom = '0';
        loader.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
        loader.style.display = 'flex';
        loader.style.flexDirection = 'column';
        loader.style.alignItems = 'center';
        loader.style.justifyContent = 'center';
        loader.style.zIndex = '9999';
        
        const spinner = document.createElement('div');
        spinner.className = 'loader-spinner';
        spinner.style.width = '50px';
        spinner.style.height = '50px';
        spinner.style.border = '5px solid #f3f3f3';
        spinner.style.borderTop = '5px solid #0057FF';
        spinner.style.borderRadius = '50%';
        spinner.style.animation = 'spin 1s linear infinite';
        
        const text = document.createElement('p');
        text.textContent = message;
        text.style.marginTop = '20px';
        text.style.color = '#333';
        
        loader.appendChild(spinner);
        loader.appendChild(text);
        document.body.appendChild(loader);
        
        // Ajouter l'animation CSS si elle n'existe pas
        if (!document.querySelector('#loader-styles')) {
            const style = document.createElement('style');
            style.id = 'loader-styles';
            style.textContent = `
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(style);
        }
    } else {
        loader.style.display = 'flex';
    }
}

/**
 * Cache l'indicateur de chargement
 */
function hideLoader() {
    const loader = document.getElementById('global-loader');
    if (loader) {
        loader.style.display = 'none';
    }
}

/**
 * Vérifie si l'utilisateur est connecté
 * @returns {boolean} True si connecté
 */
function isLoggedIn() {
    const token = localStorage.getItem('payfusion_token');
    const user = localStorage.getItem('payfusion_user');
    return !!(token && user);
}

/**
 * Récupère les données de l'utilisateur connecté
 * @returns {Object|null} Données utilisateur
 */
function getCurrentUser() {
    const userJson = localStorage.getItem('payfusion_user');
    if (userJson) {
        try {
            return JSON.parse(userJson);
        } catch (e) {
            console.error('Erreur de parsing des données utilisateur:', e);
            return null;
        }
    }
    return null;
}

/**
 * Vérifie si l'utilisateur est admin
 * @returns {boolean} True si admin
 */
function isAdmin() {
    const user = getCurrentUser();
    return user && user.email === 'kenshinworkspace@gmail.com';
}

/**
 * Nettoie le localStorage (pour le développement)
 */
function clearLocalStorage() {
    if (confirm('Voulez-vous vraiment effacer toutes les données locales? Cette action est irréversible.')) {
        localStorage.clear();
        location.reload();
    }
}

/**
 * Exporte les données utilisateur (pour backup)
 */
function exportUserData() {
    const user = getCurrentUser();
    if (!user) {
        alert('Aucun utilisateur connecté');
        return;
    }
    
    const data = {
        user: user,
        balance: JSON.parse(localStorage.getItem('payfusion_balance') || '{}'),
        transactions: JSON.parse(localStorage.getItem('payfusion_transactions') || '[]'),
        payments: JSON.parse(localStorage.getItem('payfusion_payments') || '[]'),
        orders: JSON.parse(localStorage.getItem('freefire_orders') || '[]'),
        exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payfusion-backup-${user.id}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Importe les données utilisateur (pour restore)
 */
function importUserData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = JSON.parse(e.target.result);
                
                if (!data.user || !data.user.id) {
                    throw new Error('Format de fichier invalide');
                }
                
                if (confirm(`Importer les données pour ${data.user.email}? Cela écrasera vos données actuelles.`)) {
                    localStorage.setItem('payfusion_user', JSON.stringify(data.user));
                    localStorage.setItem('payfusion_balance', JSON.stringify(data.balance || {}));
                    localStorage.setItem('payfusion_transactions', JSON.stringify(data.transactions || []));
                    localStorage.setItem('payfusion_payments', JSON.stringify(data.payments || []));
                    localStorage.setItem('freefire_orders', JSON.stringify(data.orders || []));
                    
                    alert('Données importées avec succès!');
                    location.reload();
                }
            } catch (err) {
                alert('Erreur lors de l\'import: ' + err.message);
            }
        };
        
        reader.readAsText(file);
    };
    
    input.click();
}

// Exporter les fonctions globales
window.PayFusionUtils = {
    formatCurrency,
    formatDate,
    formatPhone,
    isValidEmail,
    isValidPhone,
    isStrongPassword,
    getPasswordStrength,
    generateId,
    generateOrderId,
    formatAmount,
    convertCurrency,
    validateFile,
    readFileAsDataURL,
    truncateText,
    copyToClipboard,
    debounce,
    throttle,
    showLoader,
    hideLoader,
    isLoggedIn,
    getCurrentUser,
    isAdmin,
    clearLocalStorage,
    exportUserData,
    importUserData
};