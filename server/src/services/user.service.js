import { query } from "../database/db.js";

export async function createUser(user) {
    const result = await query(
        'INSERT INTO users (username, email, password_hash, rgpd) VALUES ($1, $2, $3, $4) RETURNING *',
        [user.username, user.email, user.password, user.rgpd]
    );
    return result.rows[0];
}

export async function getUserByUsername(user, returnPasswordHash = false) {
    let result;
    if (returnPasswordHash) {
        result = await query(
            'SELECT * FROM users WHERE username = $1',
            [user.username]
        );
    } else {
        result = await query(
            'SELECT id, username, email, rgpd FROM users WHERE username = $1',
            [user.username]
        )
    }
    return result.rows[0];
}

export async function getUserByEmail(email) {
    const result = await query(
        'SELECT * FROM users WHERE email = $1',
        [email]
    );
    return result.rows[0];
}

export async function getUserByGoogleId(googleId) {
    const result = await query(
        'SELECT * FROM users WHERE google_id = $1',
        [googleId]
    );
    return result.rows[0];
}

export async function createGoogleUser(user) {
    const result = await query(
        'INSERT INTO users (username, email, google_id, rgpd) VALUES ($1, $2, $3, TRUE) RETURNING *',
        [user.username, user.email, user.googleId]
    );
    return result.rows[0];
}

export async function isUsernameTaken(username) {
    const result = await query(
        'SELECT 1 FROM users WHERE username = $1',
        [username]
    );
    return result.rows.length > 0;
}

export async function generateUniqueUsername(base) {
    const slug = base.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 40) || 'user';
    let username = slug;
    let suffix = 0;

    while (await isUsernameTaken(username)) {
        suffix++;
        username = `${slug}${suffix}`;
    }

    return username;
}

export async function updateUser(id, updates) {
    const fields = [];
    const values = [];
    let index = 1;

    for (const [key, value] of Object.entries(updates)) {
        fields.push(`${key} = $${index}`);
        values.push(value);
        index++;
    }

    if (fields.length === 0) {
        return getUserById(id);
    }

    values.push(id);

    const result = await query(
        `UPDATE users SET ${fields.join(', ')} WHERE id = $${index} RETURNING id, username, email, rgpd`,
        values
    );
    return result.rows[0];
}

export async function getUserById(id, returnPasswordHash = false) {
    let result;
    if (returnPasswordHash) {
        result = await query(
            'SELECT * FROM users WHERE id = $1',
            [id]
        );
    } else {
        result = await query(
            'SELECT id, username, email, rgpd FROM users WHERE id = $1',
            [id]
        )
    }
    return result.rows[0];
}

export async function deleteUserById(id) {
    const result = await query(
        'DELETE FROM users WHERE id = $1 RETURNING id, username, email, rgpd',
        [id]
    );
    return result.rows[0];
}