const express = require('express');
const sql = require('mssql');
const router = express.Router();

router.post('/post_jugador', async (req, res) => {
    const { persona_id, club_id } = req.body;

    if (!persona_id || !club_id) {
        return res.status(400).json({ message: 'Los campos persona_id y club_id deben ser proporcionados' });
    }

    let transaction;
    try {
        // Inicia la transacción
        transaction = new sql.Transaction();
        await transaction.begin();

        const transactionRequest = new sql.Request(transaction);

        // Insertar en PersonaRol con el rol de 'Jugador' (id 5)
        await transactionRequest
            .input('persona_rol_id', sql.Int, persona_id)
            .input('rol_id', sql.Int, 5)  // id 5 es el rol de 'Jugador'
            .query(`
                INSERT INTO PersonaRol (persona_id, rol_id)
                VALUES (@persona_rol_id, @rol_id)
            `);

        // Insertar en Jugador
        await transactionRequest
            .input('jugador_id', sql.Int, persona_id)
            .input('club_id', sql.Int, club_id)
            .query(`
                INSERT INTO Jugador (id, club_id)
                VALUES (@jugador_id, @club_id)
            `);

        // Commit de la transacción
        await transaction.commit();

        res.status(201).json({ message: 'Jugador asignado correctamente' });

    } catch (err) {
        console.error('Error:', err.message);

        // Rollback de la transacción en caso de error
        if (transaction) {
            await transaction.rollback();
        }

        res.status(500).json({ message: 'Error al asignar el jugador', error: err.message });
    }
});

router.get('/get_jugador_club/:club_id', async (req, res) => {
    const { club_id } = req.params;

    if (!club_id) {
        return res.status(400).json({ message: 'El club_id debe ser proporcionado' });
    }

    try {
        const request = new sql.Request();

        // Consultar todos los jugadores asociados a un club específico
        const result = await request
            .input('club_id', sql.Int, club_id)
            .query(`
                SELECT 
                    j.id AS jugador_id, 
                    j.club_id, 
                    p.nombre, 
                    p.apellido, 
                    p.ci, 
                    p.fecha_nacimiento,
                    ip.persona_imagen
                FROM Jugador j
                JOIN Persona p ON j.id = p.id
                LEFT JOIN ImagenPersona ip ON p.id = ip.persona_id
                WHERE j.club_id = @club_id AND p.eliminado = 'N'
            `);

        res.status(200).json(result.recordset);

    } catch (err) {
        console.error('Error:', err.message);
        res.status(500).json({ message: 'Error al obtener los jugadores del club', error: err.message });
    }
});


module.exports = router;
