import {query} from "../database/db.js";

export async function getTagsByUserId(userId) {
    try {
        const result = await query(
            `SELECT tags.id, tags.name
             FROM user_tags
             JOIN tags ON tags.id = user_tags.tag_id
             WHERE user_tags.user_id = $1
             ORDER BY tags.name`,
            [userId]
        );
        return result.rows;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export async function setUserTags(userId, tagIds) {
    try {
        await query(`DELETE FROM user_tags WHERE user_id = $1`, [userId]);
        for (const tagId of tagIds) {
            await query(`INSERT INTO user_tags (user_id, tag_id) VALUES ($1, $2)`, [userId, tagId]);
        }
        return getTagsByUserId(userId);
    } catch (error) {
        console.error(error);
        throw error;
    }
}
