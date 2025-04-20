/**
 * Genera una contraseña aleatoria de 6 caracteres
 * @returns {string}
 */
function generatePassword(length = 6) {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const aux = '12345';
    let password = '';
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      password += charset[randomIndex];
    }
    return aux;
  }
  
  module.exports = { generatePassword };