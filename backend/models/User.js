// backend/models/User.js (simulation)
module.exports = {
  findOne: async (query) => {
    // Simulation pour Vercel
    const users = [
      {
        _id: 'admin_001',
        email: 'kenshinworkspace@gmail.com',
        firstName: 'Admin',
        lastName: 'PayFusion',
        phone: '+50939442808',
        country: 'HT',
        role: 'admin',
        verified: true,
        locked: false,
        deleted: false
      }
    ];
    
    const key = Object.keys(query)[0];
    const value = query[key];
    
    return users.find(user => user[key] === value) || null;
  },
  
  findById: async (id) => {
    const users = [
      {
        _id: 'admin_001',
        email: 'kenshinworkspace@gmail.com',
        firstName: 'Admin',
        lastName: 'PayFusion',
        phone: '+50939442808',
        country: 'HT',
        role: 'admin',
        verified: true,
        locked: false,
        deleted: false
      }
    ];
    
    return users.find(user => user._id === id) || null;
  }
};