const { Persona, Usuario, ImagenPersona, PersonaRol, Rol ,Sequelize} = require('../models');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const sequelize = require('../config/sequelize');

exports.getAllPersonas = async () => {
  const personas = await sequelize.query(`
    SELECT
        Persona.id,
        Persona.nombre,
        Persona.apellido,
        Persona.fecha_nacimiento,
        Persona.ci,
        Persona.direccion,
        Persona.fecha_registro,
        Persona.fecha_actualizacion,
        Persona.eliminado,
        ImagenPersona.persona_imagen,
        Usuario.correo
      FROM
        Persona
      LEFT JOIN
        ImagenPersona
      ON
        Persona.id = ImagenPersona.persona_id
      LEFT JOIN
        Usuario
      ON
        Persona.user_id = Usuario.id
      WHERE
        Persona.eliminado = 'N'
  `, { type: sequelize.QueryTypes.SELECT });
  return personas;
};

exports.emailExists = async (correo) => {
  try {
    const usuario = await Usuario.findOne({
      where: { correo }
    });

    return !!usuario; 
  } catch (error) {
    console.error('Error al verificar si el correo existe:', error);
    throw new Error('Error al verificar si el correo existe');
  }
};

exports.getPersonaById = async (id) => {
  try {
    const personas = await sequelize.query(`
      SELECT
        Persona.id,
        Persona.nombre,
        Persona.apellido,
        Persona.fecha_nacimiento,
        Persona.ci,
        Persona.direccion,
        Persona.fecha_registro,
        Persona.fecha_actualizacion,
        Persona.eliminado,
        ImagenPersona.persona_imagen,
        Usuario.correo
      FROM
        Persona
      LEFT JOIN
        ImagenPersona
      ON
        Persona.id = ImagenPersona.persona_id
      LEFT JOIN
        Usuario
      ON
        Persona.user_id = Usuario.id
      WHERE
        Persona.id = :id AND Persona.eliminado = 'N'
    `, {
      replacements: { id },
      type: sequelize.QueryTypes.SELECT
    });

    const persona = personas[0];

    return persona;
  } catch (error) {
    console.error('Error al obtener persona:', error);
    throw new Error('Error al obtener persona');
  }
};

exports.createPersona = async (data, imagen, hashedPassword) => {
  const { nombre, apellido, fecha_nacimiento, ci, direccion, correo } = data;
  
  const transaction = await Persona.sequelize.transaction();
  
  try {
    const nuevaPersona = await Persona.create({
      nombre,
      apellido,
      fecha_nacimiento,
      ci,
      direccion,
      fecha_registro: Sequelize.fn('GETDATE'),
      fecha_actualizacion: Sequelize.fn('GETDATE'),
      eliminado: 'N'
    }, { transaction });

    const nuevoUsuario = await Usuario.create({
      id: nuevaPersona.id,
      contraseña: hashedPassword,
      correo
    }, { transaction });

    nuevaPersona.user_id = nuevoUsuario.id;
    await nuevaPersona.save({ transaction });

    await PersonaRol.create({
      persona_id: nuevaPersona.id,
      rol_id: 8
    }, { transaction });

    if (imagen) {
      await ImagenPersona.create({
        persona_id: nuevaPersona.id,
        persona_imagen: imagen
      }, { transaction });
    }

    await transaction.commit();
    return nuevaPersona;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

exports.updatePersona = async (id, data) => {
  return await Persona.update(
    { ...data, fecha_actualizacion: Sequelize.fn('GETDATE') },
    { where: { id, eliminado: 'N' } }
  );
};

exports.deletePersona = async (id, user_id) => {
  return await Persona.update(
    { eliminado: 'S', fecha_actualizacion: Sequelize.fn('GETDATE'), user_id },
    { where: { id } }
  );
};

exports.searchPersonas = async (searchTerm) => {
  try {
    const personas = await sequelize.query(`
      SELECT
        Persona.id,
        Persona.nombre,
        Persona.apellido,
        Persona.fecha_nacimiento,
        Persona.ci,
        Persona.direccion,
        ImagenPersona.persona_imagen,
        Usuario.correo
      FROM
        Persona
      LEFT JOIN
        ImagenPersona
      ON
        Persona.id = ImagenPersona.persona_id
      LEFT JOIN
        Usuario
      ON
        Persona.id = Usuario.id
      WHERE
        (Persona.nombre LIKE :searchTerm OR Persona.apellido LIKE :searchTerm)
        AND Persona.eliminado = 'N'
    `, {
      replacements: { searchTerm: `%${searchTerm}%` }, 
      type: sequelize.QueryTypes.SELECT
    });

    return personas; 
  } catch (error) {
    console.error('Error al obtener persona:', error);
    throw new Error('Error al obtener persona');
  }
};
exports.searchPersonasSinRolJugador = async (searchTerm) => {
  try {
    const personas = await sequelize.query(`
      SELECT
        Persona.id,
        Persona.nombre,
        Persona.apellido,
        Persona.fecha_nacimiento,
        Persona.ci,
        Persona.direccion,
        ImagenPersona.persona_imagen,
        Usuario.correo
      FROM
        Persona
      LEFT JOIN
        ImagenPersona
      ON
        Persona.id = ImagenPersona.persona_id
      LEFT JOIN
        Usuario
      ON
        Persona.id = Usuario.id
      LEFT JOIN
        PersonaRol
      ON
        Persona.id = PersonaRol.persona_id
      WHERE
        (Persona.nombre LIKE :searchTerm OR Persona.apellido LIKE :searchTerm)
        AND Persona.eliminado = 'N'
        AND (PersonaRol.rol_id IS NULL OR PersonaRol.rol_id != 5)  -- Excluir personas con rol de jugador
    `, {
      replacements: { searchTerm: `%${searchTerm}%` },
      type: sequelize.QueryTypes.SELECT
    });

    return personas;
  } catch (error) {
    console.error('Error al buscar personas sin rol de jugador:', error);
    throw new Error('Error al buscar personas sin rol de jugador');
  }
};
