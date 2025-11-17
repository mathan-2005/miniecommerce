// models/Product.js - Product Model
const { promisePool } = require('../config/database');

class Product {
    // Get all products
    static async getAll() {
        try {
            const [rows] = await promisePool.query(
                'SELECT * FROM products ORDER BY created_at DESC'
            );
            return rows;
        } catch (error) {
            throw error;
        }
    }

    // Get products in stock
    static async getInStock() {
        try {
            const [rows] = await promisePool.query(
                'SELECT * FROM products WHERE stock > 0 ORDER BY name'
            );
            return rows;
        } catch (error) {
            throw error;
        }
    }

    // Get product by ID
    static async getById(id) {
        try {
            const [rows] = await promisePool.query(
                'SELECT * FROM products WHERE id = ?',
                [id]
            );
            return rows[0] || null;
        } catch (error) {
            throw error;
        }
    }

    // Create new product
    static async create(productData) {
        try {
            const { name, description, price, image, stock } = productData;
            const [result] = await promisePool.query(
                `INSERT INTO products (name, description, price, image, stock) 
                 VALUES (?, ?, ?, ?, ?)`,
                [name, description, price, image || '📦', stock]
            );
            return result.insertId;
        } catch (error) {
            throw error;
        }
    }

    // Update product
    static async update(id, productData) {
        try {
            const { name, description, price, image, stock } = productData;
            const [result] = await promisePool.query(
                `UPDATE products 
                 SET name = ?, description = ?, price = ?, image = ?, stock = ?
                 WHERE id = ?`,
                [name, description, price, image, stock, id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }

    // Update stock
    static async updateStock(id, quantity) {
        try {
            const [result] = await promisePool.query(
                'UPDATE products SET stock = stock + ? WHERE id = ?',
                [quantity, id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }

    // Decrease stock
    static async decreaseStock(id, quantity) {
        try {
            const [result] = await promisePool.query(
                'UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?',
                [quantity, id, quantity]
            );
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }

    // Delete product
    static async delete(id) {
        try {
            const [result] = await promisePool.query(
                'DELETE FROM products WHERE id = ?',
                [id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }

    // Search products
    static async search(searchTerm) {
        try {
            const [rows] = await promisePool.query(
                `SELECT * FROM products 
                 WHERE name LIKE ? OR description LIKE ?
                 ORDER BY name`,
                [`%${searchTerm}%`, `%${searchTerm}%`]
            );
            return rows;
        } catch (error) {
            throw error;
        }
    }

    // Get low stock products
    static async getLowStock(threshold = 5) {
        try {
            const [rows] = await promisePool.query(
                'SELECT * FROM products WHERE stock <= ? AND stock > 0',
                [threshold]
            );
            return rows;
        } catch (error) {
            throw error;
        }
    }

    // Get out of stock products
    static async getOutOfStock() {
        try {
            const [rows] = await promisePool.query(
                'SELECT * FROM products WHERE stock = 0'
            );
            return rows;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = Product;