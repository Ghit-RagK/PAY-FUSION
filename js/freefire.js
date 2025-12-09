// Gestionnaire Free Fire

document.addEventListener('DOMContentLoaded', function() {
    // Initialiser les packs
    initPacks();
    
    // Initialiser le formulaire
    initFreeFireForm();
    
    // Initialiser les sélections
    initSelections();
    
    // Vérifier l'authentification
    checkFreeFireAuth();
});

// Packs Free Fire
const freeFirePacks = [
    { id: 1, diamonds: 100, bonus: 10, price: 165 },
    { id: 2, diamonds: 200, bonus: 20, price: 340 },
    { id: 3, diamonds: 310, bonus: 31, price: 485 },
    { id: 4, diamonds: 410, bonus: 31, price: 650 },
    { id: 5, diamonds: 520, bonus: 52, price: 800 },
    { id: 6, diamonds: 620, bonus: 62, price: 960 },
    { id: 7, diamonds: 720, bonus: 72, price: 1100 },
    { id: 8, diamonds: 830, bonus: 83, price: 1260 },
    { id: 9, diamonds: 930, bonus: 93, price: 1415 },
    { id: 10, diamonds: 1060, bonus: 106, price: 1600 },
    { id: 11, diamonds: 1160, bonus: 116, price: 1725 },
    { id: 12, diamonds: 1260, bonus: 126, price: 1900 },
    { id: 13, diamonds: 1370, bonus: 137, price: 2030 },
    { id: 14, diamonds: 1470, bonus: 147, price: 2200 },
    { id: 15, diamonds: 1580, bonus: 158, price: 2350 },
    { id: 16, diamonds: 1680, bonus: 168, price: 2500 },
    { id: 17, diamonds: 1780, bonus: 178, price: 2675 },
    { id: 18, diamonds: 1890, bonus: 199, price: 2825 },
    { id: 19, diamonds: 1990, bonus: 129, price: 2985 },
    { id: 20, diamonds: 2180, bonus: 218, price: 3150 },
    { id: 21, diamonds: 5600, bonus: 560, price: 8000 }
];

// Souscriptions
const subscriptions = {
    weekly: { name: 'Abonnement Hebdomadaire', price: 325 },
    monthly: { name: 'Abonnement Mensuel', price: 1600 },
    levelpass: { name: 'Level Pass', price: 950, note: 'LEVEL PASS DISPO PA KONT' }
};

function initPacks() {
    const packsGrid = document.getElementById('packs-grid');
    if (!packsGrid) return;
    
    packsGrid.innerHTML = '';
    
    freeFirePacks.forEach(pack => {
        const packCard = createPackCard(pack);
        packsGrid.appendChild(packCard);
    });
}

function createPackCard(pack) {
    const card = document.createElement('div');
    card.className = 'pack-card';
    card.dataset.id = pack.id;
    card.dataset.diamonds = pack.diamonds;
    card.dataset.bonus = pack.bonus;
    card.dataset.price = pack.price;
    
    card.innerHTML = `
        <div class="pack-header">
            <div class="diamonds">${pack.diamonds} 💎</div>
            <div class="bonus">+${pack.bonus} bonus</div>
        </div>
        <div class="pack-price">${pack.price} HTG</div>
        <button class="btn btn-outline btn-small" onclick="selectPack(${pack.id})">
            Sélectionner
        </button>
    `;
    
    return card;
}

function initFreeFireForm() {
    const form = document.getElementById('freefire-form');
    if (!form) return;
    
    // Remplir les options des packs
    const packSelect = document.getElementById('pack-select');
    if (packSelect) {
        freeFirePacks.forEach(pack => {
            const option = document.createElement('option');
            option.value = pack.id;
            option.textContent = `${pack.diamonds} diamants (+${pack.bonus}) - ${pack.price} HTG`;
            packSelect.appendChild(option);
        });
    }
    
    // Gérer le changement de type de commande
    const orderType = document.getElementById('order-type');
    const packSelectGroup = document.getElementById('pack-select-group');
    
    orderType.addEventListener('change', function() {
        const selectedType = this.value;
        
        if (selectedType === 'pack') {
            packSelectGroup.style.display = 'block';
            packSelect.required = true;
        } else {
            packSelectGroup.style.display = 'none';
            packSelect.required = false;
            packSelect.value = '';
            
            // Mettre à jour l'affichage du pack sélectionné
            updateSelectedPackInfo(null);
            
            // Mettre à jour le montant total
            if (selectedType === 'weekly') {
                updateTotalAmount(325);
            } else if (selectedType === 'monthly') {
                updateTotalAmount(1600);
            } else if (selectedType === 'levelpass') {
                updateTotalAmount(950);
            } else {
                updateTotalAmount(0);
            }
        }
    });
    
    // Gérer la sélection de pack
    packSelect.addEventListener('change', function() {
        const packId = parseInt(this.value);
        const pack = freeFirePacks.find(p => p.id === packId);
        
        if (pack) {
            updateSelectedPackInfo(pack);
            updateTotalAmount(pack.price);
            
            // Ajouter la classe selected au pack correspondant
            document.querySelectorAll('.pack-card').forEach(card => {
                card.classList.remove('selected');
                if (parseInt(card.dataset.id) === packId) {
                    card.classList.add('selected');
                }
            });
        }
    });
    
    // Soumission du formulaire
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        if (!validateFreeFireForm()) {
            return;
        }
        
        submitFreeFireOrder();
    });
}

