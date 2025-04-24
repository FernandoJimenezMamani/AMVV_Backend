const { Equipo, Club, Categoria, ImagenClub, Sequelize,Campeonato,EquipoCampeonato } = require('../models');
const sequelize = require('../config/sequelize');
const campeonatoEquipoEstados = require('../constants/campeonatoEquipoEstado');
const campeonatoEstados = require('../constants/campeonatoEstados');

exports.getEquiposByCategoriaId = async (categoria_id, campeonato_id) => {
  try {
    const equipos = await sequelize.query(`
     SELECT 
      Equipo.id, 
      Equipo.nombre, 
      Club.nombre AS club_nombre, 
      Categoria.nombre AS categoria_nombre, 
      ImagenClub.club_imagen
    FROM 
      Equipo
    INNER JOIN Club ON Equipo.club_id = Club.id
    LEFT JOIN ImagenClub ON Club.id = ImagenClub.club_id
    INNER JOIN EquipoCampeonato EQ ON EQ.equipoId = Equipo.id 
    INNER JOIN Categoria ON EQ.categoria_id = Categoria.id
    WHERE 
      Equipo.eliminado = 'N' 
      AND EQ.categoria_id = :categoria_id
      AND EQ.campeonatoId = :campeonato_id 
      AND EQ.estado = 'Inscrito'
    `, {
      replacements: { categoria_id, campeonato_id },
      type: sequelize.QueryTypes.SELECT
    });

    return equipos;
  } catch (error) {
    console.error('Error al obtener los equipos:', error);
    throw new Error('Error al obtener los equipos');
  }
};

exports.getEquipoById = async (id) => {
  const query = `
    SELECT 
      e.id AS equipo_id,
      e.nombre AS equipo_nombre,
      e.club_id,
      cl.nombre AS club_nombre,
      ic.club_imagen,
      cat.id AS categoria_id,
      cat.nombre AS categoria_nombre,
      cat.genero,
      cat.division,
      cat.es_ascenso
    FROM 
      Equipo e
    JOIN 
      Club cl ON e.club_id = cl.id
    LEFT JOIN 
      ImagenClub ic ON ic.club_id = cl.id
    LEFT JOIN (
      SELECT ec1.*
      FROM EquipoCampeonato ec1
      INNER JOIN (
        SELECT equipoId, MAX(campeonatoId) AS ultimo_campeonato
        FROM EquipoCampeonato
        GROUP BY equipoId
      ) ec2 ON ec1.equipoId = ec2.equipoId AND ec1.campeonatoId = ec2.ultimo_campeonato
    ) AS ult_ec ON ult_ec.equipoId = e.id
    LEFT JOIN 
      Categoria cat ON cat.id = ult_ec.categoria_id
    WHERE 
      e.id = :id AND e.eliminado = 'N';
  `;

  const [results] = await sequelize.query(query, {
    replacements: { id },
    type: sequelize.QueryTypes.SELECT
  });

  return results || null;
};

exports.createEquipo = async ({ nombre, club_id, categoria_id, user_id }) => {
  // Verificar si ya existe un equipo con el mismo nombre en la misma categoría
  const campeonatoActivo = await Campeonato.findOne({
    where: { estado: campeonatoEstados.transaccionProceso }
  });

   if (!campeonatoActivo) {
      throw new Error("No hay un campeonato activo para registrar el equipo.");
    }

   const existingEquipo = await EquipoCampeonato.findOne({
     where: {
       campeonatoId: campeonatoActivo.id
     },
     include: [
       {
         model: Equipo,
         as: 'equipo',
         where: { nombre, eliminado: 'N' }
       }
     ]
   });

  if (existingEquipo) {
    throw new Error(`Ya existe un equipo con el nombre "${nombre}" en la misma categoría.`);
  }

  const categoria = await Categoria.findByPk(categoria_id);
  if (!categoria) {
    throw new Error("La categoría especificada no existe.");
  }

  if (categoria.cant_equipos_max !== null) {
    const cantidadActual = await EquipoCampeonato.count({
      where: {
        campeonatoId: campeonatoActivo.id,
        categoria_id
      }
    });

    if (cantidadActual >= categoria.cant_equipos_max) {
      throw new Error(`La categoría "${categoria.nombre}" ya alcanzó el máximo de ${categoria.cant_equipos_max} equipos permitidos.`);
    }
  }
  // Crear el equipo
  const nuevoEquipo = await Equipo.create({
    nombre,
    club_id,
    fecha_registro: Sequelize.fn('GETDATE'),
    fecha_actualizacion: Sequelize.fn('GETDATE'),
    eliminado: 'N',
    user_id
  });


  // Si hay un campeonato activo, registrar el equipo en EquipoCampeonato
  if (campeonatoActivo) {
    await EquipoCampeonato.create({
      equipoId: nuevoEquipo.id,
      campeonatoId: campeonatoActivo.id,
      estado: campeonatoEquipoEstados.DeudaInscripcion,
      categoria_id,
    });
  }

  return nuevoEquipo;
};


