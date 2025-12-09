// Gestionnaire d'Administration

document.addEventListener('DOMContentLoaded', function() {
    // Vérifier l'authentification admin
    checkAdminAuth();
    
    // Initialiser l'interface admin
    initAdminInterface();
});

const ADMIN_EMAIL = 'kenshinworkspace@gmail.com';
const ADMIN_PASSWORD = 'V7kR!2mQ9xL8';

function checkAdminAuth() {
    const isAdmin = localStorage.getItem('payfusion_is_admin') === 'true';
    const adminEmail = localStorage.getItem('payfusion_user_email');
    
    if (!isAdmin || adminEmail !== ADMIN_EMAIL) {
        // Afficher le formulaire de connexion admin
        showAdminLogin();
    } else {
        // Afficher l'interface admin
        showAdminInterface();
    }
}

function showAdminLogin() {
    const adminContainer = document.getElementById('admin-container');
    const adminLogin = document.getElementById('admin-login');
    
    if (adminContainer) adminContainer.style.display = 'none';
    if (adminLogin) adminLogin.style.display = 'block';
    
    // Initialiser le formulaire de connexion
    const loginForm = document.getElementById('admin-login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            adminLoginSubmit();
        });
    }
}

function showAdminInterface() {
    const adminContainer = document.getElementById('admin-container');
    const adminLogin = document.getElementById('admin-login');
    
    if (adminContainer) adminContainer.style.display = 'block';
    if (adminLogin) adminLogin.style.display = 'none';
    
    // Mettre à jour l'email affiché
    const adminEmailElement = document.getElementById('admin-email');
    if (adminEmailElement) {
        adminEmailElement.textContent = localStorage.getItem('payfusion_user_email') || 'Admin';
    }
}

function adminLoginSubmit() {
    const email = document.getElementById('admin-email-input').value.trim();
    const password = document.getElementById('admin-password').value;
    
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        // Authentification réussie
        localStorage.setItem('payfusion_is_admin', 'true');
        localStorage.setItem('payfusion_user_email', email);
        
        // Créer un token d'authentification
        const token = btoa(`${email}:${Date.now()}`);
        localStorage.setItem('payfusion_admin_token', token);
        
        showAdminInterface();
        initAdminDashboard();
        
        showNotification('Connexion admin réussie!', 'success');
    } else {
        showNotification('Email ou mot de passe incorrect', 'error');
    }
}

function logoutAdmin() {
    localStorage.removeItem('payfusion_is_admin');
    localStorage.removeItem('payfusion_admin_token');
    showAdminLogin();
    
    showNotification('Déconnexion réussie', 'info');
}

function initAdminInterface() {
    // Initialiser la navigation
    initAdminNavigation();
    
    // Initialiser le tableau de bord
    initAdminDashboard();
    
    // Initialiser les sections
    initAdminSections();
    
    // Charger les données initiales
    loadAdminData();
}

function initAdminNavigation() {
    const navLinks = document.querySelectorAll('.admin-sidebar a');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            if (this.getAttribute('href').startsWith('#')) {
                e.preventDefault();
                
                const sectionId = this.getAttribute('href').substring(1);
                
                // Mettre à jour la navigation active
                navLinks.forEach(l => l.classList.remove('active'));
                this.classList.add('active');
                
                // Afficher la section correspondante
                showAdminSection(sectionId);
            }
        });
    });
}

function showAdminSection(sectionId) {
    const sections = document.querySelectorAll('.admin-section');
    
    sections.forEach(section => {
        if (section.id === `${sectionId}-section`) {
            section.classList.add('active');
        } else {
            section.classList.remove('active');
        }
    });
    
    // Charger les données de la section si nécessaire
    switch (sectionId) {
        case 'transactions':
            loadTransactions();
            break;
        case 'users':
            loadUsers();
            break;
        case 'payments':
            loadPendingPayments();
            break;
        case 'freefire':
            loadFreeFireOrders();
            break;
        case 'crypto':
            loadCryptoDeposits();
            break;
        case 'wallet':
            loadWalletRequests();
            break;
        case 'logs':
            loadLogs();
            break;
    }
}

function initAdminDashboard() {
    // Initialiser les statistiques
    updateDashboardStats();
    
    // Initialiser l'activité récente
    loadRecentActivity();
}