function initSelections() {
    // Initialiser les sélections par défaut
    updateTotalAmount(0);
}

function selectPack(packId) {
    const pack = freeFirePacks.find(p => p.id === packId);
    if (!pack) return;
    
    // Mettre à jour le formulaire
    const orderType = document.getElementById('order-type');
    const packSelect = document.getElementById('pack-select');
    
    orderType.value = 'pack';
    packSelect.value = packId;
    
    // Afficher le sélecteur de pack
    const packSelectGroup = document.getElementById('pack-select-group');
    packSelectGroup.style.display = 'block';
    
    // Déclencher les événements de changement
    orderType.dispatchEvent(new Event('change'));
    packSelect.dispatchEvent(new Event('change'));
    
    // Mettre à jour l'affichage
    updateSelectedPackInfo(pack);
    updateTotalAmount(pack.price);
    
    // Mettre à jour les styles des cartes
    document.querySelectorAll('.pack-card').forEach(card => {
        card.classList.remove('selected');
        if (parseInt(card.dataset.id) === packId) {
            card.classList.add('selected');
        }
    });
    
    // Faire défiler jusqu'au formulaire
    document.querySelector('.order-form-container').scrollIntoView({ 
        behavior: 'smooth' 
    });
}

function selectSubscription(type) {
    const subscription = subscriptions[type];
    if (!subscription) return;
    
    // Mettre à jour le formulaire
    const orderType = document.getElementById('order-type');
    orderType.value = type;
    
    // Déclencher l'événement de changement
    orderType.dispatchEvent(new Event('change'));
    
    // Mettre à jour l'affichage
    updateSelectedPackInfo({
        diamonds: type,
        bonus: 0,
        price: subscription.price,
        name: subscription.name
    });
    
    updateTotalAmount(subscription.price);
    
    // Faire défiler jusqu'au formulaire
    document.querySelector('.order-form-container').scrollIntoView({ 
        behavior: 'smooth' 
    });
}

function updateSelectedPackInfo(pack) {
    const infoElement = document.getElementById('selected-pack-info');
    
    if (!pack) {
        infoElement.textContent = 'Aucun pack sélectionné';
        infoElement.className = 'selected-info';
        return;
    }
    
    if (typeof pack === 'object') {
        if (pack.diamonds === 'weekly' || pack.diamonds === 'monthly' || pack.diamonds === 'levelpass') {
            infoElement.innerHTML = `
                <strong>${pack.name}</strong><br>
                <small>Prix: ${pack.price} HTG</small>
            `;
        } else {
            infoElement.innerHTML = `
                <strong>${pack.diamonds} diamants</strong><br>
                <small>Bonus: +${pack.bonus} | Prix: ${pack.price} HTG</small>
            `;
        }
        infoElement.className = 'selected-info has-selection';
    }
}

function updateTotalAmount(amount) {
    const amountElement = document.getElementById('total-amount');
    if (amountElement) {
        amountElement.textContent = amount.toLocaleString('fr-FR');
    }
}

function validateFreeFireForm() {
    const playerId = document.getElementById('player-id').value.trim();
    const orderType = document.getElementById('order-type').value;
    const paymentMethod = document.getElementById('payment-method').value;
    const terms = document.getElementById('terms').checked;
    
    // Validation ID joueur
    if (!playerId) {
        showNotification('Veuillez entrer votre ID joueur', 'error');
        return false;
    }
    
    if (!/^\d{6,12}$/.test(playerId)) {
        showNotification('ID joueur invalide (6-12 chiffres)', 'error');
        return false;
    }
    
    // Validation type de commande
    if (!orderType) {
        showNotification('Veuillez sélectionner un type de commande', 'error');
        return false;
    }
    
    // Validation pack si type = pack
    if (orderType === 'pack') {
        const packSelect = document.getElementById('pack-select').value;
        if (!packSelect) {
            showNotification('Veuillez sélectionner un pack', 'error');
            return false;
        }
    }
    
    // Validation méthode de paiement
    if (!paymentMethod) {
        showNotification('Veuillez sélectionner une méthode de paiement', 'error');
        return false;
    }
    
    // Validation des conditions
    if (!terms) {
        showNotification('Veuillez accepter les conditions', 'error');
        return false;
    }
    
    return true;
}

