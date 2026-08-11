import {query} from '../database/db.js';

export async function addFavorite(userId, recipeId) {

    const result = await query(
        `INSERT INTO favorites (user_id, recipe_id) VALUES ($1, $2) RETURNING *`, [userId, recipeId]
    );

    return result.rows[0];

}

export async function getFavorites(userId) {
    return await query(
        `SELECT * FROM favorites WHERE user_id = $1`,
        [userId]
    )
}

export async function getFavoriteById(id) {
    const result = await query(
        `SELECT * FROM favorites WHERE id = $1`, [id]
    );
    return result.rows[0];
}

export async function deleteFavorite(userId, favoriteId) {
    const result = await query(
        `DELETE FROM favorites WHERE user_id = $1 AND id = $2 RETURNING *`, [userId, favoriteId]
    )
    return result.rows[0];
}