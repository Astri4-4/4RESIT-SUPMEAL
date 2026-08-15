import {query} from "../database/db.js";

export async function findOrCreateTag(name) {
    try {
        const existing = await query(`SELECT id FROM tags WHERE name = $1`, [name]);
        if (existing.rows.length > 0) {
            return existing.rows[0];
        }

        const created = await query(`INSERT INTO tags (name) VALUES ($1) RETURNING id`, [name]);
        return created.rows[0];
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export async function addTagToRecipe(recipeId, tagId) {
    try {
        await query(`INSERT INTO recipe_tags (recipe_id, tag_id) VALUES ($1, $2)`, [recipeId, tagId]);
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export async function clearRecipeTags(recipeId) {
    try {
        await query(`DELETE FROM recipe_tags WHERE recipe_id = $1`, [recipeId]);
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export async function getTagsByRecipeIds(recipeIds) {
    if (recipeIds.length === 0) return [];
    try {
        const result = await query(
            `SELECT recipe_tags.recipe_id, tags.id, tags.name
             FROM recipe_tags
             JOIN tags ON tags.id = recipe_tags.tag_id
             WHERE recipe_tags.recipe_id = ANY($1::int[])`,
            [recipeIds]
        );
        return result.rows;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export async function getAll() {
    try {
        const tags = await query(
            `SELECT * FROM tags;`,
            []
        );
        return tags.rows;
    } catch (error) {
        console.error(error);
        throw error;
    }
}