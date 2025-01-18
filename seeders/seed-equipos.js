const { sequelize } = require('../models');
const { Equipo, Club, Categoria ,PersonaRol} = require('../models');

const seedEquipos = async () => {
  let transaction;
  try {
    console.log('Iniciando la transacción...');
    transaction = await sequelize.transaction();

    // Obtener el ID de la categoría "Maxis Varones"
    console.log('Buscando la categoría "Maxis Varones"...');
    const maxisVarones = await Categoria.findOne({
      where: { nombre: 'Maxis', genero: 'V' },
      attributes: ['id'],
      raw: true,
    });

    if (!maxisVarones) {
      throw new Error('No se encontró la categoría "Maxis Varones".');
    }

    console.log(`ID de "Maxis Varones": ${maxisVarones.id}`);

    // Obtener el ID de la categoría "Maxis Damas"
    console.log('Buscando la categoría "Maxis Damas"...');
    const maxisDamas = await Categoria.findOne({
      where: { nombre: 'Maxis', genero: 'D' },
      attributes: ['id'],
      raw: true,
    });

    if (!maxisDamas) {
      throw new Error('No se encontró la categoría "Maxis Damas".');
    }

    console.log(`ID de "Maxis Damas": ${maxisDamas.id}`);

    // Obtener los IDs de los clubes
    console.log('Obteniendo IDs de los clubes...');
    const clubes = await Club.findAll({ attributes: ['id'], raw: true });
    const clubIds = clubes.map((club) => club.id);

    if (clubIds.length === 0) {
      throw new Error('No se encontraron clubes en la base de datos.');
    }

    console.log('IDs de clubes obtenidos:', clubIds);

    // Crear 10 equipos para "Maxis Varones"
    console.log('Creando equipos para "Maxis Varones"...');
    const nombresVarones = [
      'Halcones', 'Leones', 'Águilas', 'Tigres', 'Panteras',
      'Delfines', 'Estrellas', 'Toros', 'Dragones', 'Sirenas'
    ];

    const idPresidente = await PersonaRol.findOne({
      where: { rol_id: 1 },
      attributes: ['persona_id'],
      raw: true,
    });

    for (const nombre of nombresVarones) {
      const randomClubId = clubIds[Math.floor(Math.random() * clubIds.length)];
      await Equipo.create(
        {
          nombre,
          club_id: randomClubId,
          categoria_id: maxisVarones.id,
          fecha_registro: sequelize.fn('GETDATE'),
          fecha_actualizacion: sequelize.fn('GETDATE'),
          eliminado: 'N',
          user_id: idPresidente.persona_id
        },
        { transaction }
      );
      console.log(`Equipo "${nombre}" insertado en "Maxis Varones" con club_id ${randomClubId}.`);
    }

    // Crear 10 equipos para "Maxis Damas"
    console.log('Creando equipos para "Maxis Damas"...');
    const nombresDamas = [
      'Amazónicas', 'Lideresas', 'Guerreras', 'Reinas', 'Fénix',
      'Valquirias', 'Sirenas', 'Auroras', 'Diamantes', 'Orquídeas'
    ];

    for (const nombre of nombresDamas) {
      const randomClubId = clubIds[Math.floor(Math.random() * clubIds.length)];
      await Equipo.create(
        {
          nombre,
          club_id: randomClubId,
          categoria_id: maxisDamas.id,
          fecha_registro: sequelize.fn('GETDATE'),
          fecha_actualizacion: sequelize.fn('GETDATE'),
          eliminado: 'N',
          user_id: idPresidente.persona_id
        },
        { transaction }
      );
      console.log(`Equipo "${nombre}" insertado en "Maxis Damas" con club_id ${randomClubId}.`);
    }

    console.log('Confirmando la transacción...');
    await transaction.commit();
    console.log('Seed de equipos completado exitosamente.');
  } catch (error) {
    console.error('Error durante el seed de equipos:', error);
    if (transaction) {
      console.log('Deshaciendo la transacción...');
      await transaction.rollback();
    }
  } finally {
    console.log('Cerrando la conexión a la base de datos...');
    await sequelize.close();
  }
};

seedEquipos();
