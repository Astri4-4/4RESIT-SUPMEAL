import {describe, it, expect, vi, beforeEach} from 'vitest';

vi.mock('../../src/middlewares/asset.middleware.js', () => ({
    deleteCookbookImage: vi.fn(),
}));
vi.mock('../../src/services/activity.service.js', () => ({
    createActivity: vi.fn(),
}));
vi.mock('../../src/services/cookbook.service.js', () => ({
    create: vi.fn(),
    addUserToCookbook: vi.fn(),
    getCookbookById: vi.fn(),
    getCookbookMembers: vi.fn(),
    getCookbooksByUserId: vi.fn(),
    getUserRoleInCookbook: vi.fn(),
    updateCookbook: vi.fn(),
    changeRoleInCookbook: vi.fn(),
    deleteCookbook: vi.fn(),
    removeMember: vi.fn(),
    createComment: vi.fn(),
    getCommentsByRecipeId: vi.fn(),
    getCookbookRecipeId: vi.fn(),
}));

import {deleteCookbookImage} from '../../src/middlewares/asset.middleware.js';
import * as cookbookService from '../../src/services/cookbook.service.js';
import {
    createCookbook,
    getCookbooksByUserId,
    getCookbookById,
    getCookbookMembers,
    updateCookbook,
    addUserToCookbook,
    changeRoleInCookbook,
    deleteCookbook,
    quitOrKickMember,
    postComment,
    getCommentsByRecipeId as getCommentsByRecipeIdController,
} from '../../src/controllers/cookbook.controller.js';

beforeEach(() => {
    vi.resetAllMocks();
});

describe('createCookbook', () => {
    it('sets ownerId from the user, creates the cookbook, then adds the user as owner', async () => {
        cookbookService.create.mockResolvedValue({id: 10, title: 'My Cookbook'});
        cookbookService.addUserToCookbook.mockResolvedValue({});

        const result = await createCookbook({id: 3}, {title: 'My Cookbook'});

        expect(cookbookService.create).toHaveBeenCalledWith({title: 'My Cookbook', ownerId: 3});
        expect(cookbookService.addUserToCookbook).toHaveBeenCalledWith(10, 3, 'owner');
        expect(result).toEqual({id: 10, title: 'My Cookbook'});
    });

    it('wraps errors with a descriptive message', async () => {
        cookbookService.create.mockRejectedValue(new Error('db down'));

        await expect(createCookbook({id: 1}, {title: 'x'})).rejects.toThrow('Erreur lors de la création du cookbook : db down');
    });
});

describe('getCookbooksByUserId', () => {
    it('attaches members and the caller\'s role to each cookbook', async () => {
        cookbookService.getCookbooksByUserId.mockResolvedValue([{id: 1}, {id: 2}]);
        cookbookService.getCookbookMembers.mockResolvedValue([{id: 9, username: 'bob'}]);
        cookbookService.getUserRoleInCookbook.mockResolvedValue('owner');

        const result = await getCookbooksByUserId(3, 0, 10);

        expect(cookbookService.getCookbooksByUserId).toHaveBeenCalledWith(3, 0, 10);
        expect(cookbookService.getUserRoleInCookbook).toHaveBeenNthCalledWith(1, 1, 3);
        expect(cookbookService.getUserRoleInCookbook).toHaveBeenNthCalledWith(2, 2, 3);
        expect(result).toEqual([
            {id: 1, members: [{id: 9, username: 'bob'}], role: 'owner'},
            {id: 2, members: [{id: 9, username: 'bob'}], role: 'owner'},
        ]);
    });

    it('wraps errors with a descriptive message', async () => {
        cookbookService.getCookbooksByUserId.mockRejectedValue(new Error('db down'));

        await expect(getCookbooksByUserId(3, 0, 10)).rejects.toThrow('Erreur lors de la récupération des cookbooks : db down');
    });
});

describe('getCookbookById', () => {
    it('attaches members to the cookbook', async () => {
        cookbookService.getCookbookById.mockResolvedValue({id: 1, title: 'x'});
        cookbookService.getCookbookMembers.mockResolvedValue([{id: 9}]);

        const result = await getCookbookById(1);

        expect(result).toEqual({id: 1, title: 'x', members: [{id: 9}]});
    });

    it('wraps errors with a descriptive message', async () => {
        cookbookService.getCookbookById.mockRejectedValue(new Error('db down'));

        await expect(getCookbookById(1)).rejects.toThrow('Erreur lors de la récupération du cookbook : db down');
    });
});

describe('getCookbookMembers', () => {
    it('delegates to the service', async () => {
        cookbookService.getCookbookMembers.mockResolvedValue([{id: 9}]);

        await expect(getCookbookMembers(1)).resolves.toEqual([{id: 9}]);
    });

    it('wraps errors with a descriptive message', async () => {
        cookbookService.getCookbookMembers.mockRejectedValue(new Error('db down'));

        await expect(getCookbookMembers(1)).rejects.toThrow('Erreur lors de la récupération des membres du cookbook : db down');
    });
});

describe('updateCookbook', () => {
    it('delegates to the service with whitelisted fields', async () => {
        cookbookService.updateCookbook.mockResolvedValue({id: 1, title: 'New'});

        const result = await updateCookbook(1, {title: 'New'});

        expect(cookbookService.updateCookbook).toHaveBeenCalledWith(1, {title: 'New'});
        expect(result).toEqual({id: 1, title: 'New'});
    });

    it('strips fields that are not in the updatable whitelist', async () => {
        cookbookService.updateCookbook.mockResolvedValue({id: 1, title: 'New'});

        await updateCookbook(1, {title: 'New', notARealColumn: 'x', owner_id: 999});

        expect(cookbookService.updateCookbook).toHaveBeenCalledWith(1, {title: 'New'});
    });

    it('wraps errors with a descriptive message', async () => {
        cookbookService.updateCookbook.mockRejectedValue(new Error('db down'));

        await expect(updateCookbook(1, {title: 'x'})).rejects.toThrow('Erreur lors de la modification du cookbook : db down');
    });
});

