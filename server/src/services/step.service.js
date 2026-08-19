import {query} from "../database/db.js";

export async function createStep(recipeId, step) {
    try {
        await query(
            `INSERT INTO recipe_steps (recipe_id, step_number, description) VALUES ($1, $2, $3)`,
            [recipeId, step.step_number, step.description]
        );
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export async function clearRecipeSteps(recipeId) {
    try {
        await query(`DELETE FROM recipe_steps WHERE recipe_id = $1`, [recipeId]);
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export async function getStepsByRecipeIds(recipeIds) {
    if (recipeIds.length === 0) return [];
    try {
        const result = await query(
            `SELECT recipe_id, description
             FROM recipe_steps
             WHERE recipe_id = ANY($1::int[])`,
            [recipeIds]
        );
        return result.rows;
    } catch (error) {
        console.error(error);
        throw error;
    }
}