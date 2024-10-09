const express = require('express');
const router = express.Router();
const sql = require('mssql');

// Insert a new Partido
router.post('/insert', async (req, res) => {
  const { campeonato_id, equipo_local_id, equipo_visitante_id, fecha, lugar_id, resultado } = req.body;

  if (!campeonato_id || !equipo_local_id || !equipo_visitante_id || !fecha || !lugar_id) {
    console.log('Error: Todos los campos requeridos deben ser proporcionados');
    return res.status(400).json({ message: 'Todos los campos requeridos deben ser proporcionados' });
  }

  try {
    const request = new sql.Request();
    await request
      .input('campeonato_id', sql.Int, campeonato_id)
      .input('equipo_local_id', sql.Int, equipo_local_id)
      .input('equipo_visitante_id', sql.Int, equipo_visitante_id)
      .input('fecha', sql.DateTime, fecha)
      .input('lugar_id', sql.TinyInt, lugar_id)
      .input('resultado', sql.VarChar(255), resultado)
      .query(`
        INSERT INTO Partido (campeonato_id, equipo_local_id, equipo_visitante_id, fecha, lugar_id)
        VALUES (@campeonato_id, @equipo_local_id, @equipo_visitante_id, @fecha, @lugar_id)
      `);

    console.log('Partido creado exitosamente');
    res.status(201).json({ message: 'Partido creado exitosamente' });

  } catch (err) {
    console.error('Error al insertar el partido:', err.message);
    res.status(500).json({ message: 'Error al crear el Partido', error: err.message });
  }
});

// Select all Partidos
router.get('/select/:categoriaId', async (req, res) => {
  const { categoriaId } = req.params;

  try {
    const request = new sql.Request();
    
    // Declare the SQL parameter
    request.input('categoriaId', sql.Int, categoriaId);

    const resultPartidos = await request.query(`
      SELECT 
    P.id, 
    P.campeonato_id, 
    P.equipo_local_id, 
    P.equipo_visitante_id, 
    P.fecha, 
    P.lugar_id, 
    EL.nombre AS equipo_local_nombre,
    EV.nombre AS equipo_visitante_nombre,
    ICL.club_imagen AS equipo_local_imagen,
    ICV.club_imagen AS equipo_visitante_imagen,
    C.nombre AS categoria_nombre
    FROM 
        Partido P
    JOIN 
        Equipo EL ON P.equipo_local_id = EL.id
    JOIN 
        Equipo EV ON P.equipo_visitante_id = EV.id
    JOIN 
        ImagenClub ICL ON EL.club_id = ICL.club_id
    JOIN 
        ImagenClub ICV ON EV.club_id = ICV.club_id
    JOIN 
        Categoria C ON EL.categoria_id = C.id
    WHERE 
        C.id = @categoriaId
    ORDER BY 
        P.fecha ASC;
    `);

    console.log('Partidos seleccionados exitosamente');
    res.status(200).json(resultPartidos.recordset);

  } catch (err) {
    console.error('Error al seleccionar los partidos:', err.message);
    res.status(500).json({ message: 'Error al seleccionar los Partidos', error: err.message });
  }
});


