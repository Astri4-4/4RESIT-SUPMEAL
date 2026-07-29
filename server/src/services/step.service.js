import {query} from "../database/db.js";

export async function createStep(recipeId, step) {
    try {
        const result = await query(
            `INSERT INTO recipe_steps (recipe_id, step_number, description) VALUES ($1, $2, $3)`,
            [recipeId, step.step_number, step.description]
        )
    } catch (error) {
        console.error(error)
        throw error;
    }
}