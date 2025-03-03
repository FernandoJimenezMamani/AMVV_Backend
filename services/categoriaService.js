const { Categoria, sequelize, Sequelize } = require('../models');

// Obtener todas las categorías
exports.getCategorias = async () => {
  const categorias = await Categoria.findAll({
    where: { eliminado: 'N' },
    attributes: ['id', 'nombre', 'genero', 'division', 'edad_minima', 'edad_maxima', 'costo_traspaso', 'fecha_registro', 'fecha_actualizacion', 'eliminado', 'user_id'],
  });
  return categorias;
};

// Obtener categorías por división
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
      where: { id, eliminado: 'N' },
      attributes: ['id', 'nombre', 'genero', 'division', 'edad_minima', 'edad_maxima', 'costo_traspaso', 'fecha_registro', 'fecha_actualizacion', 'eliminado', 'user_id'],
    });
    return categoria;
  } catch (error) {
    console.error('Error fetching categoria:', error);
    throw new Error('Error al obtener la categoría');
  }
};

exports.createCategoria = async (nombre, genero, division, edad_minima, edad_maxima, costo_traspaso, user_id) => {
  const transaction = await sequelize.transaction();  // Iniciar la transacción

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

    // Crear la nueva categoría
    const nuevaCategoria = await Categoria.create({
      nombre,
      genero,
      division,
      edad_minima,
      edad_maxima,
      costo_traspaso,  // Asignar el costo de traspaso
      fecha_registro: Sequelize.fn('GETDATE'),  // Cambiado a GETDATE() para SQL Server
      fecha_actualizacion: Sequelize.fn('GETDATE'),  // Cambiado a GETDATE() para SQL Server
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

// Actualizar una categoría
exports.updateCategoria = async (id, nombre, genero, division, edad_minima, edad_maxima, costo_traspaso, user_id) => {
  return await Categoria.update(
    {
      nombre,
      genero,
      division,
      edad_minima,
      edad_maxima,
      costo_traspaso,  
      fecha_actualizacion: Sequelize.fn('GETDATE'), 
      user_id,
    },
    {
      where: { id, eliminado: 'N' }
    }
  );
};

// Eliminar una categoría (soft delete)
exports.deleteCategoria = async (id, user_id) => {
  return await Categoria.update(
    {
      eliminado: 'S',
      fecha_actualizacion: Sequelize.fn('GETDATE'),  // Cambiado a GETDATE() para SQL Server
      user_id,
    },
    {
      where: { id }
    }
  );
};

exports.getNombresCategorias = async () => {
  try {
    const categorias = await Categoria.findAll({
      attributes: ["nombre"], 
      group: ["nombre"], 
      order: [["nombre", "ASC"]], 
    });

    return categorias.map((cat) => cat.nombre); 

  } catch (error) {
    console.error("Error al obtener los nombres de las categorías:", error);
    throw new Error("Error al obtener los nombres de las categorías");
  }
};
