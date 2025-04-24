const bcrypt = require('bcrypt');
const { sequelize } = require('../models');
const { Persona, Usuario, PersonaRol } = require('../models');

const seeDelegadosClub = async () => {
  try {
    console.log('⏳ Iniciando la transacción para insertar presidentes de club...');
    const transaction = await sequelize.transaction();

    const hashedPassword = await bcrypt.hash('12345', 10);

    // Lista de presidentes de club de ejemplo
    const presidentes = [
        { nombre: 'Juan', apellido: 'Condori', ci: '3000001', genero: 'V' },
        { nombre: 'María', apellido: 'Choque', ci: '3000002', genero: 'D' },
        { nombre: 'Luis', apellido: 'Mamani', ci: '3000003', genero: 'V' },
        { nombre: 'Rosa', apellido: 'Quispe', ci: '3000004', genero: 'D' },
        { nombre: 'Carlos', apellido: 'Calle', ci: '3000005', genero: 'V' },
        { nombre: 'Ana', apellido: 'Laura', ci: '3000006', genero: 'D' },
        { nombre: 'Hugo', apellido: 'Huanca', ci: '3000007', genero: 'V' },
        { nombre: 'Jenny', apellido: 'Apaza', ci: '3000008', genero: 'D' },
        { nombre: 'Pablo', apellido: 'Poma', ci: '3000009', genero: 'V' },
        { nombre: 'Claudia', apellido: 'Yujra', ci: '3000010', genero: 'D' }
      ];
      

    for (const presidente of presidentes) {
      console.log(`📌 Insertando presidente: ${presidente.nombre} ${presidente.apellido}`);

      // 1️⃣ Insertar en la tabla `Persona`
      const persona = await Persona.create({
        nombre: presidente.nombre,
        apellido: presidente.apellido,
        fecha_nacimiento: '1985-01-01', // Fecha de nacimiento por defecto
        ci: presidente.ci,
        genero: presidente.genero,
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
        correo: `${presidente.nombre.toLowerCase()}.${presidente.apellido.toLowerCase()}@gmail.com`,
      }, { transaction });

      console.log(`✅ Usuario creado para: ${presidente.nombre.toLowerCase()}.${presidente.apellido.toLowerCase()}@gmail.com`);

      // 3️⃣ Insertar en la tabla `PersonaRol` (Rol de presidente de club)
      await PersonaRol.create({
        persona_id: persona.id,
        rol_id: 7, // Suponiendo que el ID del rol de presidente de club es 2
        eliminado: 0
      }, { transaction });

      console.log(`✅ Rol de presidente de club asignado a ${presidente.nombre} ${presidente.apellido}`);
    }

    // Confirmar la transacción
    await transaction.commit();
    console.log('✅ Todos los presidentes de club fueron insertados exitosamente.');

  } catch (error) {
    console.error('🚨 Error al insertar los presidentes de club:', error);
    if (transaction) {
      await transaction.rollback();
      console.log('⏪ Transacción revertida.');
    }
  } finally {
    await sequelize.close();
  }
};

seeDelegadosClub();
