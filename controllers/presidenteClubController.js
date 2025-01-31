const presidenteClubService = require('../services/presidenteClubService');

exports.getAllPresidentes = async (req, res) => {
  try {
    const presidentes = await presidenteClubService.getAllPresidentes();
    res.status(200).json(presidentes);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener personas', error: err.message });
  }
};

exports.getAllDelegados = async (req, res) => {
  try {
    const delegados = await presidenteClubService.getAllDelegados();
    res.status(200).json(delegados);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener personas', error: err.message });
  }
};

exports.getPresidenteById = async (req, res) => {
  const { id } = req.params;
  try {
    const presidente = await presidenteClubService.getPresidenteById(id);
    if (presidente) {
      res.status(200).json(presidente);
    } else {
      res.status(404).json({ message: 'Persona no encontrada' });
    }
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener la persona', error: err.message });
  }
};

exports.getDelegadoById = async (req, res) => {
  const { id } = req.params;
  try {
    const delegado = await presidenteClubService.getDelegadoById(id);
    if (delegado) {
      res.status(200).json(delegado);
    } else {
      res.status(404).json({ message: 'Persona no encontrada' });
    }
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener la persona', error: err.message });
  }
};

exports.createPresidenteClub = async (req, res) => {
  const { persona_id, club_id } = req.body;

  if (!persona_id || !club_id) {
    return res.status(400).json({ message: 'Los campos persona_id y club_id deben ser proporcionados' });
  }

  try {
    const response = await presidenteClubService.createPresidenteClub(persona_id, club_id);
    res.status(201).json(response);
  } catch (err) {
    res.status(500).json({ message: 'Error al asignar el presidente del club y actualizar el club', error: err.message });
  }
};

exports.deletePresidenteClub = async (req, res) => {
  const { id } = req.params;
  const { user_id } = req.body;

  try {
    const result = await presidenteClubService.deletePresidenteClub(id, user_id);
    if (result.success) {
      res.status(200).json({ message: 'Persona eliminada correctamente' });
    } else {
      res.status(404).json({ message: 'Persona no encontrada' });
    }
  } catch (err) {
    res.status(500).json({ message: 'Error al eliminar persona', error: err.message });
  }
};
