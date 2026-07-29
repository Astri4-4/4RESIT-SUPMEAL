import {addIngredientToRecipe, createIngredient} from "../services/ingredient.service.js";
import {createStep} from "../services/step.service.js";
import * as recipeService from "../services/recipe.service.js";

export async function createRecipe(recipe) {

    const ingredients = recipe.ingredients;
    const steps = recipe.steps;

    const result = await recipeService.createRecipe(recipe);

    for (const ingredient of ingredients) {
        try {
            const stored = await createIngredient(ingredient);
            await addIngredientToRecipe(result.rows[0].id, stored.id, ingredient.quantity);
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    for (const step of steps) {
        try {
            await createStep(result.rows[0].id, step);
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

}

export async function updateImage(imageUrl, recipeId) {
    try {
        const result = await recipeService.updateImage(imageUrl, recipeId);
        return result;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export async function getRecipeById(id) {
    try {
        const recipe = recipeService.getRecipeById(id);
        return recipe[0];
    } catch (error) {
        console.error(error);
        throw error;
    }
}