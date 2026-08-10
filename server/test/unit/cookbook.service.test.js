import {describe, it, expect, vi, beforeEach} from 'vitest';

vi.mock('../../src/database/db.js', () => ({
    query: vi.fn(),
}));

import {query} from '../../src/database/db.js';
import {
    create,
    addUserToCookbook,
    getCookbookById,
    isInCookbook,
    getCookbookMembers,
    getCookbooksByUserId,
    getUserRoleInCookbook,
    updateCookbook,
    changeRoleInCookbook,
    deleteCookbook,
    removeMember,
    createComment,
    getCommentsByRecipeId,
    getCommentById,
    updateComment,
    deleteComment,
    getCookbookRecipeId,
} from '../../src/services/cookbook.service.js';

beforeEach(() => {
    query.mockReset();
});

describe('create', () => {
    it('inserts owner_id, title, description, and image_url', async () => {
        query.mockResolvedValue({rows: [{id: 1}]});

        await create({ownerId: 7, title: 'My Cookbook', description: 'Desc', imageUrl: '/public/cookbook_image/x.jpg'});

        const [sql, params] = query.mock.calls[0];
        expect(sql).toMatch(/INSERT INTO cookbooks/);
        expect(params).toEqual([7, 'My Cookbook', 'Desc', '/public/cookbook_image/x.jpg']);
    });

    it('defaults image_url to null when imageUrl is not provided', async () => {
        query.mockResolvedValue({rows: [{id: 1}]});

        await create({ownerId: 7, title: 'My Cookbook', description: 'Desc'});

        const [, params] = query.mock.calls[0];
        expect(params[3]).toBeNull();
    });
});

describe('addUserToCookbook', () => {
    it('inserts cookbook_id, user_id, and role', async () => {
        query.mockResolvedValue({rows: [{cookbook_id: 1, user_id: 2, role: 'owner'}]});

        await addUserToCookbook(1, 2, 'owner');

        const [sql, params] = query.mock.calls[0];
        expect(sql).toMatch(/INSERT INTO cookbook_users/);
        expect(params).toEqual([1, 2, 'owner']);
    });
});

describe('getCookbookById', () => {
    it('selects a cookbook by id', async () => {
        query.mockResolvedValue({rows: [{id: 1, title: 'x'}]});

        const result = await getCookbookById(1);

        const [sql, params] = query.mock.calls[0];
        expect(sql).toMatch(/SELECT \* FROM cookbooks WHERE id = \$1/);
        expect(params).toEqual([1]);
        expect(result).toEqual({id: 1, title: 'x'});
    });

    it('returns undefined when no cookbook matches', async () => {
        query.mockResolvedValue({rows: []});

        await expect(getCookbookById(999)).resolves.toBeUndefined();
    });
});

describe('isInCookbook', () => {
    it('returns true when a membership row exists', async () => {
        query.mockResolvedValue({rows: [{id: 1}]});

        await expect(isInCookbook(1, 2)).resolves.toBe(true);
    });

    it('returns false when no membership row exists', async () => {
        query.mockResolvedValue({rows: []});

        await expect(isInCookbook(1, 2)).resolves.toBe(false);
    });
});

describe('getCookbookMembers', () => {
    it('returns member rows for the cookbook', async () => {
        query.mockResolvedValue({rows: [{id: 2, username: 'bob', role: 'owner', email: 'bob@test.com'}]});

        const result = await getCookbookMembers(1);

        const [sql, params] = query.mock.calls[0];
        expect(sql).toMatch(/FROM users u JOIN cookbook_users cu/);
        expect(params).toEqual([1]);
        expect(result).toEqual([{id: 2, username: 'bob', role: 'owner', email: 'bob@test.com'}]);
    });
});

