import {describe, it, expect, beforeEach, afterAll} from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import {query} from '../../src/database/db.js';
import redis from '../../src/database/redis.js';

const suffix = Date.now();
const validPassword = 'TestPass123!';

function uniqueUser(label) {
    return {
        username: `vitest_favorite_${label}_${suffix}`,
        email: `vitest_favorite_${label}_${suffix}@example.com`,
    };
}

async function resetRateLimits() {
    const keys = await redis.keys('ratelimit:*');
    if (keys.length > 0) {
        await redis.del(...keys);
    }
}

async function registerAndLogin(label) {
    const {username, email} = uniqueUser(label);
    await request(app).post('/auth/register').send({username, email, password: validPassword, rgpd: true}).expect(201);
    const loginRes = await request(app).post('/auth/login').send({username, password: validPassword}).expect(200);
    return {username, email, token: loginRes.body.user.token, id: loginRes.body.user.id};
}

async function createRecipeViaApi(token, overrides = {}) {
    const res = await request(app)
        .post('/recipes')
        .set('Authorization', `Bearer ${token}`)
        .send({
            title: `Vitest Favorite Recipe ${suffix} ${Math.random()}`,
            prepTime: 10,
            servings: 2,
            ingredients: [],
            steps: [],
            ...overrides,
        })
        .expect(201);
    return res.body;
}

async function addFavoriteViaApi(token, recipeId) {
    const res = await request(app)
        .post('/favorites')
        .set('Authorization', `Bearer ${token}`)
        .send({recipeId})
        .expect(201);
    return res.body;
}

beforeEach(async () => {
    await resetRateLimits();
});

afterAll(async () => {
    await query("DELETE FROM users WHERE username LIKE 'vitest\\_favorite\\_%' ESCAPE '\\'").catch(() => {});
});

describe('POST /favorites', () => {
    it('adds a recipe to the caller\'s favorites', async () => {
        const user = await registerAndLogin('add_ok');
        const recipe = await createRecipeViaApi(user.token);

        const res = await request(app)
            .post('/favorites')
            .set('Authorization', `Bearer ${user.token}`)
            .send({recipeId: recipe.id});

        expect(res.status).toBe(201);
        expect(res.body.user_id).toBe(user.id);
        expect(res.body.recipe_id).toBe(recipe.id);

        const stored = await query('SELECT * FROM favorites WHERE id = $1', [res.body.id]);
        expect(stored.rows).toHaveLength(1);
    });

    it('returns 404 for a nonexistent recipeId', async () => {
        const user = await registerAndLogin('add_404');

        const res = await request(app)
            .post('/favorites')
            .set('Authorization', `Bearer ${user.token}`)
            .send({recipeId: 999999999});

        expect(res.status).toBe(404);
    });

    it('rejects a missing recipeId', async () => {
        const user = await registerAndLogin('add_missing');

        const res = await request(app)
            .post('/favorites')
            .set('Authorization', `Bearer ${user.token}`)
            .send({});

        expect(res.status).toBe(400);
        expect(res.body.errors.some((e) => e.field === 'recipeId')).toBe(true);
    });

    it('rejects a non-integer recipeId', async () => {
        const user = await registerAndLogin('add_bad_id');

        const res = await request(app)
            .post('/favorites')
            .set('Authorization', `Bearer ${user.token}`)
            .send({recipeId: 'not-a-number'});

        expect(res.status).toBe(400);
    });

    it('allows favoriting the same recipe twice (no uniqueness constraint)', async () => {
        const user = await registerAndLogin('add_twice');
        const recipe = await createRecipeViaApi(user.token);

        await addFavoriteViaApi(user.token, recipe.id);
        const res = await request(app)
            .post('/favorites')
            .set('Authorization', `Bearer ${user.token}`)
            .send({recipeId: recipe.id});

        expect(res.status).toBe(201);

        const stored = await query('SELECT * FROM favorites WHERE user_id = $1 AND recipe_id = $2', [user.id, recipe.id]);
        expect(stored.rows).toHaveLength(2);
    });

    it('rejects a request with no auth token', async () => {
        await request(app).post('/favorites').send({recipeId: 1}).expect(403);
    });
});

describe('GET /favorites', () => {
    it("returns only the caller's favorites", async () => {
        const user = await registerAndLogin('list_ok');
        const other = await registerAndLogin('list_other');
        const recipe = await createRecipeViaApi(user.token);
        const otherRecipe = await createRecipeViaApi(other.token);
        const favorite = await addFavoriteViaApi(user.token, recipe.id);
        await addFavoriteViaApi(other.token, otherRecipe.id);

        const res = await request(app)
            .get('/favorites')
            .set('Authorization', `Bearer ${user.token}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.some((f) => f.id === favorite.id)).toBe(true);
        expect(res.body.every((f) => f.user_id === user.id)).toBe(true);
    });

    it('returns an empty array when the caller has no favorites', async () => {
        const user = await registerAndLogin('list_empty');

        const res = await request(app)
            .get('/favorites')
            .set('Authorization', `Bearer ${user.token}`);

        expect(res.status).toBe(200);
        expect(res.body).toEqual([]);
    });

    it('rejects a request with no auth token', async () => {
        await request(app).get('/favorites').expect(403);
    });
});

describe('DELETE /favorites/:id', () => {
    it('allows the owner to delete their favorite', async () => {
        const user = await registerAndLogin('delete_ok');
        const recipe = await createRecipeViaApi(user.token);
        const favorite = await addFavoriteViaApi(user.token, recipe.id);

        const res = await request(app)
            .delete(`/favorites/${favorite.id}`)
            .set('Authorization', `Bearer ${user.token}`);

        expect(res.status).toBe(200);
        const stillThere = await query('SELECT id FROM favorites WHERE id = $1', [favorite.id]);
        expect(stillThere.rows).toHaveLength(0);
    });

    it("forbids deleting another user's favorite", async () => {
        const owner = await registerAndLogin('delete_owner');
        const outsider = await registerAndLogin('delete_outsider');
        const recipe = await createRecipeViaApi(owner.token);
        const favorite = await addFavoriteViaApi(owner.token, recipe.id);

        const res = await request(app)
            .delete(`/favorites/${favorite.id}`)
            .set('Authorization', `Bearer ${outsider.token}`);

        expect(res.status).toBe(403);

        const stillThere = await query('SELECT id FROM favorites WHERE id = $1', [favorite.id]);
        expect(stillThere.rows).toHaveLength(1);
    });

    it('rejects a non-integer id', async () => {
        const user = await registerAndLogin('delete_bad_id');

        const res = await request(app)
            .delete('/favorites/not-a-number')
            .set('Authorization', `Bearer ${user.token}`);

        expect(res.status).toBe(400);
    });

    it('rejects a request with no auth token', async () => {
        await request(app).delete('/favorites/1').expect(403);
    });
});
