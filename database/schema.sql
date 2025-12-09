-- Base de données Pay Fusion
-- Version: 1.0
-- Auteur: Pay Fusion Team

CREATE DATABASE IF NOT EXISTS payfusion;
USE payfusion;

-- Table des utilisateurs
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    country CHAR(2) NOT NULL,
    timezone VARCHAR(50) DEFAULT 'America/Port-au-Prince',
    language CHAR(2) DEFAULT 'fr',
    
    -- 2FA
    two_factor_secret VARCHAR(255),
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    
    -- Préférences
    newsletter BOOLEAN DEFAULT FALSE,
    email_notifications JSON,
    push_notifications JSON,
    
    -- Statut
    role ENUM('user', 'admin') DEFAULT 'user',
    verified BOOLEAN DEFAULT FALSE,
    locked BOOLEAN DEFAULT FALSE,
    locked_until DATETIME,
    login_attempts INT DEFAULT 0,
    
    -- Métadonnées
    last_login DATETIME,
    password_changed_at DATETIME,
    deleted BOOLEAN DEFAULT FALSE,
    deleted_at DATETIME,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_email (email),
    INDEX idx_phone (phone),
    INDEX idx_role (role),
    INDEX idx_created_at (created_at DESC)
);

-- Table des wallets
CREATE TABLE wallets (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    
    -- Soldes
    balance_htg DECIMAL(15,2) DEFAULT 0.00,
    balance_usd DECIMAL(15,2) DEFAULT 0.00,
    balance_cad DECIMAL(15,2) DEFAULT 0.00,
    balance_usdt DECIMAL(15,8) DEFAULT 0.00000000,
    
    -- Métadonnées
    total_deposits DECIMAL(15,2) DEFAULT 0.00,
    total_withdrawals DECIMAL(15,2) DEFAULT 0.00,
    total_fees DECIMAL(15,2) DEFAULT 0.00,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    UNIQUE KEY unique_user_wallet (user_id)
);

-- Table des transactions
CREATE TABLE transactions (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    transaction_id VARCHAR(50) UNIQUE NOT NULL,
    
    -- Type
    type ENUM(
        'deposit',
        'withdrawal', 
        'conversion',
        'payment',
        'freefire',
        'crypto_deposit',
        'fee',
        'refund',
        'bonus'
    ) NOT NULL,
    
    subtype ENUM(
        'moncash', 'natcash', 'bank', 'crypto',
        'pack', 'subscription', 'levelpass',
        'usdt_trc20', 'usdt_erc20'
    ),
    
    -- Montants
    from_currency ENUM('HTG', 'USD', 'CAD', 'USDT'),
    from_amount DECIMAL(15,8),
    to_currency ENUM('HTG', 'USD', 'CAD', 'USDT'),
    to_amount DECIMAL(15,8),
    amount DECIMAL(15,8) NOT NULL,
    currency ENUM('HTG', 'USD', 'CAD', 'USDT') NOT NULL,
    fee DECIMAL(15,8) DEFAULT 0.00000000,
    net_amount DECIMAL(15,8),
    exchange_rate DECIMAL(15,8),
    
    -- Détails
    reference VARCHAR(255),
    transaction_hash VARCHAR(255),
    sender_address VARCHAR(255),
    recipient_address VARCHAR(255),
    player_id VARCHAR(50),
    pack_id INT,
    
    -- Statut
    status ENUM(
        'pending',
        'processing', 
        'completed',
        'failed',
        'cancelled',
        'refunded'
    ) DEFAULT 'pending',
    
    -- Vérification
    verified BOOLEAN DEFAULT FALSE,
    verified_at DATETIME,
    verified_by VARCHAR(36),
    blockchain_confirmations INT DEFAULT 0,
    
    -- Liens
    related_transaction_id VARCHAR(36),
    order_id VARCHAR(50),
    payment_id VARCHAR(36),
    freefire_order_id VARCHAR(36),
    
    -- Métadonnées
    description TEXT,
    notes TEXT,
    metadata JSON,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL,
    
    INDEX idx_user_created (user_id, created_at DESC),
    INDEX idx_transaction_id (transaction_id),
    INDEX idx_type_status (type, status),
    INDEX idx_status_created (status, created_at),
    INDEX idx_created_desc (created_at DESC),
    INDEX idx_reference (reference),
    INDEX idx_order_id (order_id)
);

