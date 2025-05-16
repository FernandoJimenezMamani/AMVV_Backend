const { Club, ImagenClub, Sequelize,Jugador } = require('../models');
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
        LEFT JOIN ImagenClub ON Club.id = ImagenClub.club_id
        LEFT JOIN Equipo ON Club.id = Equipo.club_id

        -- Obtenemos la última participación del equipo (campeonato más reciente)
        LEFT JOIN (
          SELECT ec1.*
          FROM EquipoCampeonato ec1
          INNER JOIN (
            SELECT equipoId, MAX(campeonatoId) AS ultimo_campeonato
            FROM EquipoCampeonato
            GROUP BY equipoId
          ) ec2 ON ec1.equipoId = ec2.equipoId AND ec1.campeonatoId = ec2.ultimo_campeonato
        ) AS UltimoEquipoCampeonato ON UltimoEquipoCampeonato.equipoId = Equipo.id

        LEFT JOIN Categoria ON UltimoEquipoCampeonato.categoria_id = Categoria.id
        LEFT JOIN PresidenteClub ON Club.id = PresidenteClub.club_id AND PresidenteClub.activo = 1 AND PresidenteClub.delegado = 'N'
        LEFT JOIN Persona ON PresidenteClub.presidente_id = Persona.id AND Persona.eliminado = 'N' 
        LEFT JOIN ImagenPersona ON ImagenPersona.persona_id = Persona.id

        WHERE
        Club.id = :id AND Club.eliminado = 'N'

    `, {
      replacements: { id }, 
      type: sequelize.QueryTypes.SELECT 
    });

    return clubTeams;
  } catch (error) {
    console.error('Error al obtener los equipos:', error);
    throw new Error('Error al obtener los equipos');
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

exports.activateClub = async (id, user_id) => {
  const deleted = await Club.update(
    { eliminado: 'N', fecha_actualizacion: Sequelize.fn('GETDATE'), user_id },
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

exports.getClubesAvailableForJugador = async (jugador_id) => {
  try {

    const jugadorCompleto = await Jugador.findOne({ where: { jugador_id: jugador_id , activo : 1} });
    console.log('📥 Jugador recibido:', jugador_id);
console.log('📤 Resultado de búsqueda:', jugadorCompleto);

    const idJugador = jugadorCompleto.id;
    console.log('ID del jugador:', idJugador);
    const clubes = await sequelize.query(
      `SELECT DISTINCT
        c.id AS club_id,
        c.nombre AS nombre_club,
        c.descripcion AS descripcion_club,
        pp.id AS presidente_id,
        pp.nombre AS presidente_nombre,
        pp.apellido AS presidente_apellido,
        ic.club_imagen AS imagen_club,
        pc.id AS presidente_club_id
    FROM 
        Club c
    LEFT JOIN ImagenClub ic ON ic.club_id = c.id
    LEFT JOIN PresidenteClub pc ON pc.club_id = c.id AND pc.delegado = 'N' AND pc.activo = 1
    JOIN Persona pp ON pp.id = pc.presidente_id
    LEFT JOIN Jugador j ON j.club_id = c.id AND j.jugador_id = :jugador_id AND j.activo = 1
    WHERE 
        j.id IS NULL
        AND NOT EXISTS (
            SELECT 1 FROM Traspaso t
            WHERE t.jugador_id = :jugador_id
            AND t.club_destino_id = c.id
            AND t.eliminado = 'N'
            AND (
                (t.estado_club_receptor = 'PENDIENTE' AND t.estado_club_origen = 'PENDIENTE')
                OR (t.estado_club_receptor = 'APROBADO' AND t.estado_club_origen = 'APROBADO')
            )
        );
    `,
      {
        replacements: { jugador_id },
        type: sequelize.QueryTypes.SELECT
      }
    );

    return clubes;
  } catch (error) {
    console.error('Error al obtener los clubes disponibles para el jugador:', error);
    throw new Error('Error al obtener los clubes disponibles para el jugador');
  }
};

exports.getClubesPendingConfirmation = async (jugador_id ,campeonatoId) => {
  try {
    const jugadores = await sequelize.query(
      `SELECT DISTINCT
          cd.id AS club_id,
          cd.nombre AS nombre_club,
          cd.descripcion AS descripcion_club,
          pp.nombre AS presidente_nombre,
          pp.apellido AS presidente_apellido,
          ic.club_imagen AS imagen_club,
        t.estado_club_origen AS estado_club_origen,
        t.estado_club_receptor AS estado_club_receptor,
        t.estado_jugador AS estado_jugador,
        t.estado_deuda AS estado_deuda,
        CONVERT(VARCHAR(10), t.fecha_solicitud, 120) AS fecha_solicitud,
        t.id AS traspaso_id
        FROM Traspaso t
        LEFT JOIN Club cd ON t.club_destino_id = cd.id
        LEFT JOIN ImagenClub ic ON ic.club_id = cd.id

        LEFT JOIN PresidenteClub pcd ON pcd.id = t.presidente_club_id_destino
        LEFT JOIN Persona pp ON pp.id = pcd.presidente_id

        LEFT JOIN Campeonato c ON c.id = t.campeonato_id

        WHERE 
          t.jugador_id = :jugador_id
          AND t.campeonato_id = :campeonatoId
          AND t.eliminado = 'N'
          AND t.tipo_solicitud = 'Jugador'
      `,
      {
        replacements:{jugador_id,campeonatoId},
        type: sequelize.QueryTypes.SELECT
      }
    );

    return jugadores;
  } catch (error) {
    console.error('Error al obtener los jugadores con sus clubes:', error);
    throw new Error('Error al obtener los jugadores con sus clubes');
  }
};

// clubService.js
// clubService.js o delegadoService.js
exports.getDelegadosDelClub = async (clubId) => {
  try {
    const delegados = await sequelize.query(`
      SELECT presidente_id AS persona_id
      FROM PresidenteClub
      WHERE club_id = :clubId
        AND activo = 1
        AND delegado = 'S'
    `, {
      replacements: { clubId },
      type: sequelize.QueryTypes.SELECT
    });

    return delegados.map(d => d.persona_id); // Solo los IDs
  } catch (error) {
    console.error('Error al obtener delegados del club:', error);
    throw new Error('No se pudieron obtener los delegados');
  }
};

