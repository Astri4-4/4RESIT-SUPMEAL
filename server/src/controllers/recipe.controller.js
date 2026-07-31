import {addIngredientToRecipe, clearRecipeIngredients, createIngredient} from "../services/ingredient.service.js";
import {clearRecipeSteps, createStep} from "../services/step.service.js";
import {addTagToRecipe, clearRecipeTags, findOrCreateTag} from "../services/tag.service.js";
import {deleteRecipeImage} from "../middlewares/asset.middleware.js";
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

    return result.rows[0];
}

export async function updateImage(imageUrl, recipeId) {
    try {
        return await recipeService.updateImage(imageUrl, recipeId);
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export async function getRecipeById(id) {
    try {
        const recipe = await recipeService.getRecipeById(id);
        return recipe[0];
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export async function updateRecipe(recipeId, updates) {
    const {title, description, prepTime, cookTime, servings, ingredients, steps, tags} = updates;

    try {
        if (ingredients !== undefined) {
            await clearRecipeIngredients(recipeId);
            for (const ingredient of ingredients) {
                const stored = await createIngredient(ingredient);
                await addIngredientToRecipe(recipeId, stored.id, ingredient.quantity);
            }
        }

        if (steps !== undefined) {
            await clearRecipeSteps(recipeId);
            for (const step of steps) {
                await createStep(recipeId, step);
            }
        }

        if (tags !== undefined) {
            await clearRecipeTags(recipeId);
            for (const tagName of tags) {
                const tag = await findOrCreateTag(tagName);
                await addTagToRecipe(recipeId, tag.id);
            }
        }

        const result = await recipeService.updateRecipe(recipeId, {title, description, prepTime, cookTime, servings});
        return result[0];
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export async function deleteRecipe(recipeId) {
    try {
        const deleted = await recipeService.deleteRecipe(recipeId);
        if (deleted && deleted.image_url) {
            await deleteRecipeImage(deleted.image_url);
        }
        return deleted;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export async function searchRecipes(queries) {
    const {name, tag, servings, prepTime, page} = queries;

    try {
        return await recipeService.searchRecipes({
            name,
            tag,
            servings: servings !== undefined ? parseInt(servings, 10) : undefined,
            prepTime: prepTime !== undefined ? parseInt(prepTime, 10) : undefined,
            page: page !== undefined ? parseInt(page, 10) : 1,
        });
    } catch (error) {
        console.error(error);
        throw error;
    }

}

export async function searchRecipesInCookbook(cookbookId, queries) {
    const {name, tag, servings, prepTime, page} = queries;

    try {
        return await recipeService.searchRecipesInCookbook(cookbookId, {
            name,
            tag,
            servings: servings !== undefined ? parseInt(servings, 10) : undefined,
            prepTime: prepTime !== undefined ? parseInt(prepTime, 10) : undefined,
            page: page !== undefined ? parseInt(page, 10) : 1,
        });
    } catch (error) {
        console.error(error);
        throw error;
    }

}