exports.updateEquipo = async (id, data) => {
  const { nombre, club_id, categoria_id, user_id } = data;

  // 1. Verificar que el equipo existe
  const equipo = await Equipo.findOne({ where: { id, eliminado: 'N' } });
  if (!equipo) throw new Error('Equipo no encontrado');

  // 2. Obtener el campeonato activo
  const campeonatoActivo = await Campeonato.findOne({
    where: { estado: campeonatoEstados.transaccionProceso }
  });

  if (!campeonatoActivo) {
    throw new Error("No hay un campeonato activo para actualizar el equipo.");
  }

  // 3. Obtener registro en EquipoCampeonato
  const equipoCampeonato = await EquipoCampeonato.findOne({
    where: {
      equipoId: id,
      campeonatoId: campeonatoActivo.id
    }
  });

  if (!equipoCampeonato) {
    throw new Error("El equipo no está registrado en el campeonato actual.");
  }

  // 4. Validar nombre duplicado en esa categoría
  if (nombre && categoria_id) {
    const nombreDuplicado = await EquipoCampeonato.findOne({
      where: {
        campeonatoId: campeonatoActivo.id
      },
      include: [{
        model: Equipo,
        as: 'equipo',
        where: {
          nombre,
          eliminado: 'N',
          id: { [Sequelize.Op.ne]: id } // excluir el mismo equipo
        }
      }]
    });

    if (nombreDuplicado) {
      throw new Error(`Ya existe un equipo con el nombre "${nombre}" .`);
    }
  }

  // 5. Validar límite de equipos si cambia la categoría
  if (categoria_id && categoria_id !== equipoCampeonato.categoria_id) {
    const categoria = await Categoria.findByPk(categoria_id);
    if (!categoria) throw new Error("La categoría especificada no existe.");

    if (categoria.cant_equipos_max !== null) {
      const equiposEnCategoria = await EquipoCampeonato.count({
        where: {
          campeonatoId: campeonatoActivo.id,
          categoria_id
        }
      });

      if (equiposEnCategoria >= categoria.cant_equipos_max) {
        throw new Error(`La categoría "${categoria.nombre}" ya alcanzó el máximo de ${categoria.cant_equipos_max} equipos permitidos.`);
      }
    }

    // Actualizar categoría en EquipoCampeonato
    equipoCampeonato.categoria_id = categoria_id;
    await equipoCampeonato.save();
  }

  // 6. Actualizar datos del equipo
  await Equipo.update({
    ...(nombre && { nombre }),
    ...(club_id && { club_id }),
    fecha_actualizacion: Sequelize.fn('GETDATE'),
    user_id
  }, {
    where: { id }
  });

  return { message: "Equipo actualizado correctamente." };
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
      LEFT JOIN EquipoCampeonato ec ON ec.equipoId = e.id AND ec.campeonatoId = p.campeonato_id
      LEFT JOIN Categoria cat ON ec.categoria_id = cat.id
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

exports.get_all_equipos = async () => {
  try {
    const equipos = await Equipo.findAll({
      where: { eliminado: 'N' },
      attributes: ['id', 'nombre'], // Ajusta los campos necesarios
      raw: true, // Evita encapsulación de Sequelize
    });
    return equipos;
  } catch (error) {
    console.error("Error al obtener equipos:", error.message);
    throw new Error("Error al obtener equipos");
  }
};

exports.getCategoriaEquipoByCampeonato = async (equipoId, campeonatoId) => {
  const query = `
    SELECT 
      c.id AS categoria_id,
      c.nombre AS categoria_nombre,
      c.genero,
      c.division
    FROM 
      EquipoCampeonato ec
    JOIN 
      Categoria c ON ec.categoria_id = c.id
    WHERE 
      ec.equipoId = :equipoId 
      AND ec.campeonatoId = :campeonatoId
  `;

  const [result] = await sequelize.query(query, {
    replacements: { equipoId, campeonatoId },
    type: sequelize.QueryTypes.SELECT
  });

  return result || null;
};