describe('getCookbooksByUserId', () => {
    it('selects cookbooks joined through cookbook_users with limit/offset', async () => {
        query.mockResolvedValue({rows: [{id: 1}]});

        await getCookbooksByUserId(5, 0, 10);

        const [sql, params] = query.mock.calls[0];
        expect(sql).toMatch(/JOIN cookbook_users cu ON c\.id = cu\.cookbook_id WHERE cu\.user_id = \$1/);
        expect(params).toEqual([5, 10, 0]);
    });
});

describe('getUserRoleInCookbook', () => {
    it('returns the role when a membership row exists', async () => {
        query.mockResolvedValue({rows: [{role: 'editor'}]});

        await expect(getUserRoleInCookbook(1, 2)).resolves.toBe('editor');

        const [, params] = query.mock.calls[0];
        expect(params).toEqual([1, 2]);
    });

    it('returns null when no membership row exists', async () => {
        query.mockResolvedValue({rows: []});

        await expect(getUserRoleInCookbook(1, 2)).resolves.toBeNull();
    });
});

describe('updateCookbook', () => {
    it('falls back to a plain SELECT when no fields are provided', async () => {
        query.mockResolvedValue({rows: [{id: 1}]});

        await updateCookbook(1, {});

        const [sql] = query.mock.calls[0];
        expect(sql).toMatch(/SELECT \* FROM cookbooks WHERE id = \$1/);
    });

    it('builds a parameterized SET clause for the given fields', async () => {
        query.mockResolvedValue({rows: [{id: 1, title: 'New'}]});

        await updateCookbook(1, {title: 'New', description: 'Updated desc'});

        const [sql, params] = query.mock.calls[0];
        expect(sql).toBe('UPDATE cookbooks SET title = $1, description = $2 WHERE id = $3 RETURNING *');
        expect(params).toEqual(['New', 'Updated desc', 1]);
    });

    it('interpolates arbitrary object keys directly as column names (no whitelist)', async () => {
        query.mockResolvedValue({rows: [{id: 1}]});

        await updateCookbook(1, {not_a_real_column: 'x'});

        const [sql] = query.mock.calls[0];
        expect(sql).toContain('not_a_real_column = $1');
    });
});

describe('changeRoleInCookbook', () => {
    it('updates the role for the given cookbook/user pair', async () => {
        query.mockResolvedValue({rows: [{cookbook_id: 1, user_id: 2, role: 'editor'}]});

        await changeRoleInCookbook(1, 2, 'editor');

        const [sql, params] = query.mock.calls[0];
        expect(sql).toMatch(/UPDATE cookbook_users SET role = \$1 WHERE cookbook_id = \$2 AND user_id = \$3/);
        expect(params).toEqual(['editor', 1, 2]);
    });
});

describe('deleteCookbook', () => {
    it('deletes by id and returns the deleted row', async () => {
        query.mockResolvedValue({rows: [{id: 1, image_url: '/public/cookbook_image/x.jpg'}]});

        const result = await deleteCookbook(1);

        const [sql, params] = query.mock.calls[0];
        expect(sql).toMatch(/DELETE FROM cookbooks WHERE id = \$1 RETURNING \*/);
        expect(params).toEqual([1]);
        expect(result).toEqual({id: 1, image_url: '/public/cookbook_image/x.jpg'});
    });
});

describe('removeMember', () => {
    it('deletes the membership row for the given cookbook/user pair', async () => {
        query.mockResolvedValue({rows: [{cookbook_id: 1, user_id: 2}]});

        await removeMember(1, 2);

        const [sql, params] = query.mock.calls[0];
        expect(sql).toMatch(/DELETE FROM cookbook_users WHERE cookbook_id = \$1 AND user_id = \$2/);
        expect(params).toEqual([1, 2]);
    });
});

describe('getCookbookRecipeId', () => {
    it('returns the cookbook_recipes.id for the given cookbook/recipe pair', async () => {
        query.mockResolvedValue({rows: [{id: 6}]});

        const result = await getCookbookRecipeId(41, 60);

        const [sql, params] = query.mock.calls[0];
        expect(sql).toMatch(/SELECT id FROM cookbook_recipes WHERE cookbook_id = \$1 AND recipe_id = \$2/);
        expect(params).toEqual([41, 60]);
        expect(result).toBe(6);
    });

    it('returns null when the recipe is not linked to the cookbook', async () => {
        query.mockResolvedValue({rows: []});

        await expect(getCookbookRecipeId(41, 60)).resolves.toBeNull();
    });
});

