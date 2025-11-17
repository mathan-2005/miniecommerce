// server.js - Node.js + Express + MySQL Backend
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public')); // Serve static files (HTML, CSS, JS)

// MySQL Database Connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',           // Change to your MySQL username
    password: '',           // Change to your MySQL password
    database: 'ecommerce_db'
});

// Connect to Database
db.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err);
        return;
    }
    console.log('Connected to MySQL database');
});

// ==================== API ENDPOINTS ====================

// Get all products
app.get('/api/products', (req, res) => {
    const query = 'SELECT * FROM products WHERE stock > 0';
    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});

// Get single product
app.get('/api/products/:id', (req, res) => {
    const query = 'SELECT * FROM products WHERE id = ?';
    db.query(query, [req.params.id], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json(results[0]);
    });
});

// Create new order
app.post('/api/orders', (req, res) => {
    const { customer, items, subtotal, tax, total } = req.body;

    // Start transaction
    db.beginTransaction((err) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        // Insert order
        const orderQuery = `
            INSERT INTO orders (customer_name, customer_email, customer_address, 
                              customer_city, customer_zipcode, subtotal, tax, total, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
        `;

        const orderValues = [
            customer.name,
            customer.email,
            customer.address,
            customer.city,
            customer.zipCode,
            subtotal,
            tax,
            total
        ];

        db.query(orderQuery, orderValues, (err, orderResult) => {
            if (err) {
                return db.rollback(() => {
                    res.status(500).json({ error: err.message });
                });
            }

            const orderId = orderResult.insertId;

            // Insert order items
            const itemQuery = `
                INSERT INTO order_items (order_id, product_id, product_name, 
                                        price, quantity, total)
                VALUES ?
            `;

            const itemValues = items.map(item => [
                orderId,
                item.id,
                item.name,
                item.price,
                item.quantity,
                item.price * item.quantity
            ]);

            db.query(itemQuery, [itemValues], (err) => {
                if (err) {
                    return db.rollback(() => {
                        res.status(500).json({ error: err.message });
                    });
                }

                // Update product stock
                const updateStockPromises = items.map(item => {
                    return new Promise((resolve, reject) => {
                        const updateQuery = 'UPDATE products SET stock = stock - ? WHERE id = ?';
                        db.query(updateQuery, [item.quantity, item.id], (err) => {
                            if (err) reject(err);
                            else resolve();
                        });
                    });
                });

                Promise.all(updateStockPromises)
                    .then(() => {
                        db.commit((err) => {
                            if (err) {
                                return db.rollback(() => {
                                    res.status(500).json({ error: err.message });
                                });
                            }

                            res.json({
                                success: true,
                                orderId: orderId,
                                orderNumber: `ORD-${orderId.toString().padStart(6, '0')}`,
                                message: 'Order created successfully'
                            });
                        });
                    })
                    .catch((err) => {
                        db.rollback(() => {
                            res.status(500).json({ error: err.message });
                        });
                    });
            });
        });
    });
});

// Get order details
app.get('/api/orders/:orderId', (req, res) => {
    const orderQuery = 'SELECT * FROM orders WHERE id = ?';
    const itemsQuery = 'SELECT * FROM order_items WHERE order_id = ?';

    db.query(orderQuery, [req.params.orderId], (err, orderResults) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (orderResults.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }

        db.query(itemsQuery, [req.params.orderId], (err, itemsResults) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            res.json({
                order: orderResults[0],
                items: itemsResults
            });
        });
    });
});

// Get all orders (admin)
app.get('/api/orders', (req, res) => {
    const query = 'SELECT * FROM orders ORDER BY created_at DESC';
    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});

// Update order status
app.patch('/api/orders/:orderId/status', (req, res) => {
    const { status } = req.body;
    const query = 'UPDATE orders SET status = ? WHERE id = ?';
    
    db.query(query, [status, req.params.orderId], (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }
        res.json({ success: true, message: 'Order status updated' });
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});