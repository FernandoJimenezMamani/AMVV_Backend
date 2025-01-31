const personaService = require('../services/personaService');
const { uploadFile } = require('../utils/subirImagen');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const roleNames = require('../constants/roles');

exports.getAllPersonas = async (req, res) => {
  try {
    const personas = await personaService.getAllPersonas();
    res.status(200).json(personas);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener personas', error: err.message });
  }
};

exports.getPersonaById = async (req, res) => {
  const { id } = req.params;
  try {
    const persona = await personaService.getPersonaById(id);
    if (persona) {
      res.status(200).json(persona);
    } else {
      res.status(404).json({ message: 'Persona no encontrada' });
    }
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener la persona', error: err.message });
  }
};

// Configuración de nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail', // O cualquier servicio que estés utilizando (Gmail, Outlook, etc.)
  auth: {
    user: 'ferjimenezm933@gmail.com', // Cambia por el correo que utilizarás para enviar los emails
    pass: 'rssd pwxw cpuh jpwc', // Cambia por la contraseña de tu correo
  }
});

exports.createPersona = async (req, res) => {
  try {
    console.log(req.body);

    const {
      nombre,
      apellido,
      fecha_nacimiento,
      ci,
      direccion,
      genero,
      correo,
      roles,
      club_jugador_id,
      club_presidente_id,
      club_delegado_id
    } = req.body;

    const imagen = req.file;

    let rolesArray = Array.isArray(roles) ? roles : JSON.parse(roles);
    console.log('Archivo recibido:', imagen);

    // Validar roles duplicados
    await personaService.checkDuplicateRoles(rolesArray);

    // Validación de campos obligatorios
    if (!nombre || !apellido || !ci || !correo || !roles || roles.length === 0) {
      return res.status(400).json({ message: 'Todos los campos requeridos deben ser proporcionados' });
    }

    // Validar club para jugador o presidente
    if (rolesArray.includes(roleNames.Jugador) && !club_jugador_id) {
      return res.status(400).json({ message: 'Debe seleccionar un club para el rol de jugador' });
    }
    if (rolesArray.includes(roleNames.PresidenteClub) && !club_presidente_id) {
      return res.status(400).json({ message: 'Debe seleccionar un club para el rol de presidente' });
    }
    if (rolesArray.includes(roleNames.DelegadoClub) && !club_delegado_id) {
      return res.status(400).json({ message: 'Debe seleccionar un club para el rol de delegado' });
    }

    // Verificar si el correo ya existe
    const emailExists = await personaService.emailExists(correo);
    if (emailExists) {
      return res.status(400).json({ message: 'El correo ya está registrado' });
    }

    // Generar y hashear contraseña
    const generatedPassword = generatePassword();
    const hashedPasswordPromise = bcrypt.hash(generatedPassword, saltRounds);

    // Subir imagen (si existe) en paralelo
    const uploadPromise = imagen
      ? uploadFile(imagen, `${nombre}_${apellido}_image`, null, 'FilesPersonas')
      : Promise.resolve(null);

    // Ejecutar hash y subida de imagen en paralelo
    const [hashedPassword, uploadResult] = await Promise.all([hashedPasswordPromise, uploadPromise]);

    const downloadURL = uploadResult ? uploadResult.downloadURL : null;

    // Crear la nueva persona con sus roles y clubes
    const nuevaPersona = await personaService.createPersonaWithRoles(
      { nombre, apellido, fecha_nacimiento, ci, direccion, genero, correo },
      downloadURL,
      hashedPassword,
      rolesArray,
      { club_jugador_id, club_presidente_id, club_delegado_id }
    );

    if (!nuevaPersona) {
      throw new Error('Error al crear la persona');
    }

    // Configuración de correo
    const mailOptions = {
      from: 'tu-correo@gmail.com',
      to: correo,
      subject: 'Bienvenido! Aquí está tu contraseña',
      text: `Hola ${nombre},\n\nTu cuenta ha sido creada exitosamente. Aquí está tu contraseña: ${generatedPassword}\nPor favor, cámbiala después de iniciar sesión.\n\nSaludos,\nEl equipo`
    };

    // Enviar el correo en segundo plano
    setImmediate(() => {
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error('Error enviando el correo:', error);
        } else {
          console.log('Correo enviado:', info.response);
        }
      });
    });

    // Respuesta exitosa
    res.status(201).json({
      message: 'Persona creada correctamente y contraseña enviada por correo',
      personaId: nuevaPersona.id
    });
  } catch (err) {
    console.error('Error al crear la persona:', err);

    // Manejo de errores específicos
    if (err.message.includes('Ya existe un usuario con el rol')) {
      return res.status(400).json({ message: err.message });
    }

    // Error genérico
    res.status(500).json({
      message: 'Error interno del servidor.',
      error: err.message
    });
  }
};

// Función para generar una contraseña aleatoria de 6 dígitos
function generatePassword() {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const aux = '12345';  //contrasenia temporal
  let password = '';
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  return aux;
}

