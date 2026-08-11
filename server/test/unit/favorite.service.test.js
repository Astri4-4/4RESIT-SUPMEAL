import {describe, it, expect, vi, beforeEach} from 'vitest';

vi.mock('../../src/database/db.js', () => ({
    query: vi.fn(),
}));

import {query} from '../../src/database/db.js';
import {
    addFavorite,
    getFavorites,
    getFavoriteById,
    deleteFavorite,
} from '../../src/services/favorite.service.js';

beforeEach(() => {
    query.mockReset();
});

describe('addFavorite', () => {
    it('inserts user_id and recipe_id and returns the created row', async () => {
        query.mockResolvedValue({rows: [{id: 1, user_id: 2, recipe_id: 3}]});

        const result = await addFavorite(2, 3);

        const [sql, params] = query.mock.calls[0];
        expect(sql).toMatch(/INSERT INTO favorites \(user_id, recipe_id\) VALUES \(\$1, \$2\) RETURNING \*/);
        expect(params).toEqual([2, 3]);
        expect(result).toEqual({id: 1, user_id: 2, recipe_id: 3});
    });

    it('propagates errors (e.g. a foreign key violation) from the query', async () => {
        query.mockRejectedValue(new Error('foreign key violation'));

        await expect(addFavorite(2, 3)).rejects.toThrow('foreign key violation');
    });
});

describe('getFavorites', () => {
    it('selects favorites by user_id and returns the full query result (not .rows)', async () => {
        const fakeResult = {rows: [{id: 1, user_id: 2, recipe_id: 3}]};
        query.mockResolvedValue(fakeResult);

        const result = await getFavorites(2);

        const [sql, params] = query.mock.calls[0];
        expect(sql).toMatch(/SELECT \* FROM favorites WHERE user_id = \$1/);
        expect(params).toEqual([2]);
        // Unlike getFavoriteById/addFavorite/deleteFavorite, this one returns
        // the raw pg result object rather than unwrapping .rows itself — the
        // caller (favorite.controller.js) does that instead.
        expect(result).toBe(fakeResult);
    });
});

describe('getFavoriteById', () => {
    it('selects a favorite by id', async () => {
        query.mockResolvedValue({rows: [{id: 1, user_id: 2, recipe_id: 3}]});

        const result = await getFavoriteById(1);

        const [sql, params] = query.mock.calls[0];
        expect(sql).toMatch(/SELECT \* FROM favorites WHERE id = \$1/);
        expect(params).toEqual([1]);
        expect(result).toEqual({id: 1, user_id: 2, recipe_id: 3});
    });

    it('returns undefined when no favorite matches', async () => {
        query.mockResolvedValue({rows: []});

        await expect(getFavoriteById(999)).resolves.toBeUndefined();
    });
});

describe('deleteFavorite', () => {
    it('deletes by user_id and the favorite\'s own id and returns the deleted row', async () => {
        query.mockResolvedValue({rows: [{id: 1, user_id: 2, recipe_id: 3}]});

        const result = await deleteFavorite(2, 1);

        const [sql, params] = query.mock.calls[0];
        expect(sql).toMatch(/DELETE FROM favorites WHERE user_id = \$1 AND id = \$2 RETURNING \*/);
        expect(params).toEqual([2, 1]);
        expect(result).toEqual({id: 1, user_id: 2, recipe_id: 3});
    });

    it('returns undefined when no matching favorite exists', async () => {
        query.mockResolvedValue({rows: []});

        await expect(deleteFavorite(2, 999)).resolves.toBeUndefined();
    });

    it('propagates errors from the query', async () => {
        query.mockRejectedValue(new Error('db down'));

        await expect(deleteFavorite(2, 1)).rejects.toThrow('db down');
    });
});
