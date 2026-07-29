import {describe, it, expect, beforeEach, afterAll} from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import {query} from '../../src/database/db.js';
import redis from '../../src/database/redis.js';

const suffix = Date.now();
const validPassword = 'TestPass123!';

function uniqueUser(label) {
    return {
        username: `vitest_user_${label}_${suffix}`,
        email: `vitest_user_${label}_${suffix}@example.com`,
    };
}

async function registerAndLogin(label) {
    const {username, email} = uniqueUser(label);
    await request(app).post('/auth/register').send({username, email, password: validPassword, rgpd: true}).expect(201);

    const loginRes = await request(app).post('/auth/login').send({username, password: validPassword}).expect(200);

    return {username, email, token: loginRes.body.user.token, id: loginRes.body.user.id};
}

// Same rationale as auth.routes.test.js: this suite registers/logs in many
// times in a row, so reset the (real, Redis-backed) rate limiter's own
// counters before each test rather than fight it with delays.
beforeEach(async () => {
    const keys = await redis.keys('ratelimit:*');
    if (keys.length > 0) {
        await redis.del(...keys);
    }
});

afterAll(async () => {
    await query("DELETE FROM users WHERE username LIKE 'vitest\\_user\\_%' ESCAPE '\\'").catch(() => {});
});

describe('GET /users/me', () => {
    it('returns the authenticated user without the password hash', async () => {
        const user = await registerAndLogin('me_ok');

        const res = await request(app)
            .get('/users/me')
            .set('Authorization', `Bearer ${user.token}`);

        expect(res.status).toBe(200);
        expect(res.body.username).toBe(user.username);
        expect(res.body.password_hash).toBeUndefined();
    });

    it('rejects a request with no Authorization header', async () => {
        const res = await request(app).get('/users/me');
        expect(res.status).toBe(403);
    });

    it('rejects an Authorization header with no token after "Bearer"', async () => {
        const res = await request(app).get('/users/me').set('Authorization', 'Bearer');
        expect(res.status).toBe(403);
    });

    it('rejects the literal token value "null"', async () => {
        const res = await request(app).get('/users/me').set('Authorization', 'Bearer null');
        expect(res.status).toBe(403);
    });

    it('rejects a malformed/invalid token', async () => {
        const res = await request(app).get('/users/me').set('Authorization', 'Bearer not.a.valid.jwt');
        expect(res.status).toBe(401);
    });

    it('returns 404 once the underlying user has been deleted', async () => {
        const user = await registerAndLogin('me_deleted');
        await query('DELETE FROM users WHERE id = $1', [user.id]);

        const res = await request(app)
            .get('/users/me')
            .set('Authorization', `Bearer ${user.token}`);

        expect(res.status).toBe(404);
    });
});

describe('PUT /users/', () => {
    it('rejects a request with no Authorization header', async () => {
        const res = await request(app).put('/users/').send({username: 'whatever'});
        expect(res.status).toBe(403);
    });

    it('rejects an invalid email format', async () => {
        const user = await registerAndLogin('put_bad_email');

        const res = await request(app)
            .put('/users/')
            .set('Authorization', `Bearer ${user.token}`)
            .send({email: 'not-an-email'});

        expect(res.status).toBe(400);
        expect(res.body.errors.some((e) => e.field === 'email')).toBe(true);
    });

    it('rejects an empty password string', async () => {
        const user = await registerAndLogin('put_empty_pw');

        const res = await request(app)
            .put('/users/')
            .set('Authorization', `Bearer ${user.token}`)
            .send({password: ''});

        expect(res.status).toBe(400);
        expect(res.body.errors.some((e) => e.field === 'password')).toBe(true);
    });

    it('returns the unchanged user when the update body is empty', async () => {
        const user = await registerAndLogin('put_noop');

        const res = await request(app)
            .put('/users/')
            .set('Authorization', `Bearer ${user.token}`)
            .send({});

        expect(res.status).toBe(200);
        expect(res.body.username).toBe(user.username);
    });

    it("actually persists the change to the authenticated user's own row", async () => {
        const user = await registerAndLogin('put_persists');
        const newUsername = `vitest_user_put_persists_renamed_${suffix}`;

        const res = await request(app)
            .put('/users/')
            .set('Authorization', `Bearer ${user.token}`)
            .send({username: newUsername});

        expect(res.status).toBe(200);

        const {rows} = await query('SELECT username FROM users WHERE id = $1', [user.id]);
        expect(rows[0].username).toBe(newUsername);
    });

    it("does not modify any other existing user's data", async () => {
        const bystander = await registerAndLogin('put_bystander');
        const actor = await registerAndLogin('put_actor');

        const before = await query('SELECT id, username, email FROM users ORDER BY id');

        await request(app)
            .put('/users/')
            .set('Authorization', `Bearer ${actor.token}`)
            .send({username: `vitest_user_put_actor_renamed_${suffix}`})
            .expect(200);

        const after = await query('SELECT id, username, email FROM users ORDER BY id');
        const afterById = new Map(after.rows.map((row) => [row.id, row]));

        for (const row of before.rows) {
            if (row.id === actor.id) continue;
            expect(afterById.get(row.id)).toEqual(row);
        }

        // Specifically, the bystander created just before the actor must be untouched.
        const bystanderRow = afterById.get(bystander.id);
        expect(bystanderRow.username).toBe(bystander.username);
    });

    it('changing the password allows logging in with the new password', async () => {
        const user = await registerAndLogin('put_password');
        const newPassword = 'NewTestPass456!';

        await request(app)
            .put('/users/')
            .set('Authorization', `Bearer ${user.token}`)
            .send({password: newPassword})
            .expect(200);

        const res = await request(app)
            .post('/auth/login')
            .send({username: user.username, password: newPassword});

        expect(res.status).toBe(200);
    });
});

describe('DELETE /users/', () => {
    it('rejects a request with no Authorization header', async () => {
        const res = await request(app).delete('/users/');
        expect(res.status).toBe(403);
    });

    it("deletes the authenticated user's own account", async () => {
        const user = await registerAndLogin('delete_ok');

        await request(app)
            .delete('/users/')
            .set('Authorization', `Bearer ${user.token}`)
            .expect(200);

        const {rows} = await query('SELECT id FROM users WHERE id = $1', [user.id]);
        expect(rows).toHaveLength(0);
    });

    it('makes the old token unusable afterwards', async () => {
        const user = await registerAndLogin('delete_then_me');

        await request(app)
            .delete('/users/')
            .set('Authorization', `Bearer ${user.token}`)
            .expect(200);

        const res = await request(app)
            .get('/users/me')
            .set('Authorization', `Bearer ${user.token}`);

        expect(res.status).toBe(404);
    });

    it('prevents logging in with the old credentials afterwards', async () => {
        const user = await registerAndLogin('delete_then_login');

        await request(app)
            .delete('/users/')
            .set('Authorization', `Bearer ${user.token}`)
            .expect(200);

        const res = await request(app)
            .post('/auth/login')
            .send({username: user.username, password: validPassword});

        expect(res.status).toBe(401);
    });
});
