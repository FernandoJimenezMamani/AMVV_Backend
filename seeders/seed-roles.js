const { sequelize } = require('../models');
const { Rol } = require('../models'); // Importar el modelo Rol

const seedRoles = async () => {
  try {
    // Datos a insertar
    const roles = [
      { id: 1, nombre: 'PresidenteAsociacion' },
      { id: 2, nombre: 'Tesorero' },
      { id: 3, nombre: 'PresidenteClub' },
      { id: 4, nombre: 'Jugador' },
      { id: 5, nombre: 'PresidenteArbitro' },
      { id: 6, nombre: 'Arbitro' },
      { id: 7, nombre: 'DelegadoClub' },
    ];

    // Inserción de datos con IDs manuales
    await Rol.bulkCreate(roles, { validate: true });
    console.log('Roles insertados correctamente.');
  } catch (error) {
    console.error('Error al insertar roles:', error);
  } finally {
    await sequelize.close(); // Cerrar la conexión
  }
};

seedRoles();
