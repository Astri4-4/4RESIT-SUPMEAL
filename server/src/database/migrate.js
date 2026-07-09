import { readFileSync } from 'fs';
import pool from "./db.js";

export async function migrate() {
    const sql = readFileSync("./src/database/migration.sql", 'utf8');
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('COMMIT');
        console.log(`✅ Fichier SQL exécuté: ./src/database/migration.sql`);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(`❌ Erreur lors de l'exécution de ./src/database/migration.sql:`, err.message);
        throw err;
    } finally {
        client.release();
    }
}

await migrate()
process.exit();