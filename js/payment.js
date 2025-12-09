// Gestionnaire de Paiement

document.addEventListener('DOMContentLoaded', function() {
    // Initialiser les onglets de méthode de paiement
    initPaymentTabs();
    
    // Initialiser le formulaire
    initPaymentForm();
    
    // Vérifier les paramètres URL
    checkUrlParams();
    
    // Vérifier l'authentification
    checkPaymentAuth();
});

function initPaymentTabs() {
    const tabs = document.querySelectorAll('.method-tab');
    const infos = document.querySelectorAll('.method-info');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const method = this.dataset.method;
            
            // Mettre à jour les onglets actifs
            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // Afficher l'info correspondante
            infos.forEach(info => {
                if (info.id === `${method}-info`) {
                    info.style.display = 'block';
                    info.classList.add('active');
                } else {
                    info.style.display = 'none';
                    info.classList.remove('active');
                }
            });
            
            // Mettre à jour le sélecteur de méthode dans le formulaire
            const methodSelect = document.getElementById('payment-method-selected');
            if (methodSelect) {
                methodSelect.value = method;
            }
        });
    });
}

function initPaymentForm() {
    const form = document.getElementById('payment-form');
    if (!form) return;
    
    // Générer un ID de commande
    generateOrderId();
    
    // Synchroniser l'onglet sélectionné avec le sélecteur
    const methodSelect = document.getElementById('payment-method-selected');
    const tabs = document.querySelectorAll('.method-tab');
    
    methodSelect.addEventListener('change', function() {
        const method = this.value;
        
        // Mettre à jour l'onglet actif
        tabs.forEach(tab => {
            if (tab.dataset.method === method) {
                tab.click();
            }
        });
    });
    
    // Soumission du formulaire
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        processPayment();
    });
    
    // Validation en temps réel
    const phoneInput = document.getElementById('phone-number');
    if (phoneInput) {
        phoneInput.addEventListener('input', function() {
            formatPhoneNumber(this);
        });
    }
}

function checkUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const method = urlParams.get('method');
    const orderId = urlParams.get('order');
    
    if (method && (method === 'moncash' || method === 'natcash')) {
        // Sélectionner la méthode correspondante
        const tab = document.querySelector(`.method-tab[data-method="${method}"]`);
        if (tab) {
            tab.click();
        }
        
        const methodSelect = document.getElementById('payment-method-selected');
        if (methodSelect) {
            methodSelect.value = method;
        }
    }
    
    if (orderId) {
        // Pré-remplir l'ID de commande
        const orderInput = document.getElementById('order-id');
        if (orderInput) {
            orderInput.value = orderId;
        }
    }
}

function generateOrderId() {
    const orderInput = document.getElementById('order-id');
    if (!orderInput) return;
    
    if (!orderInput.value) {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 9000) + 1000;
        orderInput.value = `PAY-${timestamp}-${random}`;
    }
}

function formatPhoneNumber(input) {
    let value = input.value.replace(/\D/g, '');
    
    if (value.startsWith('509')) {
        value = '+509' + value.substring(3);
    } else if (value.startsWith('509') && value.length <= 11) {
        value = '+509' + value.substring(3);
    }
    
    input.value = value;
}

function validatePaymentForm() {
    const fullName = document.getElementById('full-name').value.trim();
    const phoneNumber = document.getElementById('phone-number').value.trim();
    const paymentMethod = document.getElementById('payment-method-selected').value;
    const amount = parseFloat(document.getElementById('amount').value);
    const transactionNumber = document.getElementById('transaction-number').value.trim();
    const paymentProof = document.getElementById('payment-proof').files[0];
    const terms = document.getElementById('terms').checked;
    
    // Validation nom complet
    if (!fullName) {
        showNotification('Veuillez entrer votre nom complet', 'error');
        return false;
    }
    
    if (fullName.length < 3) {
        showNotification('Nom complet trop court', 'error');
        return false;
    }
    
    // Validation téléphone
    if (!phoneNumber) {
        showNotification('Veuillez entrer votre numéro de téléphone', 'error');
        return false;
    }
    
    if (!/^\+509[0-9]{8}$/.test(phoneNumber)) {
        showNotification('Numéro de téléphone invalide. Format: +509XXXXXXXX', 'error');
        return false;
    }
    
    // Validation méthode de paiement
    if (!paymentMethod) {
        showNotification('Veuillez sélectionner une méthode de paiement', 'error');
        return false;
    }
    
    // Validation montant
    if (!amount || amount < 100) {
        showNotification('Montant minimum: 100 HTG', 'error');
        return false;
    }
    
    if (amount > 1000000) {
        showNotification('Montant maximum: 1,000,000 HTG', 'error');
        return false;
    }
    
    // Validation numéro de transaction
    if (!transactionNumber) {
        showNotification('Veuillez entrer le numéro de transaction', 'error');
        return false;
    }
    
    // Validation preuve de paiement
    if (!paymentProof) {
        showNotification('Veuillez fournir une preuve de paiement', 'error');
        return false;
    }
    
    // Validation type de fichier
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(paymentProof.type)) {
        showNotification('Type de fichier non supporté. Formats acceptés: PNG, JPG, PDF', 'error');
        return false;
    }
    
    // Validation taille de fichier (5Mo max)
    if (paymentProof.size > 5 * 1024 * 1024) {
        showNotification('Fichier trop volumineux. Maximum: 5Mo', 'error');
        return false;
    }
    
    // Validation conditions
    if (!terms) {
        showNotification('Veuillez accepter les conditions', 'error');
        return false;
    }
    
    return true;
}

