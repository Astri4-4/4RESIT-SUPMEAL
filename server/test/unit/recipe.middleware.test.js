import {describe, it, expect, vi, beforeEach} from 'vitest';

vi.mock('../../src/services/recipe.service.js', () => ({
    getRecipeById: vi.fn(),
    isRecipeInCookbook: vi.fn(),
}));
vi.mock('../../src/services/cookbook.service.js', () => ({
    getUserRoleInCookbook: vi.fn(),
}));

import {getRecipeById, isRecipeInCookbook} from '../../src/services/recipe.service.js';
import * as cookbookService from '../../src/services/cookbook.service.js';
import {
    doRecipeExistsParam,
    doUserHasWritePermission,
    doUserHasViewPermission,
} from '../../src/middlewares/recipe.middleware.js';

function mockRes() {
    const res = {};
    res.status = vi.fn().mockReturnValue(res);
    res.send = vi.fn().mockReturnValue(res);
    return res;
}

beforeEach(() => {
    vi.resetAllMocks();
});

describe('doRecipeExistsParam', () => {
    it('calls next() when the recipe exists', async () => {
        getRecipeById.mockResolvedValue([{id: 1}]);
        const req = {params: {recipeId: '1'}};
        const res = mockRes();
        const next = vi.fn();

        await doRecipeExistsParam(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
    });

    it('returns 404 when the recipe does not exist', async () => {
        getRecipeById.mockResolvedValue([]);
        const req = {params: {recipeId: '999'}};
        const res = mockRes();
        const next = vi.fn();

        await doRecipeExistsParam(req, res, next);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.send).toHaveBeenCalledWith({message: 'Recipe not found'});
        expect(next).not.toHaveBeenCalled();
    });

    it('returns 500 when the lookup throws', async () => {
        getRecipeById.mockRejectedValue(new Error('db down'));
        const req = {params: {recipeId: '1'}};
        const res = mockRes();
        const next = vi.fn();

        await doRecipeExistsParam(req, res, next);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({error: 'db down'});
        expect(next).not.toHaveBeenCalled();
    });
});

