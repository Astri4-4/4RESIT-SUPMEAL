import {describe, it, expect, beforeEach, afterAll} from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import {query} from '../../src/database/db.js';
import redis from '../../src/database/redis.js';

const suffix = Date.now();
const validPassword = 'TestPass123!';

function uniqueUser(label) {
    return {
        username: `vitest_auth_${label}_${suffix}`,
        email: `vitest_auth_${label}_${suffix}@example.com`,
    };
}

// The register/login endpoints are behind a real Redis-backed rate limiter
// (3 registrations/min, 5 logins/min per IP). This suite intentionally hits
// them many times in a row, so each test clears the limiter's own counters
// first to stay independent of how many requests earlier tests made.
beforeEach(async () => {
    const keys = await redis.keys('ratelimit:*');
    if (keys.length > 0) {
        await redis.del(...keys);
    }
});

afterAll(async () => {
    await query("DELETE FROM users WHERE username LIKE 'vitest\\_auth\\_%' ESCAPE '\\'").catch(() => {});
});

describe('POST /auth/register', () => {
    it('registers a user with a valid payload', async () => {
        const {username, email} = uniqueUser('register_ok');

        const res = await request(app)
            .post('/auth/register')
            .send({username, email, password: validPassword, rgpd: true});

        expect(res.status).toBe(201);
        expect(res.body.message).toBe('User registered successfully');
    });

    it('rejects a duplicate username', async () => {
        const {username, email} = uniqueUser('dup_username');
        await request(app).post('/auth/register').send({username, email, password: validPassword, rgpd: true}).expect(201);

        const res = await request(app)
            .post('/auth/register')
            .send({username, email: `other_${email}`, password: validPassword, rgpd: true});

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/username is already in use/i);
    });

    it('rejects a duplicate email', async () => {
        const {username, email} = uniqueUser('dup_email');
        await request(app).post('/auth/register').send({username, email, password: validPassword, rgpd: true}).expect(201);

        const res = await request(app)
            .post('/auth/register')
            .send({username: `other_${username}`, email, password: validPassword, rgpd: true});

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/email is already in use/i);
    });

    it('rejects a username shorter than 3 characters', async () => {
        const {email} = uniqueUser('short_username');

        const res = await request(app)
            .post('/auth/register')
            .send({username: 'ab', email, password: validPassword, rgpd: true});

        expect(res.status).toBe(400);
        expect(res.body.errors.some((e) => e.field === 'username')).toBe(true);
    });

    it('rejects an invalid email address', async () => {
        const {username} = uniqueUser('bad_email');

        const res = await request(app)
            .post('/auth/register')
            .send({username, email: 'not-an-email', password: validPassword, rgpd: true});

        expect(res.status).toBe(400);
        expect(res.body.errors.some((e) => e.field === 'email')).toBe(true);
    });

    it.each([
        ['too short', 'Ab1!'],
        ['no uppercase', 'testpass123!'],
        ['no lowercase', 'TESTPASS123!'],
        ['no number', 'TestPassword!'],
        ['no symbol', 'TestPass123'],
    ])('rejects a password that is %s', async (_label, password) => {
        const {username, email} = uniqueUser(`weak_pw_${_label.replace(/\s+/g, '_')}`);

        const res = await request(app)
            .post('/auth/register')
            .send({username, email, password, rgpd: true});

        expect(res.status).toBe(400);
        expect(res.body.errors.some((e) => e.field === 'password')).toBe(true);
    });

    it('rejects rgpd: false', async () => {
        const {username, email} = uniqueUser('rgpd_false');

        const res = await request(app)
            .post('/auth/register')
            .send({username, email, password: validPassword, rgpd: false});

        expect(res.status).toBe(400);
        expect(res.body.errors.some((e) => e.field === 'rgpd')).toBe(true);
    });

    it('rejects a missing rgpd field', async () => {
        const {username, email} = uniqueUser('rgpd_missing');

        const res = await request(app)
            .post('/auth/register')
            .send({username, email, password: validPassword});

        expect(res.status).toBe(400);
        expect(res.body.errors.some((e) => e.field === 'rgpd')).toBe(true);
    });
});

describe('POST /auth/login', () => {
    it('logs in with the correct username and password and returns a token', async () => {
        const {username, email} = uniqueUser('login_ok');
        await request(app).post('/auth/register').send({username, email, password: validPassword, rgpd: true}).expect(201);

        const res = await request(app)
            .post('/auth/login')
            .send({username, password: validPassword});

        expect(res.status).toBe(200);
        expect(res.body.user).toHaveProperty('token');
        expect(typeof res.body.user.token).toBe('string');
        expect(res.body.user.password_hash).toBeUndefined();
    });

    it('rejects an incorrect password', async () => {
        const {username, email} = uniqueUser('login_wrong_pw');
        await request(app).post('/auth/register').send({username, email, password: validPassword, rgpd: true}).expect(201);

        const res = await request(app)
            .post('/auth/login')
            .send({username, password: 'WrongPassword123!'});

        expect(res.status).toBe(401);
    });

    it('rejects a username that does not exist', async () => {
        const res = await request(app)
            .post('/auth/login')
            .send({username: `vitest_auth_nonexistent_${suffix}`, password: validPassword});

        expect(res.status).toBe(401);
    });

    it('rejects a missing password', async () => {
        const {username, email} = uniqueUser('login_missing_pw');
        await request(app).post('/auth/register').send({username, email, password: validPassword, rgpd: true}).expect(201);

        const res = await request(app)
            .post('/auth/login')
            .send({username});

        expect(res.status).toBe(400);
    });

    it('rejects logging in with an email instead of a username, despite the Swagger doc listing "email" as the login field', async () => {
        const {username, email} = uniqueUser('login_via_email');
        await request(app).post('/auth/register').send({username, email, password: validPassword, rgpd: true}).expect(201);

        const res = await request(app)
            .post('/auth/login')
            .send({email, password: validPassword});

        expect(res.status).toBe(400);
        expect(res.body.errors.some((e) => e.field === 'username')).toBe(true);
    });
});