-- Table d'historique des statuts
CREATE TABLE transaction_status_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_id VARCHAR(36) NOT NULL,
    status VARCHAR(50) NOT NULL,
    reason TEXT,
    changed_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
    INDEX idx_transaction_status (transaction_id, created_at DESC)
);

-- Table des paiements
CREATE TABLE payments (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    
    -- Informations
    full_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    payment_method ENUM('moncash', 'natcash') NOT NULL,
    
    -- Montant
    amount_htg DECIMAL(10,2) NOT NULL,
    transaction_number VARCHAR(100) NOT NULL,
    
    -- Preuve
    proof_filename VARCHAR(255),
    proof_path VARCHAR(500),
    proof_mimetype VARCHAR(100),
    
    -- Commande
    order_id VARCHAR(50) UNIQUE NOT NULL,
    notes TEXT,
    
    -- Méthode spécifique
    method_details JSON,
    
    -- Statut
    status ENUM('pending', 'approved', 'rejected', 'completed') DEFAULT 'pending',
    status_reason TEXT,
    
    -- Validation
    approved_at DATETIME,
    approved_by VARCHAR(36),
    rejected_at DATETIME,
    rejected_by VARCHAR(36),
    completed_at DATETIME,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (rejected_by) REFERENCES users(id) ON DELETE SET NULL,
    
    INDEX idx_user_status (user_id, status),
    INDEX idx_status_created (status, created_at),
    INDEX idx_order_id (order_id),
    INDEX idx_created_desc (created_at DESC)
);

-- Table des commandes Free Fire
CREATE TABLE freefire_orders (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    
    -- Joueur
    player_id VARCHAR(50) NOT NULL,
    
    -- Commande
    order_type ENUM('pack', 'weekly', 'monthly', 'levelpass') NOT NULL,
    pack_id INT,
    
    -- Détails
    diamonds INT,
    bonus INT,
    price_htg DECIMAL(10,2) NOT NULL,
    
    -- Paiement
    payment_method ENUM('moncash', 'natcash', 'crypto', 'wallet') NOT NULL,
    payment_status ENUM('pending', 'paid', 'failed') DEFAULT 'pending',
    
    -- Statut
    status ENUM('pending', 'processing', 'completed', 'cancelled', 'failed') DEFAULT 'pending',
    status_reason TEXT,
    
    -- Exécution
    completed_at DATETIME,
    completed_by VARCHAR(36),
    cancelled_at DATETIME,
    cancelled_by VARCHAR(36),
    
    -- Métadonnées
    order_id VARCHAR(50) UNIQUE NOT NULL,
    metadata JSON,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (completed_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (cancelled_by) REFERENCES users(id) ON DELETE SET NULL,
    
    INDEX idx_user_status (user_id, status),
    INDEX idx_player_id (player_id),
    INDEX idx_status_created (status, created_at),
    INDEX idx_order_id (order_id)
);

-- Table des sessions
CREATE TABLE sessions (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    token VARCHAR(500) NOT NULL,
    
    -- Informations de session
    user_agent TEXT,
    ip_address VARCHAR(45),
    location VARCHAR(100),
    
    -- Durée
    expires_at DATETIME NOT NULL,
    last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_token (token(255)),
    INDEX idx_expires_at (expires_at)
);

-- Table des tokens de vérification
CREATE TABLE verification_tokens (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    token VARCHAR(255) NOT NULL,
    
    -- Type
    type ENUM('email_verification', 'password_reset', '2fa') NOT NULL,
    
    -- Expiration
    expires_at DATETIME NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    used_at DATETIME,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_token (token),
    INDEX idx_user_type (user_id, type),
    INDEX idx_expires_at (expires_at)
);

-- Table des logs
CREATE TABLE logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Niveau
    level ENUM('debug', 'info', 'warning', 'error', 'security') NOT NULL,
    
    -- Message
    message TEXT NOT NULL,
    
    -- Contexte
    user_id VARCHAR(36),
    action VARCHAR(100),
    ip_address VARCHAR(45),
    user_agent TEXT,
    
    -- Détails
    details JSON,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_level_created (level, created_at DESC),
    INDEX idx_user_id (user_id),
    INDEX idx_action (action),
    INDEX idx_created_desc (created_at DESC)
);

