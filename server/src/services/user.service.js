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
        `UPDATE users SET ${fields.join(', ')} WHERE id = $${index} RETURNING id, username, email, rgpd, image_url`,
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
            'SELECT id, username, email, rgpd, image_url FROM users WHERE id = $1',
            [id]
        )
    }
    return result.rows[0];
}

export async function deleteUserById(id) {
    const result = await query(
        'DELETE FROM users WHERE id = $1 RETURNING id, username, email, rgpd, image_url',
        [id]
    );
    return result.rows[0];
}