// config/database.js - Centralized Database Configuration

const mysql = require('mysql2');

// Database Configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',  // Add your MySQL password here
    database: process.env.DB_NAME || 'ecommerce_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

// Create Connection Pool (Better for production)
const pool = mysql.createPool(dbConfig);

// Create Promisified Pool
const promisePool = pool.promise();

// Test Database Connection
const testConnection = async () => {
    try {
        const connection = await promisePool.getConnection();
        console.log('✅ Database connected successfully!');
        console.log(`📊 Database: ${dbConfig.database}`);
        console.log(`🖥️  Host: ${dbConfig.host}`);
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        return false;
    }
};

// Export pool and test function
module.exports = {
    pool,
    promisePool,
    testConnection
};