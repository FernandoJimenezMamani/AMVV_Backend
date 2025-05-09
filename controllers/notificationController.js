const { Usuario } = require('../models');

exports.registerPushToken = async (req, res) => {
  try {
      const { token } = req.body;
      const userId = req.user.id; // El middleware auth ya proporciona esto

      if (!token) {
          return res.status(400).json({ 
              success: false,
              message: 'Token push es requerido' 
          });
      }

      console.log(`Registrando token push para usuario ${userId}: ${token}`);

      // Actualizar el token push en la base de datos
      await Usuario.update(
          { push_token: token },
          { where: { id: userId } }
      );

      return res.status(200).json({ 
          success: true,
          message: 'Token push registrado exitosamente' 
      });

  } catch (error) {
      console.error('Error en registerPushToken:', error);
      return res.status(500).json({ 
          success: false,
          message: 'Error interno al registrar token push',
          error: error.message 
      });
  }
};

exports.deletePushToken = async (req, res) => {
    try {
      const userId = req.user.id; // El middleware auth ya proporciona esto
  
      console.log(`Eliminando token push para usuario ${userId}`);
  
      // Actualizar el token push a null en la base de datos
      await Usuario.update(
        { push_token: null },
        { where: { id: userId } }
      );
  
      return res.status(200).json({ 
        success: true,
        message: 'Token push eliminado exitosamente' 
      });
  
    } catch (error) {
      console.error('Error en deletePushToken:', error);
      return res.status(500).json({ 
        success: false,
        message: 'Error interno al eliminar token push',
        error: error.message 
      });
    }
  };