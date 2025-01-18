const jugadorService = require('../services/jugadorService');

exports.getAllJugadores = async (req, res) => {
  try {
    const jugadores = await jugadorService.getAllJugadores();
    res.status(200).json(jugadores);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener jugadores con clubes', error: error.message });
  }
};

exports.getJugadorById = async (req, res) => {
  const { id } = req.params;
  try {
    const jugador = await jugadorService.getJugadorById(id);
    if (jugador) {
      res.status(200).json(jugador);
    } else {
      res.status(404).json({ message: 'Persona no encontrada' });
    }
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener la persona', error: err.message });
  }
};

exports.createNewJugador = async (req, res) => {
  console.log(req.body);

  const { nombre, apellido, fecha_nacimiento, ci, direccion, genero, correo, club_jugador_id } = req.body;
  const imagen = req.file;

  // Validación de campos obligatorios
  if (!nombre || !apellido || !ci || !correo || !club_jugador_id) {
    return res.status(400).json({ message: 'Todos los campos requeridos deben ser proporcionados' });
  }

  try {
    // Verificar si el correo ya existe
    const emailExists = await personaService.emailExists(correo);
    if (emailExists) {
      return res.status(400).json({ message: 'El correo ya está registrado' });
    }

    // Generar y hashear contraseña
    const generatedPassword = generatePassword();
    const hashedPasswordPromise = bcrypt.hash(generatedPassword, saltRounds);

    // Subir imagen (si existe) en paralelo
    const uploadPromise = imagen ? uploadFile(imagen, `${nombre}_${apellido}_image`, null, 'FilesPersonas') : Promise.resolve(null);

    // Ejecutar hash y subida de imagen en paralelo
    const [hashedPassword, uploadResult] = await Promise.all([hashedPasswordPromise, uploadPromise]);

    const downloadURL = uploadResult ? uploadResult.downloadURL : null;

    // Crear el jugador
    const nuevoJugador = await jugadorService.createJugador(
      { nombre, apellido, fecha_nacimiento, ci, direccion, genero, correo },
      downloadURL,
      hashedPassword,
      club_jugador_id
    );

    if (!nuevoJugador) {
      throw new Error('Error al crear el jugador');
    }

    // Configuración de correo
    const mailOptions = {
      from: 'tu-correo@gmail.com',
      to: correo,
      subject: 'Bienvenido! Aquí está tu contraseña',
      text: `Hola ${nombre},\n\nTu cuenta de jugador ha sido creada exitosamente. Aquí está tu contraseña: ${generatedPassword}\nPor favor, cámbiala después de iniciar sesión.\n\nSaludos,\nEl equipo`
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
      message: 'Jugador creado correctamente y contraseña enviada por correo',
      jugadorId: nuevoJugador.id
    });
  } catch (err) {
    console.error('Error al crear el jugador:', err);
    res.status(500).json({
      message: 'Error al crear el jugador',
      error: err.message
    });
  }
};


exports.createJugador = async (req, res) => {
  const { persona_id, club_id } = req.body;

  if (!persona_id || !club_id) {
    return res.status(400).json({ message: 'Los campos persona_id y club_id deben ser proporcionados' });
  }

  try {
    const response = await jugadorService.createJugador(persona_id, club_id);
    res.status(201).json(response);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.asignarJugadorAEquipo = async (req, res) => {
  const { persona_id, equipo_id } = req.body;
  console.log(persona_id, equipo_id);
  if (!persona_id || !equipo_id) {
    return res.status(400).json({ message: 'Los campos persona_id y equipo_id deben ser proporcionados' });
  }

  try {
    const response = await jugadorService.asignarJugadorAEquipo(persona_id, equipo_id);
    res.status(201).json(response);
  } catch (err) {
    res.status(500).json({ message: 'Error al asignar el jugador al equipo: ' + err.message });
  }
};

exports.getJugadoresByClubId = async (req, res) => {
  const { club_id } = req.params;

  if (!club_id) {
    return res.status(400).json({ message: 'El club_id debe ser proporcionado' });
  }

  try {
    const jugadores = await jugadorService.getJugadoresByClubId(club_id);
    res.status(200).json(jugadores);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener los jugadores del club', error: err.message });
  }
};

exports.getJugadoresByEquipo = async (req, res) => {
  const { equipo_id } = req.params;

  try {
    const jugadores = await jugadorService.getJugadoresByEquipoId(equipo_id);
    return res.status(200).json(jugadores);
  } catch (error) {
    console.error('Error en getJugadoresByEquipo:', error);
    return res.status(500).json({ error: 'Error al obtener los jugadores por equipo' });
  }
};
exports.searchJugadoresByClubId = async (req, res) => {
  const { club_id } = req.params;
  const { searchTerm, genero } = req.query;

  if (!club_id) {
    return res.status(400).json({ message: 'El club_id debe ser proporcionado' });
  }

  try {
    const jugadores = await jugadorService.searchJugadoresByClubId(club_id, searchTerm, genero);
    res.status(200).json(jugadores);
  } catch (err) {
    res.status(500).json({ message: 'Error al buscar jugadores', error: err.message });
  }
};

exports.getJugadoresByEquipoId = async (req, res) => {
  const { equipo_id } = req.params;

  if (!equipo_id) {
    return res.status(400).json({ message: 'El equipo_id debe ser proporcionado' });
  }

  try {
    const jugadores = await jugadorService.getJugadoresByEquipoId(equipo_id);
    res.status(200).json(jugadores);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener los jugadores del equipo', error: err.message });
  }
};
