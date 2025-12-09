// Gestionnaire Wallet

document.addEventListener('DOMContentLoaded', function() {
    // Initialiser le wallet
    initWallet();
    
    // Initialiser la conversion
    initConversion();
    
    // Initialiser l'historique
    initHistory();
    
    // Initialiser les modals
    initWalletModals();
    
    // Vérifier l'authentification
    checkWalletAuth();
});

// Taux de change
const exchangeRates = {
    USD: { HTG: 157, CAD: 1.36 },
    HTG: { USD: 1/157, CAD: 1/115 },
    CAD: { HTG: 115, USD: 1/1.36 }
};

// Solde utilisateur
let userBalance = {
    HTG: 0,
    USD: 0,
    CAD: 0
};

function initWallet() {
    // Charger le solde depuis localStorage
    loadBalance();
    
    // Mettre à jour l'affichage des soldes
    updateBalanceDisplay();
    
    // Mettre à jour le solde total
    updateTotalBalance();
}

function loadBalance() {
    const savedBalance = localStorage.getItem('payfusion_balance');
    if (savedBalance) {
        try {
            userBalance = JSON.parse(savedBalance);
        } catch (e) {
            console.error('Erreur de chargement du solde:', e);
        }
    }
}

function saveBalance() {
    localStorage.setItem('payfusion_balance', JSON.stringify(userBalance));
}

function updateBalanceDisplay() {
    // Mettre à jour les cartes de solde
    document.querySelectorAll('.balance-card').forEach(card => {
        const currency = card.querySelector('.currency-info h3').textContent.includes('HTG') ? 'HTG' :
                        card.querySelector('.currency-info h3').textContent.includes('USD') ? 'USD' : 'CAD';
        
        const amountElement = card.querySelector('.balance-amount');
        if (amountElement) {
            amountElement.textContent = `${userBalance[currency].toFixed(2)} ${currency}`;
        }
    });
}

function updateTotalBalance() {
    const totalElement = document.querySelector('.total-amount');
    if (!totalElement) return;
    
    // Convertir tout en HTG
    let totalHTG = userBalance.HTG;
    totalHTG += userBalance.USD * exchangeRates.USD.HTG;
    totalHTG += userBalance.CAD * exchangeRates.CAD.HTG;
    
    totalElement.textContent = `${totalHTG.toFixed(2)} HTG`;
}

function initConversion() {
    const form = document.getElementById('conversion-form');
    if (!form) return;
    
    // Initialiser les valeurs
    const fromCurrency = document.getElementById('from-currency');
    const toCurrency = document.getElementById('to-currency');
    const amountInput = document.getElementById('amount');
    
    // Définir des valeurs par défaut
    fromCurrency.value = 'HTG';
    toCurrency.value = 'USD';
    amountInput.value = '';
    
    // Mettre à jour le taux de change affiché
    updateConversionRate();
    
    // Écouter les changements
    fromCurrency.addEventListener('change', updateConversionRate);
    toCurrency.addEventListener('change', updateConversionRate);
    amountInput.addEventListener('input', updateConversionResult);
    
    // Soumission du formulaire
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        processConversion();
    });
}

function updateConversionRate() {
    const fromCurrency = document.getElementById('from-currency').value;
    const toCurrency = document.getElementById('to-currency').value;
    const rateInfo = document.getElementById('rate-info');
    
    if (fromCurrency && toCurrency && fromCurrency !== toCurrency) {
        const rate = exchangeRates[fromCurrency][toCurrency];
        if (rate) {
            rateInfo.textContent = `Taux de change: 1 ${fromCurrency} = ${rate.toFixed(4)} ${toCurrency}`;
        }
    }
    
    updateConversionResult();
}

