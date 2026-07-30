import {describe, it, expect, beforeEach, afterAll} from 'vitest';
import request from 'supertest';
import path from 'path';
import fs from 'fs';
import app from '../../src/app.js';
import {query} from '../../src/database/db.js';
import redis from '../../src/database/redis.js';

const suffix = Date.now();
const validPassword = 'TestPass123!';
const COOKBOOK_IMAGE_DIR = path.join(process.cwd(), 'src', 'public', 'cookbook_image');

function uniqueUser(label) {
    return {
        username: `vitest_cb_${label}_${suffix}`,
        email: `vitest_cb_${label}_${suffix}@example.com`,
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

async function createCookbookViaApi(token, {title, description} = {}) {
    const res = await request(app)
        .post('/cookbooks/create')
        .set('Authorization', `Bearer ${token}`)
        .field('title', title ?? `Vitest Cookbook ${suffix} ${Math.random()}`)
        .field('description', description ?? 'A test cookbook')
        .expect(201);
    return res.body;
}

beforeEach(async () => {
    await resetRateLimits();
});

afterAll(async () => {
    await query("DELETE FROM users WHERE username LIKE 'vitest\\_cb\\_%' ESCAPE '\\'").catch(() => {});
});

describe('POST /cookbooks/create', () => {
    it('creates a cookbook and makes the creator its owner', async () => {
        const user = await registerAndLogin('create_ok');

        const res = await request(app)
            .post('/cookbooks/create')
            .set('Authorization', `Bearer ${user.token}`)
            .field('title', `My Cookbook ${suffix}`)
            .field('description', 'Desc');

        expect(res.status).toBe(201);
        expect(res.body.title).toBe(`My Cookbook ${suffix}`);
        expect(res.body.owner_id).toBe(user.id);

        const members = await query('SELECT role FROM cookbook_users WHERE cookbook_id = $1 AND user_id = $2', [res.body.id, user.id]);
        expect(members.rows[0].role).toBe('owner');
    });

    it('accepts a jpeg image on creation', async () => {
        const user = await registerAndLogin('create_image');

        const res = await request(app)
            .post('/cookbooks/create')
            .set('Authorization', `Bearer ${user.token}`)
            .field('title', `Image Cookbook ${suffix}`)
            .attach('image', Buffer.from('fake-jpeg-bytes'), {filename: 'test.jpg', contentType: 'image/jpeg'});

        expect(res.status).toBe(201);
        expect(res.body.image_url).toMatch(/^\/public\/cookbook_image\//);
    });

    it('rejects an unsupported image mime type', async () => {
        const user = await registerAndLogin('create_bad_mime');

        const res = await request(app)
            .post('/cookbooks/create')
            .set('Authorization', `Bearer ${user.token}`)
            .field('title', `Bad Mime Cookbook ${suffix}`)
            .attach('image', Buffer.from('not an image'), {filename: 'test.txt', contentType: 'text/plain'});

        expect(res.status).toBe(400);
    });

    it('rejects a missing title', async () => {
        const user = await registerAndLogin('create_no_title');

        const res = await request(app)
            .post('/cookbooks/create')
            .set('Authorization', `Bearer ${user.token}`)
            .field('description', 'Desc');

        expect(res.status).toBe(400);
        expect(res.body.errors.some((e) => e.field === 'title')).toBe(true);
    });

    it('rejects a title longer than 100 characters', async () => {
        const user = await registerAndLogin('create_long_title');

        const res = await request(app)
            .post('/cookbooks/create')
            .set('Authorization', `Bearer ${user.token}`)
            .field('title', 'x'.repeat(101));

        expect(res.status).toBe(400);
        expect(res.body.errors.some((e) => e.field === 'title')).toBe(true);
    });

    it('rejects a request with no auth token', async () => {
        await request(app).post('/cookbooks/create').field('title', 'x').expect(403);
    });
});

describe('GET /cookbooks (list)', () => {
    it("lists cookbooks the user is a member of, with role attached", async () => {
        const user = await registerAndLogin('list_ok');
        await createCookbookViaApi(user.token);

        const res = await request(app).get('/cookbooks').set('Authorization', `Bearer ${user.token}`);

        expect(res.status).toBe(200);
        expect(res.body.length).toBeGreaterThanOrEqual(1);
        expect(res.body[0].role).toBe('owner');
        expect(Array.isArray(res.body[0].members)).toBe(true);
    });

    it('respects the limit query parameter', async () => {
        const user = await registerAndLogin('list_limit');
        await createCookbookViaApi(user.token);
        await resetRateLimits();
        await createCookbookViaApi(user.token);
        await resetRateLimits();
        await createCookbookViaApi(user.token);

        const res = await request(app).get('/cookbooks').query({limit: 2}).set('Authorization', `Bearer ${user.token}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(2);
    });

    it('a limit of 0 is falsy and silently falls back to the default of 10, instead of returning zero results', async () => {
        const user = await registerAndLogin('list_limit_zero');
        await createCookbookViaApi(user.token);

        const res = await request(app).get('/cookbooks').query({limit: 0}).set('Authorization', `Bearer ${user.token}`);

        expect(res.status).toBe(200);
        expect(res.body.length).toBeGreaterThan(0);
    });

    it('a negative limit causes a database error (no validation on this query param)', async () => {
        const user = await registerAndLogin('list_limit_neg');

        const res = await request(app).get('/cookbooks').query({limit: -1}).set('Authorization', `Bearer ${user.token}`);

        expect(res.status).toBe(500);
    });

    it('rejects a request with no auth token', async () => {
        await request(app).get('/cookbooks').expect(403);
    });
});

describe('GET /cookbooks/:cookbookId', () => {
    it('returns the cookbook with its members for the owner', async () => {
        const user = await registerAndLogin('get_ok');
        const cookbook = await createCookbookViaApi(user.token);

        const res = await request(app).get(`/cookbooks/${cookbook.id}`).set('Authorization', `Bearer ${user.token}`);

        expect(res.status).toBe(200);
        expect(res.body.id).toBe(cookbook.id);
        expect(res.body.members.some((m) => m.id === user.id && m.role === 'owner')).toBe(true);
    });

    it('returns 404 for a nonexistent cookbook', async () => {
        const user = await registerAndLogin('get_404');

        const res = await request(app).get('/cookbooks/999999999').set('Authorization', `Bearer ${user.token}`);

        expect(res.status).toBe(404);
    });

    it('returns 404 (masking existence) for a non-member', async () => {
        const owner = await registerAndLogin('get_owner');
        const outsider = await registerAndLogin('get_outsider');
        const cookbook = await createCookbookViaApi(owner.token);

        const res = await request(app).get(`/cookbooks/${cookbook.id}`).set('Authorization', `Bearer ${outsider.token}`);

        expect(res.status).toBe(404);
    });

    it('rejects a non-integer cookbookId', async () => {
        const user = await registerAndLogin('get_bad_id');

        const res = await request(app).get('/cookbooks/not-a-number').set('Authorization', `Bearer ${user.token}`);

        expect(res.status).toBe(400);
    });

    it('rejects a request with no auth token', async () => {
        await request(app).get('/cookbooks/1').expect(403);
    });
});

describe('GET /cookbooks/:cookbookId/users', () => {
    it('lists members with their roles', async () => {
        const owner = await registerAndLogin('members_owner');
        const viewer = await registerAndLogin('members_viewer');
        const cookbook = await createCookbookViaApi(owner.token);

        await request(app)
            .post(`/cookbooks/${cookbook.id}/members`)
            .set('Authorization', `Bearer ${owner.token}`)
            .send({userId: viewer.id, role: 'viewer'})
            .expect(201);

        const res = await request(app).get(`/cookbooks/${cookbook.id}/users`).set('Authorization', `Bearer ${owner.token}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(2);
        expect(res.body.some((m) => m.id === viewer.id && m.role === 'viewer')).toBe(true);
    });

    it('returns 404 for a non-member', async () => {
        const owner = await registerAndLogin('members_owner2');
        const outsider = await registerAndLogin('members_outsider');
        const cookbook = await createCookbookViaApi(owner.token);

        const res = await request(app).get(`/cookbooks/${cookbook.id}/users`).set('Authorization', `Bearer ${outsider.token}`);

        expect(res.status).toBe(404);
    });

    it('rejects a request with no auth token', async () => {
        await request(app).get('/cookbooks/1/users').expect(403);
    });
});

describe('PATCH /cookbooks/:cookbookId', () => {
    it('allows the owner to update the title and description', async () => {
        const user = await registerAndLogin('patch_ok');
        const cookbook = await createCookbookViaApi(user.token);

        const res = await request(app)
            .patch(`/cookbooks/${cookbook.id}`)
            .set('Authorization', `Bearer ${user.token}`)
            .field('title', 'Updated title');

        expect(res.status).toBe(200);
        expect(res.body.title).toBe('Updated title');
    });

    it('replaces the image and deletes the previous one from disk', async () => {
        const user = await registerAndLogin('patch_image');
        const created = await request(app)
            .post('/cookbooks/create')
            .set('Authorization', `Bearer ${user.token}`)
            .field('title', `Patch Image ${suffix}`)
            .attach('image', Buffer.from('first-image'), {filename: 'first.jpg', contentType: 'image/jpeg'})
            .expect(201);

        const firstFilePath = path.join(COOKBOOK_IMAGE_DIR, path.basename(created.body.image_url));
        expect(fs.existsSync(firstFilePath)).toBe(true);

        const res = await request(app)
            .patch(`/cookbooks/${created.body.id}`)
            .set('Authorization', `Bearer ${user.token}`)
            .attach('image', Buffer.from('second-image'), {filename: 'second.jpg', contentType: 'image/jpeg'});

        expect(res.status).toBe(200);
        expect(res.body.image_url).not.toBe(created.body.image_url);
        expect(fs.existsSync(firstFilePath)).toBe(false);

        const secondFilePath = path.join(COOKBOOK_IMAGE_DIR, path.basename(res.body.image_url));
        expect(fs.existsSync(secondFilePath)).toBe(true);
    });

    it('forbids an editor (non-owner) from updating the cookbook', async () => {
        const owner = await registerAndLogin('patch_owner');
        const editor = await registerAndLogin('patch_editor');
        const cookbook = await createCookbookViaApi(owner.token);
        await request(app)
            .post(`/cookbooks/${cookbook.id}/members`)
            .set('Authorization', `Bearer ${owner.token}`)
            .send({userId: editor.id, role: 'editor'})
            .expect(201);

        const res = await request(app)
            .patch(`/cookbooks/${cookbook.id}`)
            .set('Authorization', `Bearer ${editor.token}`)
            .field('title', 'Hijacked');

        expect(res.status).toBe(403);
    });

    it('returns 404 for a non-member', async () => {
        const owner = await registerAndLogin('patch_owner2');
        const outsider = await registerAndLogin('patch_outsider');
        const cookbook = await createCookbookViaApi(owner.token);

        const res = await request(app)
            .patch(`/cookbooks/${cookbook.id}`)
            .set('Authorization', `Bearer ${outsider.token}`)
            .field('title', 'x');

        expect(res.status).toBe(404);
    });

    it('rejects a title longer than 100 characters', async () => {
        const user = await registerAndLogin('patch_long_title');
        const cookbook = await createCookbookViaApi(user.token);

        const res = await request(app)
            .patch(`/cookbooks/${cookbook.id}`)
            .set('Authorization', `Bearer ${user.token}`)
            .field('title', 'x'.repeat(101));

        expect(res.status).toBe(400);
    });

    it('ignores an unrecognized extra field instead of touching it in the update', async () => {
        const user = await registerAndLogin('patch_no_whitelist');
        const cookbook = await createCookbookViaApi(user.token);

        const res = await request(app)
            .patch(`/cookbooks/${cookbook.id}`)
            .set('Authorization', `Bearer ${user.token}`)
            .field('title', 'Still valid title')
            .field('notARealColumn', 'x');

        expect(res.status).toBe(200);
        expect(res.body.title).toBe('Still valid title');
        expect(res.body.not_a_real_column).toBeUndefined();
    });

    it('rejects a request with no auth token', async () => {
        await request(app).patch('/cookbooks/1').field('title', 'x').expect(403);
    });
});

describe('POST /cookbooks/:cookbookId/members', () => {
    it('allows the owner to add a member', async () => {
        const owner = await registerAndLogin('add_owner');
        const newMember = await registerAndLogin('add_member');
        const cookbook = await createCookbookViaApi(owner.token);

        const res = await request(app)
            .post(`/cookbooks/${cookbook.id}/members`)
            .set('Authorization', `Bearer ${owner.token}`)
            .send({userId: newMember.id, role: 'viewer'});

        expect(res.status).toBe(201);
        expect(res.body.role).toBe('viewer');
    });

    it('allows an editor to also add members', async () => {
        const owner = await registerAndLogin('add_owner2');
        const editor = await registerAndLogin('add_editor');
        const newMember = await registerAndLogin('add_by_editor');
        const cookbook = await createCookbookViaApi(owner.token);
        await request(app)
            .post(`/cookbooks/${cookbook.id}/members`)
            .set('Authorization', `Bearer ${owner.token}`)
            .send({userId: editor.id, role: 'editor'})
            .expect(201);

        const res = await request(app)
            .post(`/cookbooks/${cookbook.id}/members`)
            .set('Authorization', `Bearer ${editor.token}`)
            .send({userId: newMember.id, role: 'viewer'});

        expect(res.status).toBe(201);
    });

    it('forbids a viewer from adding members', async () => {
        const owner = await registerAndLogin('add_owner3');
        const viewer = await registerAndLogin('add_viewer');
        const newMember = await registerAndLogin('add_by_viewer');
        const cookbook = await createCookbookViaApi(owner.token);
        await request(app)
            .post(`/cookbooks/${cookbook.id}/members`)
            .set('Authorization', `Bearer ${owner.token}`)
            .send({userId: viewer.id, role: 'viewer'})
            .expect(201);

        const res = await request(app)
            .post(`/cookbooks/${cookbook.id}/members`)
            .set('Authorization', `Bearer ${viewer.token}`)
            .send({userId: newMember.id, role: 'viewer'});

        expect(res.status).toBe(403);
    });

    it('rejects an invalid role', async () => {
        const owner = await registerAndLogin('add_owner4');
        const newMember = await registerAndLogin('add_bad_role');
        const cookbook = await createCookbookViaApi(owner.token);

        const res = await request(app)
            .post(`/cookbooks/${cookbook.id}/members`)
            .set('Authorization', `Bearer ${owner.token}`)
            .send({userId: newMember.id, role: 'superadmin'});

        expect(res.status).toBe(400);
        expect(res.body.errors.some((e) => e.field === 'role')).toBe(true);
    });

    it('rejects a user who is already a member', async () => {
        const owner = await registerAndLogin('add_owner5');
        const cookbook = await createCookbookViaApi(owner.token);

        const res = await request(app)
            .post(`/cookbooks/${cookbook.id}/members`)
            .set('Authorization', `Bearer ${owner.token}`)
            .send({userId: owner.id, role: 'viewer'});

        expect(res.status).toBe(400);
    });

    it('rejects a missing userId or role', async () => {
        const owner = await registerAndLogin('add_owner6');
        const cookbook = await createCookbookViaApi(owner.token);

        const res = await request(app)
            .post(`/cookbooks/${cookbook.id}/members`)
            .set('Authorization', `Bearer ${owner.token}`)
            .send({});

        expect(res.status).toBe(400);
        expect(res.body.errors.some((e) => e.field === 'userId')).toBe(true);
        expect(res.body.errors.some((e) => e.field === 'role')).toBe(true);
    });

    it('a second member can be added with role "owner" (no single-owner constraint)', async () => {
        const owner = await registerAndLogin('add_owner7');
        const secondOwner = await registerAndLogin('add_second_owner');
        const cookbook = await createCookbookViaApi(owner.token);

        const res = await request(app)
            .post(`/cookbooks/${cookbook.id}/members`)
            .set('Authorization', `Bearer ${owner.token}`)
            .send({userId: secondOwner.id, role: 'owner'});

        expect(res.status).toBe(201);

        const owners = await query("SELECT user_id FROM cookbook_users WHERE cookbook_id = $1 AND role = 'owner'", [cookbook.id]);
        expect(owners.rows).toHaveLength(2);
    });

    it('rejects a request with no auth token', async () => {
        await request(app).post('/cookbooks/1/members').send({userId: 1, role: 'viewer'}).expect(403);
    });
});

describe('PATCH /cookbooks/:cookbookId/members/:userId (change role)', () => {
    it('allows the owner to change a member\'s role', async () => {
        const owner = await registerAndLogin('role_owner');
        const member = await registerAndLogin('role_member');
        const cookbook = await createCookbookViaApi(owner.token);
        await request(app)
            .post(`/cookbooks/${cookbook.id}/members`)
            .set('Authorization', `Bearer ${owner.token}`)
            .send({userId: member.id, role: 'viewer'})
            .expect(201);

        const res = await request(app)
            .patch(`/cookbooks/${cookbook.id}/members/${member.id}`)
            .set('Authorization', `Bearer ${owner.token}`)
            .send({role: 'editor'});

        expect(res.status).toBe(200);
        expect(res.body.role).toBe('editor');
    });

    it('allows an editor to also change another member\'s role', async () => {
        const owner = await registerAndLogin('role_owner2');
        const editor = await registerAndLogin('role_editor');
        const member = await registerAndLogin('role_member2');
        const cookbook = await createCookbookViaApi(owner.token);
        await request(app).post(`/cookbooks/${cookbook.id}/members`).set('Authorization', `Bearer ${owner.token}`).send({userId: editor.id, role: 'editor'}).expect(201);
        await request(app).post(`/cookbooks/${cookbook.id}/members`).set('Authorization', `Bearer ${owner.token}`).send({userId: member.id, role: 'viewer'}).expect(201);

        const res = await request(app)
            .patch(`/cookbooks/${cookbook.id}/members/${member.id}`)
            .set('Authorization', `Bearer ${editor.token}`)
            .send({role: 'editor'});

        expect(res.status).toBe(200);
    });

    it('rejects an invalid role', async () => {
        const owner = await registerAndLogin('role_owner3');
        const member = await registerAndLogin('role_member3');
        const cookbook = await createCookbookViaApi(owner.token);
        await request(app).post(`/cookbooks/${cookbook.id}/members`).set('Authorization', `Bearer ${owner.token}`).send({userId: member.id, role: 'viewer'}).expect(201);

        const res = await request(app)
            .patch(`/cookbooks/${cookbook.id}/members/${member.id}`)
            .set('Authorization', `Bearer ${owner.token}`)
            .send({role: 'superadmin'});

        expect(res.status).toBe(400);
    });

    it('forbids a viewer from changing roles', async () => {
        const owner = await registerAndLogin('role_owner4');
        const viewer = await registerAndLogin('role_viewer');
        const member = await registerAndLogin('role_member4');
        const cookbook = await createCookbookViaApi(owner.token);
        await request(app).post(`/cookbooks/${cookbook.id}/members`).set('Authorization', `Bearer ${owner.token}`).send({userId: viewer.id, role: 'viewer'}).expect(201);
        await request(app).post(`/cookbooks/${cookbook.id}/members`).set('Authorization', `Bearer ${owner.token}`).send({userId: member.id, role: 'viewer'}).expect(201);

        const res = await request(app)
            .patch(`/cookbooks/${cookbook.id}/members/${member.id}`)
            .set('Authorization', `Bearer ${viewer.token}`)
            .send({role: 'editor'});

        expect(res.status).toBe(403);
    });

    it('allows demoting the sole owner away from "owner" (no protection against orphaning a cookbook)', async () => {
        const owner = await registerAndLogin('role_orphan');
        const cookbook = await createCookbookViaApi(owner.token);

        const res = await request(app)
            .patch(`/cookbooks/${cookbook.id}/members/${owner.id}`)
            .set('Authorization', `Bearer ${owner.token}`)
            .send({role: 'viewer'});

        expect(res.status).toBe(200);
        expect(res.body.role).toBe('viewer');
    });

    it('rejects a request with no auth token', async () => {
        await request(app).patch('/cookbooks/1/members/1').send({role: 'editor'}).expect(403);
    });
});

describe('DELETE /cookbooks/:cookbookId', () => {
    it('allows the owner to delete the cookbook, cascading membership and recipe links', async () => {
        const owner = await registerAndLogin('delete_owner');
        const cookbook = await createCookbookViaApi(owner.token);
        const recipeRes = await request(app)
            .post('/recipes')
            .set('Authorization', `Bearer ${owner.token}`)
            .send({
                title: 'Linked recipe',
                prepTime: 10,
                servings: 2,
                ingredients: [],
                steps: [],
            })
            .expect(201);
        await query('INSERT INTO cookbook_recipes (cookbook_id, recipe_id) VALUES ($1, $2)', [cookbook.id, recipeRes.body.id]);

        await request(app).delete(`/cookbooks/${cookbook.id}`).set('Authorization', `Bearer ${owner.token}`).expect(200);

        const [cookbookRow, membership, links, recipeRow] = await Promise.all([
            query('SELECT id FROM cookbooks WHERE id = $1', [cookbook.id]),
            query('SELECT id FROM cookbook_users WHERE cookbook_id = $1', [cookbook.id]),
            query('SELECT id FROM cookbook_recipes WHERE cookbook_id = $1', [cookbook.id]),
            query('SELECT id FROM recipes WHERE id = $1', [recipeRes.body.id]),
        ]);
        expect(cookbookRow.rows).toHaveLength(0);
        expect(membership.rows).toHaveLength(0);
        expect(links.rows).toHaveLength(0);
        // The recipe itself is not owned by the cookbook, so it survives.
        expect(recipeRow.rows).toHaveLength(1);

        await query('DELETE FROM recipes WHERE id = $1', [recipeRes.body.id]);
    });

    it('removes the cookbook image file from disk', async () => {
        const owner = await registerAndLogin('delete_image');
        const created = await request(app)
            .post('/cookbooks/create')
            .set('Authorization', `Bearer ${owner.token}`)
            .field('title', `Delete Image ${suffix}`)
            .attach('image', Buffer.from('bytes'), {filename: 'test.jpg', contentType: 'image/jpeg'})
            .expect(201);
        const filePath = path.join(COOKBOOK_IMAGE_DIR, path.basename(created.body.image_url));
        expect(fs.existsSync(filePath)).toBe(true);

        await request(app).delete(`/cookbooks/${created.body.id}`).set('Authorization', `Bearer ${owner.token}`).expect(200);

        expect(fs.existsSync(filePath)).toBe(false);
    });

    it('forbids an editor (non-owner) from deleting the cookbook', async () => {
        const owner = await registerAndLogin('delete_owner2');
        const editor = await registerAndLogin('delete_editor');
        const cookbook = await createCookbookViaApi(owner.token);
        await request(app).post(`/cookbooks/${cookbook.id}/members`).set('Authorization', `Bearer ${owner.token}`).send({userId: editor.id, role: 'editor'}).expect(201);

        const res = await request(app).delete(`/cookbooks/${cookbook.id}`).set('Authorization', `Bearer ${editor.token}`);

        expect(res.status).toBe(403);
    });

    it('returns 404 for a nonexistent cookbook', async () => {
        const user = await registerAndLogin('delete_404');

        const res = await request(app).delete('/cookbooks/999999999').set('Authorization', `Bearer ${user.token}`);

        expect(res.status).toBe(404);
    });

    it('rejects a request with no auth token', async () => {
        await request(app).delete('/cookbooks/1').expect(403);
    });
});

describe('DELETE /cookbooks/:cookbookId/members/:userId (quit or kick)', () => {
    it('allows the owner to kick another member', async () => {
        const owner = await registerAndLogin('kick_owner');
        const member = await registerAndLogin('kick_member');
        const cookbook = await createCookbookViaApi(owner.token);
        await request(app).post(`/cookbooks/${cookbook.id}/members`).set('Authorization', `Bearer ${owner.token}`).send({userId: member.id, role: 'viewer'}).expect(201);

        const res = await request(app)
            .delete(`/cookbooks/${cookbook.id}/members/${member.id}`)
            .set('Authorization', `Bearer ${owner.token}`);

        expect(res.status).toBe(200);
    });

    it('allows the owner to remove themselves', async () => {
        const owner = await registerAndLogin('kick_self_owner');
        const cookbook = await createCookbookViaApi(owner.token);

        const res = await request(app)
            .delete(`/cookbooks/${cookbook.id}/members/${owner.id}`)
            .set('Authorization', `Bearer ${owner.token}`);

        expect(res.status).toBe(200);
    });

    it('forbids a non-owner from kicking someone else', async () => {
        const owner = await registerAndLogin('kick_owner2');
        const viewer = await registerAndLogin('kick_viewer');
        const other = await registerAndLogin('kick_other');
        const cookbook = await createCookbookViaApi(owner.token);
        await request(app).post(`/cookbooks/${cookbook.id}/members`).set('Authorization', `Bearer ${owner.token}`).send({userId: viewer.id, role: 'viewer'}).expect(201);
        await request(app).post(`/cookbooks/${cookbook.id}/members`).set('Authorization', `Bearer ${owner.token}`).send({userId: other.id, role: 'viewer'}).expect(201);

        const res = await request(app)
            .delete(`/cookbooks/${cookbook.id}/members/${other.id}`)
            .set('Authorization', `Bearer ${viewer.token}`);

        expect(res.status).toBe(403);
    });

    it('a non-owner member cannot successfully quit (remove themselves), because their numeric id never strictly equals the string route param', async () => {
        const owner = await registerAndLogin('kick_owner3');
        const viewer = await registerAndLogin('kick_self_viewer');
        const cookbook = await createCookbookViaApi(owner.token);
        await request(app).post(`/cookbooks/${cookbook.id}/members`).set('Authorization', `Bearer ${owner.token}`).send({userId: viewer.id, role: 'viewer'}).expect(201);

        const res = await request(app)
            .delete(`/cookbooks/${cookbook.id}/members/${viewer.id}`)
            .set('Authorization', `Bearer ${viewer.token}`);

        // Intended behavior: any member should be able to remove themselves.
        expect(res.status).toBe(200);
    });

    it('a non-integer cookbookId causes a database error (no format validation on this route)', async () => {
        const user = await registerAndLogin('kick_bad_id');

        const res = await request(app)
            .delete(`/cookbooks/not-a-number/members/${user.id}`)
            .set('Authorization', `Bearer ${user.token}`);

        expect(res.status).toBe(500);
    });

    it('rejects a request with no auth token', async () => {
        await request(app).delete('/cookbooks/1/members/1').expect(403);
    });
});