function updateDashboardStats() {
    // Calculer les statistiques
    const users = JSON.parse(localStorage.getItem('payfusion_users') || '[]');
    const transactions = JSON.parse(localStorage.getItem('payfusion_transactions') || '[]');
    const payments = JSON.parse(localStorage.getItem('payfusion_payments') || '[]');
    const freefireOrders = JSON.parse(localStorage.getItem('freefire_orders') || '[]');
    
    // Mettre à jour les statistiques
    const statUsers = document.getElementById('stat-users');
    const statTransactions = document.getElementById('stat-transactions');
    const statRevenue = document.getElementById('stat-revenue');
    const statPending = document.getElementById('stat-pending');
    
    if (statUsers) {
        statUsers.textContent = users.length;
    }
    
    if (statTransactions) {
        statTransactions.textContent = transactions.length;
    }
    
    if (statRevenue) {
        // Calculer le revenu total (simplifié)
        let revenue = 0;
        payments.forEach(payment => {
            if (payment.status === 'approved' || payment.status === 'completed') {
                revenue += payment.amount || 0;
            }
        });
        
        freefireOrders.forEach(order => {
            if (order.status === 'completed') {
                revenue += order.details?.price || 0;
            }
        });
        
        statRevenue.textContent = `${revenue.toFixed(2)} HTG`;
    }
    
    if (statPending) {
        let pendingCount = 0;
        
        // Paiements en attente
        pendingCount += payments.filter(p => p.status === 'pending').length;
        
        // Commandes Free Fire en attente
        pendingCount += freefireOrders.filter(o => o.status === 'pending').length;
        
        // Transactions en attente
        pendingCount += transactions.filter(t => t.status === 'pending').length;
        
        statPending.textContent = pendingCount;
    }
}

function loadRecentActivity() {
    const activityList = document.getElementById('recent-activity');
    if (!activityList) return;
    
    // Collecter toutes les activités récentes
    let activities = [];
    
    // Ajouter les transactions récentes
    const transactions = JSON.parse(localStorage.getItem('payfusion_transactions') || '[]');
    transactions.slice(0, 10).forEach(tx => {
        activities.push({
            type: 'transaction',
            description: `${tx.type} - ${tx.amount || ''}${tx.currency || ''}`,
            timestamp: tx.timestamp,
            user: tx.userId || 'Utilisateur'
        });
    });
    
    // Ajouter les paiements récents
    const payments = JSON.parse(localStorage.getItem('payfusion_payments') || '[]');
    payments.slice(0, 10).forEach(payment => {
        activities.push({
            type: 'payment',
            description: `Paiement ${payment.paymentMethod} - ${payment.amount} HTG`,
            timestamp: payment.timestamp,
            user: payment.fullName
        });
    });
    
    // Trier par date (plus récent en premier)
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Prendre les 10 plus récentes
    activities = activities.slice(0, 10);
    
    // Afficher
    activityList.innerHTML = '';
    
    if (activities.length === 0) {
        activityList.innerHTML = '<div class="activity-item">Aucune activité récente</div>';
        return;
    }
    
    activities.forEach(activity => {
        const activityItem = document.createElement('div');
        activityItem.className = 'activity-item';
        
        const date = new Date(activity.timestamp);
        const formattedDate = date.toLocaleDateString('fr-FR') + ' ' + 
                            date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        
        activityItem.innerHTML = `
            <h4>${activity.description}</h4>
            <p>${activity.user}</p>
            <small>${formattedDate}</small>
        `;
        
        activityList.appendChild(activityItem);
    });
}

function loadAdminData() {
    // Charger toutes les données nécessaires
    loadTransactions();
    loadUsers();
    loadPendingPayments();
    loadFreeFireOrders();
    loadCryptoDeposits();
    loadWalletRequests();
}

