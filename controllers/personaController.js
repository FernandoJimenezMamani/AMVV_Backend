const personaService = require('../services/personaService');
const { uploadFile } = require('../utils/subirImagen');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const saltRounds = 10;

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
  const { nombre, apellido, fecha_nacimiento, ci, direccion, genero, correo } = req.body;  // Agregar genero
  const imagen = req.file;

  // Validar los campos obligatorios
  if (!nombre || !apellido || !ci || !correo) {
    return res.status(400).json({ message: 'Todos los campos requeridos deben ser proporcionados' });
  }

  try {
    // Verificar si el correo ya existe
    const emailExists = await personaService.emailExists(correo);
    if (emailExists) {
      return res.status(400).json({ message: 'El correo ya está registrado' });
    }

    // Generar una contraseña aleatoria de 6 dígitos
    const generatedPassword = generatePassword();

    // Hashear la contraseña generada
    const hashedPassword = await bcrypt.hash(generatedPassword, saltRounds);

    // Subir imagen si está disponible
    let downloadURL = null;
    if (imagen) {
      const fileName = `${nombre}_${apellido}_image`;
      const { downloadURL: url } = await uploadFile(imagen, fileName, null, 'FilesPersonas');
      downloadURL = url;
    }

    // Crear la nueva persona
    const nuevaPersona = await personaService.createPersona(
      { nombre, apellido, fecha_nacimiento, ci, direccion, genero, correo }, // Asegurarse de incluir genero
      downloadURL,
      hashedPassword
    );

    if (!nuevaPersona) {
      throw new Error('Error al crear la persona');
    }

    // Enviar el correo con la contraseña generada
    const mailOptions = {
      from: 'tu-correo@gmail.com',
      to: correo,
      subject: 'Bienvenido! Aquí está tu contraseña',
      text: `Hola ${nombre},\n\nTu cuenta ha sido creada exitosamente. Aquí está tu contraseña: ${generatedPassword}\nPor favor, cámbiala después de iniciar sesión.\n\nSaludos,\nEl equipo`
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error enviando el correo:', error);
        return res.status(500).json({ message: 'Persona creada pero fallo al enviar el correo' });
      } else {
        console.log('Correo enviado:', info.response);
        return res.status(201).json({ message: 'Persona creada correctamente y contraseña enviada por correo', personaId: nuevaPersona.id });
      }
    });
  } catch (err) {
    console.error('Error al crear la persona:', err);
    res.status(500).json({ message: 'Error al crear la persona', error: err.message });
  }
};

// Función para generar una contraseña aleatoria de 6 dígitos
function generatePassword() {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let password = '';
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  return password;
}

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

exports.deletePersona = async (req, res) => {
  const { id } = req.params;
  const { user_id } = req.body;

  try {
    const result = await personaService.deletePersona(id, user_id);
    if (result[0] > 0) {
      res.status(200).json({ message: 'Persona eliminada correctamente' });
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