describe('addUserToCookbook', () => {
    it('delegates to the service', async () => {
        cookbookService.addUserToCookbook.mockResolvedValue({cookbook_id: 1, user_id: 2, role: 'viewer'});

        await expect(addUserToCookbook(1, 2, 'viewer')).resolves.toEqual({cookbook_id: 1, user_id: 2, role: 'viewer'});
    });

    it('wraps errors with a descriptive message', async () => {
        cookbookService.addUserToCookbook.mockRejectedValue(new Error('db down'));

        await expect(addUserToCookbook(1, 2, 'viewer')).rejects.toThrow('Erreur lors de l\'ajout du membre au cookbook : db down');
    });
});

describe('changeRoleInCookbook', () => {
    it('delegates to the service', async () => {
        cookbookService.changeRoleInCookbook.mockResolvedValue({role: 'editor'});

        await expect(changeRoleInCookbook(1, 2, 'editor')).resolves.toEqual({role: 'editor'});
    });

    it('wraps errors with a descriptive message', async () => {
        cookbookService.changeRoleInCookbook.mockRejectedValue(new Error('db down'));

        await expect(changeRoleInCookbook(1, 2, 'editor')).rejects.toThrow('Erreur lors du changement de rôle : db down');
    });
});

describe('deleteCookbook', () => {
    it('deletes the image when the deleted cookbook had one', async () => {
        cookbookService.deleteCookbook.mockResolvedValue({id: 1, image_url: '/public/cookbook_image/x.jpg'});

        const result = await deleteCookbook(1);

        expect(deleteCookbookImage).toHaveBeenCalledWith('/public/cookbook_image/x.jpg');
        expect(result).toEqual({id: 1, image_url: '/public/cookbook_image/x.jpg'});
    });

    it('does not attempt image deletion when there is no image_url', async () => {
        cookbookService.deleteCookbook.mockResolvedValue({id: 1, image_url: null});

        await deleteCookbook(1);

        expect(deleteCookbookImage).not.toHaveBeenCalled();
    });

    it('wraps errors with a descriptive message', async () => {
        cookbookService.deleteCookbook.mockRejectedValue(new Error('db down'));

        await expect(deleteCookbook(1)).rejects.toThrow('Erreur lors de la suppression du cookbook : db down');
    });
});

describe('quitOrKickMember', () => {
    it('delegates to the service\'s removeMember', async () => {
        cookbookService.removeMember.mockResolvedValue({cookbook_id: 1, user_id: 2});

        await expect(quitOrKickMember(1, 2)).resolves.toEqual({cookbook_id: 1, user_id: 2});
        expect(cookbookService.removeMember).toHaveBeenCalledWith(1, 2);
    });

    it('wraps errors with a descriptive message', async () => {
        cookbookService.removeMember.mockRejectedValue(new Error('db down'));

        await expect(quitOrKickMember(1, 2)).rejects.toThrow('Erreur lors du retrait du membre : db down');
    });
});

describe('postComment', () => {
    it('resolves the cookbook_recipe_id from cookbookId/recipeId before creating the comment', async () => {
        cookbookService.getCookbookRecipeId.mockResolvedValue(6);
        cookbookService.createComment.mockResolvedValue({id: 1, cookbook_recipe_id: 6, user_id: 2, comment: 'Nice!'});

        const result = await postComment(41, 60, 2, 'Nice!');

        expect(cookbookService.getCookbookRecipeId).toHaveBeenCalledWith(41, 60);
        expect(cookbookService.createComment).toHaveBeenCalledWith(6, 2, 'Nice!');
        expect(result).toEqual({id: 1, cookbook_recipe_id: 6, user_id: 2, comment: 'Nice!'});
    });

    it('wraps errors with a descriptive message', async () => {
        cookbookService.getCookbookRecipeId.mockResolvedValue(6);
        cookbookService.createComment.mockRejectedValue(new Error('db down'));

        await expect(postComment(41, 60, 2, 'Nice!')).rejects.toThrow('Erreur lors de la création du commentaire : db down');
    });
});

describe('getCommentsByRecipeId (controller)', () => {
    it('resolves the cookbook_recipe_id from cookbookId/recipeId before listing comments', async () => {
        cookbookService.getCookbookRecipeId.mockResolvedValue(6);
        cookbookService.getCommentsByRecipeId.mockResolvedValue({rows: [{id: 1, comment: 'Nice!'}]});

        const result = await getCommentsByRecipeIdController(41, 60);

        expect(cookbookService.getCookbookRecipeId).toHaveBeenCalledWith(41, 60);
        expect(cookbookService.getCommentsByRecipeId).toHaveBeenCalledWith(6);
        expect(result).toEqual([{id: 1, comment: 'Nice!'}]);
    });

    it('wraps errors with a descriptive message', async () => {
        cookbookService.getCookbookRecipeId.mockResolvedValue(6);
        cookbookService.getCommentsByRecipeId.mockRejectedValue(new Error('db down'));

        await expect(getCommentsByRecipeIdController(41, 60)).rejects.toThrow('Erreur lors de la récupération du commentaire : db down');
    });
});