function loadTransactions() {
    const tbody = document.getElementById('transactions-body');
    if (!tbody) return;
    
    let transactions = JSON.parse(localStorage.getItem('payfusion_transactions') || '[]');
    
    // Appliquer les filtres
    const filterStatus = document.getElementById('trans-status')?.value;
    const filterType = document.getElementById('trans-type')?.value;
    const filterDate = document.getElementById('trans-date')?.value;
    
    if (filterStatus && filterStatus !== 'all') {
        transactions = transactions.filter(t => t.status === filterStatus);
    }
    
    if (filterType && filterType !== 'all') {
        transactions = transactions.filter(t => t.type === filterType);
    }
    
    if (filterDate) {
        const selectedDate = new Date(filterDate);
        transactions = transactions.filter(t => {
            const txDate = new Date(t.timestamp);
            return txDate.toDateString() === selectedDate.toDateString();
        });
    }
    
    // Trier par date (plus récent en premier)
    transactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Afficher
    tbody.innerHTML = '';
    
    if (transactions.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-light);">
                    Aucune transaction trouvée
                </td>
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
    const formattedDate = date.toLocaleDateString('fr-FR') + ' ' + 
                         date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    
    let typeText = transaction.type;
    let amountText = '';
    
    switch (transaction.type) {
        case 'deposit':
            typeText = 'Dépôt';
            amountText = `+${transaction.amount?.toFixed(2)} ${transaction.currency}`;
            break;
        case 'withdrawal':
            typeText = 'Retrait';
            amountText = `-${transaction.amount?.toFixed(2)} ${transaction.currency}`;
            break;
        case 'conversion':
            typeText = 'Conversion';
            amountText = `${transaction.fromAmount?.toFixed(2)} ${transaction.fromCurrency} → ${transaction.toAmount?.toFixed(2)} ${transaction.toCurrency}`;
            break;
        case 'payment':
            typeText = 'Paiement';
            amountText = `${transaction.amount?.toFixed(2)} ${transaction.currency}`;
            break;
    }
    
    let statusClass = '';
    let statusText = transaction.status;
    
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
        <td>${transaction.id?.substring(0, 8)}...</td>
        <td>${transaction.userId || 'N/A'}</td>
        <td>${typeText}</td>
        <td>${amountText}</td>
        <td>${formattedDate}</td>
        <td><span class="transaction-status ${statusClass}">${statusText}</span></td>
        <td>
            <button class="btn btn-outline btn-small" onclick="viewTransactionDetails('${transaction.id}')">
                Détails
            </button>
            ${transaction.status === 'pending' ? `
                <button class="btn btn-success btn-small" onclick="approveTransaction('${transaction.id}')">
                    ✓
                </button>
                <button class="btn btn-danger btn-small" onclick="rejectTransaction('${transaction.id}')">
                    ✗
                </button>
            ` : ''}
        </td>
    `;
    
    return row;
}

function loadUsers() {
    const tbody = document.getElementById('users-body');
    if (!tbody) return;
    
    let users = JSON.parse(localStorage.getItem('payfusion_users') || '[]');
    
    // Appliquer la recherche
    const searchTerm = document.getElementById('user-search')?.value.toLowerCase();
    if (searchTerm) {
        users = users.filter(user => 
            (user.email && user.email.toLowerCase().includes(searchTerm)) ||
            (user.firstName && user.firstName.toLowerCase().includes(searchTerm)) ||
            (user.lastName && user.lastName.toLowerCase().includes(searchTerm))
        );
    }
    
    // Afficher
    tbody.innerHTML = '';
    
    if (users.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-light);">
                    Aucun utilisateur trouvé
                </td>
            </tr>
        `;
        return;
    }
    
    users.forEach(user => {
        const row = createUserRow(user);
        tbody.appendChild(row);
    });
}

function createUserRow(user) {
    const row = document.createElement('tr');
    const date = new Date(user.createdAt || Date.now());
    const formattedDate = date.toLocaleDateString('fr-FR');
    
    row.innerHTML = `
        <td>${user.id?.substring(0, 8)}...</td>
        <td>${user.firstName || ''} ${user.lastName || ''}</td>
        <td>${user.email || ''}</td>
        <td>${user.phone || ''}</td>
        <td>${formattedDate}</td>
        <td>
            <span class="transaction-status ${user.verified ? 'status-approved' : 'status-pending'}">
                ${user.verified ? 'Vérifié' : 'Non vérifié'}
            </span>
        </td>
        <td>
            <button class="btn btn-outline btn-small" onclick="viewUserDetails('${user.id}')">
                Détails
            </button>
            <button class="btn btn-danger btn-small" onclick="deleteUser('${user.id}')">
                Supprimer
            </button>
        </td>
    `;
    
    return row;
}

function loadPendingPayments() {
    const container = document.getElementById('pending-payments-list');
    if (!container) return;
    
    const payments = JSON.parse(localStorage.getItem('payfusion_payments') || '[]');
    const pendingPayments = payments.filter(p => p.status === 'pending');
    
    container.innerHTML = '';
    
    if (pendingPayments.length === 0) {
        container.innerHTML = '<div class="pending-item">Aucun paiement en attente</div>';
        return;
    }
    
    pendingPayments.forEach(payment => {
        const item = createPendingPaymentItem(payment);
        container.appendChild(item);
    });
}

function createPendingPaymentItem(payment) {
    const item = document.createElement('div');
    item.className = 'pending-item';
    
    const date = new Date(payment.timestamp);
    const formattedDate = date.toLocaleDateString('fr-FR') + ' ' + 
                         date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    
    item.innerHTML = `
        <h4>${payment.paymentMethod.toUpperCase()} - ${payment.amount} HTG</h4>
        <p><strong>Nom:</strong> ${payment.fullName}</p>
        <p><strong>Téléphone:</strong> ${payment.phoneNumber}</p>
        <p><strong>Référence:</strong> ${payment.transactionNumber}</p>
        <p><strong>Date:</strong> ${formattedDate}</p>
        <p><strong>ID Commande:</strong> ${payment.id}</p>
        
        <div class="pending-actions">
            <button class="btn btn-success btn-small" onclick="approvePayment('${payment.id}')">
                Approuver
            </button>
            <button class="btn btn-danger btn-small" onclick="rejectPayment('${payment.id}')">
                Rejeter
            </button>
            <button class="btn btn-outline btn-small" onclick="viewPaymentProof('${payment.id}')">
                Voir preuve
            </button>
        </div>
    `;
    
    return item;
}

function loadFreeFireOrders() {
    const container = document.getElementById('freefire-orders-list');
    if (!container) return;
    
    const orders = JSON.parse(localStorage.getItem('freefire_orders') || '[]');
    const pendingOrders = orders.filter(o => o.status === 'pending');
    
    container.innerHTML = '';
    
    if (pendingOrders.length === 0) {
        container.innerHTML = '<div class="pending-item">Aucune commande en attente</div>';
        return;
    }
    
    pendingOrders.forEach(order => {
        const item = createFreeFireOrderItem(order);
        container.appendChild(item);
    });
}

