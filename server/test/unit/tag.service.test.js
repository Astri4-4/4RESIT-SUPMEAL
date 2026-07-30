import {describe, it, expect, vi, beforeEach} from 'vitest';

vi.mock('../../src/database/db.js', () => ({
    query: vi.fn(),
}));

import {query} from '../../src/database/db.js';
import {findOrCreateTag, addTagToRecipe, clearRecipeTags} from '../../src/services/tag.service.js';

beforeEach(() => {
    query.mockReset();
});

describe('findOrCreateTag', () => {
    it('returns the existing tag without inserting when one is found', async () => {
        query.mockResolvedValueOnce({rows: [{id: 4}]});

        const result = await findOrCreateTag('vegan');

        expect(query).toHaveBeenCalledTimes(1);
        const [selectSql, selectParams] = query.mock.calls[0];
        expect(selectSql).toMatch(/SELECT id FROM tags WHERE name = \$1/);
        expect(selectParams).toEqual(['vegan']);
        expect(result).toEqual({id: 4});
    });

    it('creates a new tag when none exists yet', async () => {
        query.mockResolvedValueOnce({rows: []});
        query.mockResolvedValueOnce({rows: [{id: 9}]});

        const result = await findOrCreateTag('brunch');

        expect(query).toHaveBeenCalledTimes(2);
        const [insertSql, insertParams] = query.mock.calls[1];
        expect(insertSql).toMatch(/INSERT INTO tags \(name\) VALUES \(\$1\) RETURNING id/);
        expect(insertParams).toEqual(['brunch']);
        expect(result).toEqual({id: 9});
    });

    it('propagates errors from the query', async () => {
        query.mockRejectedValue(new Error('db down'));

        await expect(findOrCreateTag('vegan')).rejects.toThrow('db down');
    });
});

describe('addTagToRecipe', () => {
    it('links a recipe and a tag', async () => {
        query.mockResolvedValue({rows: []});

        await addTagToRecipe(1, 4);

        const [sql, params] = query.mock.calls[0];
        expect(sql).toMatch(/INSERT INTO recipe_tags \(recipe_id, tag_id\)/);
        expect(params).toEqual([1, 4]);
    });
});

describe('clearRecipeTags', () => {
    it('deletes all recipe_tags rows for the given recipe id', async () => {
        query.mockResolvedValue({rows: []});

        await clearRecipeTags(1);

        const [sql, params] = query.mock.calls[0];
        expect(sql).toMatch(/DELETE FROM recipe_tags WHERE recipe_id = \$1/);
        expect(params).toEqual([1]);
    });
});
