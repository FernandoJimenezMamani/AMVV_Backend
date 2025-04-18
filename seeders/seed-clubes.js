const { sequelize } = require('../models');
const { Club, ImagenClub,PersonaRol } = require('../models');

const seedClubs = async () => {
  let transaction;
  try {
    console.log('Iniciando la transacción...');
    transaction = await sequelize.transaction();

    // Lista de clubes
    const clubs = [
      { nombre: 'Lapkosmi', descripcion: 'Equipo de alto rendimiento.', presidente_asignado: 'N', eliminado: 'N' },
      { nombre: 'Heroes del Chaco', descripcion: 'Equipo con tradición ganadora.', presidente_asignado: 'N', eliminado: 'N' },
      { nombre: 'Camuesa', descripcion: 'Equipo con enfoque juvenil.', presidente_asignado: 'N', eliminado: 'N' },
      { nombre: 'Bronco', descripcion: 'Equipo especializado en voleibol.', presidente_asignado: 'N', eliminado: 'N' },
      { nombre: 'Salamanca', descripcion: 'Equipo femenino competitivo.', presidente_asignado: 'N', eliminado: 'N' },
      { nombre: 'Santana', descripcion: 'Equipo con enfoque recreativo.', presidente_asignado: 'N', eliminado: 'N' },
      { nombre: 'Estrellas', descripcion: 'Equipo con grandes promesas.', presidente_asignado: 'N', eliminado: 'N' },
      { nombre: 'Toros', descripcion: 'Equipo con fuerte espíritu deportivo.', presidente_asignado: 'N', eliminado: 'N' },
      { nombre: 'Club Los Dragones', descripcion: 'Equipo juvenil y dinámico.', presidente_asignado: 'N', eliminado: 'N' },
      { nombre: 'Sirenas', descripcion: 'Equipo femenino con pasión por el deporte.', presidente_asignado: 'N', eliminado: 'N' },
      { nombre: 'Club Los Guerreros', descripcion: 'Equipo con enfoque estratégico.', presidente_asignado: 'N', eliminado: 'N' },
      { nombre: 'Club Las Amazonas', descripcion: 'Equipo mixto con fuerte unión.', presidente_asignado: 'N', eliminado: 'N' },
    ];

    const idPresidente = await PersonaRol.findOne({
      where: { rol_id: 1 },
      attributes: ['persona_id'],
      raw: true,
    });

    console.log('Insertando clubes y sus imágenes...');
    for (let i = 0; i < clubs.length; i++) {
      // Insertar el club en la tabla Club
      const newClub = await Club.create(
        {
          ...clubs[i],
          fecha_registro: sequelize.fn('GETDATE'),
          fecha_actualizacion: sequelize.fn('GETDATE'),
          user_id: idPresidente.persona_id
        },
        { transaction }
      );

      console.log(`Club ${newClub.nombre}  insertados correctamente.`);
    }

    console.log('Confirmando la transacción...');
    await transaction.commit();
    console.log('Seed de clubes completado exitosamente con imágenes asociadas.');
  } catch (error) {
    console.error('Error durante el seed de clubes:', error);
    if (transaction) {
      console.log('Deshaciendo la transacción...');
      await transaction.rollback();
    }
  } finally {
    console.log('Cerrando la conexión a la base de datos...');
    await sequelize.close();
  }
};

seedClubs();
