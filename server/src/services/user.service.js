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