function createFreeFireOrderItem(order) {
    const item = document.createElement('div');
    item.className = 'pending-item';
    
    const date = new Date(order.timestamp);
    const formattedDate = date.toLocaleDateString('fr-FR') + ' ' + 
                         date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    
    let orderDetails = '';
    if (order.type === 'pack') {
        const pack = freeFirePacks.find(p => p.id === order.details.packId);
        if (pack) {
            orderDetails = `${pack.diamonds} diamants (+${pack.bonus}) - ${pack.price} HTG`;
        }
    } else {
        orderDetails = order.details.name;
    }
    
    item.innerHTML = `
        <h4>Free Fire - ${order.type.toUpperCase()}</h4>
        <p><strong>ID Joueur:</strong> ${order.playerId}</p>
        <p><strong>Commande:</strong> ${orderDetails}</p>
        <p><strong>Prix:</strong> ${order.details.price} HTG</p>
        <p><strong>Méthode:</strong> ${order.paymentMethod}</p>
        <p><strong>Date:</strong> ${formattedDate}</p>
        <p><strong>ID Commande:</strong> ${order.id}</p>
        
        <div class="pending-actions">
            <button class="btn btn-success btn-small" onclick="completeFreeFireOrder('${order.id}')">
                Compléter
            </button>
            <button class="btn btn-danger btn-small" onclick="cancelFreeFireOrder('${order.id}')">
                Annuler
            </button>
        </div>
    `;
    
    return item;
}

function loadCryptoDeposits() {
    const container = document.getElementById('crypto-deposits-list');
    if (!container) return;
    
    // Pour l'instant, utiliser les transactions de type dépôt crypto
    const transactions = JSON.parse(localStorage.getItem('payfusion_transactions') || '[]');
    const cryptoDeposits = transactions.filter(t => 
        t.type === 'deposit' && t.method === 'crypto' && t.status === 'pending'
    );
    
    container.innerHTML = '';
    
    if (cryptoDeposits.length === 0) {
        container.innerHTML = '<div class="pending-item">Aucun dépôt crypto en attente</div>';
        return;
    }
    
    cryptoDeposits.forEach(deposit => {
        const item = createCryptoDepositItem(deposit);
        container.appendChild(item);
    });
}

function createCryptoDepositItem(deposit) {
    const item = document.createElement('div');
    item.className = 'pending-item';
    
    const date = new Date(deposit.timestamp);
    const formattedDate = date.toLocaleDateString('fr-FR') + ' ' + 
                         date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    
    item.innerHTML = `
        <h4>Dépôt Crypto - ${deposit.amount} ${deposit.currency}</h4>
        <p><strong>Référence:</strong> ${deposit.reference}</p>
        <p><strong>Hash:</strong> ${deposit.transactionHash || 'N/A'}</p>
        <p><strong>Date:</strong> ${formattedDate}</p>
        <p><strong>ID Transaction:</strong> ${deposit.id}</p>
        
        <div class="pending-actions">
            <button class="btn btn-success btn-small" onclick="verifyCryptoDeposit('${deposit.id}')">
                Vérifier
            </button>
            <button class="btn btn-danger btn-small" onclick="rejectCryptoDeposit('${deposit.id}')">
                Rejeter
            </button>
        </div>
    `;
    
    return item;
}

function loadWalletRequests() {
    const depositsContainer = document.getElementById('wallet-deposits-list');
    const withdrawalsContainer = document.getElementById('wallet-withdrawals-list');
    
    if (depositsContainer) {
        const transactions = JSON.parse(localStorage.getItem('payfusion_transactions') || '[]');
        const depositRequests = transactions.filter(t => 
            t.type === 'deposit' && t.method !== 'crypto' && t.status === 'pending'
        );
        
        depositsContainer.innerHTML = '';
        
        if (depositRequests.length === 0) {
            depositsContainer.innerHTML = '<div class="pending-item">Aucun dépôt en attente</div>';
        } else {
            depositRequests.forEach(deposit => {
                const item = createWalletRequestItem(deposit);
                depositsContainer.appendChild(item);
            });
        }
    }
    
    if (withdrawalsContainer) {
        const transactions = JSON.parse(localStorage.getItem('payfusion_transactions') || '[]');
        const withdrawalRequests = transactions.filter(t => 
            t.type === 'withdrawal' && t.status === 'pending'
        );
        
        withdrawalsContainer.innerHTML = '';
        
        if (withdrawalRequests.length === 0) {
            withdrawalsContainer.innerHTML = '<div class="pending-item">Aucun retrait en attente</div>';
        } else {
            withdrawalRequests.forEach(withdrawal => {
                const item = createWalletRequestItem(withdrawal);
                withdrawalsContainer.appendChild(item);
            });
        }
    }
}