-- Table des paramètres système
CREATE TABLE system_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Clé
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    
    -- Valeur
    setting_value TEXT NOT NULL,
    setting_type ENUM('string', 'number', 'boolean', 'json', 'array') DEFAULT 'string',
    
    -- Métadonnées
    description TEXT,
    category VARCHAR(50),
    editable BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_key (setting_key),
    INDEX idx_category (category)
);

-- Table des taux de change
CREATE TABLE exchange_rates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Devises
    from_currency ENUM('HTG', 'USD', 'CAD', 'USDT') NOT NULL,
    to_currency ENUM('HTG', 'USD', 'CAD', 'USDT') NOT NULL,
    
    -- Taux
    rate DECIMAL(15,8) NOT NULL,
    fee_percentage DECIMAL(5,2) DEFAULT 0.00,
    
    -- Validité
    valid_from DATETIME NOT NULL,
    valid_to DATETIME,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_currencies (from_currency, to_currency),
    INDEX idx_validity (valid_from, valid_to),
    UNIQUE KEY unique_rate_interval (from_currency, to_currency, valid_from)
);

-- Table des notifications
CREATE TABLE notifications (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    
    -- Notification
    type ENUM('transaction', 'security', 'system', 'promotion') NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    
    -- Données
    data JSON,
    related_id VARCHAR(36),
    
    -- Statut
    read BOOLEAN DEFAULT FALSE,
    read_at DATETIME,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_read (user_id, read),
    INDEX idx_user_created (user_id, created_at DESC),
    INDEX idx_type (type)
);

-- Table des fichiers uploadés
CREATE TABLE uploaded_files (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    
    -- Fichier
    original_filename VARCHAR(255) NOT NULL,
    stored_filename VARCHAR(255) UNIQUE NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    
    -- Usage
    purpose ENUM('payment_proof', 'identity', 'other') NOT NULL,
    related_id VARCHAR(36),
    
    -- Sécurité
    hash VARCHAR(255) NOT NULL,
    access_token VARCHAR(100),
    
    -- Métadonnées
    metadata JSON,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_purpose (user_id, purpose),
    INDEX idx_related (related_id),
    INDEX idx_created_desc (created_at DESC),
    INDEX idx_hash (hash)
);

-- Table d'audit
CREATE TABLE audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Action
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(100) NOT NULL,
    record_id VARCHAR(36) NOT NULL,
    
    -- Changements
    old_values JSON,
    new_values JSON,
    
    -- Exécutant
    user_id VARCHAR(36),
    ip_address VARCHAR(45),
    user_agent TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_action (action),
    INDEX idx_table_record (table_name, record_id),
    INDEX idx_user_id (user_id),
    INDEX idx_created_desc (created_at DESC)
);

-- Insertion des paramètres par défaut
INSERT INTO system_settings (setting_key, setting_value, setting_type, description, category) VALUES
-- Taux de change
('exchange_rate_usd_htg', '157', 'number', 'Taux de change USD vers HTG', 'exchange_rates'),
('exchange_rate_cad_htg', '115', 'number', 'Taux de change CAD vers HTG', 'exchange_rates'),
('exchange_rate_htg_usd', '0.006369', 'number', 'Taux de change HTG vers USD', 'exchange_rates'),
('exchange_rate_htg_cad', '0.008696', 'number', 'Taux de change HTG vers CAD', 'exchange_rates'),

-- Frais
('withdrawal_fee_percentage', '2', 'number', 'Pourcentage de frais sur les retraits', 'fees'),
('withdrawal_fee_minimum_htg', '50', 'number', 'Frais minimum pour les retraits en HTG', 'fees'),
('withdrawal_fee_minimum_usd', '1', 'number', 'Frais minimum pour les retraits en USD', 'fees'),
('withdrawal_fee_minimum_cad', '1', 'number', 'Frais minimum pour les retraits en CAD', 'fees'),
('conversion_fee_percentage', '0.5', 'number', 'Pourcentage de frais sur les conversions', 'fees'),

