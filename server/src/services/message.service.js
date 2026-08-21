import {query} from '../database/db.js';

export async function createMessage(cookbookId, userId, message) {
    try {
        const result = await query(
            `INSERT INTO cookbook_messages (cookbook_id, user_id, message) VALUES ($1, $2, $3) RETURNING *`,
            [cookbookId, userId, message]
        );
        return result.rows[0];
    } catch (error) {
        throw new Error('Erreur lors de la création du message : ' + error.message, { cause: error });
    }
}

export async function getMessagesByCookbookId(cookbookId, limit = 50) {
    try {
        const result = await query(
            `SELECT m.id, m.cookbook_id, m.user_id, u.username, m.message, m.created_at
             FROM cookbook_messages m
             JOIN users u ON u.id = m.user_id
             WHERE m.cookbook_id = $1
             ORDER BY m.created_at DESC
             LIMIT $2`,
            [cookbookId, limit]
        );
        return result.rows.reverse();
    } catch (error) {
        throw new Error('Erreur lors de la récupération des messages : ' + error.message, { cause: error });
    }
}