function submitFreeFireOrder() {
    const playerId = document.getElementById('player-id').value.trim();
    const orderType = document.getElementById('order-type').value;
    const packSelect = document.getElementById('pack-select').value;
    const paymentMethod = document.getElementById('payment-method').value;
    const orderId = document.getElementById('order-id').value;
    
    let orderDetails = {};
    
    if (orderType === 'pack') {
        const pack = freeFirePacks.find(p => p.id === parseInt(packSelect));
        if (!pack) {
            showNotification('Pack non trouvé', 'error');
            return;
        }
        
        orderDetails = {
            type: 'pack',
            diamonds: pack.diamonds,
            bonus: pack.bonus,
            price: pack.price,
            packId: pack.id
        };
    } else {
        const subscription = subscriptions[orderType];
        orderDetails = {
            type: orderType,
            name: subscription.name,
            price: subscription.price
        };
    }
    
    // Simuler l'envoi au serveur
    showLoading();
    
    setTimeout(() => {
        hideLoading();
        
        // Enregistrer la commande
        saveOrderToLocalStorage({
            id: orderId,
            playerId: playerId,
            type: orderType,
            details: orderDetails,
            paymentMethod: paymentMethod,
            status: 'pending',
            timestamp: new Date().toISOString()
        });
        
        // Rediriger vers la page de paiement appropriée
        redirectToPayment(paymentMethod, orderId);
        
    }, 1500);
}

function saveOrderToLocalStorage(order) {
    let orders = JSON.parse(localStorage.getItem('freefire_orders') || '[]');
    orders.push(order);
    localStorage.setItem('freefire_orders', JSON.stringify(orders));
}

function redirectToPayment(method, orderId) {
    let redirectUrl = '';
    
    switch (method) {
        case 'moncash':
        case 'natcash':
            redirectUrl = `/payment.html?method=${method}&order=${orderId}`;
            break;
        case 'crypto':
            redirectUrl = `/crypto.html?order=${orderId}`;
            break;
        case 'wallet':
            redirectUrl = `/wallet.html?action=pay&order=${orderId}`;
            break;
        default:
            showNotification('Méthode de paiement non reconnue', 'error');
            return;
    }
    
    showNotification('Commande créée avec succès! Redirection...', 'success');
    
    setTimeout(() => {
        window.location.href = redirectUrl;
    }, 2000);
}

function checkFreeFireAuth() {
    const token = localStorage.getItem('payfusion_token');
    if (!token) {
        // Si non connecté, rediriger vers login avec retour
        const currentPath = window.location.pathname + window.location.search;
        if (!currentPath.includes('login') && !currentPath.includes('register')) {
            localStorage.setItem('return_url', currentPath);
            // window.location.href = `/login.html?return=${encodeURIComponent(currentPath)}`;
        }
    }
}

function showLoading() {
    let loading = document.getElementById('loading-overlay');
    if (!loading) {
        loading = document.createElement('div');
        loading.id = 'loading-overlay';
        loading.style.position = 'fixed';
        loading.style.top = '0';
        loading.style.left = '0';
        loading.style.right = '0';
        loading.style.bottom = '0';
        loading.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
        loading.style.display = 'flex';
        loading.style.alignItems = 'center';
        loading.style.justifyContent = 'center';
        loading.style.zIndex = '10000';
        
        const spinner = document.createElement('div');
        spinner.className = 'loading';
        spinner.style.width = '50px';
        spinner.style.height = '50px';
        spinner.style.borderWidth = '5px';
        
        loading.appendChild(spinner);
        document.body.appendChild(loading);
    }
    
    loading.style.display = 'flex';
}

function hideLoading() {
    const loading = document.getElementById('loading-overlay');
    if (loading) {
        loading.style.display = 'none';
    }
}

// Fonctions globales
window.selectPack = selectPack;
window.selectSubscription = selectSubscription;

// Initialiser les notifications
function showNotification(message, type) {
    if (window.PayFusion && window.PayFusion.showNotification) {
        window.PayFusion.showNotification(message, type);
    } else {
        alert(`${type.toUpperCase()}: ${message}`);
    }
}