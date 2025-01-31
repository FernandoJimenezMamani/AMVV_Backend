const { Pago, PagoTraspaso, PagoInscripcion } = require('../models'); // Asegúrate de importar los modelos
const sequelize = require('../config/sequelize');
const pagoTipos = require('../constants/pagoTipos')

exports.createPago = async (data) => {
  const {
    monto,
    fecha,
    referencia,
    tipo_pago,
    traspaso_id,
    EquipoId,
    estado,
    fecha_registro,
    userId
  } = data;

  const transaction = await Pago.sequelize.transaction(); // Iniciar transacción

  try {
    // Crear el pago principal en la tabla 'Pago'
    const pago = await Pago.create({
      monto,
      fecha,
      referencia,
      estado,
      fecha_registro,
      userId
    }, { transaction });

    // Validar que solo se envíe uno de los dos valores: EquipoId o TraspasoId
    if (tipo_pago === pagoTipos.Traspaso) {
      if (!traspaso_id) {
        throw new Error('Se requiere un traspaso_id para este tipo de pago.');
      }
      await PagoTraspaso.create({
        id: pago.id, // Reutiliza el ID del pago principal
        traspaso_id
      }, { transaction });
    } else if (tipo_pago === pagoTipos.Inscripcion) {
      if (!EquipoId) {
        throw new Error('Se requiere un EquipoId para este tipo de pago.');
      }
      await PagoInscripcion.create({
        id: pago.id, // Reutiliza el ID del pago principal
        EquipoId
      }, { transaction });
    } else {
      throw new Error('Tipo de pago no válido.');
    }

    await transaction.commit(); // Confirmar la transacción si todo salió bien
    console.log('Pago creado exitosamente:', pago);
    return pago;

  } catch (error) {
    await transaction.rollback(); // Revertir la transacción en caso de error
    console.error('Error al crear el pago:', error);
    throw error;
  }
};

exports.obtenerEquiposPorCampeonato = async () => {
  try {
    const equipos = await sequelize.query(
      `SELECT 
          e.id AS equipo_id,
          e.nombre AS equipo_nombre,
          cat.nombre AS Categoria,
          cat.costo_inscripcion ,
          cat.genero,
          c.id AS campeonato_id,
          c.nombre AS campeonato_nombre,
          ec.estado AS estado_equipo,
          cl.nombre AS nombre_club,
          ic.club_imagen AS imagen_club
          FROM EquipoCampeonato ec
          JOIN Equipo e ON ec.equipoId = e.id
          JOIN Campeonato c ON ec.campeonatoId = c.id
          JOIN Club cl ON cl.id = e.club_id
          JOIN ImagenClub ic ON ic.club_id = cl.id
          JOIN Categoria cat ON cat.id = e.categoria_id
          WHERE c.estado != 3`,
      {
        type: sequelize.QueryTypes.SELECT
      }
    );

    return equipos;
  } catch (error) {
    console.error("Error al obtener equipos del campeonato:", error);
    throw error;
  }
};
