const jwt = require('jsonwebtoken');
require('dotenv').config();

const authMiddleware = (req, res, next) => {
  console.log('🛡️ Token recibido en la petición:', req.headers['authorization']);
  const token = req.headers['authorization']?.split(' ')[1]; 
  
  if (!token) {
    return res.status(401).json({ message: 'No se proporcionó token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    console.error('Error al verificar el token:', err);
    return res.status(401).json({ message: 'Token inválido o expirado' });
  }
};

module.exports = authMiddleware;
