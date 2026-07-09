// db.js
import pg from 'pg';


const { Pool } = pg;

const pool = new Pool({
    host: process.env.POSTGRES_HOST,
    port: process.env.POSTGRES_PORT,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB,
});

pool.on('error', (err) => {
    console.error('Erreur inattendue sur le pool PostgreSQL:', err);
    process.exit(-1);
});

export async function query(text, params) {
    const start = Date.now();
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Requête exécutée', { text, duration, rows: res.rowCount });
    return res;
}

export async function testConnection() {
    try {
        await pool.query('SELECT NOW()');
        console.log('✅ Connexion PostgreSQL établie');
        return true
    } catch (err) {
        console.error('❌ Échec de connexion PostgreSQL:', err.message);
        process.exit(1);
    }
}

export default pool;