import mysql from "mysql2";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function createPool() {
    const ca = await fs.readFile(path.join(__dirname, "aiven-drugstore.pem"));
    const pool = mysql.createPool({
        host: 'drugstore-db-akkanop-879b.l.aivencloud.com',
        port: 15893,
        user: 'avnadmin',
        password: 'AVNS_-BeF8qRK9YMWQk6wb_u',
        database: 'defaultdb',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        ssl: { ca }
    });
    return pool.promise();
}

export const promisePool = await createPool();