function createWalletRequestItem(request) {
    const item = document.createElement('div');
    item.className = 'pending-item';
    
    const date = new Date(request.timestamp);
    const formattedDate = date.toLocaleDateString('fr-FR') + ' ' + 
                         date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    
    const isWithdrawal = request.type === 'withdrawal';
    
    item.innerHTML = `
        <h4>${isWithdrawal ? 'Retrait' : 'Dépôt'} - ${request.amount} ${request.currency}</h4>
        <p><strong>Méthode:</strong> ${request.method}</p>
        <p><strong>Compte:</strong> ${request.account || request.reference}</p>
        ${isWithdrawal ? `<p><strong>Frais:</strong> ${request.fee} ${request.currency}</p>` : ''}
        <p><strong>Date:</strong> ${formattedDate}</p>
        <p><strong>ID:</strong> ${request.id}</p>
        
        <div class="pending-actions">
            <button class="btn btn-success btn-small" onclick="approveWalletRequest('${request.id}')">
                Approuver
            </button>
            <button class="btn btn-danger btn-small" onclick="rejectWalletRequest('${request.id}')">
                Rejeter
            </button>
        </div>
    `;
    
    return item;
}

function loadLogs() {
    const logsContent = document.getElementById('logs-content');
    if (!logsContent) return;
    
    // Charger les logs depuis localStorage
    const logs = JSON.parse(localStorage.getItem('payfusion_logs') || '[]');
    
    // Appliquer les filtres
    const filterDate = document.getElementById('log-date')?.value;
    const filterLevel = document.getElementById('log-level')?.value;
    
    let filteredLogs = [...logs];
    
    if (filterDate) {
        const selectedDate = new Date(filterDate);
        filteredLogs = filteredLogs.filter(log => {
            const logDate = new Date(log.timestamp);
            return logDate.toDateString() === selectedDate.toDateString();
        });
    }
    
    if (filterLevel && filterLevel !== 'all') {
        filteredLogs = filteredLogs.filter(log => log.level === filterLevel);
    }
    
    // Trier par date (plus récent en premier)
    filteredLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Formater et afficher les logs
    let logsText = '';
    filteredLogs.forEach(log => {
        const date = new Date(log.timestamp);
        const formattedDate = date.toLocaleString('fr-FR');
        
        let levelColor = '';
        switch (log.level) {
            case 'error':
                levelColor = 'color: var(--danger-color);';
                break;
            case 'warning':
                levelColor = 'color: var(--warning-color);';
                break;
            case 'info':
                levelColor = 'color: var(--info-color);';
                break;
            case 'security':
                levelColor = 'color: var(--primary-color);';
                break;
        }
        
        logsText += `[${formattedDate}] <span style="${levelColor}">${log.level.toUpperCase()}</span> ${log.message}\n`;
        
        if (log.details) {
            logsText += `       Détails: ${JSON.stringify(log.details, null, 2)}\n`;
        }
        
        logsText += '\n';
    });
    
    logsContent.innerHTML = logsText || 'Aucun log trouvé';
}

// Fonctions d'action admin

function approveTransaction(transactionId) {
    if (!confirm('Approuver cette transaction?')) return;
    
    let transactions = JSON.parse(localStorage.getItem('payfusion_transactions') || '[]');
    const transactionIndex = transactions.findIndex(t => t.id === transactionId);
    
    if (transactionIndex !== -1) {
        transactions[transactionIndex].status = 'approved';
        transactions[transactionIndex].approvedAt = new Date().toISOString();
        transactions[transactionIndex].approvedBy = localStorage.getItem('payfusion_user_email');
        
        localStorage.setItem('payfusion_transactions', JSON.stringify(transactions));
        
        // Ajouter un log
        addLog('info', `Transaction ${transactionId} approuvée`, {
            transactionId: transactionId,
            approvedBy: localStorage.getItem('payfusion_user_email')
        });
        
        showNotification('Transaction approuvée!', 'success');
        loadTransactions();
        updateDashboardStats();
    }
}

function rejectTransaction(transactionId) {
    if (!confirm('Rejeter cette transaction?')) return;
    
    let transactions = JSON.parse(localStorage.getItem('payfusion_transactions') || '[]');
    const transactionIndex = transactions.findIndex(t => t.id === transactionId);
    
    if (transactionIndex !== -1) {
        transactions[transactionIndex].status = 'rejected';
        transactions[transactionIndex].rejectedAt = new Date().toISOString();
        transactions[transactionIndex].rejectedBy = localStorage.getItem('payfusion_user_email');
        transactions[transactionIndex].rejectionReason = prompt('Raison du rejet:') || 'Non spécifiée';
        
        localStorage.setItem('payfusion_transactions', JSON.stringify(transactions));
        
        // Ajouter un log
        addLog('warning', `Transaction ${transactionId} rejetée`, {
            transactionId: transactionId,
            rejectedBy: localStorage.getItem('payfusion_user_email'),
            reason: transactions[transactionIndex].rejectionReason
        });
        
        showNotification('Transaction rejetée!', 'success');
        loadTransactions();
        updateDashboardStats();
    }
}

