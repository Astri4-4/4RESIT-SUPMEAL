import {describe, it, expect, vi, beforeEach} from 'vitest';

vi.mock('../../src/services/ingredient.service.js', () => ({
    createIngredient: vi.fn(),
    addIngredientToRecipe: vi.fn(),
    clearRecipeIngredients: vi.fn(),
}));
vi.mock('../../src/services/step.service.js', () => ({
    createStep: vi.fn(),
    clearRecipeSteps: vi.fn(),
}));
vi.mock('../../src/services/tag.service.js', () => ({
    findOrCreateTag: vi.fn(),
    addTagToRecipe: vi.fn(),
    clearRecipeTags: vi.fn(),
}));
vi.mock('../../src/middlewares/asset.middleware.js', () => ({
    deleteRecipeImage: vi.fn(),
}));
vi.mock('../../src/services/recipe.service.js', () => ({
    createRecipe: vi.fn(),
    getRecipeById: vi.fn(),
    updateRecipe: vi.fn(),
    deleteRecipe: vi.fn(),
    searchRecipes: vi.fn(),
    updateImage: vi.fn(),
}));

import {createIngredient, addIngredientToRecipe, clearRecipeIngredients} from '../../src/services/ingredient.service.js';
import {createStep, clearRecipeSteps} from '../../src/services/step.service.js';
import {findOrCreateTag, addTagToRecipe, clearRecipeTags} from '../../src/services/tag.service.js';
import {deleteRecipeImage} from '../../src/middlewares/asset.middleware.js';
import * as recipeService from '../../src/services/recipe.service.js';
import {
    createRecipe,
    getRecipeById,
    updateRecipe,
    deleteRecipe,
    searchRecipes,
    updateImage,
} from '../../src/controllers/recipe.controller.js';

beforeEach(() => {
    vi.resetAllMocks();
});

describe('createRecipe', () => {
    it('creates the recipe row, then each ingredient/link, then each step, in order', async () => {
        recipeService.createRecipe.mockResolvedValue({rows: [{id: 10}]});
        createIngredient
            .mockResolvedValueOnce({id: 101})
            .mockResolvedValueOnce({id: 102});
        addIngredientToRecipe.mockResolvedValue({});
        createStep.mockResolvedValue({});

        const recipe = {
            title: 'Quiche',
            ingredients: [
                {name: 'Egg', quantity: 2},
                {name: 'Flour', quantity: 200},
            ],
            steps: [
                {step_number: 1, description: 'Mix'},
                {step_number: 2, description: 'Bake'},
            ],
        };

        const result = await createRecipe(recipe);

        expect(recipeService.createRecipe).toHaveBeenCalledWith(recipe);
        expect(createIngredient).toHaveBeenNthCalledWith(1, recipe.ingredients[0]);
        expect(createIngredient).toHaveBeenNthCalledWith(2, recipe.ingredients[1]);
        expect(addIngredientToRecipe).toHaveBeenNthCalledWith(1, 10, 101, 2);
        expect(addIngredientToRecipe).toHaveBeenNthCalledWith(2, 10, 102, 200);
        expect(createStep).toHaveBeenNthCalledWith(1, 10, recipe.steps[0]);
        expect(createStep).toHaveBeenNthCalledWith(2, 10, recipe.steps[1]);
        expect(result).toEqual({id: 10});
    });

    it('does nothing extra when ingredients and steps are empty arrays', async () => {
        recipeService.createRecipe.mockResolvedValue({rows: [{id: 11}]});

        await createRecipe({title: 'Empty', ingredients: [], steps: []});

        expect(createIngredient).not.toHaveBeenCalled();
        expect(createStep).not.toHaveBeenCalled();
    });

    it('propagates an error thrown while creating an ingredient', async () => {
        recipeService.createRecipe.mockResolvedValue({rows: [{id: 12}]});
        createIngredient.mockRejectedValue(new Error('ingredient insert failed'));

        await expect(
            createRecipe({title: 'x', ingredients: [{name: 'Egg', quantity: 1}], steps: []})
        ).rejects.toThrow('ingredient insert failed');
    });

    it('propagates an error thrown while creating a step', async () => {
        recipeService.createRecipe.mockResolvedValue({rows: [{id: 13}]});
        createStep.mockRejectedValue(new Error('step insert failed'));

        await expect(
            createRecipe({title: 'x', ingredients: [], steps: [{step_number: 1, description: 'x'}]})
        ).rejects.toThrow('step insert failed');
    });
});

