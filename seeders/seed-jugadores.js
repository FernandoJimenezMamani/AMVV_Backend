const bcrypt = require('bcrypt');
const { sequelize } = require('../models');
const { Persona, Usuario, PersonaRol, Jugador, Club } = require('../models');

const gruposNombres = [
  {
    hombres: ['Elias', 'Dante', 'Axel', 'Oliver', 'Thiago', 'Lucio', 'Gabriel', 'Julian', 'Santiago', 'Mateo', 'Sebastian', 'Facundo'],
    mujeres: ['Camila', 'Lara', 'Valentina', 'Fiona', 'Isidora', 'Julieta', 'Carla', 'Agustina', 'Daniela', 'Renata', 'Josefina', 'Martina']
  },
  {
    hombres: ['Adrian', 'Enzo', 'Gael', 'Marco', 'Matías', 'Tobias', 'Andres', 'Leandro', 'Cristian', 'Alan', 'Nahuel', 'Luciano'],
    mujeres: ['Martina', 'Zoe', 'Celeste', 'Mireya', 'Abril', 'Florencia', 'Paula', 'Milena', 'Catalina', 'Noelia', 'Tamara', 'Romina']
  },
  {
    hombres: ['Damian', 'Iker', 'Bruno', 'Emiliano', 'Lorenzo', 'Nicolas', 'Kevin', 'Franco', 'Axel', 'Tomás', 'Bautista', 'Iván'],
    mujeres: ['Renata', 'Alma', 'Paulina', 'Luciana', 'Emilia', 'Violeta', 'Antonella', 'Melina', 'Luz', 'Juliana', 'Cecilia', 'Carolina']
  },
  {
    hombres: ['Franco', 'Rafael', 'Hugo', 'Salvador', 'Esteban', 'Gaspar', 'Matheo', 'Ezequiel', 'Agustin', 'Gonzalo', 'Ramiro', 'Mauricio'],
    mujeres: ['Bianca', 'Delfina', 'Ambar', 'Alexa', 'Antonella', 'Milagros', 'Abril', 'Brenda', 'Lorena', 'Victoria', 'Sofia', 'Aldana']
  },
  {
    hombres: ['Benjamin', 'Ivan', 'Noel', 'Samuel', 'Leonardo', 'Andres', 'Marcos', 'Brian', 'Federico', 'Lucas', 'Joaquin', 'Emanuel'],
    mujeres: ['Jazmin', 'Thalia', 'Cassandra', 'Ximena', 'Aitana', 'Melina', 'Nadia', 'Camila', 'Elena', 'Aylen', 'Belen', 'Lucia']
  }
];

const generarFechaNacimiento = () => {
  const anios = [1997, 1998, 1999, 2000, 2001];
  const mes = Math.floor(Math.random() * 12) + 1;
  const dia = Math.floor(Math.random() * 28) + 1;
  const anio = anios[Math.floor(Math.random() * anios.length)];
  return `${anio}-${mes.toString().padStart(2, '0')}-${dia.toString().padStart(2, '0')}`;
};

const generarEmailUnico = async (nombre, apellido, transaction) => {
  let email = `${nombre.toLowerCase()}.${apellido.toLowerCase()}@gmail.com`;
  let contador = 1;
  let intentos = 0;
  const MAX_INTENTOS = 10;

  console.log(`🔎 Verificando disponibilidad de correo: ${email}`);

  while (intentos < MAX_INTENTOS) {
    try {
      console.log(`🔍 Intento ${intentos + 1}: Ejecutando consulta para ${email}`);

      const result = await sequelize.query(
        `SELECT COUNT(*) as count FROM Usuario WHERE correo = :email`,
        {
          replacements: { email },
          type: sequelize.QueryTypes.SELECT,
          transaction, // 🚀 Ahora usamos la transacción aquí
        }
      );

      console.log(`📊 Resultado de consulta: ${JSON.stringify(result)}`);

      if (result[0].count === 0) {
        console.log(`✅ Correo disponible: ${email}`);
        return email;
      }

      email = `${nombre.toLowerCase()}.${apellido.toLowerCase()}${contador}@gmail.com`;
      console.log(`⚠️ Correo en uso, probando: ${email}`);
      contador++;
      intentos++;

    } catch (error) {
      console.error(`🚨 Error al verificar correo ${email}:`, error);
      throw error;
    }
  }

  throw new Error(`🚨 Se alcanzó el máximo de intentos (${MAX_INTENTOS}) para generar un email único.`);
};

const seedJugadores = async () => {
  let transaction;
  try {
    console.log('⏳ Obteniendo clubes registrados...');
    const clubes = await Club.findAll({ attributes: ['id'] });

    if (clubes.length === 0) {
      console.log('🚨 No hay clubes registrados. Abortando inserción.');
      return;
    }

    console.log(`📌 Se encontraron ${clubes.length} clubes.`);

    transaction = await sequelize.transaction(); // 🚀 Iniciamos la transacción AQUÍ

    const hashedPassword = await bcrypt.hash('univalle100', 10);

    for (const club of clubes) {
      console.log(`⚽ Registrando jugadores para el club ID: ${club.id}`);

      const grupoSeleccionado = gruposNombres[Math.floor(Math.random() * gruposNombres.length)];

      const jugadores = [
        ...grupoSeleccionado.hombres.map(nombre => ({ nombre, genero: 'V' })),
        ...grupoSeleccionado.mujeres.map(nombre => ({ nombre, genero: 'D' }))
      ];

      for (const jugador of jugadores) {
        const apellido = ['Gomez', 'Martinez', 'Sanchez', 'Torres', 'Hernandez', 'Lopez', 'Diaz', 'Perez', 'Castro', 'Mendoza'][Math.floor(Math.random() * 10)];

        console.log(`👤 Procesando jugador: ${jugador.nombre} ${apellido}`);

        const email = await generarEmailUnico(jugador.nombre, apellido, transaction);

        console.log(`📌 Insertando jugador: ${jugador.nombre} ${apellido} con email: ${email} en el Club ${club.id}`);

        const persona = await Persona.create({
          nombre: jugador.nombre,
          apellido: apellido,
          fecha_nacimiento: generarFechaNacimiento(),
          ci: Math.floor(1000000 + Math.random() * 9000000),
          genero: jugador.genero,
          direccion: 'Sin dirección',
          fecha_registro: sequelize.fn('GETDATE'),
          fecha_actualizacion: sequelize.fn('GETDATE'),
          eliminado: 'N',
        }, { transaction });

        console.log(`✅ Persona insertada con ID: ${persona.id}`);

        await Usuario.create({
          id: persona.id,
          contraseña: hashedPassword,
          correo: email,
        }, { transaction });

        console.log(`✅ Usuario creado con correo: ${email}`);

        await PersonaRol.create({
          persona_id: persona.id,
          rol_id: 4,
          eliminado: 0
        }, { transaction });

        console.log(`✅ Rol de jugador asignado a ${jugador.nombre} ${apellido}`);

        await Jugador.create({
          id: persona.id,
          club_id: club.id,
          activo: 1,
          jugador_id: persona.id,
        }, { transaction });

        console.log(`✅ Jugador registrado en la tabla Jugador con ID: ${persona.id}`);
      }
    }

    await transaction.commit(); // 🚀 Confirmamos la transacción solo al final
    console.log('✅ Todos los jugadores fueron insertados exitosamente.');

  } catch (error) {
    console.error('🚨 Error al insertar los jugadores:', error);
    if (transaction) {
      await transaction.rollback();
      console.log('⏪ Transacción revertida.');
    }
  }
};

seedJugadores();