function viewTransactionDetails(transactionId) {
    let transactions = JSON.parse(localStorage.getItem('payfusion_transactions') || '[]');
    const transaction = transactions.find(t => t.id === transactionId);
    
    if (!transaction) {
        showNotification('Transaction non trouvée', 'error');
        return;
    }
    
    const details = JSON.stringify(transaction, null, 2);
    alert(`Détails de la transaction:\n\n${details}`);
}

function viewUserDetails(userId) {
    let users = JSON.parse(localStorage.getItem('payfusion_users') || '[]');
    const user = users.find(u => u.id === userId);
    
    if (!user) {
        showNotification('Utilisateur non trouvé', 'error');
        return;
    }
    
    const details = JSON.stringify(user, null, 2);
    alert(`Détails de l'utilisateur:\n\n${details}`);
}

function deleteUser(userId) {
    if (!confirm('Supprimer cet utilisateur? Cette action est irréversible!')) return;
    
    let users = JSON.parse(localStorage.getItem('payfusion_users') || '[]');
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex !== -1) {
        const userEmail = users[userIndex].email;
        users.splice(userIndex, 1);
        
        localStorage.setItem('payfusion_users', JSON.stringify(users));
        
        // Ajouter un log
        addLog('warning', `Utilisateur ${userEmail} supprimé`, {
            userId: userId,
            deletedBy: localStorage.getItem('payfusion_user_email')
        });
        
        showNotification('Utilisateur supprimé!', 'success');
        loadUsers();
        updateDashboardStats();
    }
}

function approvePayment(paymentId) {
    if (!confirm('Approuver ce paiement?')) return;
    
    let payments = JSON.parse(localStorage.getItem('payfusion_payments') || '[]');
    const paymentIndex = payments.findIndex(p => p.id === paymentId);
    
    if (paymentIndex !== -1) {
        payments[paymentIndex].status = 'approved';
        payments[paymentIndex].approvedAt = new Date().toISOString();
        payments[paymentIndex].approvedBy = localStorage.getItem('payfusion_user_email');
        
        // Créer une transaction correspondante
        const payment = payments[paymentIndex];
        addTransaction({
            type: 'payment',
            currency: 'HTG',
            amount: payment.amount,
            method: payment.paymentMethod,
            reference: payment.transactionNumber,
            status: 'completed',
            timestamp: new Date().toISOString(),
            userId: payment.userId
        });
        
        localStorage.setItem('payfusion_payments', JSON.stringify(payments));
        
        // Ajouter un log
        addLog('info', `Paiement ${paymentId} approuvé`, {
            paymentId: paymentId,
            amount: payment.amount,
            method: payment.paymentMethod,
            approvedBy: localStorage.getItem('payfusion_user_email')
        });
        
        showNotification('Paiement approuvé!', 'success');
        loadPendingPayments();
        updateDashboardStats();
    }
}

function rejectPayment(paymentId) {
    if (!confirm('Rejeter ce paiement?')) return;
    
    let payments = JSON.parse(localStorage.getItem('payfusion_payments') || '[]');
    const paymentIndex = payments.findIndex(p => p.id === paymentId);
    
    if (paymentIndex !== -1) {
        payments[paymentIndex].status = 'rejected';
        payments[paymentIndex].rejectedAt = new Date().toISOString();
        payments[paymentIndex].rejectedBy = localStorage.getItem('payfusion_user_email');
        payments[paymentIndex].rejectionReason = prompt('Raison du rejet:') || 'Non spécifiée';
        
        localStorage.setItem('payfusion_payments', JSON.stringify(payments));
        
        // Ajouter un log
        addLog('warning', `Paiement ${paymentId} rejeté`, {
            paymentId: paymentId,
            rejectedBy: localStorage.getItem('payfusion_user_email'),
            reason: payments[paymentIndex].rejectionReason
        });
        
        showNotification('Paiement rejeté!', 'success');
        loadPendingPayments();
        updateDashboardStats();
    }
}

function viewPaymentProof(paymentId) {
    let payments = JSON.parse(localStorage.getItem('payfusion_payments') || '[]');
    const payment = payments.find(p => p.id === paymentId);
    
    if (!payment || !payment.proof) {
        showNotification('Preuve non trouvée', 'error');
        return;
    }
    
    // Ouvrir la preuve dans une nouvelle fenêtre
    const proofWindow = window.open('', '_blank');
    proofWindow.document.write(`
        <html>
            <head>
                <title>Preuve de paiement - ${paymentId}</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    img { max-width: 100%; height: auto; }
                    .info { margin-bottom: 20px; }
                </style>
            </head>
            <body>
                <div class="info">
                    <h2>Preuve de paiement</h2>
                    <p><strong>ID:</strong> ${paymentId}</p>
                    <p><strong>Montant:</strong> ${payment.amount} HTG</p>
                    <p><strong>Méthode:</strong> ${payment.paymentMethod}</p>
                    <p><strong>Nom:</strong> ${payment.fullName}</p>
                </div>
                ${payment.proof.startsWith('data:image') ? 
                    `<img src="${payment.proof}" alt="Preuve de paiement">` : 
                    `<p>Fichier PDF: <a href="${payment.proof}" download="preuve-${paymentId}.pdf">Télécharger</a></p>`
                }
            </body>
        </html>
    `);
}

