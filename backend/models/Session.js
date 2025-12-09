// backend/models/Session.js (simulation)
const sessionsMemory = [];

module.exports = {
  findOne: async (query) => {
    const sessions = sessionsMemory;
    const key = Object.keys(query)[0];
    const value = query[key];
    
    const session = sessions.find(s => s[key] === value);
    
    if (session && session.expiresAt < new Date()) {
      // Session expirée
      return null;
    }
    
    return session || null;
  },
  
  save: function() {
    // Simulation de save
    return Promise.resolve(this);
  }
};