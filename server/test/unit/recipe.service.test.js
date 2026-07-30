import {describe, it, expect, vi, beforeEach} from 'vitest';

vi.mock('../../src/database/db.js', () => ({
    query: vi.fn(),
}));

import {query} from '../../src/database/db.js';
import {
    createRecipe,
    getRecipeById,
    updateRecipe,
    deleteRecipe,
    isRecipeInCookbook,
    updateImage,
    searchRecipes,
} from '../../src/services/recipe.service.js';

beforeEach(() => {
    query.mockReset();
});

describe('createRecipe', () => {
    it('inserts all fields in the expected order', async () => {
        query.mockResolvedValue({rows: [{id: 1}]});

        await createRecipe({title: 'Quiche', description: 'Tasty', prepTime: 10, cookTime: 20, servings: 4, owner: 7});

        const [sql, params] = query.mock.calls[0];
        expect(sql).toMatch(/INSERT INTO recipes/);
        expect(params).toEqual(['Quiche', 'Tasty', 10, 20, 4, 7]);
    });

    it('defaults cookTime to 0 when not provided', async () => {
        query.mockResolvedValue({rows: [{id: 1}]});

        await createRecipe({title: 'Quiche', prepTime: 10, servings: 4, owner: 7});

        const [, params] = query.mock.calls[0];
        expect(params[3]).toBe(0);
    });

    it('propagates errors from the query', async () => {
        query.mockRejectedValue(new Error('db down'));

        await expect(createRecipe({title: 'x', prepTime: 1, servings: 1, owner: 1})).rejects.toThrow('db down');
    });
});

describe('getRecipeById', () => {
    it('selects by id and returns the rows array', async () => {
        query.mockResolvedValue({rows: [{id: 3, title: 'Quiche'}]});

        const result = await getRecipeById(3);

        const [sql, params] = query.mock.calls[0];
        expect(sql).toMatch(/SELECT \* FROM recipes WHERE id = \$1/);
        expect(params).toEqual([3]);
        expect(result).toEqual([{id: 3, title: 'Quiche'}]);
    });
});

describe('deleteRecipe', () => {
    it('deletes by id and returns the deleted row', async () => {
        query.mockResolvedValue({rows: [{id: 3, image_url: '/public/recipe_image/x.jpg'}]});

        const result = await deleteRecipe(3);

        const [sql, params] = query.mock.calls[0];
        expect(sql).toMatch(/DELETE FROM recipes WHERE id = \$1 RETURNING \*/);
        expect(params).toEqual([3]);
        expect(result).toEqual({id: 3, image_url: '/public/recipe_image/x.jpg'});
    });

    it('returns undefined when nothing was deleted', async () => {
        query.mockResolvedValue({rows: []});

        const result = await deleteRecipe(999);

        expect(result).toBeUndefined();
    });
});

describe('isRecipeInCookbook', () => {
    it('returns true when a cookbook_recipes row exists', async () => {
        query.mockResolvedValue({rows: [{id: 1}]});

        await expect(isRecipeInCookbook(5)).resolves.toBe(true);
    });

    it('returns false when no cookbook_recipes row exists', async () => {
        query.mockResolvedValue({rows: []});

        await expect(isRecipeInCookbook(5)).resolves.toBe(false);
    });
});

describe('updateImage', () => {
    it('updates image_url for the given recipe id', async () => {
        query.mockResolvedValue({rows: [{id: 2, image_url: '/public/recipe_image/new.jpg'}]});

        const result = await updateImage('/public/recipe_image/new.jpg', 2);

        const [sql, params] = query.mock.calls[0];
        expect(sql).toMatch(/UPDATE recipes SET image_url=\$1 WHERE id=\$2/);
        expect(params).toEqual(['/public/recipe_image/new.jpg', 2]);
        expect(result).toEqual({id: 2, image_url: '/public/recipe_image/new.jpg'});
    });
});

