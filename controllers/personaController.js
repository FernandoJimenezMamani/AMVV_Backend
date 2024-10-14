const personaService = require('../services/personaService');
const { uploadFile } = require('../utils/subirImagen');
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

exports.createPersona = async (req, res) => {
  const { nombre, apellido, fecha_nacimiento, ci, direccion, contrasena, correo } = req.body;
  const imagen = req.file;

  if (!nombre || !apellido || !ci || !contrasena || !correo) {
    return res.status(400).json({ message: 'Todos los campos requeridos deben ser proporcionados' });
  }

  try {
    const emailExists = await personaService.emailExists(correo);
    if (emailExists) {
      return res.status(400).json({ message: 'El correo ya está registrado' });
    }

    const hashedPassword = await bcrypt.hash(contrasena, saltRounds);

    let downloadURL = null;
    if (imagen) {
      const fileName = `${nombre}_${apellido}_image`;
      const { downloadURL: url } = await uploadFile(imagen, fileName, null, 'FilesPersonas');
      downloadURL = url;
    }

    const nuevaPersona = await personaService.createPersona(
      { nombre, apellido, fecha_nacimiento, ci, direccion, correo },
      downloadURL,
      hashedPassword
    );

    res.status(201).json({ message: 'Persona creada correctamente', personaId: nuevaPersona.id });
  } catch (err) {
    res.status(500).json({ message: 'Error al crear la persona', error: err.message });
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
