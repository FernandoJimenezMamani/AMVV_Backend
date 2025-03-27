const { sequelize } = require('../models');
const { Op } = require('sequelize');
const { Equipo, Club, Categoria, PersonaRol, Campeonato, EquipoCampeonato } = require('../models');
const campeonatoEquipoEstados = require('../constants/campeonatoEquipoEstado');
const campeonatoEstados = require('../constants/campeonatoEstados');

const categoriasARegistrar = [
  { nombre: '1ras de Honor', genero: 'V', division: 'MY' },
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
  { nombre: 'Mini', genero: 'V', division: 'MN' }
];

const nombresVarones = [
  'Halcones', 'Leones', 'Águilas', 'Tigres', 'Panteras',
  'Delfines', 'Estrellas', 'Toros', 'Dragones', 'Cóndores',
  'Leopardos', 'Pumas', 'Búfalos', 'Samuráis', 'Raptors',
  'Titans', 'Guerreros', 'Vikingos', 'Lobos', 'Fénix'
];

const nombresDamas = [
  'Amazónicas', 'Lideresas', 'Guerreras', 'Reinas', 'Fénix',
  'Valquirias', 'Sirenas', 'Auroras', 'Diamantes', 'Orquídeas',
  'Perlas', 'Esmeraldas', 'Panteras Rosas', 'Mariposas', 'Violetas',
  'Estrellas Doradas', 'Brillantes', 'Diosas', 'Ángeles', 'Gladiadoras'
];

const obtenerNombreUnico = async (baseNombre, transaction) => {
  console.log(`🔍 Buscando nombres de equipo existentes con base: ${baseNombre}`);

  const query = `SELECT nombre FROM Equipo WHERE eliminado = 'N';`;

  try {
    const nombresExistentes = await sequelize.query(query, {
      type: sequelize.QueryTypes.SELECT,
      transaction,
    });

    const nombresUsados = new Set(nombresExistentes.map(e => e.nombre));
    let nombreFinal = baseNombre;
    let contador = 1;

    while (nombresUsados.has(nombreFinal)) {
      nombreFinal = `${baseNombre} ${contador}`;
      contador++;
    }

    console.log(`✅ Nombre único generado: ${nombreFinal}`);
    return nombreFinal;
  } catch (error) {
    console.error(`🚨 Error al verificar nombres existentes:`, error);
    throw error;
  }
};

const seedEquipos = async () => {
  let transaction;
  try {
    transaction = await sequelize.transaction();
    console.log("🚀 Iniciando transacción");

    const campeonatoActivo = await Campeonato.findOne({
      where: { estado: campeonatoEstados.transaccionProceso },
      transaction
    });

    if (!campeonatoActivo) {
      throw new Error('❌ No se encontró un campeonato en preparación (estado = 2).');
    }

    const categorias = await Categoria.findAll({
      where: { [Op.or]: categoriasARegistrar },
      attributes: ['id', 'nombre', 'genero', 'division'],
      raw: true,
      transaction
    });

    if (!categorias.length) throw new Error('No se encontraron las categorías especificadas.');

    const clubes = await Club.findAll({ attributes: ['id'], raw: true, transaction });
    const clubIds = clubes.map(club => club.id);
    if (!clubIds.length) throw new Error('No se encontraron clubes en la base de datos.');

    const idPresidente = await PersonaRol.findOne({
      where: { rol_id: 1 },
      attributes: ['persona_id'],
      raw: true,
      transaction
    });
    if (!idPresidente) throw new Error('No se encontró un usuario con rol de Presidente.');

    let clubIndex = 0;

    for (const categoria of categorias) {
      // Buscar equipos ya registrados en esta categoría para este campeonato
      const registrados = await EquipoCampeonato.findAll({
        where: {
          campeonatoId: campeonatoActivo.id,
          categoria_id: categoria.id
        },
        attributes: ['equipoId'],
        raw: true,
        transaction
      });
      

      const nombresRegistrados = registrados.map(r => r.equipo?.nombre).filter(Boolean);
      if (nombresRegistrados.length >= 5) continue;

      const equiposFaltantes = 5 - nombresRegistrados.length;
      const nombresDisponibles = categoria.genero === 'V' ? nombresVarones : nombresDamas;

      for (let i = 0; i < equiposFaltantes; i++) {
        const clubId = clubIds[clubIndex % clubIds.length];
        clubIndex++;

        const nombreBase = nombresDisponibles[i % nombresDisponibles.length];
        const nombreEquipo = await obtenerNombreUnico(nombreBase, transaction);

        // Crear el equipo (sin categoría)
        const nuevoEquipo = await Equipo.create({
          nombre: nombreEquipo,
          club_id: clubId,
          fecha_registro: sequelize.fn('GETDATE'),
          fecha_actualizacion: sequelize.fn('GETDATE'),
          eliminado: 'N',
          user_id: idPresidente.persona_id
        }, { transaction });

        // Asociar equipo al campeonato con categoría
        await EquipoCampeonato.create({
          equipoId: nuevoEquipo.id,
          campeonatoId: campeonatoActivo.id,
          categoria_id: categoria.id,
          estado: campeonatoEquipoEstados.DeudaInscripcion
        }, { transaction });
      }
    }

    await transaction.commit();
    console.log("✅ Seed completado con éxito.");
  } catch (error) {
    console.error("❌ Error en el seed:", error);
    if (transaction) {
      await transaction.rollback();
      console.log("⚠️ Rollback ejecutado.");
    }
  } finally {
    await sequelize.close();
    console.log("🔒 Conexión cerrada.");
  }
};


seedEquipos();
