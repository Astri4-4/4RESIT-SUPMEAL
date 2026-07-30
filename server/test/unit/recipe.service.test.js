import {describe, it, expect, vi, beforeEach} from 'vitest';

vi.mock('../../src/database/db.js', () => ({
    query: vi.fn(),
}));

import {query} from '../../src/database/db.js';
import {searchRecipes, updateRecipe} from '../../src/services/recipe.service.js';

beforeEach(() => {
    query.mockReset();
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
});