describe('searchRecipes', () => {
    it('builds an unfiltered query with default pagination when no filters are given', async () => {
        query.mockResolvedValue({rows: []});

        await searchRecipes({});

        const [sql, params] = query.mock.calls[0];
        expect(sql).not.toMatch(/WHERE/);
        expect(params).toEqual([10, 0]);
    });

    it('wraps the name filter in wildcards for a partial, case-insensitive match', async () => {
        query.mockResolvedValue({rows: []});

        await searchRecipes({name: 'quiche'});

        const [sql, params] = query.mock.calls[0];
        expect(sql).toMatch(/recipes\.title ILIKE \$1/);
        expect(params[0]).toBe('%quiche%');
    });

    it('computes OFFSET from the page number instead of using it directly', async () => {
        query.mockResolvedValue({rows: []});

        await searchRecipes({page: 3});

        const [, params] = query.mock.calls[0];
        expect(params).toEqual([10, 20]);
    });

    it('filters by tag via an EXISTS subquery rather than an INNER JOIN', async () => {
        query.mockResolvedValue({rows: []});

        await searchRecipes({tag: 'vegan'});

        const [sql, params] = query.mock.calls[0];
        expect(sql).toMatch(/EXISTS/);
        expect(sql).not.toMatch(/FROM recipes\s+JOIN/);
        expect(params).toContain('%vegan%');
    });

    it('combines multiple filters with AND', async () => {
        query.mockResolvedValue({rows: []});

        await searchRecipes({name: 'quiche', servings: 4, prepTime: 30});

        const [sql, params] = query.mock.calls[0];
        expect(sql).toMatch(/recipes\.title ILIKE \$1 AND recipes\.servings = \$2 AND recipes\.preptime <= \$3/);
        expect(params.slice(0, 3)).toEqual(['%quiche%', 4, 30]);
    });

    it('combines all four filters (name, servings, prepTime, tag) together', async () => {
        query.mockResolvedValue({rows: []});

        await searchRecipes({name: 'quiche', servings: 4, prepTime: 30, tag: 'vegan'});

        const [sql, params] = query.mock.calls[0];
        expect(sql).toMatch(/recipes\.title ILIKE \$1 AND recipes\.servings = \$2 AND recipes\.preptime <= \$3 AND EXISTS/);
        expect(params.slice(0, 4)).toEqual(['%quiche%', 4, 30, '%vegan%']);
    });

    it('treats servings: 0 as no filter, since 0 is falsy', async () => {
        query.mockResolvedValue({rows: []});

        await searchRecipes({servings: 0});

        const [sql] = query.mock.calls[0];
        expect(sql).not.toMatch(/WHERE/);
    });

    it('defaults to page 1 when no page is given', async () => {
        query.mockResolvedValue({rows: []});

        await searchRecipes({name: 'quiche'});

        const [, params] = query.mock.calls[0];
        expect(params.slice(-2)).toEqual([10, 0]);
    });
});

describe('updateRecipe', () => {
    it('only sets the fields that were provided', async () => {
        query.mockResolvedValue({rows: [{id: 1, title: 'New title'}]});

        await updateRecipe(1, {title: 'New title'});

        const [sql, params] = query.mock.calls[0];
        expect(sql).toContain('title = $1');
        expect(sql).not.toContain('servings');
        expect(params).toEqual(['New title', 1]);
    });

    it('maps camelCase fields to their lowercase DB columns', async () => {
        query.mockResolvedValue({rows: [{id: 1}]});

        await updateRecipe(1, {prepTime: 20, cookTime: 40});

        const [sql, params] = query.mock.calls[0];
        expect(sql).toContain('preptime = $1');
        expect(sql).toContain('cooktime = $2');
        expect(params).toEqual([20, 40, 1]);
    });

    it('falls back to a plain SELECT when no updatable fields are provided', async () => {
        query.mockResolvedValue({rows: [{id: 1}]});

        await updateRecipe(1, {});

        const [sql] = query.mock.calls[0];
        expect(sql).toMatch(/SELECT \* FROM recipes WHERE id = \$1/);
    });

    it('ignores keys that are not in the updatable fields whitelist', async () => {
        query.mockResolvedValue({rows: [{id: 1}]});

        await updateRecipe(1, {owner: 999, id: 42, title: 'Safe title'});

        const [sql, params] = query.mock.calls[0];
        expect(sql).toBe('UPDATE recipes SET title = $1 WHERE id = $2 RETURNING *');
        expect(params).toEqual(['Safe title', 1]);
    });

    it('updates all five updatable fields at once with correctly ordered placeholders', async () => {
        query.mockResolvedValue({rows: [{id: 9}]});

        await updateRecipe(9, {
            title: 'T',
            description: 'D',
            prepTime: 5,
            cookTime: 10,
            servings: 2,
        });

        const [sql, params] = query.mock.calls[0];
        expect(sql).toBe(
            'UPDATE recipes SET title = $1, description = $2, preptime = $3, cooktime = $4, servings = $5 WHERE id = $6 RETURNING *'
        );
        expect(params).toEqual(['T', 'D', 5, 10, 2, 9]);
    });
});