-- Limites
('min_deposit_htg', '100', 'number', 'Dépôt minimum en HTG', 'limits'),
('min_withdrawal_htg', '500', 'number', 'Retrait minimum en HTG', 'limits'),
('max_daily_withdrawal_htg', '50000', 'number', 'Retrait quotidien maximum en HTG', 'limits'),
('min_crypto_deposit', '10', 'number', 'Dépôt crypto minimum en USDT', 'limits'),

-- Adresses crypto
('crypto_usdt_trc20_address', 'TJHVCbXMBQdtzurHngB1aXSFkR9TWYvZ94', 'string', 'Adresse USDT TRC20', 'crypto'),
('crypto_usdt_erc20_address', '0x742d35Cc6634C0532925a3b844Bc9e90E2E6B1E1', 'string', 'Adresse USDT ERC20', 'crypto'),
('crypto_destination_name', 'Bien Aimé Marcco', 'string', 'Nom du destinataire crypto', 'crypto'),

-- Numéros de téléphone
('moncash_phone', '+50939442808', 'string', 'Numéro MonCash', 'payments'),
('moncash_recipient', 'Bien Aimé Marcco', 'string', 'Destinataire MonCash', 'payments'),
('natcash_phone', '+50935751478', 'string', 'Numéro NatCash', 'payments'),
('natcash_recipient', 'Bien Aimé Marcco', 'string', 'Destinataire NatCash', 'payments'),

-- Configuration système
('site_name', 'Pay Fusion', 'string', 'Nom du site', 'system'),
('site_url', 'https://payfusion.com', 'string', 'URL du site', 'system'),
('support_email', 'support@payfusion.com', 'string', 'Email de support', 'system'),
('admin_email', 'kenshinworkspace@gmail.com', 'string', 'Email administrateur', 'system'),
('maintenance_mode', 'false', 'boolean', 'Mode maintenance', 'system'),

-- Sécurité
('max_login_attempts', '5', 'number', 'Nombre maximum de tentatives de connexion', 'security'),
('lock_duration_minutes', '15', 'number', 'Durée de verrouillage en minutes', 'security'),
('session_timeout_minutes', '30', 'number', 'Timeout de session en minutes', 'security'),
('require_2fa_for_admin', 'true', 'boolean', '2FA obligatoire pour les admins', 'security'),

-- Packs Free Fire
('freefire_packs', '[{"id":1,"diamonds":100,"bonus":10,"price":165},{"id":2,"diamonds":200,"bonus":20,"price":340},{"id":3,"diamonds":310,"bonus":31,"price":485},{"id":4,"diamonds":410,"bonus":31,"price":650},{"id":5,"diamonds":520,"bonus":52,"price":800},{"id":6,"diamonds":620,"bonus":62,"price":960},{"id":7,"diamonds":720,"bonus":72,"price":1100},{"id":8,"diamonds":830,"bonus":83,"price":1260},{"id":9,"diamonds":930,"bonus":93,"price":1415},{"id":10,"diamonds":1060,"bonus":106,"price":1600},{"id":11,"diamonds":1160,"bonus":116,"price":1725},{"id":12,"diamonds":1260,"bonus":126,"price":1900},{"id":13,"diamonds":1370,"bonus":137,"price":2030},{"id":14,"diamonds":1470,"bonus":147,"price":2200},{"id":15,"diamonds":1580,"bonus":158,"price":2350},{"id":16,"diamonds":1680,"bonus":168,"price":2500},{"id":17,"diamonds":1780,"bonus":178,"price":2675},{"id":18,"diamonds":1890,"bonus":199,"price":2825},{"id":19,"diamonds":1990,"bonus":129,"price":2985},{"id":20,"diamonds":2180,"bonus":218,"price":3150},{"id":21,"diamonds":5600,"bonus":560,"price":8000}]', 'json', 'Packs Free Fire disponibles', 'freefire'),

-- Abonnements Free Fire
('freefire_subscriptions', '[{"type":"weekly","name":"Abonnement Hebdomadaire","price":325},{"type":"monthly","name":"Abonnement Mensuel","price":1600},{"type":"levelpass","name":"Level Pass","price":950,"note":"LEVEL PASS DISPO PA KONT"}]', 'json', 'Abonnements Free Fire', 'freefire'),

