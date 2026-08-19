import {query} from "../database/db.js";

export async function createIngredient(ingredient) {
    try {
        const result = await query(
            `INSERT INTO ingredients (name, unit, type) VALUES ($1, $2, $3) RETURNING id`,
            [ingredient.name, ingredient.unit, ingredient.type]
        )
        return result.rows[0];
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export async function addIngredientToRecipe(recipeId, ingredientId, quantity) {
    try {
        const result = await query(
            `INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity) VALUES ($1, $2, $3) RETURNING *`,
            [recipeId, ingredientId, quantity]
        );
        return result.rows[0];
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export async function clearRecipeIngredients(recipeId) {
    try {
        await query(`DELETE FROM recipe_ingredients WHERE recipe_id = $1`, [recipeId]);
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export async function getIngredientsByRecipeIds(recipeIds) {
    if (recipeIds.length === 0) return [];
    try {
        const result = await query(
            `SELECT recipe_ingredients.recipe_id, ingredients.name
             FROM recipe_ingredients
             JOIN ingredients ON ingredients.id = recipe_ingredients.ingredient_id
             WHERE recipe_ingredients.recipe_id = ANY($1::int[])`,
            [recipeIds]
        );
        return result.rows;
    } catch (error) {
        console.error(error);
        throw error;
    }
}