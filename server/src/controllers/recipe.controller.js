import {addIngredientToRecipe, clearRecipeIngredients, createIngredient} from "../services/ingredient.service.js";
import {clearRecipeSteps, createStep} from "../services/step.service.js";
import {addTagToRecipe, clearRecipeTags, findOrCreateTag} from "../services/tag.service.js";
import {deleteRecipeImage, saveRecipeImageFromUrl} from "../middlewares/asset.middleware.js";
import * as recipeService from "../services/recipe.service.js";
import * as shoppingListService from "../services/shoppingList.service.js";
import * as recipeImportService from "../services/recipeImport.service.js";
import {getFavoritesByUser} from "../services/favorite.service.js";
import {getTagsByRecipeIds} from "../services/tag.service.js";
import {getPlannedRecipeIds} from "../services/plan.service.js";
import {getRecipeIdsInShoppingList} from "../services/shoppingList.service.js";

async function withRecipeExtras(recipes, userId) {
    const recipeIds = recipes.map((recipe) => recipe.id);

    const [favorites, tagRows, plannedIds, shoppingListIds] = await Promise.all([
        getFavoritesByUser(userId),
        getTagsByRecipeIds(recipeIds),
        getPlannedRecipeIds(userId, recipeIds),
        getRecipeIdsInShoppingList(userId, recipeIds),
    ]);

    const favoriteByRecipeId = new Map(favorites.map((f) => [f.recipe_id, f.id]));
    const plannedRecipeIds = new Set(plannedIds);
    const shoppingListRecipeIds = new Set(shoppingListIds);

    const tagsByRecipeId = new Map();
    for (const row of tagRows) {
        if (!tagsByRecipeId.has(row.recipe_id)) {
            tagsByRecipeId.set(row.recipe_id, []);
        }
        tagsByRecipeId.get(row.recipe_id).push({id: row.id, name: row.name});
    }

    return recipes.map((recipe) => ({
        ...recipe,
        favorite: favoriteByRecipeId.has(recipe.id),
        favoriteId: favoriteByRecipeId.get(recipe.id) ?? null,
        tags: tagsByRecipeId.get(recipe.id) ?? [],
        inMealPlan: plannedRecipeIds.has(recipe.id),
        inShoppingList: shoppingListRecipeIds.has(recipe.id),
    }));
}

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

export async function importRecipeFromUrl(url, ownerId) {
    const parsed = await recipeImportService.fetchMarmitonRecipe(url);

    const created = await createRecipe({
        title: parsed.title,
        description: parsed.description,
        prepTime: parsed.prepTime,
        cookTime: parsed.cookTime,
        servings: parsed.servings,
        ingredients: parsed.ingredients,
        steps: parsed.steps,
        owner: ownerId,
    });

    for (const tagName of parsed.tags) {
        try {
            const tag = await findOrCreateTag(tagName);
            await addTagToRecipe(created.id, tag.id);
        } catch (error) {
            console.error("Failed to attach imported tag:", error);
        }
    }

    if (parsed.imageUrl) {
        try {
            const imagePath = await saveRecipeImageFromUrl(parsed.imageUrl);
            await recipeService.updateImage(imagePath, created.id);
        } catch (error) {
            console.error("Failed to import recipe image:", error);
        }
    }

    return await getRecipeById(created.id, ownerId);
}

export async function updateImage(imageUrl, recipeId) {
    try {
        return await recipeService.updateImage(imageUrl, recipeId);
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export async function getRecipeById(id, userId) {
    try {
        const recipe = await recipeService.getRecipeById(id);
        const [withExtras] = await withRecipeExtras(recipe, userId);
        return withExtras;
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

export async function getMyRecipes(userId) {
    try {
        const recipes = await recipeService.getRecipesByOwner(userId);
        return await withRecipeExtras(recipes, userId);
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export async function getShoppingList(userId) {
    try {
        return await shoppingListService.getShoppingList(userId);
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export async function addRecipeIngredientsToShoppingList(userId, recipeId) {
    try {
        return await shoppingListService.addRecipeIngredientsToShoppingList(userId, recipeId);
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export async function deleteShoppingListItem(userId, itemId) {
    try {
        return await shoppingListService.deleteShoppingListItem(userId, itemId);
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export async function searchRecipes(queries, userId) {
    const {name, tag, servings, prepTime, page} = queries;

    try {
        const recipes = await recipeService.searchRecipes({
            name,
            tag,
            servings: servings !== undefined ? parseInt(servings, 10) : undefined,
            prepTime: prepTime !== undefined ? parseInt(prepTime, 10) : undefined,
            page: page !== undefined ? parseInt(page, 10) : 1,
        });
        return await withRecipeExtras(recipes, userId);
    } catch (error) {
        console.error(error);
        throw error;
    }

}

export async function searchRecipesInCookbook(cookbookId, queries, userId) {
    const {name, tag, servings, prepTime, page} = queries;

    try {
        const recipes = await recipeService.searchRecipesInCookbook(cookbookId, {
            name,
            tag,
            servings: servings !== undefined ? parseInt(servings, 10) : undefined,
            prepTime: prepTime !== undefined ? parseInt(prepTime, 10) : undefined,
            page: page !== undefined ? parseInt(page, 10) : 1,
        });
        return await withRecipeExtras(recipes, userId);
    } catch (error) {
        console.error(error);
        throw error;
    }

}