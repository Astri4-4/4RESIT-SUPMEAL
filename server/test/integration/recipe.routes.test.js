import {describe, it, expect, beforeAll, afterAll} from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import {query} from '../../src/database/db.js';

describe('Recipe CRUD (integration)', () => {
    const suffix = Date.now();
    const username = `vitest_${suffix}`;
    const email = `vitest_${suffix}@example.com`;
    const password = 'TestPass123!';

    let token;
    let userId;
    let recipeId;

    beforeAll(async () => {
        await request(app)
            .post('/auth/register')
            .send({username, email, password, rgpd: true})
            .expect(201);

        const loginRes = await request(app)
            .post('/auth/login')
            .send({username, password})
            .expect(200);

        token = loginRes.body.user.token;
        userId = loginRes.body.user.id;
    });

    afterAll(async () => {
        if (recipeId) {
            await query('DELETE FROM recipes WHERE id = $1', [recipeId]).catch(() => {});
        }
        if (userId) {
            await query('DELETE FROM users WHERE id = $1', [userId]).catch(() => {});
        }
    });

    it('creates a recipe with ingredients and steps', async () => {
        const res = await request(app)
            .post('/recipes')
            .set('Authorization', `Bearer ${token}`)
            .send({
                title: 'Vitest Quiche',
                description: 'A test recipe',
                prepTime: 15,
                cookTime: 30,
                servings: 4,
                ingredients: [
                    {name: 'Eggs', unit: 'pcs', type: 'dairy', quantity: 4},
                ],
                steps: [
                    {step_number: 1, description: 'Mix everything'},
                ],
            })
            .expect(201);

        expect(res.body).toHaveProperty('id');
        expect(res.body.title).toBe('Vitest Quiche');
        recipeId = res.body.id;
    });

    it('retrieves the recipe by id', async () => {
        const res = await request(app)
            .get(`/recipes/${recipeId}`)
            .set('Authorization', `Bearer ${token}`)
            .expect(200);

        expect(res.body.title).toBe('Vitest Quiche');
        expect(res.body.servings).toBe(4);
    });

    it('finds the recipe via search by partial name', async () => {
        const res = await request(app)
            .get('/recipes')
            .query({name: 'Vitest Qui'})
            .set('Authorization', `Bearer ${token}`)
            .expect(200);

        expect(res.body.some((r) => r.id === recipeId)).toBe(true);
    });

    it('updates the recipe title and tags', async () => {
        const res = await request(app)
            .patch(`/recipes/${recipeId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({title: 'Vitest Quiche Updated', tags: ['vegan', 'brunch']})
            .expect(200);

        expect(res.body.title).toBe('Vitest Quiche Updated');
    });

    it('rejects requests with no auth token', async () => {
        await request(app)
            .get(`/recipes/${recipeId}`)
            .expect(403);
    });

    it('deletes the recipe and makes it unreachable afterwards', async () => {
        await request(app)
            .delete(`/recipes/${recipeId}`)
            .set('Authorization', `Bearer ${token}`)
            .expect(200);

        await request(app)
            .get(`/recipes/${recipeId}`)
            .set('Authorization', `Bearer ${token}`)
            .expect(404);

        recipeId = null;
    });
});