function processPayment() {
    if (!validatePaymentForm()) {
        return;
    }
    
    const fullName = document.getElementById('full-name').value.trim();
    const phoneNumber = document.getElementById('phone-number').value.trim();
    const paymentMethod = document.getElementById('payment-method-selected').value;
    const amount = parseFloat(document.getElementById('amount').value);
    const transactionNumber = document.getElementById('transaction-number').value.trim();
    const paymentProof = document.getElementById('payment-proof').files[0];
    const orderId = document.getElementById('order-id').value;
    const notes = document.getElementById('notes').value.trim();
    
    // Récupérer les informations de la méthode sélectionnée
    let methodDetails = {};
    if (paymentMethod === 'moncash') {
        methodDetails = {
            number: '+50939442808',
            recipient: 'Bien Aimé Marcco',
            type: 'MonCash'
        };
    } else if (paymentMethod === 'natcash') {
        methodDetails = {
            number: '+50935751478',
            recipient: 'Bien Aimé Marcco',
            type: 'NatCash'
        };
    }
    
    // Confirmation
    const confirmationMessage = `
        Confirmer le paiement?
        
        Méthode: ${paymentMethod}
        Montant: ${amount} HTG
        Destinataire: ${methodDetails.recipient}
        Numéro: ${methodDetails.number}
        Votre téléphone: ${phoneNumber}
        Référence: ${transactionNumber}
        
        Note: Cette transaction nécessite une validation manuelle par notre équipe.
    `;
    
    if (!confirm(confirmationMessage)) {
        return;
    }
    
    // Simuler l'envoi au serveur
    showLoading();
    
    // Lire le fichier comme URL data
    const reader = new FileReader();
    reader.onload = function(e) {
        const proofDataUrl = e.target.result;
        
        setTimeout(() => {
            hideLoading();
            
            // Enregistrer le paiement
            savePaymentToLocalStorage({
                id: orderId,
                fullName: fullName,
                phoneNumber: phoneNumber,
                paymentMethod: paymentMethod,
                amount: amount,
                transactionNumber: transactionNumber,
                proof: proofDataUrl,
                notes: notes,
                methodDetails: methodDetails,
                status: 'pending',
                timestamp: new Date().toISOString()
            });
            
            showNotification('Paiement soumis avec succès! En attente de validation.', 'success');
            
            // Réinitialiser le formulaire
            document.getElementById('payment-form').reset();
            generateOrderId();
            
            // Rediriger vers l'historique ou la page d'accueil
            setTimeout(() => {
                window.location.href = '/account.html#history';
            }, 2000);
            
        }, 2000);
    };
    
    reader.readAsDataURL(paymentProof);
}

function savePaymentToLocalStorage(payment) {
    let payments = JSON.parse(localStorage.getItem('payfusion_payments') || '[]');
    payments.push(payment);
    localStorage.setItem('payfusion_payments', JSON.stringify(payments));
}

function checkPaymentAuth() {
    const token = localStorage.getItem('payfusion_token');
    if (!token) {
        // Si non connecté, rediriger vers login
        const currentPath = window.location.pathname + window.location.search;
        localStorage.setItem('return_url', currentPath);
        // window.location.href = `/login.html?return=${encodeURIComponent(currentPath)}`;
    }
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

// Exporter les fonctions globales
window.formatPhoneNumber = formatPhoneNumber;