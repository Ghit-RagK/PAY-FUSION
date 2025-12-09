
const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    // Identification
    transactionId: {
        type: String,
        required: true,
        unique: true
    },
    
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    
    // Type de transaction
    type: {
        type: String,
        required: true,
        enum: [
            'deposit',          // Dépôt
            'withdrawal',       // Retrait
            'conversion',       // Conversion
            'payment',          // Paiement
            'freefire',         // Recharge Free Fire
            'crypto_deposit',   // Dépôt crypto
            'fee',              // Frais
            'refund',           // Remboursement
            'bonus'             // Bonus
        ]
    },
    
    subtype: {
        type: String,
        enum: [
            'moncash', 'natcash', 'bank', 'crypto',
            'pack', 'subscription', 'levelpass',
            'usdt_trc20', 'usdt_erc20'
        ]
    },
    
    // Montants
    fromCurrency: {
        type: String,
        enum: ['HTG', 'USD', 'CAD', 'USDT']
    },
    
    fromAmount: {
        type: Number,
        min: 0
    },
    
    toCurrency: {
        type: String,
        enum: ['HTG', 'USD', 'CAD', 'USDT']
    },
    
    toAmount: {
        type: Number,
        min: 0
    },
    
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    
    currency: {
        type: String,
        required: true,
        enum: ['HTG', 'USD', 'CAD', 'USDT']
    },
    
    fee: {
        type: Number,
        default: 0,
        min: 0
    },
    
    netAmount: {
        type: Number,
        min: 0
    },
    
    rate: {
        type: Number
    },
    
    // Détails spécifiques
    reference: {
        type: String
    },
    
    transactionHash: {
        type: String
    },
    
    senderAddress: {
        type: String
    },
    
    recipientAddress: {
        type: String
    },
    
    playerId: {
        type: String
    },
    
    packId: {
        type: Number
    },
    
    // Statut
    status: {
        type: String,
        required: true,
        enum: ['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'],
        default: 'pending'
    },
    
    statusHistory: [{
        status: String,
        timestamp: Date,
        reason: String,
        changedBy: String
    }],
    
    // Métadonnées de validation
    verified: {
        type: Boolean,
        default: false
    },
    
    verifiedAt: {
        type: Date
    },
    
    verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    
    blockchainConfirmations: {
        type: Number,
        default: 0
    },
    
    // Liens
    relatedTransactionId: {
        type: String
    },
    
    orderId: {
        type: String
    },
    
    paymentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Payment'
    },
    
    freefireOrderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FreeFireOrder'
    },
    
    // Métadonnées
    description: {
        type: String
    },
    
    notes: {
        type: String
    },
    
    metadata: {
        type: mongoose.Schema.Types.Mixed
    }
    
}, {
    timestamps: true
});

// Indexes
transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ transactionId: 1 });
transactionSchema.index({ type: 1, status: 1 });
transactionSchema.index({ status: 1, createdAt: 1 });
transactionSchema.index({ createdAt: -1 });
transactionSchema.index({ 'statusHistory.timestamp': -1 });

// Méthodes
transactionSchema.methods.updateStatus = async function(newStatus, reason = '', changedBy = 'system') {
    this.statusHistory.push({
        status: this.status,
        timestamp: new Date(),
        reason: reason,
        changedBy: changedBy
    });
    
    this.status = newStatus;
    
    if (newStatus === 'completed') {
        this.completedAt = new Date();
    } else if (newStatus === 'failed') {
        this.failedAt = new Date();
    }
    
    await this.save();
};

transactionSchema.methods.verify = async function(verifiedBy, confirmations = 0) {
    this.verified = true;
    this.verifiedAt = new Date();
    this.verifiedBy = verifiedBy;
    this.blockchainConfirmations = confirmations;
    
    await this.updateStatus('completed', 'Transaction vérifiée', verifiedBy);
};

// Middleware pre-save
transactionSchema.pre('save', function(next) {
    if (this.isNew) {
        // Ajouter l'état initial à l'historique
        this.statusHistory = [{
            status: this.status,
            timestamp: new Date(),
            reason: 'Transaction créée',
            changedBy: 'system'
        }];
    }
    next();
});

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;