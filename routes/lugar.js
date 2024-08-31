const express = require('express');
const router = express.Router();
const sql = require('mssql');

// Insert a new Lugar
router.post('/insert', async (req, res) => {
  const { nombre, longitud, latitud } = req.body;

  if (!nombre || !longitud || !latitud) {
    console.log('Error: Todos los campos deben ser proporcionados');
    return res.status(400).json({ message: 'Todos los campos deben ser proporcionados' });
  }

  try {
    const request = new sql.Request();
    await request
      .input('nombre', sql.VarChar(80), nombre)
      .input('longitud', sql.Decimal(9, 6), longitud)
      .input('latitud', sql.Decimal(9, 6), latitud)
      .query(`
        INSERT INTO Lugar (nombre, longitud, latitud, eliminado)
        VALUES (@nombre, @longitud, @latitud, '0')
      `);

    console.log('Lugar creado exitosamente');
    res.status(201).json({ message: 'Lugar creado exitosamente' });

  } catch (err) {
    console.error('Error al insertar el lugar:', err.message);
    res.status(500).json({ message: 'Error al crear el Lugar', error: err.message });
  }
});

// Select all Lugares
router.get('/select', async (req, res) => {
  try {
    const request = new sql.Request();
    const resultLugares = await request.query(`
      SELECT id, nombre, longitud, latitud, eliminado
      FROM Lugar
      WHERE eliminado = '0'
    `);

    console.log('Lugares seleccionados exitosamente');
    res.status(200).json(resultLugares.recordset);

  } catch (err) {
    console.error('Error al seleccionar los lugares:', err.message);
    res.status(500).json({ message: 'Error al seleccionar los Lugares', error: err.message });
  }
});

// Select one Lugar by id
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const request = new sql.Request();
    const result = await request
      .input('id', sql.TinyInt, id)
      .query('SELECT id, nombre, longitud, latitud, eliminado FROM Lugar WHERE id = @id AND eliminado = \'0\'');

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Lugar no encontrado' });
    }

    res.status(200).json(result.recordset[0]);
  } catch (err) {
    console.error('Error al obtener el lugar:', err.message);
    res.status(500).json({ message: 'Error al obtener el lugar', error: err.message });
  }
});

// Update a Lugar
router.put('/edit/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre, longitud, latitud } = req.body;

  if (!nombre || !longitud || !latitud) {
    console.log('Error: Todos los campos deben ser proporcionados');
    return res.status(400).json({ message: 'Todos los campos deben ser proporcionados' });
  }

  try {
    const request = new sql.Request();
    await request
      .input('nombre', sql.VarChar(80), nombre)
      .input('longitud', sql.Decimal(10, 10), longitud)
      .input('latitud', sql.Decimal(10, 10), latitud)
      .query(`
        UPDATE Lugar
        SET nombre = @nombre, longitud = @longitud, latitud = @latitud
        WHERE id = @id AND eliminado = '0'
      `);

    console.log('Lugar editado exitosamente');
    res.status(200).json({ message: 'Lugar editado exitosamente' });

  } catch (err) {
    console.error('Error al editar el lugar:', err.message);
    res.status(500).json({ message: 'Error al editar el Lugar', error: err.message });
  }
});

// "Delete" a Lugar (soft delete by setting eliminado)
router.put('/delete/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const request = new sql.Request();
    await request
      .input('id', sql.TinyInt, id)
      .query(`
        UPDATE Lugar
        SET eliminado = '1'
        WHERE id = @id
      `);

    console.log('Lugar eliminado exitosamente');
    res.status(200).json({ message: 'Lugar eliminado exitosamente' });

  } catch (err) {
    console.error('Error al eliminar el lugar:', err.message);
    res.status(500).json({ message: 'Error al eliminar el Lugar', error: err.message });
  }
});

module.exports = router;
