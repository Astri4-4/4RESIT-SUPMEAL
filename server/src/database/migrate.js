import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import pool from "./db.js";

const EXPECTED_TABLES = [
    'users', 'cookbooks', 'cookbook_users', 'cookbook_messages', 'recipes',
    'tags', 'recipe_tags', 'ingredients', 'recipe_ingredients', 'recipe_steps',
    'cookbook_recipes', 'cookbook_recipe_comments', 'activities',
    'meal_plans', 'meal_plan_items', 'favorites', 'user_tags', 'shopping_list_items',
];

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

export async function allTablesExist() {
    const { rows } = await pool.query(
        `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = ANY($1::text[])`,
        [EXPECTED_TABLES]
    );
    const found = new Set(rows.map((r) => r.table_name));
    return EXPECTED_TABLES.every((t) => found.has(t));
}

export async function ensureSchema() {
    if (await allTablesExist()) {
        console.log('✅ Vérification du schéma: toutes les tables sont présentes');
        return;
    }
    console.warn('⚠️  Tables manquantes détectées, exécution de la migration...');
    await migrate();
}

const isMainModule = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMainModule) {
    await migrate();
    process.exit();
}