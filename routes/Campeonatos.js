const express = require('express');
const router = express.Router();
const sql = require('mssql');

// Crear un nuevo campeonato
router.post('/insert', async (req, res) => {
  const { nombre, fecha_inicio, fecha_fin } = req.body;

  if (!nombre || !fecha_inicio || !fecha_fin) {
    console.log('Error: Todos los campos deben ser proporcionados');
    return res.status(400).json({ message: 'Todos los campos deben ser proporcionados' });
  }

  try {
    const request = new sql.Request();

    // Normalize the name for comparison
    const normalizedNombre = nombre.replace(/\s+/g, '').toUpperCase();

    // Check if the championship name already exists
    const checkNameResult = await request.query(`
      SELECT id FROM Campeonato
      WHERE REPLACE(UPPER(nombre), ' ', '') = '${normalizedNombre}'
    `);

    if (checkNameResult.recordset.length > 0) {
      console.log('Error: El nombre del campeonato ya existe');
      return res.status(400).json({ message: 'El nombre del campeonato ya existe' });
    }

    // Insertar en Campeonato
    const resultCampeonato = await request
      .input('nombre', sql.VarChar(255), nombre)
      .input('fecha_inicio', sql.Date, fecha_inicio)
      .input('fecha_fin', sql.Date, fecha_fin)
      .query(`
        INSERT INTO Campeonato (nombre, fecha_inicio, fecha_fin)
        OUTPUT inserted.id
        VALUES (@nombre, @fecha_inicio, @fecha_fin)
      `);

    const campeonatoId = resultCampeonato.recordset[0].id;
    console.log('Campeonato creado exitosamente con ID:', campeonatoId);
    res.status(201).json({ message: 'Campeonato creado exitosamente', campeonatoId });

  } catch (err) {
    console.error('Error al insertar el campeonato:', err.message);
    res.status(500).json({ message: 'Error al crear el Campeonato', error: err.message });
  }
});



router.get('/get_campeonato_categoria/:campeonato_id/:categoria_id', async (req, res) => {
  const { campeonato_id, categoria_id } = req.params; // Obtener los parámetros desde la URL

  try {
    const request = new sql.Request();

    // Preparar la consulta SQL
    const query = `
      SELECT C.nombre AS campeonato_nombre, CT.nombre AS categoria_nombre
      FROM Campeonato C
      INNER JOIN EquipoCampeonato EC ON EC.campeonatoId = C.id
      INNER JOIN Equipo E ON EC.equipoId = E.id
      INNER JOIN Categoria CT ON E.categoria_id = CT.id
      WHERE C.id = @campeonato_id AND CT.id = @categoria_id
    `;

    // Establecer los parámetros de entrada
    request.input('campeonato_id', sql.Int, campeonato_id);
    request.input('categoria_id', sql.SmallInt, categoria_id);

    const result = await request.query(query);

    if (result.recordset.length > 0) {
      res.status(200).json(result.recordset[0]); // Devolver el primer (y único) resultado
    } else {
      res.status(404).json({ message: 'Campeonato o Categoría no encontrados' });
    }
  } catch (err) {
    console.error('Error:', err.message);
    res.status(500).json({ message: 'Error al obtener los nombres del campeonato y categoría', error: err.message });
  }
});

router.get('/select', async (req, res) => {
  try {
    const request = new sql.Request();

    // Seleccionar todos los campeonatos
    const resultCampeonatos = await request.query(`
      SELECT id, nombre, fecha_inicio, fecha_fin
      FROM Campeonato
    `);

    console.log('Campeonatos seleccionados exitosamente');
    res.status(200).json(resultCampeonatos.recordset);

  } catch (err) {
    console.error('Error al seleccionar los campeonatos:', err.message);
    res.status(500).json({ message: 'Error al seleccionar los Campeonatos', error: err.message });
  }
});


router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const request = new sql.Request();
    const result = await request
      .input('id', sql.Int, id)
      .query('SELECT id, nombre, fecha_inicio, fecha_fin FROM Campeonato WHERE id = @id');

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Campeonato no encontrado' });
    }

    res.status(200).json(result.recordset[0]);
  } catch (err) {
    console.error('Error al obtener el campeonato:', err.message);
    res.status(500).json({ message: 'Error al obtener el campeonato', error: err.message });
  }
});

router.put('/edit/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre, fecha_inicio, fecha_fin } = req.body;

  if (!nombre || !fecha_inicio || !fecha_fin) {
    console.log('Error: Todos los campos deben ser proporcionados');
    return res.status(400).json({ message: 'Todos los campos deben ser proporcionados' });
  }

  try {
    const request = new sql.Request();

    // Normalize the name for comparison
    const normalizedNombre = nombre.replace(/\s+/g, '').toUpperCase();

    // Check if the championship name already exists for another record
    const checkNameResult = await request.query(`
      SELECT id FROM Campeonato
      WHERE REPLACE(UPPER(nombre), ' ', '') = '${normalizedNombre}' AND id != ${id}
    `);

    if (checkNameResult.recordset.length > 0) {
      console.log('Error: El nombre del campeonato ya existe para otro registro');
      return res.status(400).json({ message: 'El nombre del campeonato ya existe para otro registro' });
    }

    // Update Campeonato
    await request
      .input('nombre', sql.VarChar(255), nombre)
      .input('fecha_inicio', sql.Date, fecha_inicio)
      .input('fecha_fin', sql.Date, fecha_fin)
      .query(`
        UPDATE Campeonato
        SET nombre = @nombre, fecha_inicio = @fecha_inicio, fecha_fin = @fecha_fin
        WHERE id = ${id}
      `);

    console.log('Campeonato editado exitosamente');
    res.status(200).json({ message: 'Campeonato editado exitosamente' });

  } catch (err) {
    console.error('Error al editar el campeonato:', err.message);
    res.status(500).json({ message: 'Error al editar el Campeonato', error: err.message });
  }
});
module.exports = router;
