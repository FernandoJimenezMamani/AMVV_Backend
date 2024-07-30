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
