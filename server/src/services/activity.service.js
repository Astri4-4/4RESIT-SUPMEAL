import {query} from "../database/db.js";

export async function createActivity({cookbookId, userId, type, recipeId = null, commentId = null, excerpt = null}) {
    try {
        const result = await query(
            `INSERT INTO activities (cookbook_id, user_id, type, recipe_id, comment_id, excerpt)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [cookbookId, userId, type, recipeId, commentId, excerpt]
        );
        return result.rows[0];
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export async function getRecentActivitiesForUser(userId, limit) {
    try {
        const result = await query(
            `SELECT a.id, a.type, a.excerpt, a.created_at,
                    actor.id AS actor_id, actor.username AS actor_username,
                    r.id AS recipe_id, r.title AS recipe_title, r.image_url AS recipe_image_url,
                    c.id AS cookbook_id, c.title AS cookbook_title, c.image_url AS cookbook_image_url
             FROM activities a
             JOIN users actor ON actor.id = a.user_id
             JOIN cookbooks c ON c.id = a.cookbook_id
             LEFT JOIN recipes r ON r.id = a.recipe_id
             WHERE a.cookbook_id IN (SELECT cookbook_id FROM cookbook_users WHERE user_id = $1)
             ORDER BY a.created_at DESC
             LIMIT $2`,
            [userId, limit]
        );
        return result.rows;
    } catch (error) {
        console.error(error);
        throw error;
    }
}
