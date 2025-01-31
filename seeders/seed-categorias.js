const { sequelize } = require('../models');
const { Categoria , PersonaRol } = require('../models');

const seedCategorias = async () => {
  let transaction;
  try {
    console.log('Iniciando la transacción...');
    transaction = await sequelize.transaction();

    const presidenteAsociacion = await PersonaRol.findOne({
      where: { rol_id: 1 },
      attributes: ['persona_id'],
    });

    // Datos de las categorías
    const categorias = [
      { nombre: '1ras Honor', genero: 'V', division: 'MY' },
      { nombre: '3ras Ascenso', genero: 'D', division: 'MY' },
      { nombre: '1ras de Honor', genero: 'D', division: 'MY' },
      { nombre: 'Maxis', genero: 'V', division: 'MY' },
      { nombre: 'Maxis', genero: 'D', division: 'MY' },
      { nombre: 'Juveniles', genero: 'V', division: 'MN' },
      { nombre: 'Juveniles', genero: 'D', division: 'MN' },
      { nombre: 'Cadetes', genero: 'V', division: 'MN' },
      { nombre: 'Cadetes', genero: 'D', division: 'MN' },
      { nombre: 'Infantil', genero: 'V', division: 'MN' },
      { nombre: 'Infantil', genero: 'D', division: 'MN' },
      { nombre: '3ras Ascenso', genero: 'V', division: 'MY' },
      { nombre: '1ras Ascenso', genero: 'D', division: 'MY' },
      { nombre: '1ras Ascenso', genero: 'V', division: 'MY' },
      { nombre: '2das Ascenso', genero: 'D', division: 'MY' },
      { nombre: '2das Ascenso', genero: 'V', division: 'MY' },
      { nombre: 'Senior', genero: 'D', division: 'MY' },
      { nombre: 'Senior', genero: 'V', division: 'MY' },
      { nombre: 'Mini', genero: 'D', division: 'MN' },
      { nombre: 'Mini', genero: 'V', division: 'MN' },
    ];

    console.log('Insertando categorías en la tabla Categoria...');
    for (const categoria of categorias) {
      await Categoria.create(
        {
          ...categoria,
          edad_minima: null, // Puede ser nulo
          edad_maxima: null, // Puede ser nulo
          costo_traspaso: 0.00, // Puede ser nulo
          fecha_registro: sequelize.fn('GETDATE'),
          fecha_actualizacion: sequelize.fn('GETDATE'),
          eliminado: 'N',
          user_id:presidenteAsociacion
        },
        { transaction }
      );
      console.log(`Categoría "${categoria.nombre}" insertada.`);
    }

    console.log('Confirmando la transacción...');
    await transaction.commit();
    console.log('Seed de categorías completado exitosamente.');
  } catch (error) {
    console.error('Error durante el seed de categorías:', error);
    if (transaction) {
      console.log('Deshaciendo la transacción...');
      await transaction.rollback();
    }
  } finally {
    console.log('Cerrando la conexión a la base de datos...');
    await sequelize.close();
  }
};

seedCategorias();
