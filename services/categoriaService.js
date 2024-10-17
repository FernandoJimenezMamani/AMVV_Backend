const { Categoria,Sequelize} = require('../models');

exports.getCategorias = async () => {
  const categorias = await Categoria.findAll({
    where: { eliminado: 'N' },
    attributes: ['id', 'nombre', 'genero', 'division', 'fecha_registro', 'fecha_actualizacion', 'eliminado', 'user_id'],
  });
  return categorias;
};

exports.getCategoriaByDivision = async (division) => {
  const categorias = await Categoria.findAll({
    where: { division, eliminado: 'N' },
    attributes: ['id', 'nombre', 'fecha_registro', 'fecha_actualizacion', 'eliminado', 'user_id'],
  });
  return categorias;
};

exports.getCategoriaById = async (id) => {
  try {
    const categoria = await Categoria.findOne({
      where: { id:id, eliminado: 'N' },
      attributes: ['id', 'nombre', 'fecha_registro', 'fecha_actualizacion', 'eliminado', 'user_id'],
    });
    return categoria;
  } catch (error) {
    console.error('Error fetching categoria:', error);
  }
};


exports.createCategoria = async (nombre, genero, division, user_id) => {
  let transaction;

  try {
    // Verificar si ya existe una categoría con el mismo nombre y género
    const existingCategoria = await Categoria.findOne({
      where: {
        nombre,
        genero
      }
    });

    if (existingCategoria) {
      throw new Error('Ya existe una categoría con el mismo nombre y género');
    }

    // Iniciar una transacción
    transaction = await sequelize.transaction();

    // Crear la nueva categoría
    const nuevaCategoria = await Categoria.create({
      nombre,
      genero, // Guardar V, D, M para Varones, Damas, Mixto
      division, // Guardar MY, MN para Mayores, Menores
      fecha_registro: Sequelize.fn('GETDATE'),
      fecha_actualizacion: Sequelize.fn('GETDATE'),
      eliminado: 'N',
      user_id,
    }, { transaction });

    // Confirmar la transacción
    await transaction.commit();

    return nuevaCategoria;

  } catch (error) {
    console.error("Error al crear la categoría:", error);

    // Si algo sale mal, revertir la transacción
    if (transaction) await transaction.rollback();

    // Propagar el error para que el controlador lo maneje
    throw error;
  }
};

exports.updateCategoria = async (id, nombre, user_id) => {
  const updatedCategoria = await Categoria.update(
    {
      nombre,
      genero,
      fecha_actualizacion: Sequelize.fn('GETDATE'),
      user_id,
    },
    {
      where: { id },
    }
  );
  return updatedCategoria;
};

exports.deleteCategoria = async (id, user_id) => {
  const deletedCategoria = await Categoria.update(
    {
      eliminado: 'S',
      fecha_actualizacion: Sequelize.fn('GETDATE'),
      user_id,
    },
    {
      where: { id },
    }
  );
  return deletedCategoria;
};
