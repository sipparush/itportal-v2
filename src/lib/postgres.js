import { Pool } from 'pg';

let pool;

export function getPostgresPool() {
    if (!process.env.DATABASE_URL) {
        throw new Error('DATABASE_URL is not configured');
    }

    if (!pool) {
        pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.PGSSLMODE === 'disable' ? false : undefined
        });
    }

    return pool;
}

export async function query(text, params = []) {
    return getPostgresPool().query(text, params);
}
