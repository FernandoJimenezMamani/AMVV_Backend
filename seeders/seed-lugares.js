const { sequelize } = require('../models');
const { Lugar } = require('../models'); // Importar el modelo Lugar

const seedLugares = async () => {
  try {
    console.log('Iniciando la inserción de lugares...');

    // Datos de lugares de ejemplo
    const lugares = [
      { nombre: 'Coliceo Bolivar', longitud: -58.3816, latitud: -34.6037, eliminado: 0, direccion: 'Av. Principal 123' },
      { nombre: 'Coliceo Coronilla', longitud: -58.4321, latitud: -34.5623, eliminado: 0, direccion: 'Calle Norte 456' },
      { nombre: 'Colegio San Marcos', longitud: -58.3987, latitud: -34.5892, eliminado: 0, direccion: 'Av. Sur 789' },
      { nombre: 'OTB Juan Vargas', longitud: -58.4723, latitud: -34.5211, eliminado: 0, direccion: 'Plaza Municipal 101' },
      { nombre: 'OTB Quiñones', longitud: -58.3524, latitud: -34.6345, eliminado: 0, direccion: 'Av. Deportes 202' },
    ];

    // Inserción de datos en la tabla Lugar
    await Lugar.bulkCreate(lugares, { validate: true });
    console.log('Lugares insertados correctamente.');
  } catch (error) {
    console.error('Error al insertar lugares:', error);
  } finally {
    console.log('Cerrando la conexión a la base de datos...');
    await sequelize.close();
  }
};

seedLugares();