function updateConversionResult() {
    const fromCurrency = document.getElementById('from-currency').value;
    const toCurrency = document.getElementById('to-currency').value;
    const amount = parseFloat(document.getElementById('amount').value) || 0;
    const outputElement = document.getElementById('conversion-output');
    
    if (fromCurrency && toCurrency && fromCurrency !== toCurrency && amount > 0) {
        const rate = exchangeRates[fromCurrency][toCurrency];
        const result = amount * rate;
        
        outputElement.textContent = `${amount.toFixed(2)} ${fromCurrency} = ${result.toFixed(2)} ${toCurrency}`;
        
        // Vérifier si le solde est suffisant
        if (amount > userBalance[fromCurrency]) {
            outputElement.style.color = 'var(--danger-color)';
            outputElement.innerHTML += '<br><small style="color: var(--danger-color);">Solde insuffisant</small>';
        } else {
            outputElement.style.color = 'var(--primary-color)';
        }
    } else {
        outputElement.textContent = '...';
        outputElement.style.color = 'inherit';
    }
}

function processConversion() {
    const fromCurrency = document.getElementById('from-currency').value;
    const toCurrency = document.getElementById('to-currency').value;
    const amount = parseFloat(document.getElementById('amount').value) || 0;
    
    // Validation
    if (!fromCurrency || !toCurrency || fromCurrency === toCurrency) {
        showNotification('Veuillez sélectionner des devises différentes', 'error');
        return;
    }
    
    if (amount <= 0) {
        showNotification('Veuillez entrer un montant valide', 'error');
        return;
    }
    
    if (amount > userBalance[fromCurrency]) {
        showNotification(`Solde ${fromCurrency} insuffisant`, 'error');
        return;
    }
    
    // Calculer le résultat
    const rate = exchangeRates[fromCurrency][toCurrency];
    const result = amount * rate;
    const fee = result * 0.005; // 0.5% de frais
    const finalResult = result - fee;
    
    // Confirmation
    if (!confirm(`Convertir ${amount} ${fromCurrency} en ${finalResult.toFixed(2)} ${toCurrency}?\nFrais: ${fee.toFixed(2)} ${toCurrency} (0.5%)`)) {
        return;
    }
    
    // Effectuer la conversion
    userBalance[fromCurrency] -= amount;
    userBalance[toCurrency] += finalResult;
    
    // Sauvegarder
    saveBalance();
    
    // Mettre à jour l'affichage
    updateBalanceDisplay();
    updateTotalBalance();
    
    // Enregistrer la transaction
    addTransaction({
        type: 'conversion',
        fromCurrency: fromCurrency,
        fromAmount: amount,
        toCurrency: toCurrency,
        toAmount: finalResult,
        fee: fee,
        rate: rate,
        status: 'completed',
        timestamp: new Date().toISOString()
    });
    
    // Réinitialiser le formulaire
    document.getElementById('amount').value = '';
    updateConversionResult();
    
    showNotification('Conversion effectuée avec succès!', 'success');
}

function initHistory() {
    // Charger l'historique
    loadTransactions();
    
    // Initialiser les filtres
    initHistoryFilters();
}

function loadTransactions() {
    const tbody = document.getElementById('history-body');
    if (!tbody) return;
    
    // Charger depuis localStorage
    let transactions = JSON.parse(localStorage.getItem('payfusion_transactions') || '[]');
    
    // Trier par date (plus récent en premier)
    transactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Afficher
    displayTransactions(transactions);
}