exports.updatePersonaWithRoles = async (req, res) => {
  console.log("Datos recibidos:", req.body);
  
  const {
    nombre,
    apellido,
    fecha_nacimiento,
    ci,
    direccion,
    genero,
    correo,
    roles,
    club_jugador_id,
    club_presidente_id,
    club_delegado_id
  } = req.body;

  const personaId = req.params.id;
  const imagen = req.file;

  let rolesArray;
  try {
    rolesArray = Array.isArray(roles) ? roles : roles.split(",").map(role => role.trim());
  } catch (error) {
    console.error("Error procesando roles:", error);
    return res.status(400).json({ message: "El campo roles tiene un formato inválido", error });
  }

  console.log("Archivo recibido:", imagen);
  console.log("Roles procesados:", rolesArray);

  if (!nombre || !apellido || !ci || !correo || !rolesArray || rolesArray.length === 0) {
    console.error("Faltan campos obligatorios");
    return res.status(400).json({ message: "Todos los campos requeridos deben ser proporcionados" });
  }

  if (rolesArray.includes("Jugador") && !club_jugador_id) {
    console.error("Falta club para jugador");
    return res.status(400).json({ message: "Debe seleccionar un club para el rol de jugador" });
  }

  if (rolesArray.includes("PresidenteClub") && !club_presidente_id) {
    console.error("Falta club para presidente");
    return res.status(400).json({ message: "Debe seleccionar un club para el rol de presidente" });
  }

  if (rolesArray.includes("PresidenteClub") && !club_delegado_id) {
    console.error("Falta club para delegado");
    return res.status(400).json({ message: "Debe seleccionar un club para el rol de delegado" });
  }


  try {
    // Verificar si la persona existe
    console.log("Verificando si la persona existe...");
    const personaExists = await personaService.getPersonaById(personaId);
    if (!personaExists) {
      console.error("Persona no encontrada");
      return res.status(404).json({ message: "La persona no existe" });
    }

    console.log("Persona encontrada:", personaExists);

    // Verificar si el correo pertenece a otra persona
    console.log("Verificando correo...");
    const emailExists = await personaService.emailExistsUpdate(correo, personaId);
    if (emailExists) {
      console.error("El correo ya está registrado para otro usuario");
      return res.status(400).json({ message: "El correo ya está registrado para otro usuario" });
    }

    console.log("Correo validado");

    // Subir imagen si existe
    let downloadURL = null;

    // Actualizar la imagen usando el servicio existente
    if (imagen) {
      console.log('Actualizando la imagen de la persona...');
      const result = await personaService.updatePersonaImage(personaId, imagen);
      console.log(result.message);
      downloadURL = result.downloadURL; // Guardar la nueva URL de la imagen
    }

    // Actualizar datos de la persona
    console.log("Actualizando datos de la persona...");
    const personaActualizada = await personaService.updatePersonaWithRoles(
      personaId,
      { nombre, apellido, fecha_nacimiento, ci, direccion, genero, correo },
      downloadURL,
      rolesArray,
      { club_jugador_id, club_presidente_id, club_delegado_id }
    );

    if (!personaActualizada) {
      console.error("Error al actualizar la persona");
      throw new Error("Error al actualizar la persona");
    }

    console.log("Persona actualizada:", personaActualizada);

    res.status(200).json({
      message: "Persona actualizada correctamente",
      personaId: personaActualizada.id,
    });
  } catch (err) {
    console.error("Error al actualizar la persona:", err);
    res.status(500).json({
      message: "Error al actualizar la persona",
      error: err.message,
    });
  }
};


exports.updatePersona = async (req, res) => {
  const { id } = req.params;
  const data = req.body;

  try {
    const result = await personaService.updatePersona(id, data);
    if (result[0] > 0) {
      res.status(200).json({ message: 'Persona actualizada correctamente' });
    } else {
      res.status(404).json({ message: 'Persona no encontrada' });
    }
  } catch (err) {
    res.status(500).json({ message: 'Error al actualizar persona', error: err.message });
  }
};

exports.updatePersonaImage = async (req, res) => {
  const { id } = req.params;
  const imagen = req.file;

  try {
    const result = await personaService.updatePersonaImage(id, imagen);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar la imagen de la persona', error: error.message });
  }
};

exports.deletePersona = async (req, res) => {
  const { id } = req.params; // ID de la persona a eliminar
  const { user_id, roles } = req.body; // ID del usuario que realiza la acción y roles asociados

  try {
    if (!id || !user_id || !roles || !Array.isArray(roles)) {
      return res.status(400).json({
        message: 'Faltan datos requeridos: id, user_id o roles no son válidos.',
      });
    }

    console.log(`Eliminando persona con ID: ${id}, roles: ${roles}`);

    await personaService.deletePersona(id, user_id, roles);

    res.status(200).json({
      message: 'Persona eliminada correctamente.',
    });
  } catch (error) {
    console.error(`Error al eliminar la persona con ID: ${id}`, error.message);

    // Devuelve un error 500 con información adicional
    res.status(500).json({
      message: 'Error al eliminar la persona.',
      error: error.message,
    });
  }
};

exports.activatePersona = async (req, res) => {
  const { id } = req.params;
  const { user_id } = req.body;

  try {
    const result = await personaService.activatePersona(id, user_id);
    if (result[0] > 0) {
      res.status(200).json({ message: 'Persona activada correctamente' });
    } else {
      res.status(404).json({ message: 'Persona no encontrada' });
    }
  } catch (err) {
    res.status(500).json({ message: 'Error al eliminar persona', error: err.message });
  }
};

exports.searchPersonas = async (req, res) => {
  const { searchTerm } = req.query;

  try {
    const personas = await personaService.searchPersonas(searchTerm);
    res.status(200).json(personas);
  } catch (err) {
    res.status(500).json({ message: 'Error al buscar personas', error: err.message });
  }
};

exports.updatePersonaImage = async (req, res) => {
  const { id } = req.params;
  const imagen = req.file;

  try {
    const result = await personaService.updatePersonaImage(id, imagen);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar la imagen de la persona', error: error.message });
  }
};


exports.searchPersonasSinRolJugador = async (req, res) => {
  const { searchTerm } = req.query;

  try {
    const personas = await personaService.searchPersonasSinRolJugador(searchTerm);
    res.status(200).json(personas);
  } catch (err) {
    res.status(500).json({ message: 'Error al buscar personas sin rol de jugador', error: err.message });
  }
};