function completeFreeFireOrder(orderId) {
    if (!confirm('Marquer cette commande comme complétée?')) return;
    
    let orders = JSON.parse(localStorage.getItem('freefire_orders') || '[]');
    const orderIndex = orders.findIndex(o => o.id === orderId);
    
    if (orderIndex !== -1) {
        orders[orderIndex].status = 'completed';
        orders[orderIndex].completedAt = new Date().toISOString();
        orders[orderIndex].completedBy = localStorage.getItem('payfusion_user_email');
        
        localStorage.setItem('freefire_orders', JSON.stringify(orders));
        
        // Ajouter un log
        addLog('info', `Commande Free Fire ${orderId} complétée`, {
            orderId: orderId,
            playerId: orders[orderIndex].playerId,
            completedBy: localStorage.getItem('payfusion_user_email')
        });
        
        showNotification('Commande complétée!', 'success');
        loadFreeFireOrders();
        updateDashboardStats();
    }
}

function cancelFreeFireOrder(orderId) {
    if (!confirm('Annuler cette commande?')) return;
    
    let orders = JSON.parse(localStorage.getItem('freefire_orders') || '[]');
    const orderIndex = orders.findIndex(o => o.id === orderId);
    
    if (orderIndex !== -1) {
        orders[orderIndex].status = 'cancelled';
        orders[orderIndex].cancelledAt = new Date().toISOString();
        orders[orderIndex].cancelledBy = localStorage.getItem('payfusion_user_email');
        orders[orderIndex].cancellationReason = prompt('Raison de l\'annulation:') || 'Non spécifiée';
        
        localStorage.setItem('freefire_orders', JSON.stringify(orders));
        
        // Ajouter un log
        addLog('warning', `Commande Free Fire ${orderId} annulée`, {
            orderId: orderId,
            cancelledBy: localStorage.getItem('payfusion_user_email'),
            reason: orders[orderIndex].cancellationReason
        });
        
        showNotification('Commande annulée!', 'success');
        loadFreeFireOrders();
        updateDashboardStats();
    }
}

function verifyCryptoDeposit(transactionId) {
    if (!confirm('Vérifier ce dépôt crypto?')) return;
    
    const hash = prompt('Entrez le hash de transaction pour vérification:');
    if (!hash) {
        showNotification('Hash requis pour vérification', 'error');
        return;
    }
    
    // Simuler la vérification blockchain
    showLoading();
    
    setTimeout(() => {
        hideLoading();
        
        let transactions = JSON.parse(localStorage.getItem('payfusion_transactions') || '[]');
        const transactionIndex = transactions.findIndex(t => t.id === transactionId);
        
        if (transactionIndex !== -1) {
            transactions[transactionIndex].status = 'approved';
            transactions[transactionIndex].approvedAt = new Date().toISOString();
            transactions[transactionIndex].approvedBy = localStorage.getItem('payfusion_user_email');
            transactions[transactionIndex].transactionHash = hash;
            transactions[transactionIndex].blockchainVerified = true;
            
            localStorage.setItem('payfusion_transactions', JSON.stringify(transactions));
            
            // Ajouter un log
            addLog('info', `Dépôt crypto ${transactionId} vérifié`, {
                transactionId: transactionId,
                hash: hash,
                approvedBy: localStorage.getItem('payfusion_user_email')
            });
            
            showNotification('Dépôt crypto vérifié et approuvé!', 'success');
            loadCryptoDeposits();
            updateDashboardStats();
        }
    }, 2000);
}

function rejectCryptoDeposit(transactionId) {
    if (!confirm('Rejeter ce dépôt crypto?')) return;
    
    let transactions = JSON.parse(localStorage.getItem('payfusion_transactions') || '[]');
    const transactionIndex = transactions.findIndex(t => t.id === transactionId);
    
    if (transactionIndex !== -1) {
        transactions[transactionIndex].status = 'rejected';
        transactions[transactionIndex].rejectedAt = new Date().toISOString();
        transactions[transactionIndex].rejectedBy = localStorage.getItem('payfusion_user_email');
        transactions[transactionIndex].rejectionReason = prompt('Raison du rejet:') || 'Non spécifiée';
        
        localStorage.setItem('payfusion_transactions', JSON.stringify(transactions));
        
        // Ajouter un log
        addLog('warning', `Dépôt crypto ${transactionId} rejeté`, {
            transactionId: transactionId,
            rejectedBy: localStorage.getItem('payfusion_user_email'),
            reason: transactions[transactionIndex].rejectionReason
        });
        
        showNotification('Dépôt crypto rejeté!', 'success');
        loadCryptoDeposits();
        updateDashboardStats();
    }
}

