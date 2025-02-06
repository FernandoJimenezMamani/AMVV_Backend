const { sequelize } = require('../models');
const { Partido } = require('../models'); // Importar el modelo Partido

const seedPartidos = async () => {
  try {
    // Datos de partidos de ejemplo
    const partidos = [
        { campeonato_id: 5, equipo_local_id: 62, equipo_visitante_id: 63, fecha: new Date(2025, 0, 30, 14, 0, 0), lugar_id: 16, estado: 1 },
        { campeonato_id: 5, equipo_local_id: 64, equipo_visitante_id: 65, fecha: new Date(2025, 0, 30, 15, 0, 0), lugar_id: 17, estado: 1 },
        { campeonato_id: 5, equipo_local_id: 66, equipo_visitante_id: 67, fecha: new Date(2025, 0, 30, 16, 0, 0), lugar_id: 18, estado: 1 },
      ];
      
      await Partido.bulkCreate(partidos, { validate: true });
    console.log('Partidos insertados correctamente.');
  } catch (error) {
    console.error('Error al insertar partidos:', error);
  } finally {
    await sequelize.close(); // Cerrar la conexión
  }
};

seedPartidos();
