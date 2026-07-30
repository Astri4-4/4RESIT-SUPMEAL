import {describe, it, expect, vi, beforeEach} from 'vitest';

vi.mock('../../src/database/db.js', () => ({
    query: vi.fn(),
}));

import {query} from '../../src/database/db.js';
import {createIngredient, addIngredientToRecipe, clearRecipeIngredients} from '../../src/services/ingredient.service.js';

beforeEach(() => {
    query.mockReset();
});

describe('createIngredient', () => {
    it('inserts name, unit, and type and returns the new id', async () => {
        query.mockResolvedValue({rows: [{id: 5}]});

        const result = await createIngredient({name: 'Egg', unit: 'pcs', type: 'dairy'});

        const [sql, params] = query.mock.calls[0];
        expect(sql).toMatch(/INSERT INTO ingredients \(name, unit, type\)/);
        expect(params).toEqual(['Egg', 'pcs', 'dairy']);
        expect(result).toEqual({id: 5});
    });

    it('propagates errors from the query', async () => {
        query.mockRejectedValue(new Error('constraint violation'));

        await expect(createIngredient({name: 'Egg'})).rejects.toThrow('constraint violation');
    });
});

describe('addIngredientToRecipe', () => {
    it('links a recipe and ingredient with a quantity', async () => {
        query.mockResolvedValue({rows: [{recipe_id: 1, ingredient_id: 5, quantity: 2.5}]});

        const result = await addIngredientToRecipe(1, 5, 2.5);

        const [sql, params] = query.mock.calls[0];
        expect(sql).toMatch(/INSERT INTO recipe_ingredients/);
        expect(params).toEqual([1, 5, 2.5]);
        expect(result).toEqual({recipe_id: 1, ingredient_id: 5, quantity: 2.5});
    });
});

describe('clearRecipeIngredients', () => {
    it('deletes all recipe_ingredients rows for the given recipe id', async () => {
        query.mockResolvedValue({rows: []});

        await clearRecipeIngredients(7);

        const [sql, params] = query.mock.calls[0];
        expect(sql).toMatch(/DELETE FROM recipe_ingredients WHERE recipe_id = \$1/);
        expect(params).toEqual([7]);
    });
});
