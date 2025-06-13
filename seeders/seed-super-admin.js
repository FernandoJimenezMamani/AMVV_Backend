const bcrypt = require('bcrypt'); // Para encriptar la contraseña
const { sequelize } = require('../models');
const { Persona, Usuario, PersonaRol, PresidenteAsociacion } = require('../models');

const seedSuperAdmin = async () => {
  try {
    console.log('Iniciando la transacción...');
    // Iniciar una transacción
    const transaction = await sequelize.transaction();

    // Encriptar la contraseña
    console.log('Encriptando la contraseña...');
    const hashedPassword = await bcrypt.hash('univalle100', 10);
    console.log('Contraseña encriptada:', hashedPassword);

    // 1. Insertar en la tabla Persona
    console.log('Insertando datos en la tabla Persona...');
    const personaData = {
      nombre: 'Admin',
      apellido: 'Presidente',
      fecha_nacimiento: '1980-01-01', // Fecha de nacimiento de ejemplo
      ci: '12345678',
      genero: 'V',
      direccion: 'Dirección de ejemplo',
      fecha_registro:  sequelize.fn('GETDATE'),
      fecha_actualizacion:  sequelize.fn('GETDATE'),
      eliminado: 'N', // No eliminado
    };

    const persona = await Persona.create(personaData, { transaction });
    console.log('Persona insertada:', persona.id);

    // 2. Insertar en la tabla Usuario
    console.log('Insertando datos en la tabla Usuario...');
    const usuarioData = {
      id: persona.id, // Usar el ID de la persona recién creada
      contraseña: hashedPassword,
      correo: 'Admin@example.com',
    };

    await Usuario.create(usuarioData, { transaction });
    console.log('Usuario insertado con ID:', persona.id);

    // 3. Insertar en la tabla PersonaRol
    console.log('Insertando datos en la tabla PersonaRol...');
    const personaRolData = {
      persona_id: persona.id,
      rol_id: 1, // ID del rol 1 (Administrador/Presidente)
      eliminado: 0
    };

    await PersonaRol.create(personaRolData, { transaction });
    console.log('PersonaRol insertado para persona_id:', persona.id);

    // Confirmar la transacción
    console.log('Confirmando la transacción...');
    await transaction.commit();
    console.log('Transacción confirmada.');

    console.log('Super administrador creado exitosamente.');
  } catch (error) {
    console.error('Error en la transacción:', error);
    // En caso de error, deshacer la transacción
    if (transaction) {
      console.log('Deshaciendo la transacción...');
      await transaction.rollback();
      console.log('Transacción deshecha.');
    }
  } finally {
    // Cerrar la conexión
    await sequelize.close();
  }
};

seedSuperAdmin();
