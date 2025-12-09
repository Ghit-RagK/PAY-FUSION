const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  // Informations personnelles
  firstName: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 50
  },
  
  lastName: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 50
  },
  
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Adresse email invalide']
  },
  
  phone: {
    type: String,
    required: true,
    trim: true,
    match: [/^\+?[0-9]{10,15}$/, 'Numéro de téléphone invalide']
  },
  
  // Sécurité
  password: {
    type: String,
    required: true
  },
  
  twoFactorSecret: {
    type: String,
    select: false
  },
  
  twoFactorTempSecret: {
    type: String,
    select: false
  },
  
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  
  // Localisation
  country: {
    type: String,
    required: true,
    uppercase: true,
    minlength: 2,
    maxlength: 2
  },
  
  timezone: {
    type: String,
    default: 'America/Port-au-Prince'
  },
  
  language: {
    type: String,
    default: 'fr',
    enum: ['fr', 'en', 'es', 'ht']
  },
  
  // Préférences
  newsletter: {
    type: Boolean,
    default: false
  },
  
  emailNotifications: {
    security: { type: Boolean, default: true },
    transactions: { type: Boolean, default: true },
    promotions: { type: Boolean, default: false }
  },
  
  pushNotifications: {
    important: { type: Boolean, default: true },
    alerts: { type: Boolean, default: true }
  },
  
  // Statut
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  
  verified: {
    type: Boolean,
    default: false
  },
  
  locked: {
    type: Boolean,
    default: false
  },
  
  lockedUntil: {
    type: Date
  },
  
  loginAttempts: {
    type: Number,
    default: 0
  },
  
  // Métadonnées
  lastLogin: {
    type: Date
  },
  
  passwordChangedAt: {
    type: Date
  },
  
  // Soft delete
  deleted: {
    type: Boolean,
    default: false
  },
  
  deletedAt: {
    type: Date
  }
  
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.twoFactorSecret;
      delete ret.twoFactorTempSecret;
      delete ret.loginAttempts;
      return ret;
    }
  }
});

// Indexes
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ phone: 1 });
userSchema.index({ role: 1 });
userSchema.index({ createdAt: -1 });

// Méthodes
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.incrementLoginAttempts = async function() {
  this.loginAttempts += 1;
  
  if (this.loginAttempts >= 5) {
    this.locked = true;
    this.lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
  }
  
  await this.save();
};

userSchema.methods.resetLoginAttempts = async function() {
  this.loginAttempts = 0;
  this.locked = false;
  this.lockedUntil = undefined;
  await this.save();
};

// Middleware pre-save
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.pre('save', function(next) {
  if (this.isModified('password') && !this.isNew) {
    this.passwordChangedAt = new Date();
  }
  next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;