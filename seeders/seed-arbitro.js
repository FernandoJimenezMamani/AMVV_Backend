const bcrypt = require('bcrypt');
const { sequelize } = require('../models');
const { Persona, Usuario, PersonaRol, Arbitro } = require('../models');
const rolesMapping = require('../constants/roles');

const seedArbitros = async () => {
  try {
    console.log('⏳ Iniciando la transacción para insertar árbitros...');
    const transaction = await sequelize.transaction();

    const hashedPassword = await bcrypt.hash('12345', 10);

    // Lista de árbitros de ejemplo
    const arbitros = [
      { nombre: 'Carlos', apellido: 'Lopez', ci: '1000001', genero: 'V' },
      { nombre: 'Maria', apellido: 'Fernandez', ci: '1000002', genero: 'D' },
      { nombre: 'Jose', apellido: 'Martinez', ci: '1000003', genero: 'V' },
      { nombre: 'Ana', apellido: 'Gomez', ci: '1000004', genero: 'D' },
      { nombre: 'Pedro', apellido: 'Ramirez', ci: '1000005', genero: 'V' },
      { nombre: 'Laura', apellido: 'Diaz', ci: '1000006', genero: 'D' },
      { nombre: 'Luis', apellido: 'Sanchez', ci: '1000007', genero: 'V' },
      { nombre: 'Elena', apellido: 'Torres', ci: '1000008', genero: 'D' },
      { nombre: 'Fernando', apellido: 'Ruiz', ci: '1000009', genero: 'V' },
      { nombre: 'Andrea', apellido: 'Perez', ci: '1000010', genero: 'D' },
      { nombre: 'Sergio', apellido: 'Hernandez', ci: '1000011', genero: 'V' },
      { nombre: 'Carolina', apellido: 'Mendoza', ci: '1000012', genero: 'D' },
      { nombre: 'Javier', apellido: 'Gutierrez', ci: '1000013', genero: 'V' },
      { nombre: 'Valeria', apellido: 'Castro', ci: '1000014', genero: 'D' },
      { nombre: 'Raul', apellido: 'Ortega', ci: '1000015', genero: 'V' }
    ];

    for (const arbitro of arbitros) {
      console.log(`📌 Insertando árbitro: ${arbitro.nombre} ${arbitro.apellido}`);

      // 1️⃣ Insertar en la tabla `Persona`
      const persona = await Persona.create({
        nombre: arbitro.nombre,
        apellido: arbitro.apellido,
        fecha_nacimiento: '1990-01-01', // Fecha de nacimiento por defecto
        ci: arbitro.ci,
        genero: arbitro.genero,
        direccion: 'Sin dirección',
        fecha_registro: sequelize.fn('GETDATE'),
        fecha_actualizacion: sequelize.fn('GETDATE'),
        eliminado: 'N',
      }, { transaction });

      console.log(`✅ Persona insertada con ID: ${persona.id}`);

      // 2️⃣ Insertar en la tabla `Usuario`
      await Usuario.create({
        id: persona.id,
        contraseña: hashedPassword,
        correo: `${arbitro.nombre.toLowerCase()}.${arbitro.apellido.toLowerCase()}@gmail.com`,
      }, { transaction });

      console.log(`✅ Usuario creado para: ${arbitro.nombre.toLowerCase()}.${arbitro.apellido.toLowerCase()}@gmail.com`);

      // 3️⃣ Insertar en la tabla `PersonaRol` (Rol de árbitro)
      await PersonaRol.create({
        persona_id: persona.id,
        rol_id: 6, // Suponiendo que el ID del rol de árbitro es 3
        eliminado: 0
      }, { transaction });

      console.log(`✅ Rol de árbitro asignado a ${arbitro.nombre} ${arbitro.apellido}`);

      // 4️⃣ Insertar en la tabla `Arbitro`
      await Arbitro.create({
        id: persona.id,
        activo: 1, // Marcado como activo
      }, { transaction });

      console.log(`✅ Arbitro registrado en la tabla Arbitro con ID: ${persona.id}`);
    }

    // Confirmar la transacción
    await transaction.commit();
    console.log('✅ Todos los árbitros fueron insertados exitosamente.');

  } catch (error) {
    console.error('🚨 Error al insertar los árbitros:', error);
    if (transaction) {
      await transaction.rollback();
      console.log('⏪ Transacción revertida.');
    }
  } finally {
    await sequelize.close();
  }
};

seedArbitros();
