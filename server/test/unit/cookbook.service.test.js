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
