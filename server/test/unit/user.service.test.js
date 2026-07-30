import {describe, it, expect, vi, beforeEach} from 'vitest';

vi.mock('../../src/database/db.js', () => ({
    query: vi.fn(),
}));

import {query} from '../../src/database/db.js';
import {
    createUser,
    getUserByUsername,
    getUserById,
    updateUser,
    deleteUserById,
} from '../../src/services/user.service.js';

beforeEach(() => {
    query.mockReset();
});

describe('createUser', () => {
    it('inserts username, email, hashed password, and rgpd', async () => {
        query.mockResolvedValue({rows: [{id: 1}]});

        await createUser({username: 'bob', email: 'bob@test.com', password: 'hashed', rgpd: true});

        const [sql, params] = query.mock.calls[0];
        expect(sql).toMatch(/INSERT INTO users/);
        expect(params).toEqual(['bob', 'bob@test.com', 'hashed', true]);
    });
});

describe('getUserByUsername', () => {
    it('excludes password_hash by default', async () => {
        query.mockResolvedValue({rows: [{id: 1, username: 'bob'}]});

        await getUserByUsername({username: 'bob'});

        const [sql] = query.mock.calls[0];
        expect(sql).not.toMatch(/\*/);
        expect(sql).not.toMatch(/password_hash/);
    });

    it('includes password_hash when explicitly requested (for login)', async () => {
        query.mockResolvedValue({rows: [{id: 1, username: 'bob', password_hash: 'x'}]});

        await getUserByUsername({username: 'bob'}, true);

        const [sql] = query.mock.calls[0];
        expect(sql).toMatch(/SELECT \* FROM users/);
    });
});

describe('getUserById', () => {
    it('excludes password_hash by default', async () => {
        query.mockResolvedValue({rows: [{id: 1}]});

        await getUserById(1);

        const [sql, params] = query.mock.calls[0];
        expect(sql).not.toMatch(/password_hash/);
        expect(params).toEqual([1]);
    });

    it('includes password_hash when explicitly requested', async () => {
        query.mockResolvedValue({rows: [{id: 1, password_hash: 'x'}]});

        await getUserById(1, true);

        const [sql] = query.mock.calls[0];
        expect(sql).toMatch(/SELECT \* FROM users/);
    });
});

describe('updateUser', () => {
    it('falls back to a plain SELECT when no fields are provided', async () => {
        query.mockResolvedValue({rows: [{id: 5}]});

        await updateUser(5, {});

        const [sql, params] = query.mock.calls[0];
        expect(sql).toMatch(/SELECT id, username, email, rgpd, image_url FROM users WHERE id = \$1/);
        expect(params).toEqual([5]);
    });

    it('parameterizes every updated field', async () => {
        query.mockResolvedValue({rows: [{id: 5, username: 'newname'}]});

        await updateUser(5, {username: 'newname'});

        const [sql] = query.mock.calls[0];
        expect(sql).toContain('username = $1');
    });

    it('targets the given user id via a bound parameter, not a literal in the WHERE clause', async () => {
        query.mockResolvedValue({rows: [{id: 5, username: 'newname'}]});

        await updateUser(5, {username: 'newname'});

        const [sql, params] = query.mock.calls[0];
        // The WHERE clause should read "WHERE id = $2" (bound to the id
        // parameter), not "WHERE id = 2" (the literal placeholder count).
        expect(sql).toMatch(/WHERE id = \$\d+/);
        expect(params).toContain(5);
    });

    it('binds the correct id value when multiple fields are updated', async () => {
        query.mockResolvedValue({rows: [{id: 42}]});

        await updateUser(42, {username: 'a', email: 'b@test.com'});

        const [sql, params] = query.mock.calls[0];
        expect(sql).toMatch(/WHERE id = \$3/);
        expect(params).toEqual(['a', 'b@test.com', 42]);
    });
});

describe('deleteUserById', () => {
    it('deletes by id and returns the safe (non-hash) columns', async () => {
        query.mockResolvedValue({rows: [{id: 7, username: 'bob'}]});

        await deleteUserById(7);

        const [sql, params] = query.mock.calls[0];
        expect(sql).toMatch(/DELETE FROM users WHERE id = \$1/);
        expect(sql).not.toMatch(/password_hash/);
        expect(params).toEqual([7]);
    });
});