function approveWalletRequest(requestId) {
    if (!confirm('Approuver cette demande?')) return;
    
    let transactions = JSON.parse(localStorage.getItem('payfusion_transactions') || '[]');
    const transactionIndex = transactions.findIndex(t => t.id === requestId);
    
    if (transactionIndex !== -1) {
        const request = transactions[transactionIndex];
        
        if (request.type === 'withdrawal') {
            // Pour les retraits, confirmer l'envoi
            if (!confirm(`Confirmer l'envoi de ${request.netAmount} ${request.currency} à ${request.account}?`)) {
                return;
            }
        }
        
        transactions[transactionIndex].status = 'completed';
        transactions[transactionIndex].completedAt = new Date().toISOString();
        transactions[transactionIndex].completedBy = localStorage.getItem('payfusion_user_email');
        
        localStorage.setItem('payfusion_transactions', JSON.stringify(transactions));
        
        // Ajouter un log
        addLog('info', `Demande wallet ${requestId} approuvée`, {
            requestId: requestId,
            type: request.type,
            amount: request.amount,
            completedBy: localStorage.getItem('payfusion_user_email')
        });
        
        showNotification('Demande approuvée!', 'success');
        loadWalletRequests();
        updateDashboardStats();
    }
}

function rejectWalletRequest(requestId) {
    if (!confirm('Rejeter cette demande?')) return;
    
    let transactions = JSON.parse(localStorage.getItem('payfusion_transactions') || '[]');
    const transactionIndex = transactions.findIndex(t => t.id === requestId);
    
    if (transactionIndex !== -1) {
        transactions[transactionIndex].status = 'rejected';
        transactions[transactionIndex].rejectedAt = new Date().toISOString();
        transactions[transactionIndex].rejectedBy = localStorage.getItem('payfusion_user_email');
        transactions[transactionIndex].rejectionReason = prompt('Raison du rejet:') || 'Non spécifiée';
        
        localStorage.setItem('payfusion_transactions', JSON.stringify(transactions));
        
        // Ajouter un log
        addLog('warning', `Demande wallet ${requestId} rejetée`, {
            requestId: requestId,
            rejectedBy: localStorage.getItem('payfusion_user_email'),
            reason: transactions[transactionIndex].rejectionReason
        });
        
        showNotification('Demande rejetée!', 'success');
        loadWalletRequests();
        updateDashboardStats();
    }
}

function searchUsers() {
    loadUsers();
}

function exportLogs() {
    const logs = JSON.parse(localStorage.getItem('payfusion_logs') || '[]');
    
    if (logs.length === 0) {
        showNotification('Aucun log à exporter', 'warning');
        return;
    }
    
    // Convertir en texte
    let logsText = 'Pay Fusion - Logs d\'administration\n';
    logsText += 'Exporté le: ' + new Date().toLocaleString('fr-FR') + '\n\n';
    
    logs.forEach(log => {
        const date = new Date(log.timestamp);
        logsText += `[${date.toLocaleString('fr-FR')}] ${log.level.toUpperCase()} - ${log.message}\n`;
        
        if (log.details) {
            logsText += 'Détails: ' + JSON.stringify(log.details, null, 2) + '\n';
        }
        
        logsText += '\n';
    });
    
    // Créer et télécharger le fichier
    const blob = new Blob([logsText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payfusion-logs-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification('Logs exportés avec succès!', 'success');
}

function addLog(level, message, details = null) {
    const log = {
        level: level,
        message: message,
        details: details,
        timestamp: new Date().toISOString(),
        admin: localStorage.getItem('payfusion_user_email')
    };
    
    let logs = JSON.parse(localStorage.getItem('payfusion_logs') || '[]');
    logs.unshift(log);
    
    // Garder seulement les 1000 logs les plus récents
    if (logs.length > 1000) {
        logs = logs.slice(0, 1000);
    }
    
    localStorage.setItem('payfusion_logs', JSON.stringify(logs));
}

// Fonctions utilitaires
function showNotification(message, type) {
    alert(`${type.toUpperCase()}: ${message}`);
}

function showLoading() {
    // Implémenter un indicateur de chargement si nécessaire
}

function hideLoading() {
    // Cacher l'indicateur de chargement si nécessaire
}

// Exporter les fonctions globales
window.initAdmin = function() {
    // Cette fonction est appelée depuis main.js quand l'admin est détecté
    console.log('Admin module loaded');
};

window.showAdminSection = showAdminSection;
window.logoutAdmin = logoutAdmin;
window.loadTransactions = loadTransactions;
window.searchUsers = searchUsers;
window.loadLogs = loadLogs;
window.exportLogs = exportLogs;

// Définir freeFirePacks pour référence
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