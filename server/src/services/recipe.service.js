import {query} from "../database/db.js";

export async function createRecipe(recipe) {
    try {
        const result = await query(
            `INSERT INTO recipes (title, description, preptime, servings, owner) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [recipe.title, recipe.description, recipe.prepTime, recipe.servings, recipe.owner]
        );
        return result;
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

export async function isRecipeInCookbook(recipeId) {
    try {
        const result = await query(
            `SELECT id FROM cookbook_recipes WHERE recipe_id = $1`,
            [recipeId]
        );
        return result.rows > 0;
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