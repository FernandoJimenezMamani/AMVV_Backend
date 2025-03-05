const { sequelize } = require('../models');
const { Op } = require('sequelize');
const { Equipo, Club, Categoria, PersonaRol } = require('../models');

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

const obtenerNombreUnico = async (baseNombre, categoriaId, transaction) => {
  console.log(`🔍 Buscando nombres para la categoría ${categoriaId}...`);

  const query = `SELECT nombre FROM Equipo WHERE categoria_id = ?;`;
  try {
    console.log(`🟢 Ejecutando consulta para obtener nombres existentes en la categoría ${categoriaId}`);
    const nombresExistentes = await sequelize.query(query, {
      type: sequelize.QueryTypes.SELECT,
      replacements: [categoriaId],
      transaction,
    });

    console.log(`📊 Nombres obtenidos en la categoría ${categoriaId}: ${JSON.stringify(nombresExistentes)}`);

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
    console.error(`🚨 Error al buscar nombres en la categoría ${categoriaId}:`, error);
    throw error;
  }
};

const seedEquipos = async () => {
  let transaction;
  try {
    transaction = await sequelize.transaction();
    console.log("🚀 Iniciando transacción");

    const categorias = await Categoria.findAll({
      where: { [Op.or]: categoriasARegistrar },
      attributes: ['id', 'nombre', 'genero', 'division'],
      raw: true
    });
    console.log(`📂 Categorías obtenidas: ${JSON.stringify(categorias)}`);

    if (!categorias.length) throw new Error('No se encontraron las categorías especificadas.');

    const clubes = await Club.findAll({ attributes: ['id'], raw: true });
    const clubIds = clubes.map(club => club.id);
    console.log(`🏢 Clubes obtenidos: ${JSON.stringify(clubIds)}`);

    if (!clubIds.length) throw new Error('No se encontraron clubes en la base de datos.');

    const idPresidente = await PersonaRol.findOne({ where: { rol_id: 1 }, attributes: ['persona_id'], raw: true });
    console.log(`👤 ID del presidente obtenido: ${JSON.stringify(idPresidente)}`);

    if (!idPresidente) throw new Error('No se encontró un usuario con rol de Presidente.');

    let clubIndex = 0;
    for (const categoria of categorias) {
      console.log(`📌 Procesando categoría: ${categoria.nombre}`);
      const equiposExistentes = await Equipo.findAll({
        where: { categoria_id: categoria.id },
        attributes: ['nombre'],
        raw: true,
        transaction
      });

      console.log(`📊 Equipos existentes en ${categoria.nombre}: ${JSON.stringify(equiposExistentes)}`);
      if (equiposExistentes.length >= 5) continue;

      const equiposFaltantes = 5 - equiposExistentes.length;
      console.log(`⚠️ Se necesitan ${equiposFaltantes} equipos en ${categoria.nombre}`);
      const nombresDisponibles = categoria.genero === 'V' ? nombresVarones : nombresDamas;

      for (let i = 0; i < equiposFaltantes; i++) {
        const clubId = clubIds[clubIndex % clubIds.length];
        clubIndex++;

        const nombreBase = nombresDisponibles[i % nombresDisponibles.length];
        console.log(`🆕 Generando equipo con base: ${nombreBase} en categoría ${categoria.nombre}`);
        const nombreEquipo = await obtenerNombreUnico(nombreBase, categoria.id, transaction);

        console.log(`✍ Insertando equipo: ${nombreEquipo} en la categoría ${categoria.nombre}`);
        await Equipo.create(
          {
            nombre: nombreEquipo,
            club_id: clubId,
            categoria_id: categoria.id,
            fecha_registro: sequelize.fn('GETDATE'),
            fecha_actualizacion: sequelize.fn('GETDATE'),
            eliminado: 'N',
            user_id: idPresidente.persona_id
          },
          { transaction }
        );
      }
    }

    console.log("✅ Confirmando la transacción...");
    await transaction.commit();
  } catch (error) {
    console.error('❌ Error en el seed:', error);
    if (transaction) {
      console.log("⚠️ Haciendo rollback de la transacción...");
      await transaction.rollback();
    }
  } finally {
    console.log("🔄 Cerrando la conexión a la base de datos...");
    await sequelize.close();
  }
};

seedEquipos();
