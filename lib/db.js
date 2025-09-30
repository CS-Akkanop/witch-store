import mysql from "mysql2";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function createPool() {
    const ca = await fs.readFile(path.join(__dirname, "aiven-drugstore.pem"));
    const pool = mysql.createPool({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        ssl: { ca }
    });
    return pool.promise();
}

export const promisePool = await createPool();