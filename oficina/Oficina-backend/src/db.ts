import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

export const pool = mysql.createPool({
    host: process.env.db_host || 'localhost',
    user: process.env.db_user || 'root',
    password: process.env.db_password || '',
    database: process.env.db_name || 'oficina',
    waitForConnections: true,
    connectionLimit: 10,
});