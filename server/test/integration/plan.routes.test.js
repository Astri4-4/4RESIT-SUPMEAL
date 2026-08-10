import {describe, it, expect, beforeEach, afterAll} from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import {query} from '../../src/database/db.js';
import redis from '../../src/database/redis.js';

const suffix = Date.now();
const validPassword = 'TestPass123!';

function uniqueUser(label) {
    return {
        username: `vitest_plan_${label}_${suffix}`,
        email: `vitest_plan_${label}_${suffix}@example.com`,
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
            title: `Vitest Plan Recipe ${suffix} ${Math.random()}`,
            prepTime: 10,
            servings: 2,
            ingredients: [],
            steps: [],
            ...overrides,
        })
        .expect(201);
    return res.body;
}

async function createCookbookViaApi(token, title) {
    const res = await request(app)
        .post('/cookbooks/create')
        .set('Authorization', `Bearer ${token}`)
        .field('title', title ?? `Vitest Plan Cookbook ${suffix} ${Math.random()}`)
        .expect(201);
    return res.body;
}

async function addMemberToCookbook(ownerToken, cookbookId, userId, role) {
    await request(app)
        .post(`/cookbooks/${cookbookId}/members`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({userId, role})
        .expect(201);
}

async function getPersonalPlanId(userId) {
    const result = await query('SELECT id FROM meal_plans WHERE user_id = $1', [userId]);
    return result.rows[0].id;
}

async function getCookbookPlanId(cookbookId) {
    const result = await query('SELECT id FROM meal_plans WHERE cookbook_id = $1', [cookbookId]);
    return result.rows[0].id;
}

async function addItemViaApi(token, planId, {recipeId, date} = {}) {
    const res = await request(app)
        .post(`/plans/${planId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({recipeId, date: date ?? '2026-01-01'})
        .expect(201);
    return res.body;
}

beforeEach(async () => {
    await resetRateLimits();
});

afterAll(async () => {
    await query("DELETE FROM users WHERE username LIKE 'vitest\\_plan\\_%' ESCAPE '\\'").catch(() => {});
});

describe('POST /plans/:planId (add item to plan)', () => {
    it("adds an item to the caller's own plan", async () => {
        const user = await registerAndLogin('add_ok');
        const planId = await getPersonalPlanId(user.id);
        const recipe = await createRecipeViaApi(user.token);

        const res = await request(app)
            .post(`/plans/${planId}`)
            .set('Authorization', `Bearer ${user.token}`)
            .send({recipeId: recipe.id, date: '2026-01-01'});

        expect(res.status).toBe(201);
        expect(res.body.recipe_id).toBe(recipe.id);
        expect(res.body.meal_plan_id).toBe(planId);
    });

    it('allows an editor of the cookbook to add an item to the cookbook plan', async () => {
        const owner = await registerAndLogin('add_cb_owner');
        const editor = await registerAndLogin('add_cb_editor');
        const cookbook = await createCookbookViaApi(owner.token);
        const planId = await getCookbookPlanId(cookbook.id);
        await addMemberToCookbook(owner.token, cookbook.id, editor.id, 'editor');
        const recipe = await createRecipeViaApi(owner.token);

        const res = await request(app)
            .post(`/plans/${planId}`)
            .set('Authorization', `Bearer ${editor.token}`)
            .send({recipeId: recipe.id, date: '2026-01-01'});

        expect(res.status).toBe(201);
    });

    it('forbids a viewer of the cookbook from adding an item', async () => {
        const owner = await registerAndLogin('add_cb_owner2');
        const viewer = await registerAndLogin('add_cb_viewer');
        const cookbook = await createCookbookViaApi(owner.token);
        const planId = await getCookbookPlanId(cookbook.id);
        await addMemberToCookbook(owner.token, cookbook.id, viewer.id, 'viewer');
        const recipe = await createRecipeViaApi(owner.token);

        const res = await request(app)
            .post(`/plans/${planId}`)
            .set('Authorization', `Bearer ${viewer.token}`)
            .send({recipeId: recipe.id, date: '2026-01-01'});

        expect(res.status).toBe(403);
    });

    it("forbids a user from adding an item to another user's personal plan", async () => {
        const owner = await registerAndLogin('add_owner');
        const outsider = await registerAndLogin('add_outsider');
        const planId = await getPersonalPlanId(owner.id);
        const recipe = await createRecipeViaApi(owner.token);

        const res = await request(app)
            .post(`/plans/${planId}`)
            .set('Authorization', `Bearer ${outsider.token}`)
            .send({recipeId: recipe.id, date: '2026-01-01'});

        expect(res.status).toBe(403);
    });

    it('returns 404 for a non-member of the cookbook owning the plan', async () => {
        const owner = await registerAndLogin('add_cb_owner3');
        const outsider = await registerAndLogin('add_cb_outsider');
        const cookbook = await createCookbookViaApi(owner.token);
        const planId = await getCookbookPlanId(cookbook.id);
        const recipe = await createRecipeViaApi(owner.token);

        const res = await request(app)
            .post(`/plans/${planId}`)
            .set('Authorization', `Bearer ${outsider.token}`)
            .send({recipeId: recipe.id, date: '2026-01-01'});

        expect(res.status).toBe(404);
    });

    it('returns 404 for a nonexistent plan', async () => {
        const user = await registerAndLogin('add_404');
        const recipe = await createRecipeViaApi(user.token);

        const res = await request(app)
            .post('/plans/999999999')
            .set('Authorization', `Bearer ${user.token}`)
            .send({recipeId: recipe.id, date: '2026-01-01'});

        expect(res.status).toBe(404);
    });

    it('rejects a missing recipeId or date', async () => {
        const user = await registerAndLogin('add_missing');
        const planId = await getPersonalPlanId(user.id);

        const res = await request(app)
            .post(`/plans/${planId}`)
            .set('Authorization', `Bearer ${user.token}`)
            .send({});

        expect(res.status).toBe(400);
        expect(res.body.errors.some((e) => e.field === 'recipeId')).toBe(true);
        expect(res.body.errors.some((e) => e.field === 'date')).toBe(true);
    });

    it('rejects an invalid date format', async () => {
        const user = await registerAndLogin('add_bad_date');
        const planId = await getPersonalPlanId(user.id);
        const recipe = await createRecipeViaApi(user.token);

        const res = await request(app)
            .post(`/plans/${planId}`)
            .set('Authorization', `Bearer ${user.token}`)
            .send({recipeId: recipe.id, date: 'not-a-date'});

        expect(res.status).toBe(400);
    });

    it('rejects a request with no auth token', async () => {
        await request(app).post('/plans/1').send({recipeId: 1, date: '2026-01-01'}).expect(403);
    });
});

describe('GET /plans/:planId', () => {
    it("returns the plan with its items nested as a sub-array", async () => {
        const user = await registerAndLogin('get_ok');
        const planId = await getPersonalPlanId(user.id);
        const recipe = await createRecipeViaApi(user.token);
        const item = await addItemViaApi(user.token, planId, {recipeId: recipe.id});

        const res = await request(app).get(`/plans/${planId}`).set('Authorization', `Bearer ${user.token}`);

        expect(res.status).toBe(200);
        expect(res.body.id).toBe(planId);
        expect(Array.isArray(res.body.items)).toBe(true);
        expect(res.body.items.some((i) => i.id === item.id)).toBe(true);
    });

    it('returns an empty items array for a plan with no items', async () => {
        const user = await registerAndLogin('get_empty');
        const planId = await getPersonalPlanId(user.id);

        const res = await request(app).get(`/plans/${planId}`).set('Authorization', `Bearer ${user.token}`);

        expect(res.status).toBe(200);
        expect(res.body.items).toEqual([]);
    });

    it("forbids reading another user's personal plan", async () => {
        const owner = await registerAndLogin('get_owner');
        const outsider = await registerAndLogin('get_outsider');
        const planId = await getPersonalPlanId(owner.id);

        const res = await request(app).get(`/plans/${planId}`).set('Authorization', `Bearer ${outsider.token}`);

        expect(res.status).toBe(403);
    });

    it('allows a viewer of the cookbook to read the cookbook plan', async () => {
        const owner = await registerAndLogin('get_cb_owner');
        const viewer = await registerAndLogin('get_cb_viewer');
        const cookbook = await createCookbookViaApi(owner.token);
        const planId = await getCookbookPlanId(cookbook.id);
        await addMemberToCookbook(owner.token, cookbook.id, viewer.id, 'viewer');

        const res = await request(app).get(`/plans/${planId}`).set('Authorization', `Bearer ${viewer.token}`);

        expect(res.status).toBe(200);
    });

    it('returns 404 for a non-member of the cookbook owning the plan', async () => {
        const owner = await registerAndLogin('get_cb_owner2');
        const outsider = await registerAndLogin('get_cb_outsider');
        const cookbook = await createCookbookViaApi(owner.token);
        const planId = await getCookbookPlanId(cookbook.id);

        const res = await request(app).get(`/plans/${planId}`).set('Authorization', `Bearer ${outsider.token}`);

        expect(res.status).toBe(404);
    });

    it('returns 404 for a nonexistent plan', async () => {
        const user = await registerAndLogin('get_404');

        const res = await request(app).get('/plans/999999999').set('Authorization', `Bearer ${user.token}`);

        expect(res.status).toBe(404);
    });

    it('rejects a non-integer planId', async () => {
        const user = await registerAndLogin('get_bad_id');

        const res = await request(app).get('/plans/not-a-number').set('Authorization', `Bearer ${user.token}`);

        expect(res.status).toBe(400);
    });

    it('rejects a request with no auth token', async () => {
        await request(app).get('/plans/1').expect(403);
    });
});

describe('PATCH /plans/:planId/items/:itemId', () => {
    it('allows the owner to update the date of an item', async () => {
        const user = await registerAndLogin('patch_ok');
        const planId = await getPersonalPlanId(user.id);
        const recipe = await createRecipeViaApi(user.token);
        const item = await addItemViaApi(user.token, planId, {recipeId: recipe.id, date: '2026-01-01'});

        const res = await request(app)
            .patch(`/plans/${planId}/items/${item.id}`)
            .set('Authorization', `Bearer ${user.token}`)
            .send({date: '2026-02-02'});

        expect(res.status).toBe(200);
        expect(res.body.date).toMatch(/^2026-02-02/);
        expect(res.body.recipe_id).toBe(recipe.id);
    });

    it('allows the owner to update the recipe of an item', async () => {
        const user = await registerAndLogin('patch_recipe');
        const planId = await getPersonalPlanId(user.id);
        const recipe = await createRecipeViaApi(user.token);
        const otherRecipe = await createRecipeViaApi(user.token);
        const item = await addItemViaApi(user.token, planId, {recipeId: recipe.id});

        const res = await request(app)
            .patch(`/plans/${planId}/items/${item.id}`)
            .set('Authorization', `Bearer ${user.token}`)
            .send({recipeId: otherRecipe.id});

        expect(res.status).toBe(200);
        expect(res.body.recipe_id).toBe(otherRecipe.id);
    });

    it("forbids updating another user's plan item", async () => {
        const owner = await registerAndLogin('patch_owner');
        const outsider = await registerAndLogin('patch_outsider');
        const planId = await getPersonalPlanId(owner.id);
        const recipe = await createRecipeViaApi(owner.token);
        const item = await addItemViaApi(owner.token, planId, {recipeId: recipe.id});

        const res = await request(app)
            .patch(`/plans/${planId}/items/${item.id}`)
            .set('Authorization', `Bearer ${outsider.token}`)
            .send({date: '2026-03-03'});

        expect(res.status).toBe(403);
    });

    it('returns 404 when the item does not belong to the given plan', async () => {
        const user = await registerAndLogin('patch_wrong_plan');
        const planId = await getPersonalPlanId(user.id);
        const recipe = await createRecipeViaApi(user.token);
        const item = await addItemViaApi(user.token, planId, {recipeId: recipe.id});
        const other = await registerAndLogin('patch_wrong_plan_other');
        const otherPlanId = await getPersonalPlanId(other.id);

        const res = await request(app)
            .patch(`/plans/${otherPlanId}/items/${item.id}`)
            .set('Authorization', `Bearer ${other.token}`)
            .send({date: '2026-03-03'});

        expect(res.status).toBe(404);
    });

    it('returns 404 for a nonexistent item', async () => {
        const user = await registerAndLogin('patch_404');
        const planId = await getPersonalPlanId(user.id);

        const res = await request(app)
            .patch(`/plans/${planId}/items/999999999`)
            .set('Authorization', `Bearer ${user.token}`)
            .send({date: '2026-03-03'});

        expect(res.status).toBe(404);
    });

    it('rejects an invalid recipeId', async () => {
        const user = await registerAndLogin('patch_bad_recipe');
        const planId = await getPersonalPlanId(user.id);
        const recipe = await createRecipeViaApi(user.token);
        const item = await addItemViaApi(user.token, planId, {recipeId: recipe.id});

        const res = await request(app)
            .patch(`/plans/${planId}/items/${item.id}`)
            .set('Authorization', `Bearer ${user.token}`)
            .send({recipeId: 'not-a-number'});

        expect(res.status).toBe(400);
    });

    it('rejects an invalid date format', async () => {
        const user = await registerAndLogin('patch_bad_date');
        const planId = await getPersonalPlanId(user.id);
        const recipe = await createRecipeViaApi(user.token);
        const item = await addItemViaApi(user.token, planId, {recipeId: recipe.id});

        const res = await request(app)
            .patch(`/plans/${planId}/items/${item.id}`)
            .set('Authorization', `Bearer ${user.token}`)
            .send({date: 'not-a-date'});

        expect(res.status).toBe(400);
    });

    it('rejects a request with no auth token', async () => {
        await request(app).patch('/plans/1/items/1').send({date: '2026-01-01'}).expect(403);
    });
});

describe('DELETE /plans/:planId/items/:itemId', () => {
    it('allows the owner to delete an item', async () => {
        const user = await registerAndLogin('delete_ok');
        const planId = await getPersonalPlanId(user.id);
        const recipe = await createRecipeViaApi(user.token);
        const item = await addItemViaApi(user.token, planId, {recipeId: recipe.id});

        const res = await request(app)
            .delete(`/plans/${planId}/items/${item.id}`)
            .set('Authorization', `Bearer ${user.token}`);

        expect(res.status).toBe(200);

        const stillThere = await query('SELECT id FROM meal_plan_items WHERE id = $1', [item.id]);
        expect(stillThere.rows).toHaveLength(0);
    });

    it("forbids deleting another user's plan item", async () => {
        const owner = await registerAndLogin('delete_owner');
        const outsider = await registerAndLogin('delete_outsider');
        const planId = await getPersonalPlanId(owner.id);
        const recipe = await createRecipeViaApi(owner.token);
        const item = await addItemViaApi(owner.token, planId, {recipeId: recipe.id});

        const res = await request(app)
            .delete(`/plans/${planId}/items/${item.id}`)
            .set('Authorization', `Bearer ${outsider.token}`);

        expect(res.status).toBe(403);

        const stillThere = await query('SELECT id FROM meal_plan_items WHERE id = $1', [item.id]);
        expect(stillThere.rows).toHaveLength(1);
    });

    it('returns 404 when the item does not belong to the given plan', async () => {
        const user = await registerAndLogin('delete_wrong_plan');
        const planId = await getPersonalPlanId(user.id);
        const recipe = await createRecipeViaApi(user.token);
        const item = await addItemViaApi(user.token, planId, {recipeId: recipe.id});
        const other = await registerAndLogin('delete_wrong_plan_other');
        const otherPlanId = await getPersonalPlanId(other.id);

        const res = await request(app)
            .delete(`/plans/${otherPlanId}/items/${item.id}`)
            .set('Authorization', `Bearer ${other.token}`);

        expect(res.status).toBe(404);
    });

    it('returns 404 for a nonexistent item', async () => {
        const user = await registerAndLogin('delete_404');
        const planId = await getPersonalPlanId(user.id);

        const res = await request(app)
            .delete(`/plans/${planId}/items/999999999`)
            .set('Authorization', `Bearer ${user.token}`);

        expect(res.status).toBe(404);
    });

    it('rejects a request with no auth token', async () => {
        await request(app).delete('/plans/1/items/1').expect(403);
    });
});
