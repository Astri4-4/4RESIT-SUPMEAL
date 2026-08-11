import {describe, it, expect, vi, beforeEach} from 'vitest';

vi.mock('../../src/services/favorite.service.js', () => ({
    addFavorite: vi.fn(),
    getFavorites: vi.fn(),
    deleteFavorite: vi.fn(),
}));

import * as favoriteService from '../../src/services/favorite.service.js';
import {
    addFavorite,
    getFavorites,
    deleteFavorite,
} from '../../src/controllers/favorite.controller.js';

beforeEach(() => {
    vi.resetAllMocks();
});

describe('addFavorite', () => {
    it('delegates to the service', async () => {
        favoriteService.addFavorite.mockResolvedValue({id: 1, user_id: 2, recipe_id: 3});

        const result = await addFavorite(2, 3);

        expect(favoriteService.addFavorite).toHaveBeenCalledWith(2, 3);
        expect(result).toEqual({id: 1, user_id: 2, recipe_id: 3});
    });

    it('propagates errors from the service', async () => {
        favoriteService.addFavorite.mockRejectedValue(new Error('db down'));

        await expect(addFavorite(2, 3)).rejects.toThrow('db down');
    });
});

describe('getFavorites', () => {
    it('unwraps .rows from the service result', async () => {
        favoriteService.getFavorites.mockResolvedValue({rows: [{id: 1, user_id: 2, recipe_id: 3}]});

        const result = await getFavorites(2);

        expect(favoriteService.getFavorites).toHaveBeenCalledWith(2);
        expect(result).toEqual([{id: 1, user_id: 2, recipe_id: 3}]);
    });

    it('propagates errors from the service', async () => {
        favoriteService.getFavorites.mockRejectedValue(new Error('db down'));

        await expect(getFavorites(2)).rejects.toThrow('db down');
    });
});

describe('deleteFavorite', () => {
    it('delegates to the service', async () => {
        favoriteService.deleteFavorite.mockResolvedValue({id: 1, user_id: 2, recipe_id: 3});

        const result = await deleteFavorite(2, 1);

        expect(favoriteService.deleteFavorite).toHaveBeenCalledWith(2, 1);
        expect(result).toEqual({id: 1, user_id: 2, recipe_id: 3});
    });

    it('propagates errors from the service', async () => {
        favoriteService.deleteFavorite.mockRejectedValue(new Error('db down'));

        await expect(deleteFavorite(2, 1)).rejects.toThrow('db down');
    });
});
