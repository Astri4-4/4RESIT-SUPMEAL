import {describe, it, expect, vi, beforeEach} from 'vitest';

vi.mock('../../src/services/favorite.service.js', () => ({
    getFavoriteById: vi.fn(),
}));

import * as favoriteService from '../../src/services/favorite.service.js';
import {
    isOwnerOfFavorite,
    doFavoriteExists,
} from '../../src/middlewares/favorite.middleware.js';

function mockRes() {
    const res = {};
    res.status = vi.fn().mockReturnValue(res);
    res.send = vi.fn().mockReturnValue(res);
    return res;
}

beforeEach(() => {
    vi.resetAllMocks();
});

describe('isOwnerOfFavorite', () => {
    it('calls next() when the requester owns the favorite', async () => {
        favoriteService.getFavoriteById.mockResolvedValue({id: 1, user_id: 2, recipe_id: 3});
        const req = {params: {id: '1'}, user: {id: 2}};
        const res = mockRes();
        const next = vi.fn();

        await isOwnerOfFavorite(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
    });

    it('returns 403 when the requester does not own the favorite', async () => {
        favoriteService.getFavoriteById.mockResolvedValue({id: 1, user_id: 999, recipe_id: 3});
        const req = {params: {id: '1'}, user: {id: 2}};
        const res = mockRes();
        const next = vi.fn();

        await isOwnerOfFavorite(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(next).not.toHaveBeenCalled();
    });

    it('returns 500 when the lookup throws', async () => {
        favoriteService.getFavoriteById.mockRejectedValue(new Error('db down'));
        const req = {params: {id: '1'}, user: {id: 2}};
        const res = mockRes();
        const next = vi.fn();

        await isOwnerOfFavorite(req, res, next);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(next).not.toHaveBeenCalled();
    });

    it('throws when the favorite does not exist (no null-check before reading .user_id)', async () => {
        // getFavoriteById resolving to undefined makes `favorite.user_id`
        // throw a TypeError, which lands in the catch block as a 500 rather
        // than the 403/404 one might expect. In the real route this
        // middleware only runs after doFavoriteExists has already confirmed
        // the favorite exists and stopped the chain otherwise, so this path
        // is only reachable via a delete-between-check race, not normal use.
        favoriteService.getFavoriteById.mockResolvedValue(undefined);
        const req = {params: {id: '999'}, user: {id: 2}};
        const res = mockRes();
        const next = vi.fn();

        await isOwnerOfFavorite(req, res, next);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(next).not.toHaveBeenCalled();
    });
});

describe('doFavoriteExists', () => {
    it('calls next() when the favorite exists', async () => {
        favoriteService.getFavoriteById.mockResolvedValue({id: 1, user_id: 2, recipe_id: 3});
        const req = {params: {id: '1'}};
        const res = mockRes();
        const next = vi.fn();

        await doFavoriteExists(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
    });

    it('sends 404 and stops the chain when the favorite does not exist', async () => {
        favoriteService.getFavoriteById.mockResolvedValue(undefined);
        const req = {params: {id: '999'}};
        const res = mockRes();
        const next = vi.fn();

        await doFavoriteExists(req, res, next);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(next).not.toHaveBeenCalled();
    });

    it('returns 500 (and does not call next()) when the lookup throws', async () => {
        favoriteService.getFavoriteById.mockRejectedValue(new Error('db down'));
        const req = {params: {id: '1'}};
        const res = mockRes();
        const next = vi.fn();

        await doFavoriteExists(req, res, next);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(next).not.toHaveBeenCalled();
    });
});