describe('createComment', () => {
    it('inserts the first argument directly as cookbook_recipe_id', async () => {
        query.mockResolvedValue({rows: [{id: 1, cookbook_recipe_id: 60, user_id: 2, comment: 'Nice!'}]});

        await createComment(60, 2, 'Nice!');

        const [sql, params] = query.mock.calls[0];
        expect(sql).toMatch(/INSERT INTO cookbook_recipe_comments \(cookbook_recipe_id, user_id, comment\)/);
        // This function trusts its first argument to already be the
        // cookbook_recipes.id (the join-table row id) — it's the caller's
        // job (cookbook.controller.js postComment) to resolve that from
        // cookbookId/recipeId via getCookbookRecipeId() first.
        expect(params).toEqual([60, 2, 'Nice!']);
    });

    it('propagates errors (e.g. a foreign key violation) from the query', async () => {
        query.mockRejectedValue(new Error('foreign key violation'));

        await expect(createComment(60, 2, 'Nice!')).rejects.toThrow('foreign key violation');
    });
});

describe('getCommentsByRecipeId', () => {
    it('selects comments by cookbook_recipe_id and returns the full query result (not .rows)', async () => {
        const fakeResult = {rows: [{id: 1, comment: 'Nice!'}]};
        query.mockResolvedValue(fakeResult);

        const result = await getCommentsByRecipeId(60);

        const [sql, params] = query.mock.calls[0];
        expect(sql).toMatch(/SELECT \* FROM cookbook_recipe_comments WHERE cookbook_recipe_id = \$1/);
        expect(params).toEqual([60]);
        // Unlike every other read function in this file, this one returns
        // the raw pg result object rather than unwrapping .rows itself —
        // the caller (cookbook.controller.js) does that instead.
        expect(result).toBe(fakeResult);
    });
});

describe('getCommentById', () => {
    it('selects a comment by id', async () => {
        query.mockResolvedValue({rows: [{id: 1, user_id: 2, comment: 'Nice!'}]});

        const result = await getCommentById(1);

        const [sql, params] = query.mock.calls[0];
        expect(sql).toMatch(/SELECT \* FROM cookbook_recipe_comments WHERE id = \$1/);
        expect(params).toEqual([1]);
        expect(result).toEqual({id: 1, user_id: 2, comment: 'Nice!'});
    });

    it('returns undefined when no comment matches', async () => {
        query.mockResolvedValue({rows: []});

        await expect(getCommentById(999)).resolves.toBeUndefined();
    });
});

describe('updateComment', () => {
    it('updates the comment text for the given id', async () => {
        query.mockResolvedValue({rows: [{id: 1, comment: 'Updated'}]});

        const result = await updateComment(1, 'Updated');

        const [sql, params] = query.mock.calls[0];
        expect(sql).toMatch(/UPDATE cookbook_recipe_comments SET comment = \$1 WHERE id = \$2 RETURNING \*/);
        expect(params).toEqual(['Updated', 1]);
        expect(result).toEqual({id: 1, comment: 'Updated'});
    });
});

describe('deleteComment', () => {
    it('deletes the comment by id', async () => {
        query.mockResolvedValue({rows: []});

        await deleteComment(1);

        const [sql, params] = query.mock.calls[0];
        expect(sql).toMatch(/DELETE FROM cookbook_recipe_comments WHERE id = \$1/);
        expect(params).toEqual([1]);
    });

    it('propagates errors from the query', async () => {
        query.mockRejectedValue(new Error('db down'));

        await expect(deleteComment(1)).rejects.toThrow('db down');
    });
});
