import {describe, it, expect, beforeEach, afterAll} from 'vitest';
import request from 'supertest';
import path from 'path';
import fs from 'fs';
import app from '../../src/app.js';
import {query} from '../../src/database/db.js';
import redis from '../../src/database/redis.js';

const suffix = Date.now();
const validPassword = 'TestPass123!';
const RECIPE_IMAGE_DIR = path.join(process.cwd(), 'src', 'public', 'recipe_image');

function uniqueUser(label) {
    return {
        username: `vitest_recipe_${label}_${suffix}`,
        email: `vitest_recipe_${label}_${suffix}@example.com`,
    };
}

function validRecipePayload(overrides = {}) {
    return {
        title: 'Quiche Lorraine',
        description: 'Classic French quiche',
        prepTime: 15,
        cookTime: 30,
        servings: 4,
        ingredients: [{name: 'Egg', unit: 'pcs', type: 'dairy', quantity: 4}],
        steps: [{step_number: 1, description: 'Mix everything'}],
        ...overrides,
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
        .send(validRecipePayload(overrides))
        .expect(201);
    return res.body;
}

// The recipe endpoints sit behind a real Redis-backed rate limiter
// (10 general requests/min per IP). This suite fires many requests per
// test, so its own counters are reset before each test.
beforeEach(async () => {
    await resetRateLimits();
});

afterAll(async () => {
    await query("DELETE FROM tags WHERE name LIKE 'vitest\\_tag\\_%' ESCAPE '\\'").catch(() => {});
    await query("DELETE FROM users WHERE username LIKE 'vitest\\_recipe\\_%' ESCAPE '\\'").catch(() => {});
});

describe('POST /recipes', () => {
    it('creates a recipe with ingredients and steps', async () => {
        const user = await registerAndLogin('create_ok');

        const res = await request(app)
            .post('/recipes')
            .set('Authorization', `Bearer ${user.token}`)
            .send(validRecipePayload());

        expect(res.status).toBe(201);
        expect(res.body.title).toBe('Quiche Lorraine');
        expect(res.body.owner).toBe(user.id);
    });

    it('defaults cookTime to 0 when omitted', async () => {
        const user = await registerAndLogin('create_no_cooktime');
        const payload = validRecipePayload();
        delete payload.cookTime;

        const res = await request(app).post('/recipes').set('Authorization', `Bearer ${user.token}`).send(payload);

        expect(res.status).toBe(201);
        expect(res.body.cooktime).toBe(0);
    });

    it('accepts empty ingredients and steps arrays', async () => {
        const user = await registerAndLogin('create_empty_arrays');

        const res = await request(app)
            .post('/recipes')
            .set('Authorization', `Bearer ${user.token}`)
            .send(validRecipePayload({ingredients: [], steps: []}));

        expect(res.status).toBe(201);
    });

    it('rejects a request with no auth token', async () => {
        await request(app).post('/recipes').send(validRecipePayload()).expect(403);
    });

    it('rejects a missing title', async () => {
        const user = await registerAndLogin('create_no_title');
        const payload = validRecipePayload();
        delete payload.title;

        const res = await request(app).post('/recipes').set('Authorization', `Bearer ${user.token}`).send(payload);

        expect(res.status).toBe(400);
        expect(res.body.errors.some((e) => e.field === 'title')).toBe(true);
    });

    it('rejects a title longer than 100 characters', async () => {
        const user = await registerAndLogin('create_long_title');

        const res = await request(app)
            .post('/recipes')
            .set('Authorization', `Bearer ${user.token}`)
            .send(validRecipePayload({title: 'x'.repeat(101)}));

        expect(res.status).toBe(400);
        expect(res.body.errors.some((e) => e.field === 'title')).toBe(true);
    });

    it('accepts a title of exactly 100 characters (boundary)', async () => {
        const user = await registerAndLogin('create_title_100');

        const res = await request(app)
            .post('/recipes')
            .set('Authorization', `Bearer ${user.token}`)
            .send(validRecipePayload({title: 'x'.repeat(100)}));

        expect(res.status).toBe(201);
    });

    it('rejects an empty string title', async () => {
        const user = await registerAndLogin('create_empty_title');

        const res = await request(app)
            .post('/recipes')
            .set('Authorization', `Bearer ${user.token}`)
            .send(validRecipePayload({title: ''}));

        expect(res.status).toBe(400);
        expect(res.body.errors.some((e) => e.field === 'title')).toBe(true);
    });

    it('rejects a non-string title', async () => {
        const user = await registerAndLogin('create_title_number');

        const res = await request(app)
            .post('/recipes')
            .set('Authorization', `Bearer ${user.token}`)
            .send(validRecipePayload({title: 12345}));

        expect(res.status).toBe(400);
        expect(res.body.errors.some((e) => e.field === 'title')).toBe(true);
    });

    it('rejects a non-numeric prepTime', async () => {
        const user = await registerAndLogin('create_preptime_str');

        const res = await request(app)
            .post('/recipes')
            .set('Authorization', `Bearer ${user.token}`)
            .send(validRecipePayload({prepTime: 'abc'}));

        expect(res.status).toBe(400);
        expect(res.body.errors.some((e) => e.field === 'prepTime')).toBe(true);
    });

    it('accepts prepTime: 0 (boundary)', async () => {
        const user = await registerAndLogin('create_preptime_zero');

        const res = await request(app)
            .post('/recipes')
            .set('Authorization', `Bearer ${user.token}`)
            .send(validRecipePayload({prepTime: 0}));

        expect(res.status).toBe(201);
    });

    it('rejects servings: 0 (below the minimum of 1)', async () => {
        const user = await registerAndLogin('create_servings_zero');

        const res = await request(app)
            .post('/recipes')
            .set('Authorization', `Bearer ${user.token}`)
            .send(validRecipePayload({servings: 0}));

        expect(res.status).toBe(400);
        expect(res.body.errors.some((e) => e.field === 'servings')).toBe(true);
    });

    it('rejects a non-integer (float) servings value', async () => {
        const user = await registerAndLogin('create_servings_float');

        const res = await request(app)
            .post('/recipes')
            .set('Authorization', `Bearer ${user.token}`)
            .send(validRecipePayload({servings: 3.5}));

        expect(res.status).toBe(400);
        expect(res.body.errors.some((e) => e.field === 'servings')).toBe(true);
    });

    it('rejects ingredients that is not an array', async () => {
        const user = await registerAndLogin('create_ing_not_array');

        const res = await request(app)
            .post('/recipes')
            .set('Authorization', `Bearer ${user.token}`)
            .send(validRecipePayload({ingredients: 'not an array'}));

        expect(res.status).toBe(400);
        expect(res.body.errors.some((e) => e.field === 'ingredients')).toBe(true);
    });

    it('rejects a missing prepTime', async () => {
        const user = await registerAndLogin('create_no_preptime');
        const payload = validRecipePayload();
        delete payload.prepTime;

        const res = await request(app).post('/recipes').set('Authorization', `Bearer ${user.token}`).send(payload);

        expect(res.status).toBe(400);
        expect(res.body.errors.some((e) => e.field === 'prepTime')).toBe(true);
    });

    it('rejects a missing servings', async () => {
        const user = await registerAndLogin('create_no_servings');
        const payload = validRecipePayload();
        delete payload.servings;

        const res = await request(app).post('/recipes').set('Authorization', `Bearer ${user.token}`).send(payload);

        expect(res.status).toBe(400);
        expect(res.body.errors.some((e) => e.field === 'servings')).toBe(true);
    });

    it('rejects a missing ingredients field', async () => {
        const user = await registerAndLogin('create_no_ingredients');
        const payload = validRecipePayload();
        delete payload.ingredients;

        const res = await request(app).post('/recipes').set('Authorization', `Bearer ${user.token}`).send(payload);

        expect(res.status).toBe(400);
        expect(res.body.errors.some((e) => e.field === 'ingredients')).toBe(true);
    });

    it('rejects an ingredient missing a name', async () => {
        const user = await registerAndLogin('create_ing_no_name');

        const res = await request(app)
            .post('/recipes')
            .set('Authorization', `Bearer ${user.token}`)
            .send(validRecipePayload({ingredients: [{unit: 'pcs', quantity: 1}]}));

        expect(res.status).toBe(400);
        expect(res.body.errors.some((e) => e.field === 'ingredients[0].name')).toBe(true);
    });

    it('rejects an ingredient missing a quantity', async () => {
        const user = await registerAndLogin('create_ing_no_qty');

        const res = await request(app)
            .post('/recipes')
            .set('Authorization', `Bearer ${user.token}`)
            .send(validRecipePayload({ingredients: [{name: 'Egg'}]}));

        expect(res.status).toBe(400);
        expect(res.body.errors.some((e) => e.field === 'ingredients[0].quantity')).toBe(true);
    });

    it('rejects a step missing step_number', async () => {
        const user = await registerAndLogin('create_step_no_number');

        const res = await request(app)
            .post('/recipes')
            .set('Authorization', `Bearer ${user.token}`)
            .send(validRecipePayload({steps: [{description: 'Mix'}]}));

        expect(res.status).toBe(400);
        expect(res.body.errors.some((e) => e.field === 'steps[0].step_number')).toBe(true);
    });

    it('rejects a step missing description', async () => {
        const user = await registerAndLogin('create_step_no_desc');

        const res = await request(app)
            .post('/recipes')
            .set('Authorization', `Bearer ${user.token}`)
            .send(validRecipePayload({steps: [{step_number: 1}]}));

        expect(res.status).toBe(400);
        expect(res.body.errors.some((e) => e.field === 'steps[0].description')).toBe(true);
    });
});

describe('POST /recipes/:recipeId/image', () => {
    it('uploads a jpeg image and updates the recipe image_url', async () => {
        const user = await registerAndLogin('image_ok');
        const recipe = await createRecipeViaApi(user.token);

        const res = await request(app)
            .post(`/recipes/${recipe.id}/image`)
            .set('Authorization', `Bearer ${user.token}`)
            .attach('image', Buffer.from('fake-jpeg-bytes'), {filename: 'test.jpg', contentType: 'image/jpeg'});

        expect(res.status).toBe(201);
        expect(res.body.image_url).toMatch(/^\/public\/recipe_image\//);

        await request(app).delete(`/recipes/${recipe.id}`).set('Authorization', `Bearer ${user.token}`);
    });

    it('rejects an unsupported mime type', async () => {
        const user = await registerAndLogin('image_bad_mime');
        const recipe = await createRecipeViaApi(user.token);

        const res = await request(app)
            .post(`/recipes/${recipe.id}/image`)
            .set('Authorization', `Bearer ${user.token}`)
            .attach('image', Buffer.from('not an image'), {filename: 'test.txt', contentType: 'text/plain'});

        expect(res.status).toBe(400);

        await request(app).delete(`/recipes/${recipe.id}`).set('Authorization', `Bearer ${user.token}`);
    });

    it('rejects a request with no file attached', async () => {
        const user = await registerAndLogin('image_no_file');
        const recipe = await createRecipeViaApi(user.token);

        const res = await request(app).post(`/recipes/${recipe.id}/image`).set('Authorization', `Bearer ${user.token}`);

        expect(res.status).toBe(400);

        await request(app).delete(`/recipes/${recipe.id}`).set('Authorization', `Bearer ${user.token}`);
    });

    it('returns 404 for a nonexistent recipe', async () => {
        const user = await registerAndLogin('image_404');

        const res = await request(app)
            .post('/recipes/999999999/image')
            .set('Authorization', `Bearer ${user.token}`)
            .attach('image', Buffer.from('x'), {filename: 'test.jpg', contentType: 'image/jpeg'});

        expect(res.status).toBe(404);
    });

    it('forbids uploading an image to a recipe owned by someone else', async () => {
        const owner = await registerAndLogin('image_owner');
        const intruder = await registerAndLogin('image_intruder');
        const recipe = await createRecipeViaApi(owner.token);

        const res = await request(app)
            .post(`/recipes/${recipe.id}/image`)
            .set('Authorization', `Bearer ${intruder.token}`)
            .attach('image', Buffer.from('x'), {filename: 'test.jpg', contentType: 'image/jpeg'});

        expect(res.status).toBe(403);

        await request(app).delete(`/recipes/${recipe.id}`).set('Authorization', `Bearer ${owner.token}`);
    });

    it('rejects a non-integer recipeId', async () => {
        const user = await registerAndLogin('image_bad_id');

        const res = await request(app)
            .post('/recipes/not-a-number/image')
            .set('Authorization', `Bearer ${user.token}`)
            .attach('image', Buffer.from('x'), {filename: 'test.jpg', contentType: 'image/jpeg'});

        expect(res.status).toBe(400);
    });

    it('rejects a request with no auth token', async () => {
        const res = await request(app)
            .post('/recipes/1/image')
            .attach('image', Buffer.from('x'), {filename: 'test.jpg', contentType: 'image/jpeg'});

        expect(res.status).toBe(403);
    });

    it('accepts a png image', async () => {
        const user = await registerAndLogin('image_png');
        const recipe = await createRecipeViaApi(user.token);

        const res = await request(app)
            .post(`/recipes/${recipe.id}/image`)
            .set('Authorization', `Bearer ${user.token}`)
            .attach('image', Buffer.from('fake-png-bytes'), {filename: 'test.png', contentType: 'image/png'});

        expect(res.status).toBe(201);

        await request(app).delete(`/recipes/${recipe.id}`).set('Authorization', `Bearer ${user.token}`);
    });

    it('accepts a webp image', async () => {
        const user = await registerAndLogin('image_webp');
        const recipe = await createRecipeViaApi(user.token);

        const res = await request(app)
            .post(`/recipes/${recipe.id}/image`)
            .set('Authorization', `Bearer ${user.token}`)
            .attach('image', Buffer.from('fake-webp-bytes'), {filename: 'test.webp', contentType: 'image/webp'});

        expect(res.status).toBe(201);

        await request(app).delete(`/recipes/${recipe.id}`).set('Authorization', `Bearer ${user.token}`);
    });

    it('rejects a file over the 5MB size limit', async () => {
        const user = await registerAndLogin('image_too_big');
        const recipe = await createRecipeViaApi(user.token);
        const oversized = Buffer.alloc(6 * 1024 * 1024);

        const res = await request(app)
            .post(`/recipes/${recipe.id}/image`)
            .set('Authorization', `Bearer ${user.token}`)
            .attach('image', oversized, {filename: 'big.jpg', contentType: 'image/jpeg'});

        expect(res.status).toBe(400);

        await request(app).delete(`/recipes/${recipe.id}`).set('Authorization', `Bearer ${user.token}`);
    }, 20000);

    it('rejects a file attached under the wrong field name', async () => {
        const user = await registerAndLogin('image_wrong_field');
        const recipe = await createRecipeViaApi(user.token);

        const res = await request(app)
            .post(`/recipes/${recipe.id}/image`)
            .set('Authorization', `Bearer ${user.token}`)
            .attach('file', Buffer.from('x'), {filename: 'test.jpg', contentType: 'image/jpeg'});

        expect(res.status).toBe(400);

        await request(app).delete(`/recipes/${recipe.id}`).set('Authorization', `Bearer ${user.token}`);
    });

    it('rejects more than one file in the same request', async () => {
        const user = await registerAndLogin('image_multi_file');
        const recipe = await createRecipeViaApi(user.token);

        const res = await request(app)
            .post(`/recipes/${recipe.id}/image`)
            .set('Authorization', `Bearer ${user.token}`)
            .attach('image', Buffer.from('one'), {filename: 'one.jpg', contentType: 'image/jpeg'})
            .attach('image', Buffer.from('two'), {filename: 'two.jpg', contentType: 'image/jpeg'});

        expect(res.status).toBe(400);

        await request(app).delete(`/recipes/${recipe.id}`).set('Authorization', `Bearer ${user.token}`);
    });
});

describe('GET /recipes/:recipeId', () => {
    it("returns the recipe for its owner", async () => {
        const user = await registerAndLogin('get_ok');
        const recipe = await createRecipeViaApi(user.token);

        const res = await request(app).get(`/recipes/${recipe.id}`).set('Authorization', `Bearer ${user.token}`);

        expect(res.status).toBe(200);
        expect(res.body.title).toBe('Quiche Lorraine');
    });

    it('returns 404 for a nonexistent recipe', async () => {
        const user = await registerAndLogin('get_404');

        const res = await request(app).get('/recipes/999999999').set('Authorization', `Bearer ${user.token}`);

        expect(res.status).toBe(404);
    });

    it('forbids viewing a recipe owned by someone else', async () => {
        const owner = await registerAndLogin('get_owner');
        const intruder = await registerAndLogin('get_intruder');
        const recipe = await createRecipeViaApi(owner.token);

        const res = await request(app).get(`/recipes/${recipe.id}`).set('Authorization', `Bearer ${intruder.token}`);

        expect(res.status).toBe(403);
    });

    it('rejects a non-integer recipeId', async () => {
        const user = await registerAndLogin('get_bad_id');

        const res = await request(app).get('/recipes/not-a-number').set('Authorization', `Bearer ${user.token}`);

        expect(res.status).toBe(400);
    });

    it('rejects a request with no auth token', async () => {
        await request(app).get('/recipes/1').expect(403);
    });
});

describe('GET /recipes (search)', () => {
    it('filters by exact servings', async () => {
        const user = await registerAndLogin('search_servings');
        const namePrefix = `SearchServings ${suffix}`;
        await createRecipeViaApi(user.token, {title: `${namePrefix} A`, servings: 2});
        await createRecipeViaApi(user.token, {title: `${namePrefix} B`, servings: 6});

        const res = await request(app)
            .get('/recipes')
            .query({name: namePrefix, servings: 2})
            .set('Authorization', `Bearer ${user.token}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(1);
        expect(res.body[0].title).toBe(`${namePrefix} A`);
    });

    it('filters by maximum prepTime', async () => {
        const user = await registerAndLogin('search_preptime');
        const namePrefix = `SearchPrepTime ${suffix}`;
        await createRecipeViaApi(user.token, {title: `${namePrefix} Quick`, prepTime: 10});
        await createRecipeViaApi(user.token, {title: `${namePrefix} Slow`, prepTime: 90});

        const res = await request(app)
            .get('/recipes')
            .query({name: namePrefix, prepTime: 20})
            .set('Authorization', `Bearer ${user.token}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(1);
        expect(res.body[0].title).toBe(`${namePrefix} Quick`);
    });

    it('filters by tag', async () => {
        const user = await registerAndLogin('search_tag');
        const namePrefix = `SearchTag ${suffix}`;
        const tagName = `vitest_tag_search_${suffix}`;
        const tagged = await createRecipeViaApi(user.token, {title: `${namePrefix} Tagged`});
        await createRecipeViaApi(user.token, {title: `${namePrefix} Untagged`});

        await request(app)
            .patch(`/recipes/${tagged.id}`)
            .set('Authorization', `Bearer ${user.token}`)
            .send({tags: [tagName]})
            .expect(200);

        const res = await request(app)
            .get('/recipes')
            .query({name: namePrefix, tag: tagName})
            .set('Authorization', `Bearer ${user.token}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(1);
        expect(res.body[0].id).toBe(tagged.id);
    });

    it('returns an empty array when nothing matches', async () => {
        const user = await registerAndLogin('search_empty');

        const res = await request(app)
            .get('/recipes')
            .query({name: `NoSuchRecipeTitle ${suffix}`})
            .set('Authorization', `Bearer ${user.token}`);

        expect(res.status).toBe(200);
        expect(res.body).toEqual([]);
    });

    it('rejects a non-integer servings query param', async () => {
        const user = await registerAndLogin('search_bad_servings');

        const res = await request(app)
            .get('/recipes')
            .query({servings: 'not-a-number'})
            .set('Authorization', `Bearer ${user.token}`);

        expect(res.status).toBe(400);
    });

    it('rejects page: 0 (below the minimum of 1)', async () => {
        const user = await registerAndLogin('search_page_zero');

        const res = await request(app)
            .get('/recipes')
            .query({page: 0})
            .set('Authorization', `Bearer ${user.token}`);

        expect(res.status).toBe(400);
    });

    it('rejects a negative page number', async () => {
        const user = await registerAndLogin('search_page_neg');

        const res = await request(app)
            .get('/recipes')
            .query({page: -1})
            .set('Authorization', `Bearer ${user.token}`);

        expect(res.status).toBe(400);
    });

    it('returns an empty array for a page beyond the available results', async () => {
        const user = await registerAndLogin('search_page_beyond');
        const namePrefix = `SearchPageBeyond ${suffix}`;
        await createRecipeViaApi(user.token, {title: namePrefix});

        const res = await request(app)
            .get('/recipes')
            .query({name: namePrefix, page: 50})
            .set('Authorization', `Bearer ${user.token}`);

        expect(res.status).toBe(200);
        expect(res.body).toEqual([]);
    });

    it('treats a literal "%" in the search name as an ILIKE wildcard rather than a literal character', async () => {
        const user = await registerAndLogin('search_percent');
        const literalName = `PercentLit${suffix}%Test`;
        const collidingName = `PercentLit${suffix}ZZZTest`;
        await createRecipeViaApi(user.token, {title: literalName});
        await createRecipeViaApi(user.token, {title: collidingName});

        const res = await request(app)
            .get('/recipes')
            .query({name: `PercentLit${suffix}%Test`})
            .set('Authorization', `Bearer ${user.token}`);

        expect(res.status).toBe(200);
        // Both the exact match and the unrelated title match, because "%" in
        // user input is interpreted as an ILIKE wildcard instead of being
        // escaped to match a literal "%" character.
        const titles = res.body.map((r) => r.title);
        expect(titles).toContain(literalName);
        expect(titles).toContain(collidingName);
    });

    it('paginates results at 10 per page', async () => {
        const user = await registerAndLogin('search_pagination');
        const namePrefix = `Pagination ${suffix}`;
        const createdIds = [];

        for (let i = 0; i < 12; i++) {
            await resetRateLimits();
            const recipe = await createRecipeViaApi(user.token, {title: `${namePrefix} #${i}`});
            createdIds.push(recipe.id);
        }

        await resetRateLimits();
        const page1 = await request(app)
            .get('/recipes')
            .query({name: namePrefix, page: 1})
            .set('Authorization', `Bearer ${user.token}`)
            .expect(200);

        await resetRateLimits();
        const page2 = await request(app)
            .get('/recipes')
            .query({name: namePrefix, page: 2})
            .set('Authorization', `Bearer ${user.token}`)
            .expect(200);

        expect(page1.body).toHaveLength(10);
        expect(page2.body).toHaveLength(2);

        const page1Ids = page1.body.map((r) => r.id);
        const page2Ids = page2.body.map((r) => r.id);
        expect(page1Ids.filter((id) => page2Ids.includes(id))).toHaveLength(0);
        expect([...page1Ids, ...page2Ids].sort((a, b) => a - b)).toEqual([...createdIds].sort((a, b) => a - b));
    }, 30000);

    it('rejects a request with no auth token', async () => {
        await request(app).get('/recipes').expect(403);
    });
});

describe('PATCH /recipes/:recipeId', () => {
    it('updates scalar fields', async () => {
        const user = await registerAndLogin('patch_scalars');
        const recipe = await createRecipeViaApi(user.token);

        const res = await request(app)
            .patch(`/recipes/${recipe.id}`)
            .set('Authorization', `Bearer ${user.token}`)
            .send({title: 'Updated title', servings: 8});

        expect(res.status).toBe(200);
        expect(res.body.title).toBe('Updated title');
        expect(res.body.servings).toBe(8);
    });

    it('replaces ingredients: old links removed, new ones inserted', async () => {
        const user = await registerAndLogin('patch_ingredients');
        const recipe = await createRecipeViaApi(user.token, {
            ingredients: [{name: 'Egg', unit: 'pcs', type: 'dairy', quantity: 4}],
        });

        const before = await query('SELECT * FROM recipe_ingredients WHERE recipe_id = $1', [recipe.id]);
        expect(before.rows).toHaveLength(1);

        const res = await request(app)
            .patch(`/recipes/${recipe.id}`)
            .set('Authorization', `Bearer ${user.token}`)
            .send({ingredients: [{name: 'Flour', unit: 'g', type: 'grain', quantity: 200}]});

        expect(res.status).toBe(200);

        const after = await query(
            'SELECT ri.quantity, i.name FROM recipe_ingredients ri JOIN ingredients i ON i.id = ri.ingredient_id WHERE ri.recipe_id = $1',
            [recipe.id]
        );
        expect(after.rows).toHaveLength(1);
        expect(after.rows[0].name).toBe('Flour');
        expect(Number(after.rows[0].quantity)).toBe(200);
    });

    it('replaces steps: old rows removed, new ones inserted', async () => {
        const user = await registerAndLogin('patch_steps');
        const recipe = await createRecipeViaApi(user.token, {
            steps: [{step_number: 1, description: 'Original step'}],
        });

        const res = await request(app)
            .patch(`/recipes/${recipe.id}`)
            .set('Authorization', `Bearer ${user.token}`)
            .send({steps: [{step_number: 1, description: 'New step one'}, {step_number: 2, description: 'New step two'}]});

        expect(res.status).toBe(200);

        const after = await query(
            'SELECT step_number, description FROM recipe_steps WHERE recipe_id = $1 ORDER BY step_number',
            [recipe.id]
        );
        expect(after.rows).toHaveLength(2);
        expect(after.rows[0].description).toBe('New step one');
        expect(after.rows[1].description).toBe('New step two');
    });

    it('reuses an existing tag row instead of creating a duplicate', async () => {
        const user = await registerAndLogin('patch_tag_dedup');
        const tagName = `vitest_tag_dedup_${suffix}`;
        const recipeA = await createRecipeViaApi(user.token, {title: `Tag Dedup A ${suffix}`});
        const recipeB = await createRecipeViaApi(user.token, {title: `Tag Dedup B ${suffix}`});

        await request(app).patch(`/recipes/${recipeA.id}`).set('Authorization', `Bearer ${user.token}`).send({tags: [tagName]}).expect(200);
        await request(app).patch(`/recipes/${recipeB.id}`).set('Authorization', `Bearer ${user.token}`).send({tags: [tagName]}).expect(200);

        const tagRows = await query('SELECT id FROM tags WHERE name = $1', [tagName]);
        expect(tagRows.rows).toHaveLength(1);

        const linkRows = await query('SELECT recipe_id FROM recipe_tags WHERE tag_id = $1', [tagRows.rows[0].id]);
        const linkedIds = linkRows.rows.map((r) => r.recipe_id).sort((a, b) => a - b);
        expect(linkedIds).toEqual([recipeA.id, recipeB.id].sort((a, b) => a - b));
    });

    it('returns the unchanged recipe when the update body is empty', async () => {
        const user = await registerAndLogin('patch_noop');
        const recipe = await createRecipeViaApi(user.token);

        const res = await request(app)
            .patch(`/recipes/${recipe.id}`)
            .set('Authorization', `Bearer ${user.token}`)
            .send({});

        expect(res.status).toBe(200);
        expect(res.body.title).toBe('Quiche Lorraine');
    });

    it('rejects an explicit null (unlike an omitted field, .optional() does not skip null)', async () => {
        const user = await registerAndLogin('patch_null_title');
        const recipe = await createRecipeViaApi(user.token);

        const res = await request(app)
            .patch(`/recipes/${recipe.id}`)
            .set('Authorization', `Bearer ${user.token}`)
            .send({title: null});

        expect(res.status).toBe(400);
        expect(res.body.errors.some((e) => e.field === 'title')).toBe(true);
    });

    it('clears all ingredients when given an empty array', async () => {
        const user = await registerAndLogin('patch_clear_ing');
        const recipe = await createRecipeViaApi(user.token, {
            ingredients: [{name: 'Egg', unit: 'pcs', type: 'dairy', quantity: 2}],
        });

        await request(app)
            .patch(`/recipes/${recipe.id}`)
            .set('Authorization', `Bearer ${user.token}`)
            .send({ingredients: []})
            .expect(200);

        const after = await query('SELECT * FROM recipe_ingredients WHERE recipe_id = $1', [recipe.id]);
        expect(after.rows).toHaveLength(0);
    });

    it('clears all steps when given an empty array', async () => {
        const user = await registerAndLogin('patch_clear_steps');
        const recipe = await createRecipeViaApi(user.token, {
            steps: [{step_number: 1, description: 'Mix'}],
        });

        await request(app)
            .patch(`/recipes/${recipe.id}`)
            .set('Authorization', `Bearer ${user.token}`)
            .send({steps: []})
            .expect(200);

        const after = await query('SELECT * FROM recipe_steps WHERE recipe_id = $1', [recipe.id]);
        expect(after.rows).toHaveLength(0);
    });

    it('clears all tags when given an empty array', async () => {
        const user = await registerAndLogin('patch_clear_tags');
        const recipe = await createRecipeViaApi(user.token);
        await request(app)
            .patch(`/recipes/${recipe.id}`)
            .set('Authorization', `Bearer ${user.token}`)
            .send({tags: [`vitest_tag_clear_${suffix}`]})
            .expect(200);

        await request(app)
            .patch(`/recipes/${recipe.id}`)
            .set('Authorization', `Bearer ${user.token}`)
            .send({tags: []})
            .expect(200);

        const after = await query('SELECT * FROM recipe_tags WHERE recipe_id = $1', [recipe.id]);
        expect(after.rows).toHaveLength(0);
    });

    it('sending the same tag name twice in one request inserts a duplicate recipe_tags row (no unique constraint)', async () => {
        const user = await registerAndLogin('patch_dup_tag');
        const tagName = `vitest_tag_dup_${suffix}`;
        const recipe = await createRecipeViaApi(user.token);

        await request(app)
            .patch(`/recipes/${recipe.id}`)
            .set('Authorization', `Bearer ${user.token}`)
            .send({tags: [tagName, tagName]})
            .expect(200);

        const tagRows = await query('SELECT id FROM tags WHERE name = $1', [tagName]);
        expect(tagRows.rows).toHaveLength(1);

        const linkRows = await query('SELECT id FROM recipe_tags WHERE recipe_id = $1 AND tag_id = $2', [
            recipe.id,
            tagRows.rows[0].id,
        ]);
        expect(linkRows.rows).toHaveLength(2);
    });

    it('rejects an invalid field type', async () => {
        const user = await registerAndLogin('patch_invalid_type');
        const recipe = await createRecipeViaApi(user.token);

        const res = await request(app)
            .patch(`/recipes/${recipe.id}`)
            .set('Authorization', `Bearer ${user.token}`)
            .send({servings: 'not-a-number'});

        expect(res.status).toBe(400);
        expect(res.body.errors.some((e) => e.field === 'servings')).toBe(true);
    });

    it('returns 404 for a nonexistent recipe', async () => {
        const user = await registerAndLogin('patch_404');

        const res = await request(app)
            .patch('/recipes/999999999')
            .set('Authorization', `Bearer ${user.token}`)
            .send({title: 'x'});

        expect(res.status).toBe(404);
    });

    it('forbids a non-owner from updating', async () => {
        const owner = await registerAndLogin('patch_owner');
        const intruder = await registerAndLogin('patch_intruder');
        const recipe = await createRecipeViaApi(owner.token);

        const res = await request(app)
            .patch(`/recipes/${recipe.id}`)
            .set('Authorization', `Bearer ${intruder.token}`)
            .send({title: 'Hijacked'});

        expect(res.status).toBe(403);
    });

    it('rejects a request with no auth token', async () => {
        await request(app).patch('/recipes/1').send({title: 'x'}).expect(403);
    });
});

describe('DELETE /recipes/:recipeId', () => {
    it('deletes the recipe and cascades to ingredients, steps, and tags', async () => {
        const user = await registerAndLogin('delete_cascade');
        const recipe = await createRecipeViaApi(user.token, {
            ingredients: [{name: 'Egg', unit: 'pcs', type: 'dairy', quantity: 2}],
            steps: [{step_number: 1, description: 'Mix'}],
        });
        await request(app)
            .patch(`/recipes/${recipe.id}`)
            .set('Authorization', `Bearer ${user.token}`)
            .send({tags: [`vitest_tag_cascade_${suffix}`]})
            .expect(200);

        await request(app).delete(`/recipes/${recipe.id}`).set('Authorization', `Bearer ${user.token}`).expect(200);

        const [ingredients, steps, tags, recipeRow] = await Promise.all([
            query('SELECT * FROM recipe_ingredients WHERE recipe_id = $1', [recipe.id]),
            query('SELECT * FROM recipe_steps WHERE recipe_id = $1', [recipe.id]),
            query('SELECT * FROM recipe_tags WHERE recipe_id = $1', [recipe.id]),
            query('SELECT * FROM recipes WHERE id = $1', [recipe.id]),
        ]);

        expect(ingredients.rows).toHaveLength(0);
        expect(steps.rows).toHaveLength(0);
        expect(tags.rows).toHaveLength(0);
        expect(recipeRow.rows).toHaveLength(0);
    });

    it('removes the uploaded image file from disk', async () => {
        const user = await registerAndLogin('delete_image_cleanup');
        const recipe = await createRecipeViaApi(user.token);

        const uploadRes = await request(app)
            .post(`/recipes/${recipe.id}/image`)
            .set('Authorization', `Bearer ${user.token}`)
            .attach('image', Buffer.from('fake-jpeg-bytes'), {filename: 'test.jpg', contentType: 'image/jpeg'})
            .expect(201);

        const filename = path.basename(uploadRes.body.image_url);
        const filePath = path.join(RECIPE_IMAGE_DIR, filename);
        expect(fs.existsSync(filePath)).toBe(true);

        await request(app).delete(`/recipes/${recipe.id}`).set('Authorization', `Bearer ${user.token}`).expect(200);

        expect(fs.existsSync(filePath)).toBe(false);
    });

    it('returns 404 for a nonexistent recipe', async () => {
        const user = await registerAndLogin('delete_404');

        const res = await request(app).delete('/recipes/999999999').set('Authorization', `Bearer ${user.token}`);

        expect(res.status).toBe(404);
    });

    it('forbids a non-owner from deleting', async () => {
        const owner = await registerAndLogin('delete_owner');
        const intruder = await registerAndLogin('delete_intruder');
        const recipe = await createRecipeViaApi(owner.token);

        const res = await request(app).delete(`/recipes/${recipe.id}`).set('Authorization', `Bearer ${intruder.token}`);

        expect(res.status).toBe(403);

        const stillThere = await query('SELECT id FROM recipes WHERE id = $1', [recipe.id]);
        expect(stillThere.rows).toHaveLength(1);
    });

    it('returns 404 on a second delete of the same recipe', async () => {
        const user = await registerAndLogin('delete_twice');
        const recipe = await createRecipeViaApi(user.token);

        await request(app).delete(`/recipes/${recipe.id}`).set('Authorization', `Bearer ${user.token}`).expect(200);

        const res = await request(app).delete(`/recipes/${recipe.id}`).set('Authorization', `Bearer ${user.token}`);

        expect(res.status).toBe(404);
    });

    it('rejects a request with no auth token', async () => {
        await request(app).delete('/recipes/1').expect(403);
    });
});

describe('Recipe permissions via cookbook membership', () => {
    async function createCookbookAndAddMember(ownerToken, memberId, role) {
        const cbRes = await request(app)
            .post('/cookbooks/create')
            .set('Authorization', `Bearer ${ownerToken}`)
            .field('title', `Vitest Recipe CB ${suffix} ${Math.random()}`)
            .expect(201);

        await request(app)
            .post(`/cookbooks/${cbRes.body.id}/members`)
            .set('Authorization', `Bearer ${ownerToken}`)
            .send({userId: memberId, role})
            .expect(201);

        return cbRes.body.id;
    }

    it('allows a cookbook editor to update a recipe they do not own', async () => {
        const owner = await registerAndLogin('cb_write_owner');
        const editor = await registerAndLogin('cb_write_editor');
        const recipe = await createRecipeViaApi(owner.token);

        const cookbookId = await createCookbookAndAddMember(owner.token, editor.id, 'editor');
        await query('INSERT INTO cookbook_recipes (cookbook_id, recipe_id) VALUES ($1, $2)', [cookbookId, recipe.id]);

        const res = await request(app)
            .patch(`/recipes/${recipe.id}`)
            .set('Authorization', `Bearer ${editor.token}`)
            .send({title: 'Edited by cookbook editor'});

        expect(res.status).toBe(200);
    });

    it('forbids a cookbook viewer from updating a recipe they do not own', async () => {
        const owner = await registerAndLogin('cb_write_owner2');
        const viewer = await registerAndLogin('cb_write_viewer');
        const recipe = await createRecipeViaApi(owner.token);

        const cookbookId = await createCookbookAndAddMember(owner.token, viewer.id, 'viewer');
        await query('INSERT INTO cookbook_recipes (cookbook_id, recipe_id) VALUES ($1, $2)', [cookbookId, recipe.id]);

        const res = await request(app)
            .patch(`/recipes/${recipe.id}`)
            .set('Authorization', `Bearer ${viewer.token}`)
            .send({title: 'Should not be allowed'});

        expect(res.status).toBe(403);
    });

    it('allows a cookbook viewer to view (but not own) a recipe', async () => {
        const owner = await registerAndLogin('cb_view_owner');
        const viewer = await registerAndLogin('cb_view_viewer');
        const recipe = await createRecipeViaApi(owner.token);

        const cookbookId = await createCookbookAndAddMember(owner.token, viewer.id, 'viewer');
        await query('INSERT INTO cookbook_recipes (cookbook_id, recipe_id) VALUES ($1, $2)', [cookbookId, recipe.id]);

        const res = await request(app).get(`/recipes/${recipe.id}`).set('Authorization', `Bearer ${viewer.token}`);

        expect(res.status).toBe(200);
        expect(res.body.id).toBe(recipe.id);
    });
});
