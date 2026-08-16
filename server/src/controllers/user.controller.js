import * as userService from '../services/user.service.js';
import * as userTagService from '../services/userTag.service.js';
import * as recipeService from '../services/recipe.service.js';
import * as ingredientService from '../services/ingredient.service.js';
import * as stepService from '../services/step.service.js';
import * as tagService from '../services/tag.service.js';
import * as cookbookService from '../services/cookbook.service.js';
import * as planService from '../services/plan.service.js';
import bcrypt from 'bcrypt';

const UPDATABLE_FIELDS = ['username', 'email', 'password', 'image_url'];

export async function getUserById(user) {
    const id = user.id;

    try {
        const stored = await userService.getUserById(id);
        if (!stored) return null;

        const {google_id, ...rest} = stored;
        return {...rest, googleLinked: !!google_id};
    } catch (error) {
        throw new Error('Error retrieving user information');
    }

}

export async function updateUser(user, updates) {
    const fieldsToUpdate = {};

    for (const field of UPDATABLE_FIELDS) {
        if (updates[field] !== undefined) {
            fieldsToUpdate[field] = updates[field];
        }
    }

    if (fieldsToUpdate.password !== undefined) {
        fieldsToUpdate.password_hash = await bcrypt.hash(fieldsToUpdate.password, 10);
        delete fieldsToUpdate.password;
    }

    try {
        return await userService.updateUser(user.id, fieldsToUpdate);
    } catch (error) {
        console.log(error)
        throw new Error('Error updating user information');
    }
}

export async function deleteUser(user) {
    try {
        return await userService.deleteUserById(user.id);
    } catch (error) {
        throw new Error('Error deleting user');
    }
}

export async function getUserPreferences(userId) {
    try {
        return await userTagService.getTagsByUserId(userId);
    } catch (error) {
        throw new Error('Error retrieving user preferences');
    }
}

export async function updateUserPreferences(userId, tagIds) {
    try {
        return await userTagService.setUserTags(userId, tagIds);
    } catch (error) {
        throw new Error('Error updating user preferences');
    }
}

export async function exportUserData(userId) {
    try {
        const ownedRecipes = await recipeService.getRecipesByOwner(userId);
        const recipeIds = ownedRecipes.map((recipe) => recipe.id);

        const tagRows = await tagService.getTagsByRecipeIds(recipeIds);
        const tagNamesByRecipeId = new Map();
        for (const row of tagRows) {
            if (!tagNamesByRecipeId.has(row.recipe_id)) {
                tagNamesByRecipeId.set(row.recipe_id, []);
            }
            tagNamesByRecipeId.get(row.recipe_id).push(row.name);
        }

        const recipes = [];
        for (const recipe of ownedRecipes) {
            const [detail] = await recipeService.getRecipeById(recipe.id);
            recipes.push({
                title: detail.title,
                description: detail.description,
                prepTime: detail.preptime,
                cookTime: detail.cooktime,
                servings: detail.servings,
                ingredients: detail.ingredients.map((ingredient) => ({
                    name: ingredient.name,
                    unit: ingredient.unit,
                    type: ingredient.type,
                    quantity: ingredient.quantity,
                })),
                steps: detail.steps.map((step) => ({
                    step_number: step.step_number,
                    description: step.description,
                })),
                tags: tagNamesByRecipeId.get(recipe.id) ?? [],
            });
        }

        const cookbooks = await cookbookService.getCookbooksByUserId(userId, 0, 1000);

        return {
            exportedAt: new Date().toISOString(),
            recipes,
            cookbooks: cookbooks.map((cookbook) => ({
                title: cookbook.title,
                description: cookbook.description,
            })),
        };
    } catch (error) {
        console.error(error);
        throw new Error('Error exporting user data');
    }
}

export async function importUserData(userId, data) {
    const result = {recipesImported: 0, cookbooksImported: 0};

    try {
        for (const recipe of data.recipes ?? []) {
            const created = await recipeService.createRecipe({
                title: recipe.title,
                description: recipe.description,
                prepTime: recipe.prepTime,
                cookTime: recipe.cookTime,
                servings: recipe.servings,
                owner: userId,
            });
            const recipeId = created.rows[0].id;

            for (const ingredient of recipe.ingredients ?? []) {
                const stored = await ingredientService.createIngredient(ingredient);
                await ingredientService.addIngredientToRecipe(recipeId, stored.id, ingredient.quantity);
            }

            for (const step of recipe.steps ?? []) {
                await stepService.createStep(recipeId, step);
            }

            for (const tagName of recipe.tags ?? []) {
                const tag = await tagService.findOrCreateTag(tagName);
                await tagService.addTagToRecipe(recipeId, tag.id);
            }

            result.recipesImported++;
        }

        for (const cookbook of data.cookbooks ?? []) {
            const created = await cookbookService.create({
                ownerId: userId,
                title: cookbook.title,
                description: cookbook.description,
            });
            await cookbookService.addUserToCookbook(created.id, userId, "owner");
            await planService.createPlan(null, created.id);
            result.cookbooksImported++;
        }

        return result;
    } catch (error) {
        console.error(error);
        throw new Error('Error importing user data');
    }
}