describe('updateRecipe', () => {
    it('replaces ingredients only when the ingredients array is provided', async () => {
        recipeService.updateRecipe.mockResolvedValue([{id: 1}]);
        createIngredient.mockResolvedValue({id: 201});

        await updateRecipe(1, {ingredients: [{name: 'Egg', quantity: 3}]});

        expect(clearRecipeIngredients).toHaveBeenCalledWith(1);
        expect(createIngredient).toHaveBeenCalledWith({name: 'Egg', quantity: 3});
        expect(addIngredientToRecipe).toHaveBeenCalledWith(1, 201, 3);
    });

    it('does not touch ingredients when the field is omitted', async () => {
        recipeService.updateRecipe.mockResolvedValue([{id: 1}]);

        await updateRecipe(1, {title: 'New title'});

        expect(clearRecipeIngredients).not.toHaveBeenCalled();
        expect(createIngredient).not.toHaveBeenCalled();
    });

    it('replaces steps only when the steps array is provided', async () => {
        recipeService.updateRecipe.mockResolvedValue([{id: 1}]);

        await updateRecipe(1, {steps: [{step_number: 1, description: 'Mix'}]});

        expect(clearRecipeSteps).toHaveBeenCalledWith(1);
        expect(createStep).toHaveBeenCalledWith(1, {step_number: 1, description: 'Mix'});
    });

    it('does not touch steps when the field is omitted', async () => {
        recipeService.updateRecipe.mockResolvedValue([{id: 1}]);

        await updateRecipe(1, {title: 'New title'});

        expect(clearRecipeSteps).not.toHaveBeenCalled();
        expect(createStep).not.toHaveBeenCalled();
    });

    it('replaces tags only when the tags array is provided, reusing found-or-created tag ids', async () => {
        recipeService.updateRecipe.mockResolvedValue([{id: 1}]);
        findOrCreateTag.mockResolvedValueOnce({id: 55}).mockResolvedValueOnce({id: 56});

        await updateRecipe(1, {tags: ['vegan', 'brunch']});

        expect(clearRecipeTags).toHaveBeenCalledWith(1);
        expect(findOrCreateTag).toHaveBeenNthCalledWith(1, 'vegan');
        expect(findOrCreateTag).toHaveBeenNthCalledWith(2, 'brunch');
        expect(addTagToRecipe).toHaveBeenNthCalledWith(1, 1, 55);
        expect(addTagToRecipe).toHaveBeenNthCalledWith(2, 1, 56);
    });

    it('does not touch tags when the field is omitted', async () => {
        recipeService.updateRecipe.mockResolvedValue([{id: 1}]);

        await updateRecipe(1, {title: 'New title'});

        expect(clearRecipeTags).not.toHaveBeenCalled();
        expect(findOrCreateTag).not.toHaveBeenCalled();
    });

    it('always forwards the scalar fields to recipeService.updateRecipe, even when undefined', async () => {
        recipeService.updateRecipe.mockResolvedValue([{id: 1, title: 'New title'}]);

        const result = await updateRecipe(1, {title: 'New title'});

        expect(recipeService.updateRecipe).toHaveBeenCalledWith(1, {
            title: 'New title',
            description: undefined,
            prepTime: undefined,
            cookTime: undefined,
            servings: undefined,
        });
        expect(result).toEqual({id: 1, title: 'New title'});
    });
});

describe('deleteRecipe', () => {
    it('deletes the recipe image when the deleted row has an image_url', async () => {
        recipeService.deleteRecipe.mockResolvedValue({id: 1, image_url: '/public/recipe_image/x.jpg'});

        const result = await deleteRecipe(1);

        expect(deleteRecipeImage).toHaveBeenCalledWith('/public/recipe_image/x.jpg');
        expect(result).toEqual({id: 1, image_url: '/public/recipe_image/x.jpg'});
    });

    it('does not attempt to delete an image when the deleted row has none', async () => {
        recipeService.deleteRecipe.mockResolvedValue({id: 1, image_url: null});

        await deleteRecipe(1);

        expect(deleteRecipeImage).not.toHaveBeenCalled();
    });

    it('does not throw when the recipe did not exist (deleteRecipe resolves undefined)', async () => {
        recipeService.deleteRecipe.mockResolvedValue(undefined);

        await expect(deleteRecipe(999)).resolves.toBeUndefined();
        expect(deleteRecipeImage).not.toHaveBeenCalled();
    });

    it('propagates errors from the service', async () => {
        recipeService.deleteRecipe.mockRejectedValue(new Error('db error'));

        await expect(deleteRecipe(1)).rejects.toThrow('db error');
    });
});

describe('searchRecipes', () => {
    it('parses servings and prepTime to integers and defaults page to 1', async () => {
        recipeService.searchRecipes.mockResolvedValue([]);

        await searchRecipes({name: 'quiche', servings: '4', prepTime: '30'});

        expect(recipeService.searchRecipes).toHaveBeenCalledWith({
            name: 'quiche',
            tag: undefined,
            servings: 4,
            prepTime: 30,
            page: 1,
        });
    });

    it('parses the page number to an integer when provided', async () => {
        recipeService.searchRecipes.mockResolvedValue([]);

        await searchRecipes({page: '3'});

        expect(recipeService.searchRecipes).toHaveBeenCalledWith(
            expect.objectContaining({page: 3})
        );
    });

    it('leaves servings/prepTime undefined when not provided', async () => {
        recipeService.searchRecipes.mockResolvedValue([]);

        await searchRecipes({});

        expect(recipeService.searchRecipes).toHaveBeenCalledWith({
            name: undefined,
            tag: undefined,
            servings: undefined,
            prepTime: undefined,
            page: 1,
        });
    });
});

describe('getRecipeById', () => {
    it('returns the first element of the service result', async () => {
        recipeService.getRecipeById.mockResolvedValue([{id: 1, title: 'Quiche'}]);

        const result = await getRecipeById(1);

        expect(result).toEqual({id: 1, title: 'Quiche'});
    });

    it('propagates errors from the service', async () => {
        recipeService.getRecipeById.mockRejectedValue(new Error('db error'));

        await expect(getRecipeById(1)).rejects.toThrow('db error');
    });
});

describe('updateImage', () => {
    it('delegates to the service and returns its result', async () => {
        recipeService.updateImage.mockResolvedValue({id: 1, image_url: '/public/recipe_image/x.jpg'});

        const result = await updateImage('/public/recipe_image/x.jpg', 1);

        expect(recipeService.updateImage).toHaveBeenCalledWith('/public/recipe_image/x.jpg', 1);
        expect(result).toEqual({id: 1, image_url: '/public/recipe_image/x.jpg'});
    });

    it('propagates errors from the service', async () => {
        recipeService.updateImage.mockRejectedValue(new Error('db error'));

        await expect(updateImage('/x.jpg', 1)).rejects.toThrow('db error');
    });
});
