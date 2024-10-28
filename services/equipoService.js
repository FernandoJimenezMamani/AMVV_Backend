const { Equipo, Club, Categoria, ImagenClub, Sequelize } = require('../models');
const sequelize = require('../config/sequelize');

exports.getEquiposByCategoriaId = async (categoria_id) => {
  try {
    const equipos = await sequelize.query(`
      SELECT Equipo.id, Equipo.nombre, Club.nombre AS club_nombre, Categoria.nombre AS categoria_nombre, ImagenClub.club_imagen
      FROM Equipo
      INNER JOIN Club ON Equipo.club_id = Club.id
      INNER JOIN Categoria ON Equipo.categoria_id = Categoria.id
      LEFT JOIN ImagenClub ON Club.id = ImagenClub.club_id
      WHERE Equipo.eliminado = 'N' AND Equipo.categoria_id = :categoria_id
    `, {
      replacements: { categoria_id },
      type: sequelize.QueryTypes.SELECT
    });

    return equipos;
  } catch (error) {
    console.error('Error al obtener los equipos:', error);
    throw new Error('Error al obtener los equipos');
  }
};

exports.getEquipoById = async (id) => {
  return await Equipo.findOne({
    where: { id, eliminado: 'N' },
    attributes: ['id', 'nombre', 'club_id', 'categoria_id'],
    include: [
      {
        model: Club,
        as: 'club',
        attributes: ['nombre'],
        include: [
          {
            model: ImagenClub,
            as: 'imagenClub',
            attributes: ['club_imagen'] // Agregar la imagen del club
          }
        ]
      },
      {
        model: Categoria,
        as: 'categoria',
        attributes: ['nombre', 'genero'] // Incluir también el género de la categoría
      }
    ]
  });
};


exports.createEquipo = async ({ nombre, club_id, categoria_id, user_id }) => {
  const existingEquipo = await Equipo.findOne({
    where: {
      nombre,
      categoria_id,
      eliminado: 'N'
    }
  });

  if (existingEquipo) {
    throw new Error(`Ya existe un equipo con el nombre "${nombre}" en la misma categoría.`);
  }

  return await Equipo.create({
    nombre,
    club_id,
    categoria_id,
    fecha_registro: Sequelize.fn('GETDATE'),
    fecha_actualizacion: Sequelize.fn('GETDATE'),
    eliminado: 'N',
    user_id
  });
};

exports.updateEquipo = async (id, data) => {
  const { nombre, club_id, categoria_id, user_id } = data;

  const fieldsToUpdate = {
    fecha_actualizacion: Sequelize.fn('GETDATE'),
    user_id
  };

  if (nombre) fieldsToUpdate.nombre = nombre;
  if (club_id) fieldsToUpdate.club_id = club_id;
  if (categoria_id) fieldsToUpdate.categoria_id = categoria_id;

  return await Equipo.update(fieldsToUpdate, { where: { id, eliminado: 'N' } });
};

exports.deleteEquipo = async (id, user_id) => {
  return await Equipo.update(
    { eliminado: 'S', fecha_actualizacion: Sequelize.fn('GETDATE'), user_id },
    { where: { id } }
  );
};

exports.getEquiposByPartidoId = async (partido_id) => {
  try {
    const equipos = await sequelize.query(`
      SELECT 
        e.id AS equipo_id, 
        e.nombre AS equipo_nombre, 
        c.nombre AS club_nombre, 
        cat.nombre AS categoria_nombre, 
        ic.club_imagen
      FROM Partido p
      INNER JOIN Equipo e ON e.id = p.equipo_local_id OR e.id = p.equipo_visitante_id
      INNER JOIN Club c ON e.club_id = c.id
      INNER JOIN Categoria cat ON e.categoria_id = cat.id
      LEFT JOIN ImagenClub ic ON c.id = ic.club_id
      WHERE p.id = :partido_id AND e.eliminado = 'N'
    `, {
      replacements: { partido_id },
      type: sequelize.QueryTypes.SELECT
    });

    return equipos;
  } catch (error) {
    console.error('Error al obtener los equipos por partido:', error);
    throw new Error('Error al obtener los equipos por partido');
  }
};