-- Configuration SMS/Email
('smtp_host', 'smtp.gmail.com', 'string', 'Hôte SMTP', 'email'),
('smtp_port', '587', 'number', 'Port SMTP', 'email'),
('smtp_secure', 'true', 'boolean', 'SMTP sécurisé', 'email'),
('sms_provider', 'twilio', 'string', 'Fournisseur SMS', 'sms'),
('sms_from_number', '+15005550006', 'string', 'Numéro d\'envoi SMS', 'sms'),

-- Configuration de sauvegarde
('backup_enabled', 'true', 'boolean', 'Sauvegarde automatique activée', 'backup'),
('backup_frequency', 'daily', 'string', 'Fréquence des sauvegardes', 'backup'),
('backup_retention_days', '30', 'number', 'Rétention des sauvegardes en jours', 'backup');

-- Création des vues
CREATE VIEW wallet_summary AS
SELECT 
    w.user_id,
    u.email,
    u.first_name,
    u.last_name,
    w.balance_htg,
    w.balance_usd,
    w.balance_cad,
    w.balance_usdt,
    (w.balance_htg + (w.balance_usd * 157) + (w.balance_cad * 115)) as total_htg_equivalent,
    w.total_deposits,
    w.total_withdrawals,
    w.total_fees,
    w.updated_at as last_updated
FROM wallets w
JOIN users u ON w.user_id = u.id
WHERE u.deleted = FALSE;

CREATE VIEW daily_transactions AS
SELECT 
    DATE(created_at) as transaction_date,
    type,
    currency,
    COUNT(*) as transaction_count,
    SUM(amount) as total_amount,
    SUM(fee) as total_fees,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count
FROM transactions
GROUP BY DATE(created_at), type, currency
ORDER BY transaction_date DESC;

CREATE VIEW admin_dashboard AS
SELECT 
    (SELECT COUNT(*) FROM users WHERE deleted = FALSE) as total_users,
    (SELECT COUNT(*) FROM users WHERE deleted = FALSE AND verified = TRUE) as verified_users,
    (SELECT COUNT(*) FROM users WHERE deleted = FALSE AND DATE(created_at) = CURDATE()) as new_users_today,
    (SELECT COUNT(*) FROM transactions WHERE DATE(created_at) = CURDATE()) as transactions_today,
    (SELECT SUM(amount) FROM transactions WHERE DATE(created_at) = CURDATE() AND status = 'completed') as revenue_today,
    (SELECT COUNT(*) FROM payments WHERE status = 'pending') as pending_payments,
    (SELECT COUNT(*) FROM freefire_orders WHERE status = 'pending') as pending_freefire_orders,
    (SELECT COUNT(*) FROM transactions WHERE status = 'pending' AND type IN ('deposit', 'withdrawal')) as pending_wallet_requests;

-- Procédures stockées
DELIMITER //

CREATE PROCEDURE ProcessDailySettlement()
BEGIN
    DECLARE today DATE;
    SET today = CURDATE();
    
    -- Archivage des transactions anciennes
    INSERT INTO transactions_archive
    SELECT * FROM transactions 
    WHERE created_at < DATE_SUB(today, INTERVAL 90 DAY)
    AND status IN ('completed', 'failed', 'cancelled');
    
    DELETE FROM transactions 
    WHERE created_at < DATE_SUB(today, INTERVAL 90 DAY)
    AND status IN ('completed', 'failed', 'cancelled');
    
    -- Nettoyage des tokens expirés
    DELETE FROM verification_tokens 
    WHERE expires_at < NOW();
    
    -- Nettoyage des sessions expirées
    DELETE FROM sessions 
    WHERE expires_at < NOW();
    
    -- Archivage des logs
    INSERT INTO logs_archive
    SELECT * FROM logs 
    WHERE created_at < DATE_SUB(today, INTERVAL 30 DAY);
    
    DELETE FROM logs 
    WHERE created_at < DATE_SUB(today, INTERVAL 30 DAY);
    
    COMMIT;
END //