router.get('/get_upcoming_matches/:categoria', async (req, res) => {
  const { categoria } = req.params;

  try {
    const request = new sql.Request();
    const query = `
      SELECT TOP 3 
        P.id, 
        P.fecha, 
        EL.nombre AS equipo_local_nombre, 
        EV.nombre AS equipo_visitante_nombre, 
        ICL.club_imagen AS equipo_local_imagen, 
        ICV.club_imagen AS equipo_visitante_imagen 
      FROM Partido P
      JOIN Equipo EL ON P.equipo_local_id = EL.id
      JOIN Equipo EV ON P.equipo_visitante_id = EV.id
      JOIN ImagenClub ICL ON EL.club_id = ICL.club_id
      JOIN ImagenClub ICV ON EV.club_id = ICV.club_id
      JOIN Categoria C ON EL.categoria_id = C.id
      WHERE C.id = @categoria
      ORDER BY P.fecha ASC;
    `;
    
    request.input('categoria', sql.VarChar, categoria);
    const result = await request.query(query);
    res.status(200).json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/get_all_matches/:categoria', async (req, res) => {
  const { categoria } = req.params;

  try {
    const request = new sql.Request();
    const query = `
      SELECT 
        P.id, 
        P.fecha, 
        EL.nombre AS equipo_local_nombre, 
        EV.nombre AS equipo_visitante_nombre, 
        ICL.club_imagen AS equipo_local_imagen, 
        ICV.club_imagen AS equipo_visitante_imagen 
      FROM Partido P
      JOIN Equipo EL ON P.equipo_local_id = EL.id
      JOIN Equipo EV ON P.equipo_visitante_id = EV.id
      JOIN ImagenClub ICL ON EL.club_id = ICL.club_id
      JOIN ImagenClub ICV ON EV.club_id = ICV.club_id
      JOIN Categoria C ON EL.categoria_id = C.id
      WHERE C.id = @categoria
      AND P.id NOT IN (
        SELECT TOP 3 P.id 
        FROM Partido P
        JOIN Equipo EL ON P.equipo_local_id = EL.id
        JOIN Categoria C ON EL.categoria_id = C.id
        WHERE C.id = @categoria
        ORDER BY P.fecha ASC
      )
      ORDER BY P.fecha ASC;
    `;
    
    request.input('categoria', sql.VarChar, categoria);
    const result = await request.query(query);
    res.status(200).json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



// Select one Partido by id
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const request = new sql.Request();
    const result = await request
      .input('id', sql.Int, id)
      .query('SELECT id, campeonato_id, equipo_local_id, equipo_visitante_id, fecha, lugar_id FROM Partido WHERE id = @id');

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Partido no encontrado' });
    }

    res.status(200).json(result.recordset[0]);
  } catch (err) {
    console.error('Error al obtener el partido:', err.message);
    res.status(500).json({ message: 'Error al obtener el Partido', error: err.message });
  }
});

// Update a Partido
router.put('/edit/:id', async (req, res) => {
  const { id } = req.params;
  const { campeonato_id, equipo_local_id, equipo_visitante_id, fecha, lugar_id, resultado } = req.body;

  if (!campeonato_id || !equipo_local_id || !equipo_visitante_id || !fecha || !lugar_id) {
    console.log('Error: Todos los campos requeridos deben ser proporcionados');
    return res.status(400).json({ message: 'Todos los campos requeridos deben ser proporcionados' });
  }

  try {
    const request = new sql.Request();
    await request
      .input('campeonato_id', sql.Int, campeonato_id)
      .input('equipo_local_id', sql.Int, equipo_local_id)
      .input('equipo_visitante_id', sql.Int, equipo_visitante_id)
      .input('fecha', sql.DateTime, fecha)
      .input('lugar_id', sql.TinyInt, lugar_id)
      .input('resultado', sql.VarChar(255), resultado)
      .query(`
        UPDATE Partido
        SET campeonato_id = @campeonato_id, equipo_local_id = @equipo_local_id, equipo_visitante_id = @equipo_visitante_id, fecha = @fecha, lugar_id = @lugar_id, resultado = @resultado
        WHERE id = @id
      `);

    console.log('Partido editado exitosamente');
    res.status(200).json({ message: 'Partido editado exitosamente' });

  } catch (err) {
    console.error('Error al editar el partido:', err.message);
    res.status(500).json({ message: 'Error al editar el Partido', error: err.message });
  }
});

// "Delete" a Partido (soft delete by setting resultado to 'ELIMINADO')
router.put('/delete/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const request = new sql.Request();
    await request
      .input('id', sql.Int, id)
      .query(`
        UPDATE Partido
        SET resultado = 'ELIMINADO'
        WHERE id = @id
      `);

    console.log('Partido eliminado exitosamente');
    res.status(200).json({ message: 'Partido eliminado exitosamente' });

  } catch (err) {
    console.error('Error al eliminar el partido:', err.message);
    res.status(500).json({ message: 'Error al eliminar el Partido', error: err.message });
  }
});

module.exports = router;
