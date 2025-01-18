const arbitroService = require('../services/arbitroService');

exports.getArbitros = async (req, res) => {
    try {
      const arbitros = await arbitroService.getArbitros();
      res.status(200).json(arbitros);
    } catch (error) {
      res.status(500).json({ message: 'Error al obtener árbitros', error: error.message });
    }
};

exports.getArbitroById = async (req, res) => {
  const { id } = req.params;
  try {
    const arbitro = await arbitroService.getArbitroById(id);
    if (arbitro) {
      res.status(200).json(arbitro);
    } else {
      res.status(404).json({ message: 'Persona no encontrada' });
    }
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener la persona', error: err.message });
  }
};
  
exports.createArbitro = async (req, res) => {
  const { persona_id, activo } = req.body;

  // Validación simple para asegurar que los campos requeridos están presentes
  if (!persona_id || activo === undefined) {
    return res.status(400).json({ message: 'Los campos persona_id y activo deben ser proporcionados' });
  }

  try {
    const response = await arbitroService.createArbitro(persona_id, activo);
    res.status(201).json(response);
  } catch (err) {
    res.status(500).json({ message: 'Error al asignar el árbitro', error: err.message });
  }
};