CREATE PROCEDURE CalculateUserStats(IN user_id_param VARCHAR(36))
BEGIN
    SELECT 
        u.id,
        u.email,
        u.first_name,
        u.last_name,
        w.balance_htg,
        w.balance_usd,
        w.balance_cad,
        (SELECT COUNT(*) FROM transactions t WHERE t.user_id = u.id AND t.status = 'completed') as total_transactions,
        (SELECT SUM(t.amount) FROM transactions t WHERE t.user_id = u.id AND t.status = 'completed' AND t.type = 'deposit') as total_deposits,
        (SELECT SUM(t.amount) FROM transactions t WHERE t.user_id = u.id AND t.status = 'completed' AND t.type = 'withdrawal') as total_withdrawals,
        (SELECT COUNT(*) FROM payments p WHERE p.user_id = u.id AND p.status = 'completed') as total_payments,
        (SELECT COUNT(*) FROM freefire_orders f WHERE f.user_id = u.id AND f.status = 'completed') as total_freefire_orders,
        u.last_login,
        u.created_at
    FROM users u
    LEFT JOIN wallets w ON u.id = w.user_id
    WHERE u.id = user_id_param
    AND u.deleted = FALSE;
END //

CREATE PROCEDURE GetPendingAdminActions()
BEGIN
    SELECT 
        'payment' as type,
        p.id,
        p.order_id,
        p.amount_htg,
        p.full_name,
        p.created_at
    FROM payments p
    WHERE p.status = 'pending'
    
    UNION ALL
    
    SELECT 
        'freefire' as type,
        f.id,
        f.order_id,
        f.price_htg,
        f.player_id,
        f.created_at
    FROM freefire_orders f
    WHERE f.status = 'pending'
    
    UNION ALL
    
    SELECT 
        'deposit' as type,
        t.id,
        t.transaction_id,
        t.amount,
        t.reference,
        t.created_at
    FROM transactions t
    WHERE t.status = 'pending' 
    AND t.type = 'deposit'
    
    UNION ALL
    
    SELECT 
        'withdrawal' as type,
        t.id,
        t.transaction_id,
        t.amount,
        t.reference,
        t.created_at
    FROM transactions t
    WHERE t.status = 'pending' 
    AND t.type = 'withdrawal'
    
    ORDER BY created_at DESC;
END //

DELIMITER ;

-- Triggers
DELIMITER //

CREATE TRIGGER after_user_insert
AFTER INSERT ON users
FOR EACH ROW
BEGIN
    -- Créer un wallet pour le nouvel utilisateur
    INSERT INTO wallets (id, user_id) 
    VALUES (UUID(), NEW.id);
    
    -- Logger la création
    INSERT INTO logs (level, message, user_id, action, details)
    VALUES ('info', 'Nouvel utilisateur créé', NEW.id, 'user_created', 
            JSON_OBJECT('email', NEW.email, 'name', CONCAT(NEW.first_name, ' ', NEW.last_name)));
END //

