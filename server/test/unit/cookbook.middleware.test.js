import {describe, it, expect, vi, beforeEach} from 'vitest';

vi.mock('../../src/services/cookbook.service.js', () => ({
    getCookbookById: vi.fn(),
    isInCookbook: vi.fn(),
    getUserRoleInCookbook: vi.fn(),
}));

import * as cookbookService from '../../src/services/cookbook.service.js';
import {
    doCookbookExistsById,
    isMemberOfCookbook,
    isBodyUserNotMemberOfCookbook,
    isOwnerOfCookbook,
    isEditorOrOwnerOfCookbook,
    hasRightToKick,
} from '../../src/middlewares/cookbook.middleware.js';

function mockRes() {
    const res = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    return res;
}

beforeEach(() => {
    vi.resetAllMocks();
});

describe('doCookbookExistsById', () => {
    it('attaches the cookbook to req and calls next() when found', async () => {
        cookbookService.getCookbookById.mockResolvedValue({id: 1, title: 'x'});
        const req = {params: {cookbookId: '1'}};
        const res = mockRes();
        const next = vi.fn();

        await doCookbookExistsById(req, res, next);

        expect(req.cookbook).toEqual({id: 1, title: 'x'});
        expect(next).toHaveBeenCalled();
    });

    it('returns 404 when the cookbook does not exist', async () => {
        cookbookService.getCookbookById.mockResolvedValue(undefined);
        const req = {params: {cookbookId: '999'}};
        const res = mockRes();
        const next = vi.fn();

        await doCookbookExistsById(req, res, next);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(next).not.toHaveBeenCalled();
    });

    it('returns 500 when the lookup throws', async () => {
        cookbookService.getCookbookById.mockRejectedValue(new Error('db down'));
        const req = {params: {cookbookId: '1'}};
        const res = mockRes();
        const next = vi.fn();

        await doCookbookExistsById(req, res, next);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(next).not.toHaveBeenCalled();
    });
});

describe('isMemberOfCookbook', () => {
    it('calls next() when the user is a member', async () => {
        cookbookService.isInCookbook.mockResolvedValue(true);
        const req = {params: {cookbookId: '1'}, user: {id: 2}};
        const res = mockRes();
        const next = vi.fn();

        await isMemberOfCookbook(req, res, next);

        expect(next).toHaveBeenCalled();
    });

    it('returns 404 (not 403) when the user is not a member, masking existence', async () => {
        cookbookService.isInCookbook.mockResolvedValue(false);
        const req = {params: {cookbookId: '1'}, user: {id: 2}};
        const res = mockRes();
        const next = vi.fn();

        await isMemberOfCookbook(req, res, next);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(next).not.toHaveBeenCalled();
    });

    it('returns 500 when the lookup throws', async () => {
        cookbookService.isInCookbook.mockRejectedValue(new Error('db down'));
        const req = {params: {cookbookId: '1'}, user: {id: 2}};
        const res = mockRes();
        const next = vi.fn();

        await isMemberOfCookbook(req, res, next);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(next).not.toHaveBeenCalled();
    });
});

describe('isBodyUserNotMemberOfCookbook', () => {
    it('calls next() when the target user is not yet a member', async () => {
        cookbookService.isInCookbook.mockResolvedValue(false);
        const req = {params: {cookbookId: '1'}, body: {userId: 5}};
        const res = mockRes();
        const next = vi.fn();

        await isBodyUserNotMemberOfCookbook(req, res, next);

        expect(next).toHaveBeenCalled();
    });

    it('returns 400 when the target user is already a member', async () => {
        cookbookService.isInCookbook.mockResolvedValue(true);
        const req = {params: {cookbookId: '1'}, body: {userId: 5}};
        const res = mockRes();
        const next = vi.fn();

        await isBodyUserNotMemberOfCookbook(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(next).not.toHaveBeenCalled();
    });
});

describe('isOwnerOfCookbook', () => {
    it('calls next() for role "owner"', async () => {
        cookbookService.getUserRoleInCookbook.mockResolvedValue('owner');
        const req = {params: {cookbookId: '1'}, user: {id: 2}};
        const res = mockRes();
        const next = vi.fn();

        await isOwnerOfCookbook(req, res, next);

        expect(next).toHaveBeenCalled();
    });

    it('returns 403 for role "editor"', async () => {
        cookbookService.getUserRoleInCookbook.mockResolvedValue('editor');
        const req = {params: {cookbookId: '1'}, user: {id: 2}};
        const res = mockRes();
        const next = vi.fn();

        await isOwnerOfCookbook(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(next).not.toHaveBeenCalled();
    });

    it('returns 403 for a null role', async () => {
        cookbookService.getUserRoleInCookbook.mockResolvedValue(null);
        const req = {params: {cookbookId: '1'}, user: {id: 2}};
        const res = mockRes();
        const next = vi.fn();

        await isOwnerOfCookbook(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(next).not.toHaveBeenCalled();
    });
});

describe('isEditorOrOwnerOfCookbook', () => {
    it.each(['owner', 'editor'])('calls next() for role "%s"', async (role) => {
        cookbookService.getUserRoleInCookbook.mockResolvedValue(role);
        const req = {params: {cookbookId: '1'}, user: {id: 2}};
        const res = mockRes();
        const next = vi.fn();

        await isEditorOrOwnerOfCookbook(req, res, next);

        expect(next).toHaveBeenCalled();
    });

    it('returns 403 for role "viewer"', async () => {
        cookbookService.getUserRoleInCookbook.mockResolvedValue('viewer');
        const req = {params: {cookbookId: '1'}, user: {id: 2}};
        const res = mockRes();
        const next = vi.fn();

        await isEditorOrOwnerOfCookbook(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(next).not.toHaveBeenCalled();
    });
});

describe('hasRightToKick', () => {
    it('allows the owner to kick another member', async () => {
        cookbookService.getUserRoleInCookbook.mockResolvedValue('owner');
        const req = {params: {cookbookId: '1', userId: '99'}, user: {id: 2}};
        const res = mockRes();
        const next = vi.fn();

        await hasRightToKick(req, res, next);

        expect(next).toHaveBeenCalled();
    });

    it('allows the owner to remove themselves', async () => {
        cookbookService.getUserRoleInCookbook.mockResolvedValue('owner');
        const req = {params: {cookbookId: '1', userId: '2'}, user: {id: 2}};
        const res = mockRes();
        const next = vi.fn();

        await hasRightToKick(req, res, next);

        expect(next).toHaveBeenCalled();
    });

    it('forbids a non-owner from kicking someone else', async () => {
        cookbookService.getUserRoleInCookbook.mockResolvedValue('viewer');
        const req = {params: {cookbookId: '1', userId: '99'}, user: {id: 2}};
        const res = mockRes();
        const next = vi.fn();

        await hasRightToKick(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(next).not.toHaveBeenCalled();
    });

    it('allows a non-owner (viewer) to remove themselves — i.e. to quit', async () => {
        cookbookService.getUserRoleInCookbook.mockResolvedValue('viewer');
        // req.user.id comes from the JWT payload (a number); req.params.userId
        // is always a string, since Express route params are strings. The
        // "isHimself" check uses strict equality (===), so 2 === '2' is
        // false — a non-owner can never successfully quit their own cookbook.
        const req = {params: {cookbookId: '1', userId: '2'}, user: {id: 2}};
        const res = mockRes();
        const next = vi.fn();

        await hasRightToKick(req, res, next);

        expect(next).toHaveBeenCalled();
    });
});
