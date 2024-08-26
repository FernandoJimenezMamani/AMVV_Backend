const express = require('express');
const sql = require('mssql');
const router = express.Router();

router.post('/post_presidente_club', async (req, res) => {
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

        // Insertar en PersonaRol con el rol de 'PresidenteClub' (id 3)
        await transactionRequest
            .input('persona_rol_id', sql.Int, persona_id)
            .input('rol_id', sql.Int, 3)  // id 3 es el rol de 'PresidenteClub'
            .query(`
                INSERT INTO PersonaRol (persona_id, rol_id)
                VALUES (@persona_rol_id, @rol_id)
            `);

        // Insertar en PresidenteClub
        await transactionRequest
            .input('persona_presidente_club_id', sql.Int, persona_id)
            .input('club_presidente_club_id', sql.Int, club_id)
            .query(`
                INSERT INTO PresidenteClub (id, club_id)
                VALUES (@persona_presidente_club_id, @club_presidente_club_id)
            `);

        // Actualizar la tabla Club para establecer presidente_asignado a 'S'
        await transactionRequest
            .input('club_id', sql.Int, club_id)
            .query(`
                UPDATE Club
                SET presidente_asignado = 'S'
                WHERE id = @club_id
            `);

        // Commit de la transacción
        await transaction.commit();

        res.status(201).json({ message: 'Presidente del club asignado correctamente y club actualizado' });

    } catch (err) {
        console.error('Error:', err.message);

        // Rollback de la transacción en caso de error
        if (transaction) {
            await transaction.rollback();
        }

        res.status(500).json({ message: 'Error al asignar el presidente del club y actualizar el club', error: err.message });
    }
});

module.exports = router;