CREATE TRIGGER after_transaction_update
AFTER UPDATE ON transactions
FOR EACH ROW
BEGIN
    -- Mettre à jour le wallet si la transaction est complétée
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        IF NEW.type = 'deposit' THEN
            UPDATE wallets w
            SET 
                w.balance_htg = w.balance_htg + CASE WHEN NEW.currency = 'HTG' THEN NEW.net_amount ELSE 0 END,
                w.balance_usd = w.balance_usd + CASE WHEN NEW.currency = 'USD' THEN NEW.net_amount ELSE 0 END,
                w.balance_cad = w.balance_cad + CASE WHEN NEW.currency = 'CAD' THEN NEW.net_amount ELSE 0 END,
                w.balance_usdt = w.balance_usdt + CASE WHEN NEW.currency = 'USDT' THEN NEW.net_amount ELSE 0 END,
                w.total_deposits = w.total_deposits + NEW.amount,
                w.total_fees = w.total_fees + NEW.fee,
                w.updated_at = NOW()
            WHERE w.user_id = NEW.user_id;
            
        ELSEIF NEW.type = 'withdrawal' THEN
            UPDATE wallets w
            SET 
                w.balance_htg = w.balance_htg - CASE WHEN NEW.currency = 'HTG' THEN NEW.amount ELSE 0 END,
                w.balance_usd = w.balance_usd - CASE WHEN NEW.currency = 'USD' THEN NEW.amount ELSE 0 END,
                w.balance_cad = w.balance_cad - CASE WHEN NEW.currency = 'CAD' THEN NEW.amount ELSE 0 END,
                w.balance_usdt = w.balance_usdt - CASE WHEN NEW.currency = 'USDT' THEN NEW.amount ELSE 0 END,
                w.total_withdrawals = w.total_withdrawals + NEW.net_amount,
                w.total_fees = w.total_fees + NEW.fee,
                w.updated_at = NOW()
            WHERE w.user_id = NEW.user_id;
            
        ELSEIF NEW.type = 'conversion' THEN
            UPDATE wallets w
            SET 
                w.balance_htg = w.balance_htg - CASE WHEN NEW.from_currency = 'HTG' THEN NEW.from_amount ELSE 0 END
                                    + CASE WHEN NEW.to_currency = 'HTG' THEN NEW.to_amount ELSE 0 END,
                w.balance_usd = w.balance_usd - CASE WHEN NEW.from_currency = 'USD' THEN NEW.from_amount ELSE 0 END
                                    + CASE WHEN NEW.to_currency = 'USD' THEN NEW.to_amount ELSE 0 END,
                w.balance_cad = w.balance_cad - CASE WHEN NEW.from_currency = 'CAD' THEN NEW.from_amount ELSE 0 END
                                    + CASE WHEN NEW.to_currency = 'CAD' THEN NEW.to_amount ELSE 0 END,
                w.balance_usdt = w.balance_usdt - CASE WHEN NEW.from_currency = 'USDT' THEN NEW.from_amount ELSE 0 END
                                    + CASE WHEN NEW.to_currency = 'USDT' THEN NEW.to_amount ELSE 0 END,
                w.total_fees = w.total_fees + NEW.fee,
                w.updated_at = NOW()
            WHERE w.user_id = NEW.user_id;
        END IF;
        
        -- Logger la transaction complétée
        INSERT INTO logs (level, message, user_id, action, details)
        VALUES ('info', 'Transaction complétée', NEW.user_id, 'transaction_completed', 
                JSON_OBJECT('transaction_id', NEW.transaction_id, 'type', NEW.type, 'amount', NEW.amount, 'currency', NEW.currency));
    END IF;
END //

CREATE TRIGGER before_payment_insert
BEFORE INSERT ON payments
FOR EACH ROW
BEGIN
    -- Générer un ID de commande unique
    IF NEW.order_id IS NULL THEN
        SET NEW.order_id = CONCAT('PAY-', UNIX_TIMESTAMP(), '-', FLOOR(RAND() * 9000 + 1000));
    END IF;
    
    -- Définir les détails de la méthode
    IF NEW.payment_method = 'moncash' THEN
        SET NEW.method_details = JSON_OBJECT(
            'number', (SELECT setting_value FROM system_settings WHERE setting_key = 'moncash_phone'),
            'recipient', (SELECT setting_value FROM system_settings WHERE setting_key = 'moncash_recipient'),
            'type', 'MonCash'
        );
    ELSEIF NEW.payment_method = 'natcash' THEN
        SET NEW.method_details = JSON_OBJECT(
            'number', (SELECT setting_value FROM system_settings WHERE setting_key = 'natcash_phone'),
            'recipient', (SELECT setting_value FROM system_settings WHERE setting_key = 'natcash_recipient'),
            'type', 'NatCash'
        );
    END IF;
END //

CREATE TRIGGER before_freefire_order_insert
BEFORE INSERT ON freefire_orders
FOR EACH ROW
BEGIN
    -- Générer un ID de commande unique
    IF NEW.order_id IS NULL THEN
        SET NEW.order_id = CONCAT('FF-', UNIX_TIMESTAMP(), '-', FLOOR(RAND() * 9000 + 1000));
    END IF;
    
    -- Remplir les détails du pack si c'est un pack
    IF NEW.order_type = 'pack' AND NEW.pack_id IS NOT NULL THEN
        SET @packs_json = (SELECT setting_value FROM system_settings WHERE setting_key = 'freefire_packs');
        SET @pack = JSON_EXTRACT(@packs_json, CONCAT('$[', NEW.pack_id - 1, ']'));
        
        SET NEW.diamonds = JSON_UNQUOTE(JSON_EXTRACT(@pack, '$.diamonds'));
        SET NEW.bonus = JSON_UNQUOTE(JSON_EXTRACT(@pack, '$.bonus'));
        SET NEW.price_htg = JSON_UNQUOTE(JSON_EXTRACT(@pack, '$.price'));
    END IF;
END //

DELIMITER ;
