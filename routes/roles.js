const express = require('express');
const sql = require('mssql');
const router = express.Router();

//Select
router.get('/get_rol', async (req, res) => {
    try {
      const request = new sql.Request();
      const result = await request.query('SELECT * FROM Rol');
      res.status(200).json(result.recordset);
    } catch (err) {
      console.error('Error:', err.message);
      res.status(500).json({ message: 'Error al obtener roles', error: err.message });
    }
  });

//Insert
router.post('/post_rol', async (req, res) => {
  const { nombre } = req.body;

  if (!nombre) {
    return res.status(400).json({ message: 'El campo nombre debe ser proporcionado' });
  }

  try {
    const request = new sql.Request();

    // Usar consultas parametrizadas para prevenir inyección SQL
    const resultRol = await request
      .input('nombre', sql.VarChar(255), nombre)
      .query(`
        INSERT INTO Rol (nombre)
        OUTPUT inserted.id
        VALUES (@nombre)
      `);

    const rolId = resultRol.recordset[0].id;

    res.status(201).json({ message: 'Rol creado', rolId });

  } catch (err) {
    console.error('Error:', err.message);
    res.status(500).json({ message: 'Error al crear Rol', error: err.message });
  }
});

module.exports = router;
