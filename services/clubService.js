const { Club, ImagenClub, Sequelize } = require('../models');
const { uploadFile } = require('../utils/subirImagen');
const { storage } = require('../config/firebase');
const { ref, deleteObject } = require('firebase/storage');
const sequelize = require('../config/sequelize');

exports.getClubs = async () => {
  const clubs = await sequelize.query(`
    SELECT
        Club.id,
        Club.nombre,
        Club.descripcion,
        Club.eliminado,
        Club.user_id,
        club.presidente_asignado,
        ImagenClub.club_imagen
      FROM
        Club
      LEFT JOIN
        ImagenClub
      ON
        Club.id = ImagenClub.club_id
      WHERE
        Club.eliminado = 'N'
  `, { type: sequelize.QueryTypes.SELECT });
  return clubs;
};

exports.getClubsWithNoPresident = async () => {
  const clubs = await sequelize.query(`
    SELECT
        Club.id,
        Club.nombre,
        Club.descripcion,
        Club.eliminado,
        Club.user_id,
		club.presidente_asignado,
        ImagenClub.club_imagen
      FROM
        Club
      LEFT JOIN
        ImagenClub
      ON
        Club.id = ImagenClub.club_id
      WHERE
        Club.eliminado = 'N' AND Club.presidente_asignado= 'N' 
  `, { type: sequelize.QueryTypes.SELECT });
  return clubs;
};

exports.getClubById = async (id) => {
  try {
    const clubById = await sequelize.query(`
       SELECT
        Club.id,
        Club.nombre,
        Club.descripcion,
        Club.presidente_asignado,
        Club.eliminado,
        Club.user_id,
        ImagenClub.club_imagen
      FROM
        Club
      LEFT JOIN
        ImagenClub
      ON
        Club.id = ImagenClub.club_id
      WHERE
        Club.id = :id AND Club.eliminado = 'N'
    `, {
      replacements: { id }, 
      type: sequelize.QueryTypes.SELECT 
    });

    return clubById;
  } catch (error) {
    console.error('Error al obtener los partidos:', error);
    throw new Error('Error al obtener los partidos');
  }
};

exports.getClubTeams = async (id) => {
  try {
    const clubTeams = await sequelize.query(`
       SELECT
        Club.id AS club_id,
        Club.nombre AS club_nombre,
        Club.descripcion AS club_descripcion,
        Club.presidente_asignado,
        Club.eliminado AS club_eliminado,
        ImagenClub.club_imagen AS club_imagen,
        Equipo.id AS equipo_id,
        Equipo.nombre AS equipo_nombre,
        Equipo.eliminado AS equipo_eliminado,
        Categoria.id AS categoria_id,
        Categoria.nombre AS categoria_nombre,
        Categoria.genero AS categoria_genero,
        Persona.id AS presidente_id,
        Persona.genero AS presidente_genero,
        CONCAT(Persona.nombre, ' ', Persona.apellido) AS presidente_nombre,
		ImagenPersona.persona_imagen
      FROM
        Club
      LEFT JOIN
        ImagenClub
      ON
        Club.id = ImagenClub.club_id
      LEFT JOIN
        Equipo
      ON
        Club.id = Equipo.club_id
      LEFT JOIN
        Categoria
      ON
        Equipo.categoria_id = Categoria.id
      LEFT JOIN
        PresidenteClub
      ON
        Club.id = PresidenteClub.club_id AND PresidenteClub.activo = 1
      LEFT JOIN
        Persona
      ON
        PresidenteClub.presidente_id = Persona.id AND Persona.eliminado = 'N' 
	  LEFT JOIN ImagenPersona 
	  ON ImagenPersona.persona_id = Persona.id
      WHERE
        Club.id = :id AND Club.eliminado = 'N'
    `, {
      replacements: { id }, 
      type: sequelize.QueryTypes.SELECT 
    });

    return clubTeams;
  } catch (error) {
    console.error('Error al obtener los partidos:', error);
    throw new Error('Error al obtener los partidos');
  }
};

exports.createClub = async (nombre, descripcion, user_id, imagen) => {
  let transaction;

  try {
    // Verificar si ya existe un club con el mismo nombre
    const existingClub = await Club.findOne({ where: { nombre } });

    if (existingClub) {
      throw new Error('El nombre del club ya existe');
    }

    // Iniciar una transacción
    transaction = await sequelize.transaction();

    // Crear el club
    const newClub = await Club.create({
      nombre,
      descripcion,
      fecha_registro: Sequelize.fn('GETDATE'),
      fecha_actualizacion: Sequelize.fn('GETDATE'),
      eliminado: 'N',
      user_id,
      presidente_asignado: 'N',
    }, { transaction });

    // Preparar el nombre del archivo basado en el nombre del club
    const fileName = `${nombre.replace(/\s+/g, '_')}_image`;

    // Subir la imagen del club y obtener la URL de descarga
    const { downloadURL } = await uploadFile(imagen, fileName, null, 'FilesClubs');

    // Crear la referencia de la imagen del club en la tabla ImagenClub
    await ImagenClub.create({
      club_id: newClub.id,
      club_imagen: downloadURL
    }, { transaction });

    // Confirmar la transacción
    await transaction.commit();

    return newClub;

  } catch (error) {
    console.error("Error durante la transacción:", error);

    // Si algo sale mal, revertir la transacción
    if (transaction) await transaction.rollback();

    // Propagar el error para que el controlador lo maneje
    throw error;
  }
};


exports.updateClub = async (id, nombre, descripcion, user_id) => {
  const club = await Club.update(
    { nombre, descripcion, fecha_actualizacion: Sequelize.fn('GETDATE'), user_id },
    { where: { id }, returning: true }
  );
  return club;
};

exports.deleteClub = async (id, user_id) => {
  const deleted = await Club.update(
    { eliminado: 'S', fecha_actualizacion: Sequelize.fn('GETDATE'), user_id },
    { where: { id } }
  );
  return deleted;
};

exports.updateClubImage = async (id, imagen) => {
  let transaction;
  try {
    transaction = await sequelize.transaction();

    const currentImage = await ImagenClub.findOne({ where: { club_id: id } });

    if (currentImage) {
      const previousImageRef = ref(storage, currentImage.club_imagen);
      await deleteObject(previousImageRef);
      const { downloadURL } = await uploadFile(imagen, null, null, 'FilesClubs');
      await currentImage.update({ club_imagen: downloadURL }, { transaction });
    } else {
      const { downloadURL } = await uploadFile(imagen, null, null, 'FilesClubs');
      await ImagenClub.create({ club_id: id, club_imagen: downloadURL }, { transaction });
    }

    await transaction.commit();
    return 'Imagen actualizada';
  } catch (error) {
    if (transaction) await transaction.rollback();
    throw error;
  }
};