describe('doUserHasWritePermission', () => {
    it('allows an owner-role cookbook member to write', async () => {
        isRecipeInCookbook.mockResolvedValue(true);
        cookbookService.getUserRoleInCookbook.mockResolvedValue('owner');
        const req = {user: {id: 1}, params: {recipeId: '5'}, body: {}};
        const res = mockRes();
        const next = vi.fn();

        await doUserHasWritePermission(req, res, next);

        expect(next).toHaveBeenCalled();
    });

    it('allows an editor-role cookbook member to write', async () => {
        isRecipeInCookbook.mockResolvedValue(true);
        cookbookService.getUserRoleInCookbook.mockResolvedValue('editor');
        const req = {user: {id: 1}, params: {recipeId: '5'}, body: {}};
        const res = mockRes();
        const next = vi.fn();

        await doUserHasWritePermission(req, res, next);

        expect(next).toHaveBeenCalled();
    });

    it('forbids a viewer-role cookbook member from writing', async () => {
        isRecipeInCookbook.mockResolvedValue(true);
        cookbookService.getUserRoleInCookbook.mockResolvedValue('viewer');
        const req = {user: {id: 1}, params: {recipeId: '5'}, body: {}};
        const res = mockRes();
        const next = vi.fn();

        await doUserHasWritePermission(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(next).not.toHaveBeenCalled();
    });

    it('forbids a non-member (null role) of the recipe\'s cookbook from writing', async () => {
        isRecipeInCookbook.mockResolvedValue(true);
        cookbookService.getUserRoleInCookbook.mockResolvedValue(null);
        const req = {user: {id: 1}, params: {recipeId: '5'}, body: {}};
        const res = mockRes();
        const next = vi.fn();

        await doUserHasWritePermission(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(next).not.toHaveBeenCalled();
    });

    it('allows the recipe owner to write when the recipe is not in any cookbook', async () => {
        isRecipeInCookbook.mockResolvedValue(false);
        getRecipeById.mockResolvedValue([{id: 5, owner: 1}]);
        const req = {user: {id: 1}, params: {recipeId: '5'}, body: {}};
        const res = mockRes();
        const next = vi.fn();

        await doUserHasWritePermission(req, res, next);

        expect(next).toHaveBeenCalled();
    });

    it('forbids a non-owner from writing when the recipe is not in any cookbook', async () => {
        isRecipeInCookbook.mockResolvedValue(false);
        getRecipeById.mockResolvedValue([{id: 5, owner: 2}]);
        const req = {user: {id: 1}, params: {recipeId: '5'}, body: {}};
        const res = mockRes();
        const next = vi.fn();

        await doUserHasWritePermission(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(next).not.toHaveBeenCalled();
    });

    it('falls back to req.body.recipeId when req.params.recipeId is absent', async () => {
        isRecipeInCookbook.mockResolvedValue(false);
        getRecipeById.mockResolvedValue([{id: 5, owner: 1}]);
        const req = {user: {id: 1}, params: {}, body: {recipeId: '5'}};
        const res = mockRes();
        const next = vi.fn();

        await doUserHasWritePermission(req, res, next);

        expect(isRecipeInCookbook).toHaveBeenCalledWith('5');
        expect(next).toHaveBeenCalled();
    });

    it('returns 500 when the cookbook lookup throws', async () => {
        isRecipeInCookbook.mockRejectedValue(new Error('db down'));
        const req = {user: {id: 1}, params: {recipeId: '5'}, body: {}};
        const res = mockRes();
        const next = vi.fn();

        await doUserHasWritePermission(req, res, next);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(next).not.toHaveBeenCalled();
    });
});

describe('doUserHasViewPermission', () => {
    it('allows an owner-role cookbook member to view', async () => {
        isRecipeInCookbook.mockResolvedValue(true);
        cookbookService.getUserRoleInCookbook.mockResolvedValue('owner');
        const req = {user: {id: 1}, params: {recipeId: '5'}};
        const res = mockRes();
        const next = vi.fn();

        await doUserHasViewPermission(req, res, next);

        expect(next).toHaveBeenCalled();
    });

    it('allows a viewer-role cookbook member to view (unlike write permission)', async () => {
        isRecipeInCookbook.mockResolvedValue(true);
        cookbookService.getUserRoleInCookbook.mockResolvedValue('viewer');
        const req = {user: {id: 1}, params: {recipeId: '5'}};
        const res = mockRes();
        const next = vi.fn();

        await doUserHasViewPermission(req, res, next);

        expect(next).toHaveBeenCalled();
    });

    it('forbids a non-member (null role) of the recipe\'s cookbook from viewing', async () => {
        isRecipeInCookbook.mockResolvedValue(true);
        cookbookService.getUserRoleInCookbook.mockResolvedValue(null);
        const req = {user: {id: 1}, params: {recipeId: '5'}};
        const res = mockRes();
        const next = vi.fn();

        await doUserHasViewPermission(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(next).not.toHaveBeenCalled();
    });

    it('allows the recipe owner to view when the recipe is not in any cookbook', async () => {
        isRecipeInCookbook.mockResolvedValue(false);
        getRecipeById.mockResolvedValue([{id: 5, owner: 1}]);
        const req = {user: {id: 1}, params: {recipeId: '5'}};
        const res = mockRes();
        const next = vi.fn();

        await doUserHasViewPermission(req, res, next);

        expect(next).toHaveBeenCalled();
    });

    it('forbids a non-owner from viewing when the recipe is not in any cookbook', async () => {
        isRecipeInCookbook.mockResolvedValue(false);
        getRecipeById.mockResolvedValue([{id: 5, owner: 2}]);
        const req = {user: {id: 1}, params: {recipeId: '5'}};
        const res = mockRes();
        const next = vi.fn();

        await doUserHasViewPermission(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(next).not.toHaveBeenCalled();
    });

    it('returns 500 when the cookbook lookup throws', async () => {
        isRecipeInCookbook.mockRejectedValue(new Error('db down'));
        const req = {user: {id: 1}, params: {recipeId: '5'}};
        const res = mockRes();
        const next = vi.fn();

        await doUserHasViewPermission(req, res, next);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(next).not.toHaveBeenCalled();
    });
});
