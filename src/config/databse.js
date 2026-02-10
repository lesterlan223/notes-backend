const mysql = require('mysql2/promise');
require('dotenv').config();

class Database {
    constructor() {
        this.pool = null;
        this.init();
    }

    parseDatabaseUrl() {
        // Используем DATABASE_URL из переменных окружения или разбираем отдельные переменные
        if (process.env.DATABASE_URL) {
            const url = new URL(process.env.DATABASE_URL);
            return {
                host: url.hostname,
                user: url.username,
                password: url.password,
                database: url.pathname.substring(1), // убираем ведущий /
                port: url.port || 3306
            };
        }
        
        // Fallback на отдельные переменные
        return {
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'notes_app',
            port: process.env.DB_PORT || 3306
        };
    }

    async init() {
        try {
            const dbConfig = this.parseDatabaseUrl();
            
            console.log('Database config:', {
                host: dbConfig.host,
                user: dbConfig.user,
                database: dbConfig.database,
                port: dbConfig.port
            });

            this.pool = mysql.createPool({
                ...dbConfig,
                waitForConnections: true,
                connectionLimit: 10,
                queueLimit: 0,
                ssl: process.env.NODE_ENV === 'production' ? { 
                    rejectUnauthorized: false 
                } : null,
                // Дополнительные параметры для Railway
                timezone: 'Z', // UTC
                charset: 'utf8mb4',
                dateStrings: true
            });

            console.log('Database pool created successfully');
            
            // Test connection and create tables
            await this.testConnection();
            await this.createTables();
            
        } catch (error) {
            console.error('Error initializing database:', error);
            process.exit(1);
        }
    }

    async testConnection() {
        let connection;
        try {
            connection = await this.pool.getConnection();
            console.log('✅ Database connected successfully');
            
            // Проверяем текущую базу данных
            const [rows] = await connection.query('SELECT DATABASE() as db');
            console.log(`Connected to database: ${rows[0].db}`);
            
        } catch (error) {
            console.error('❌ Database connection failed:', error.message);
            throw error;
        } finally {
            if (connection) connection.release();
        }
    }

    async createTables() {
        let connection;
        try {
            connection = await this.pool.getConnection();
            
            const createNotesTable = `
                CREATE TABLE IF NOT EXISTS notes (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    title VARCHAR(255) NOT NULL,
                    content TEXT NOT NULL,
                    tags JSON,
                    important BOOLEAN DEFAULT FALSE,
                    deleted BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX idx_deleted (deleted),
                    INDEX idx_important (important),
                    INDEX idx_updated (updated_at),
                    FULLTEXT idx_search (title, content)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            `;

            await connection.query(createNotesTable);
            console.log('✅ Notes table created/verified successfully');
            
            // Проверяем существующие таблицы
            const [tables] = await connection.query('SHOW TABLES');
            console.log(`📊 Total tables in database: ${tables.length}`);
            tables.forEach(table => {
                console.log(`   - ${table[Object.keys(table)[0]]}`);
            });
            
        } catch (error) {
            console.error('❌ Error creating tables:', error.message);
            throw error;
        } finally {
            if (connection) connection.release();
        }
    }

    async query(sql, params) {
        let connection;
        try {
            connection = await this.pool.getConnection();
            const [results] = await connection.execute(sql, params);
            return results;
        } catch (error) {
            console.error('Database query error:', error.message);
            console.error('SQL:', sql);
            console.error('Params:', params);
            throw error;
        } finally {
            if (connection) connection.release();
        }
    }

    async getConnection() {
        return await this.pool.getConnection();
    }
}

// Singleton instance
const database = new Database();
module.exports = database;