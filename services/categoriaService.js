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
  console.log("Género recibido:", genero);
  const nuevaCategoria = await Categoria.create({
    nombre,
    genero, // Guardar V, D, M para Varones, Damas, Mixto
    division, // Guardar MY, MN para Mayores, Menores
    fecha_registro: Sequelize.fn('GETDATE'),
    fecha_actualizacion: Sequelize.fn('GETDATE'),
    eliminado: 'N',
    user_id,
  });
  return nuevaCategoria;
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