function displayTransactions(transactions) {
    const tbody = document.getElementById('history-body');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (transactions.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-history">Aucune transaction pour le moment</td>
            </tr>
        `;
        return;
    }
    
    transactions.forEach(transaction => {
        const row = createTransactionRow(transaction);
        tbody.appendChild(row);
    });
}

function createTransactionRow(transaction) {
    const row = document.createElement('tr');
    const date = new Date(transaction.timestamp);
    const formattedDate = date.toLocaleDateString('fr-FR') + ' ' + date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    
    // Déterminer l'icône et la couleur selon le type
    let typeIcon = '💰';
    let typeText = transaction.type;
    let amountText = '';
    
    switch (transaction.type) {
        case 'deposit':
            typeIcon = '⬇️';
            typeText = 'Dépôt';
            amountText = `+${transaction.amount.toFixed(2)} ${transaction.currency}`;
            break;
        case 'withdrawal':
            typeIcon = '⬆️';
            typeText = 'Retrait';
            amountText = `-${transaction.amount.toFixed(2)} ${transaction.currency}`;
            break;
        case 'conversion':
            typeIcon = '🔄';
            typeText = 'Conversion';
            amountText = `${transaction.fromAmount.toFixed(2)} ${transaction.fromCurrency} → ${transaction.toAmount.toFixed(2)} ${transaction.toCurrency}`;
            break;
        case 'payment':
            typeIcon = '💳';
            typeText = 'Paiement';
            amountText = `-${transaction.amount.toFixed(2)} ${transaction.currency}`;
            break;
    }
    
    // Déterminer le statut
    let statusClass = '';
    let statusText = '';
    
    switch (transaction.status) {
        case 'pending':
            statusClass = 'status-pending';
            statusText = 'En attente';
            break;
        case 'approved':
            statusClass = 'status-approved';
            statusText = 'Approuvé';
            break;
        case 'rejected':
            statusClass = 'status-rejected';
            statusText = 'Rejeté';
            break;
        case 'completed':
            statusClass = 'status-approved';
            statusText = 'Complété';
            break;
    }
    
    row.innerHTML = `
        <td>${formattedDate}</td>
        <td>${typeIcon} ${typeText}</td>
        <td>${amountText}</td>
        <td>${transaction.currency || transaction.fromCurrency}</td>
        <td><span class="transaction-status ${statusClass}">${statusText}</span></td>
        <td>
            <button class="btn btn-outline btn-small" onclick="viewTransactionDetails('${transaction.id}')">
                Détails
            </button>
        </td>
    `;
    
    return row;
}

function initHistoryFilters() {
    const filterType = document.getElementById('filter-type');
    const filterCurrency = document.getElementById('filter-currency');
    const filterDate = document.getElementById('filter-date');
    
    if (filterType) {
        filterType.addEventListener('change', applyFilters);
    }
    
    if (filterCurrency) {
        filterCurrency.addEventListener('change', applyFilters);
    }
    
    if (filterDate) {
        filterDate.addEventListener('change', applyFilters);
    }
}

function applyFilters() {
    let transactions = JSON.parse(localStorage.getItem('payfusion_transactions') || '[]');
    
    const filterType = document.getElementById('filter-type')?.value;
    const filterCurrency = document.getElementById('filter-currency')?.value;
    const filterDate = document.getElementById('filter-date')?.value;
    
    // Filtrer par type
    if (filterType && filterType !== 'all') {
        transactions = transactions.filter(t => t.type === filterType);
    }
    
    // Filtrer par devise
    if (filterCurrency && filterCurrency !== 'all') {
        transactions = transactions.filter(t => 
            t.currency === filterCurrency || 
            t.fromCurrency === filterCurrency || 
            t.toCurrency === filterCurrency
        );
    }
    
    // Filtrer par date
    if (filterDate) {
        const selectedDate = new Date(filterDate);
        transactions = transactions.filter(t => {
            const transactionDate = new Date(t.timestamp);
            return transactionDate.toDateString() === selectedDate.toDateString();
        });
    }
    
    // Afficher les transactions filtrées
    displayTransactions(transactions);
}

function addTransaction(transaction) {
    // Générer un ID unique
    transaction.id = 'TX_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    // Charger les transactions existantes
    let transactions = JSON.parse(localStorage.getItem('payfusion_transactions') || '[]');
    
    // Ajouter la nouvelle transaction
    transactions.unshift(transaction);
    
    // Sauvegarder
    localStorage.setItem('payfusion_transactions', JSON.stringify(transactions));
    
    // Mettre à jour l'affichage
    applyFilters();
    
    return transaction.id;
}

function initWalletModals() {
    // Modal de dépôt
    const depositForm = document.getElementById('deposit-form');
    if (depositForm) {
        depositForm.addEventListener('submit', function(e) {
            e.preventDefault();
            processDeposit();
        });
    }
    
    // Modal de retrait
    const withdrawForm = document.getElementById('withdraw-form');
    if (withdrawForm) {
        withdrawForm.addEventListener('submit', function(e) {
            e.preventDefault();
            processWithdrawal();
        });
    }
}

function openDepositModal(currency) {
    const modal = document.getElementById('deposit-modal');
    const currencySelect = document.getElementById('deposit-currency');
    
    if (currencySelect && currency) {
        currencySelect.value = currency;
    }
    
    // Réinitialiser le formulaire
    document.getElementById('deposit-form').reset();
    
    openModal('deposit-modal');
}

function openWithdrawModal(currency) {
    const modal = document.getElementById('withdraw-modal');
    const currencySelect = document.getElementById('withdraw-currency');
    const balanceElement = document.getElementById('withdraw-balance');
    
    if (currencySelect && currency) {
        currencySelect.value = currency;
    }
    
    // Mettre à jour l'affichage du solde
    if (balanceElement && currency) {
        balanceElement.textContent = `Solde disponible: ${userBalance[currency].toFixed(2)} ${currency}`;
    }
    
    // Réinitialiser le formulaire
    document.getElementById('withdraw-form').reset();
    
    openModal('withdraw-modal');
}

function processDeposit() {
    const currency = document.getElementById('deposit-currency').value;
    const amount = parseFloat(document.getElementById('deposit-amount').value);
    const method = document.getElementById('deposit-method').value;
    const proof = document.getElementById('deposit-proof').files[0];
    const reference = document.getElementById('deposit-reference').value.trim();
    
    // Validation
    if (!currency || !amount || amount <= 0) {
        showNotification('Montant invalide', 'error');
        return;
    }
    
    if (!method) {
        showNotification('Veuillez sélectionner une méthode de paiement', 'error');
        return;
    }
    
    if (!reference) {
        showNotification('Veuillez entrer une référence', 'error');
        return;
    }
    
    if (!proof) {
        showNotification('Veuillez fournir une preuve de paiement', 'error');
        return;
    }
    
    // Créer la transaction
    const transactionId = addTransaction({
        type: 'deposit',
        currency: currency,
        amount: amount,
        method: method,
        reference: reference,
        status: 'pending',
        timestamp: new Date().toISOString()
    });
    
    // Simuler l'envoi au serveur
    showLoading();
    
    setTimeout(() => {
        hideLoading();
        
        showNotification('Demande de dépôt soumise! En attente de validation.', 'success');
        closeModal('deposit-modal');
        
        // Réinitialiser le formulaire
        document.getElementById('deposit-form').reset();
        
    }, 1500);
}

function processWithdrawal() {
    const currency = document.getElementById('withdraw-currency').value;
    const amount = parseFloat(document.getElementById('withdraw-amount').value);
    const method = document.getElementById('withdraw-method').value;
    const account = document.getElementById('withdraw-account').value.trim();
    const confirm = document.getElementById('withdraw-confirm').checked;
    
    // Validation
    if (!currency || !amount || amount <= 0) {
        showNotification('Montant invalide', 'error');
        return;
    }
    
    if (amount > userBalance[currency]) {
        showNotification('Solde insuffisant', 'error');
        return;
    }
    
    if (!method) {
        showNotification('Veuillez sélectionner une méthode de retrait', 'error');
        return;
    }
    
    if (!account) {
        showNotification('Veuillez entrer le numéro de compte/destination', 'error');
        return;
    }
    
    if (!confirm) {
        showNotification('Veuillez confirmer les détails de retrait', 'error');
        return;
    }
    
    // Calculer les frais
    const fee = amount * 0.02; // 2% de frais
    const feeMinimum = currency === 'HTG' ? 50 : 1;
    const finalFee = Math.max(fee, feeMinimum);
    const netAmount = amount - finalFee;
    
    // Confirmation
    if (!confirm(`Demander un retrait de ${amount} ${currency}?\nFrais: ${finalFee.toFixed(2)} ${currency}\nMontant net: ${netAmount.toFixed(2)} ${currency}\nDestination: ${account}`)) {
        return;
    }
    
    // Créer la transaction
    const transactionId = addTransaction({
        type: 'withdrawal',
        currency: currency,
        amount: amount,
        fee: finalFee,
        netAmount: netAmount,
        method: method,
        account: account,
        status: 'pending',
        timestamp: new Date().toISOString()
    });
    
    // Réserver le montant (le déduire temporairement)
    userBalance[currency] -= amount;
    saveBalance();
    updateBalanceDisplay();
    updateTotalBalance();
    
    showNotification('Demande de retrait soumise! En attente de validation.', 'success');
    closeModal('withdraw-modal');
    
    // Réinitialiser le formulaire
    document.getElementById('withdraw-form').reset();
}

function viewTransactionDetails(transactionId) {
    // Charger la transaction
    let transactions = JSON.parse(localStorage.getItem('payfusion_transactions') || '[]');
    const transaction = transactions.find(t => t.id === transactionId);
    
    if (!transaction) {
        showNotification('Transaction non trouvée', 'error');
        return;
    }
    
    // Créer une modal de détails
    const details = `
        <h3>Détails de la Transaction</h3>
        <p><strong>ID:</strong> ${transaction.id}</p>
        <p><strong>Date:</strong> ${new Date(transaction.timestamp).toLocaleString('fr-FR')}</p>
        <p><strong>Type:</strong> ${transaction.type}</p>
        <p><strong>Statut:</strong> ${transaction.status}</p>
        
        ${transaction.amount ? `<p><strong>Montant:</strong> ${transaction.amount} ${transaction.currency}</p>` : ''}
        ${transaction.fromAmount ? `<p><strong>De:</strong> ${transaction.fromAmount} ${transaction.fromCurrency}</p>` : ''}
        ${transaction.toAmount ? `<p><strong>À:</strong> ${transaction.toAmount} ${transaction.toCurrency}</p>` : ''}
        ${transaction.fee ? `<p><strong>Frais:</strong> ${transaction.fee} ${transaction.currency || transaction.toCurrency}</p>` : ''}
        ${transaction.rate ? `<p><strong>Taux:</strong> ${transaction.rate}</p>` : ''}
        ${transaction.method ? `<p><strong>Méthode:</strong> ${transaction.method}</p>` : ''}
        ${transaction.reference ? `<p><strong>Référence:</strong> ${transaction.reference}</p>` : ''}
        ${transaction.account ? `<p><strong>Compte:</strong> ${transaction.account}</p>` : ''}
    `;
    
    alert(details);
}

function checkWalletAuth() {
    const token = localStorage.getItem('payfusion_token');
    if (!token) {
        // Si non connecté, rediriger vers login
        const currentPath = window.location.pathname + window.location.search;
        localStorage.setItem('return_url', currentPath);
        // window.location.href = `/login.html?return=${encodeURIComponent(currentPath)}`;
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

function showNotification(message, type) {
    if (window.PayFusion && window.PayFusion.showNotification) {
        window.PayFusion.showNotification(message, type);
    } else {
        alert(`${type.toUpperCase()}: ${message}`);
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

// Exporter les fonctions globales
window.openDepositModal = openDepositModal;
window.openWithdrawModal = openWithdrawModal;
window.closeModal = closeModal;
window.viewTransactionDetails = viewTransactionDetails;