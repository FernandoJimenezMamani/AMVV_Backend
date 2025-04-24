const equipoService = require('../services/equipoService');
const campeonatoService = require('../services/campeonatoService');

exports.getEquiposByCategoriaId = async (req, res) => {
  const { categoria_id, campeonato_id } = req.params;

  try {
    const equipos = await equipoService.getEquiposByCategoriaId(categoria_id ,campeonato_id);
    res.status(200).json(equipos);
  } catch (err) {
    console.error('Error:', err.message);
    res.status(500).json({ message: 'Error al obtener equipos', error: err.message });
  }
};

exports.getEquipoById = async (req, res) => {
  const { id } = req.params;

  try {
    const equipo = await equipoService.getEquipoById(id);
    if (equipo) {
      res.status(200).json(equipo);
    } else {
      res.status(404).json({ message: 'Equipo no encontrado' });
    }
  } catch (err) {
    console.error('Error:', err.message);
    res.status(500).json({ message: 'Error al obtener equipo', error: err.message });
  }
};

exports.createEquipo = async (req, res) => {
  const { nombre, club_id, categoria_id, user_id } = req.body;

  if (!nombre || !club_id || !categoria_id || !user_id) {
    return res.status(400).json({ message: 'Todos los campos (nombre, club_id, categoria_id, user_id) deben ser proporcionados' });
  }

  try {
    const equipo = await equipoService.createEquipo({ nombre, club_id, categoria_id, user_id });
    res.status(201).json({ message: 'Equipo creado', equipoId: equipo.id });
  } catch (error) {
    console.error("❌ Error al registrar el equipo:", error.message);
    res.status(400).json({ error: error.message || 'Error al registrar el equipo' });
  }
};

exports.updateEquipo = async (req, res) => {
  const { id } = req.params;
  const { nombre, club_id, categoria_id, user_id } = req.body;

  if (!id) {
    return res.status(400).json({ message: 'El ID del equipo debe ser proporcionado' });
  }

  try {
    const result = await equipoService.updateEquipo(id, { nombre, club_id, categoria_id, user_id });
    res.status(200).json(result); // Ya contiene el mensaje

  } catch (err) {
    console.error('Error:', err.message);
    res.status(400).json({ error: err.message || 'Error al actualizar equipo' });
  }  
};

exports.deleteEquipo = async (req, res) => {
  const { id } = req.params;
  const { user_id } = req.body;

  if (!id || !user_id) {
    return res.status(400).json({ message: 'El ID y el user_id deben ser proporcionados' });
  }

  try {
    const result = await equipoService.deleteEquipo(id, user_id);
    if (result[0] > 0) {
      res.status(200).json({ message: 'Equipo eliminado lógicamente correctamente' });
    } else {
      res.status(404).json({ message: 'Equipo no encontrado' });
    }
  } catch (err) {
    console.error('Error:', err.message);
    res.status(500).json({ message: 'Error al eliminar lógicamente el equipo', error: err.message });
  }
};

exports.getEquiposPorPartido = async (req, res) => {
  const { partido_id } = req.params;

  try {
    const equipos = await equipoService.getEquiposByPartidoId(partido_id);
    return res.status(200).json(equipos);
  } catch (error) {
    console.error('Error en el controlador getEquiposPorPartido:', error);
    return res.status(500).json({ error: 'Error al obtener los equipos por partido' });
  }
};

exports.getTeamPosition = async (req, res) => {
  const { categoria_id, campeonato_id, equipo_id } = req.params;

  try {
    // Convertir los parámetros a números (opcional, pero recomendable)
    const categoria = parseInt(categoria_id);
    const campeonato = parseInt(campeonato_id);
    const equipo = parseInt(equipo_id);

    if (isNaN(categoria) || isNaN(campeonato) || isNaN(equipo)) {
      return res.status(400).json({ message: 'Parámetros inválidos' });
    }

    // Obtener la posición del equipo
    const teamPosition = await campeonatoService.getTeamPosition(categoria, campeonato, equipo);

    res.status(200).json(teamPosition);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.get_all_teams = async(req, res)=>{
  try{
    const equipos = await equipoService.get_all_equipos();
    res.status(200).json(equipos)
  }catch(err){
    res.status(500).json({ message: err.message });
  }
}

exports.getCategoriaByEquipoAndCampeonato = async (req, res) => {
  const { equipoId, campeonatoId } = req.params;

  try {
    const categoria = await equipoService.getCategoriaEquipoByCampeonato(equipoId, campeonatoId);
    if (!categoria) {
      return res.status(404).json({ message: 'No se encontró la categoría para este equipo en el campeonato especificado.' });
    }
    res.json(categoria);
  } catch (error) {
    console.error('Error al obtener la categoría:', error);
    res.status(500).json({ message: 'Error al obtener la categoría.' });
  }
};
