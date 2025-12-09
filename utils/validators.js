// backend/utils/validators.js

function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function isValidPhone(phone) {
  // Accepte +509XXXXXXXX ou 509XXXXXXXX
  const re = /^\+?509\d{8}$/;
  return re.test(phone);
}

function isStrongPassword(password) {
  // Au moins 8 caractères, une majuscule, une minuscule, un chiffre
  const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  return re.test(password);
}

module.exports = {
  isValidEmail,
  isValidPhone,
  isStrongPassword
};