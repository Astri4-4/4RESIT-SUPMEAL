import {query} from "../database/db.js";

export async function createRecipe(recipe) {
    try {
        return await query(
            `INSERT INTO recipes (title, description, preptime, cooktime, servings, owner) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [recipe.title, recipe.description, recipe.prepTime, recipe.cookTime ?? 0, recipe.servings, recipe.owner]
        );
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export async function getRecipeById(id) {
    try {
        const result = await query(
            `SELECT * FROM recipes WHERE id = $1`,
            [id]
        );
        return result.rows;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

const UPDATABLE_RECIPE_FIELDS = {
    title: "title",
    description: "description",
    prepTime: "preptime",
    cookTime: "cooktime",
    servings: "servings",
};

export async function updateRecipe(recipeId, updates) {
    const fields = [];
    const values = [];
    let index = 1;

    for (const [key, column] of Object.entries(UPDATABLE_RECIPE_FIELDS)) {
        if (updates[key] !== undefined) {
            fields.push(`${column} = $${index}`);
            values.push(updates[key]);
            index++;
        }
    }

    if (fields.length === 0) {
        return getRecipeById(recipeId);
    }

    values.push(recipeId);

    try {
        const result = await query(
            `UPDATE recipes SET ${fields.join(", ")} WHERE id = $${index} RETURNING *`,
            values
        );
        return result.rows;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export async function deleteRecipe(recipeId) {
    try {
        const result = await query(
            `DELETE FROM recipes WHERE id = $1 RETURNING *`,
            [recipeId]
        );
        return result.rows[0];
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export async function isRecipeInCookbook(recipeId) {
    try {
        const result = await query(
            `SELECT id FROM cookbook_recipes WHERE recipe_id = $1`,
            [recipeId]
        );
        return result.rows.length > 0;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export async function getCookbookIdForRecipe(recipeId) {
    try {
        const result = await query(
            `SELECT cookbook_id FROM cookbook_recipes WHERE recipe_id = $1 LIMIT 1`,
            [recipeId]
        );
        return result.rows[0] ? result.rows[0].cookbook_id : null;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export async function updateImage(imageUrl, recipeId) {
    try {
        const result = await query(
            `UPDATE recipes SET image_url=$1 WHERE id=$2 RETURNING *`,
            [imageUrl, recipeId]
        );
        return result.rows[0];
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export async function searchRecipes({name, tag, servings, prepTime, page = 1} = {}) {
    const limit = 10;
    const offset = (page - 1) * limit;

    const conditions = [];
    const params = [];

    if (name) {
        params.push(`%${name}%`);
        conditions.push(`recipes.title ILIKE $${params.length}`);
    }
    if (servings) {
        params.push(servings);
        conditions.push(`recipes.servings = $${params.length}`);
    }
    if (prepTime) {
        params.push(prepTime);
        conditions.push(`recipes.preptime <= $${params.length}`);
    }
    if (tag) {
        params.push(`%${tag}%`);
        conditions.push(`EXISTS (
            SELECT 1 FROM recipe_tags rt
            JOIN tags t ON t.id = rt.tag_id
            WHERE rt.recipe_id = recipes.id AND t.name ILIKE $${params.length}
        )`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    params.push(limit);
    const limitIndex = params.length;
    params.push(offset);
    const offsetIndex = params.length;

    try {
        const result = await query(
            `SELECT * FROM recipes ${whereClause} ORDER BY recipes.id LIMIT $${limitIndex} OFFSET $${offsetIndex}`,
            params
        );
        return result.rows;
    } catch (error) {
        console.error(error);
        throw error;
    }
}