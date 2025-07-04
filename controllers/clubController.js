const clubService = require('../services/clubService');

exports.getClubs = async (req, res) => {
  try {
    const clubs = await clubService.getClubs();
    res.status(200).json(clubs);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener clubs', error: err.message });
  }
};

exports.getClubsWithNoPresident = async (req, res) => {
  try {
    const clubs = await clubService.getClubsWithNoPresident();
    res.status(200).json(clubs);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener clubs', error: err.message });
  }
};

exports.getClubById = async (req, res) => {
  const { id } = req.params;
  try {
    const club = await clubService.getClubById(id);
    if (!club) return res.status(404).json({ message: 'Club no encontrado' });
    res.status(200).json(club);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener club', error: err.message });
  }
};

exports.getClubTeams = async (req, res) => {
  const { id } = req.params;
  try {
    const club = await clubService.getClubTeams(id);
    if (!club) return res.status(404).json({ message: 'Club no encontrado o no tiene equipos' });
    res.status(200).json(club);
  } catch (err) {
    console.error('Error:', err); 
    res.status(500).json({ message: 'Error al obtener equipos del club', error: err.message || err });
  }
};


exports.createClub = async (req, res) => {
  const { nombre, descripcion, user_id } = req.body;
  const imagen = req.file;
  console.log('req.file:', req.file);

  if (!nombre || !descripcion || !user_id || !imagen) {
    return res.status(400).json({ message: 'Todos los campos deben ser proporcionados' });
  }

  try {
    const newClub = await clubService.createClub(nombre, descripcion, user_id, imagen);
    res.status(201).json({ message: 'Club creado exitosamente', clubId: newClub.id });
  } catch (err) {
    res.status(500).json({ message: 'Error al crear club', error: err.message });
  }
};

exports.updateClub = async (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion, user_id } = req.body;

  try {
    const club = await clubService.updateClub(id, nombre, descripcion, user_id);
    if (!club[1].length) return res.status(404).json({ message: 'Club no encontrado' });
    res.status(200).json({ message: 'Club actualizado correctamente' });
  } catch (err) {
    res.status(500).json({ message: 'Error al actualizar club', error: err.message });
  }
};

exports.updateClubImage = async (req, res) => {
  const { id } = req.params;
  const imagen = req.file;

  try {
    await clubService.updateClubImage(id, imagen);
    res.status(200).json({ message: 'Imagen del club actualizada correctamente' });
  } catch (err) {
    console.error('Error en controlador:', err);
    res.status(500).json({ message: 'Error al actualizar imagen del club', error: err.message });
  }
};

exports.deleteClub = async (req, res) => {
  const { id } = req.params;
  const { user_id } = req.body;

  try {
    const deleted = await clubService.deleteClub(id, user_id);
    if (!deleted[0]) return res.status(404).json({ message: 'Club no encontrado' });
    res.status(200).json({ message: 'Club eliminado lógicamente correctamente' });
  } catch (err) {
    res.status(500).json({ message: 'Error al eliminar club', error: err.message });
  }
};

exports.activateClub = async (req, res) => {
  const { id } = req.params;
  const { user_id } = req.body;

  try {
    const deleted = await clubService.activateClub(id, user_id);
    if (!deleted[0]) return res.status(404).json({ message: 'Club no encontrado' });
    res.status(200).json({ message: 'Club eliminado lógicamente correctamente' });
  } catch (err) {
    res.status(500).json({ message: 'Error al eliminar club', error: err.message });
  }
};

exports.obtenerClubesDisponiblesParaJugador = async (req, res) => {
  try {
    const { jugador_id } = req.body;
    console.log('jugador_id:', jugador_id);

    if (!jugador_id) {
      return res.status(400).json({ error: 'El ID del jugador es requerido' });
    }

    const clubes = await clubService.getClubesAvailableForJugador(jugador_id);

    res.status(200).json({ clubes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getClubesPendingConfirmation = async (req, res) => {
  try {
      const { jugador_id ,campeonatoId} = req.body;

      console.log('datos recibidos traspaso xs' ,req.body )

      if (!jugador_id || !campeonatoId) {
          return res.status(400).json({ error: 'Los parámetros club_presidente e idTraspasoPresidente son requeridos' });
      }

      const jugadores = await clubService.getClubesPendingConfirmation(jugador_id, campeonatoId);

      return res.status(200).json(jugadores);
  } catch (error) {
      console.error('Error en el controlador al obtener jugadores:', error);
      return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

exports.getDelegados = async (req, res) => {
  const { id } = req.params;
  try {
    const delegados = await clubService.getDelegadosDelClub(id);
    res.status(200).json(delegados);
  } catch (error) {
    res.status(500).json({ error: 'No se pudieron obtener los delegados' });
  }
};

