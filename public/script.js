// script-with-api.js - Frontend JavaScript with Database API Integration

// API Base URL
const API_URL = 'http://localhost:3000/api';

// State
let cart = [];
let currentView = 'products';
let orderDetails = null;
let products = [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    setupEventListeners();
});

// Event Listeners
function setupEventListeners() {
    document.getElementById('cartBtn').addEventListener('click', toggleCart);
}

// Load Products from Database
async function loadProducts() {
    try {
        const response = await fetch(`${API_URL}/products`);
        if (!response.ok) throw new Error('Failed to load products');
        
        products = await response.json();
        renderProducts();
    } catch (error) {
        console.error('Error loading products:', error);
        showNotification('Failed to load products. Please refresh the page.', 'error');
    }
}

// Render Products
function renderProducts() {
    const productGrid = document.getElementById('productGrid');
    
    if (products.length === 0) {
        productGrid.innerHTML = '<p style="color: white; text-align: center;">No products available</p>';
        return;
    }

    productGrid.innerHTML = products.map(product => `
        <div class="product-card">
            <div class="product-image">${product.image}</div>
            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                <p class="product-description">${product.description}</p>
                <div class="product-footer">
                    <span class="product-price">$${parseFloat(product.price).toFixed(2)}</span>
                    <span class="product-stock">${product.stock} in stock</span>
                </div>
                <button class="btn btn-primary btn-full" onclick="addToCart(${product.id})" 
                    ${product.stock === 0 ? 'disabled' : ''}>
                    🛒 ${product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                </button>
            </div>
        </div>
    `).join('');
}

// Add to Cart
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const existingItem = cart.find(item => item.id === productId);

    if (existingItem) {
        if (existingItem.quantity < product.stock) {
            existingItem.quantity++;
        } else {
            showNotification('Maximum stock reached!', 'error');
            return;
        }
    } else {
        cart.push({ 
            id: product.id,
            name: product.name,
            price: parseFloat(product.price),
            image: product.image,
            stock: product.stock,
            quantity: 1 
        });
    }

    updateCartCount();
    showNotification('Added to cart!', 'success');
}

// Update Cart Count
function updateCartCount() {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    const cartCount = document.getElementById('cartCount');
    
    if (count > 0) {
        cartCount.textContent = count;
        cartCount.classList.remove('hidden');
    } else {
        cartCount.classList.add('hidden');
    }
}

// Toggle Cart View
function toggleCart() {
    if (currentView === 'products') {
        showCart();
    } else {
        showProducts();
    }
}

// Show Products View
function showProducts() {
    currentView = 'products';
    hideAllViews();
    document.getElementById('productsView').classList.add('active');
}

// Show Cart View
function showCart() {
    currentView = 'cart';
    hideAllViews();
    document.getElementById('cartView').classList.add('active');
    renderCart();
}

// Show Checkout View
function showCheckout() {
    currentView = 'checkout';
    hideAllViews();
    document.getElementById('checkoutView').classList.add('active');
    renderCheckoutSummary();
}

// Show Confirmation View
function showConfirmation() {
    currentView = 'confirmation';
    hideAllViews();
    document.getElementById('confirmationView').classList.add('active');
    renderOrderConfirmation();
}

// Hide All Views
function hideAllViews() {
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
    });
}

// Render Cart
function renderCart() {
    const cartContent = document.getElementById('cartContent');

    if (cart.length === 0) {
        cartContent.innerHTML = `
            <div class="empty-cart">
                <div class="empty-cart-icon">🛒</div>
                <p class="empty-cart-message">Your cart is empty</p>
                <button class="btn btn-primary" onclick="showProducts()">Continue Shopping</button>
            </div>
        `;
        return;
    }

    cartContent.innerHTML = `
        <div class="cart-grid">
            <div class="cart-items">
                ${cart.map(item => `
                    <div class="cart-item">
                        <div class="cart-item-image">${item.image}</div>
                        <div class="cart-item-details">
                            <div class="cart-item-name">${item.name}</div>
                            <div class="cart-item-price">$${item.price.toFixed(2)} each</div>
                        </div>
                        <div class="quantity-controls">
                            <button class="quantity-btn" onclick="updateQuantity(${item.id}, -1)">−</button>
                            <span class="quantity-value">${item.quantity}</span>
                            <button class="quantity-btn" onclick="updateQuantity(${item.id}, 1)">+</button>
                        </div>
                        <div class="cart-item-total">$${(item.price * item.quantity).toFixed(2)}</div>
                        <button class="remove-btn" onclick="removeFromCart(${item.id})">🗑️</button>
                    </div>
                `).join('')}
            </div>
            <div class="order-summary">
                <h3>Order Summary</h3>
                <div class="summary-line">
                    <span>Subtotal</span>
                    <span>$${getCartTotal().toFixed(2)}</span>
                </div>
                <div class="summary-line">
                    <span>Tax (8%)</span>
                    <span>$${getTax().toFixed(2)}</span>
                </div>
                <div class="summary-line summary-total">
                    <span>Total</span>
                    <span>$${getGrandTotal().toFixed(2)}</span>
                </div>
                <button class="btn btn-primary btn-full btn-large" onclick="showCheckout()">
                    💳 Proceed to Checkout
                </button>
            </div>
        </div>
    `;
}

// Update Quantity
function updateQuantity(productId, delta) {
    const item = cart.find(i => i.id === productId);
    if (!item) return;

    const newQuantity = item.quantity + delta;

    if (newQuantity <= 0) {
        removeFromCart(productId);
        return;
    }

    if (newQuantity > item.stock) {
        showNotification('Maximum stock reached!', 'error');
        return;
    }

    item.quantity = newQuantity;
    updateCartCount();
    renderCart();
}

// Remove from Cart
function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    updateCartCount();
    renderCart();
}

// Calculate Cart Total
function getCartTotal() {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
}

// Calculate Tax
function getTax() {
    return getCartTotal() * 0.08;
}

// Calculate Grand Total
function getGrandTotal() {
    return getCartTotal() + getTax();
}

// Render Checkout Summary
function renderCheckoutSummary() {
    const checkoutSummary = document.getElementById('checkoutSummary');
    checkoutSummary.innerHTML = `
        <div class="order-summary">
            <h3>Order Summary</h3>
            ${cart.map(item => `
                <div class="summary-line" style="font-size: 0.9rem;">
                    <span>${item.name} x${item.quantity}</span>
                    <span>$${(item.price * item.quantity).toFixed(2)}</span>
                </div>
            `).join('')}
            <div class="summary-line">
                <span>Subtotal</span>
                <span>$${getCartTotal().toFixed(2)}</span>
            </div>
            <div class="summary-line">
                <span>Tax (8%)</span>
                <span>$${getTax().toFixed(2)}</span>
            </div>
            <div class="summary-line summary-total">
                <span>Total</span>
                <span>$${getGrandTotal().toFixed(2)}</span>
            </div>
        </div>
    `;

    document.getElementById('completePurchaseBtn').onclick = processPayment;
}

// Process Payment and Save to Database
async function processPayment() {
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const address = document.getElementById('address').value;
    const city = document.getElementById('city').value;
    const zipCode = document.getElementById('zipCode').value;
    const cardNumber = document.getElementById('cardNumber').value;
    const expiry = document.getElementById('expiry').value;
    const cvv = document.getElementById('cvv').value;

    if (!name || !email || !address || !city || !zipCode || !cardNumber || !expiry || !cvv) {
        showNotification('Please fill in all fields', 'error');
        return;
    }

    const btn = document.getElementById('completePurchaseBtn');
    btn.textContent = 'Processing...';
    btn.disabled = true;

    try {
        const orderData = {
            customer: { name, email, address, city, zipCode },
            items: cart.map(item => ({
                id: item.id,
                name: item.name,
                price: item.price,
                quantity: item.quantity
            })),
            subtotal: getCartTotal(),
            tax: getTax(),
            total: getGrandTotal()
        };

        const response = await fetch(`${API_URL}/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderData)
        });

        if (!response.ok) {
            throw new Error('Failed to create order');
        }

        const result = await response.json();

        orderDetails = {
            orderNumber: result.orderNumber,
            orderId: result.orderId,
            date: new Date().toLocaleString(),
            items: [...cart],
            subtotal: getCartTotal(),
            tax: getTax(),
            total: getGrandTotal(),
            customer: { name, email, address, city, zipCode }
        };

        cart = [];
        updateCartCount();
        
        // Reload products to update stock
        await loadProducts();
        
        showConfirmation();
        showNotification('Order placed successfully!', 'success');

    } catch (error) {
        console.error('Error processing payment:', error);
        showNotification('Failed to process order. Please try again.', 'error');
        btn.textContent = '💳 Complete Purchase';
        btn.disabled = false;
    }
}

// Render Order Confirmation
function renderOrderConfirmation() {
    const orderDetailsBox = document.getElementById('orderDetailsBox');
    
    orderDetailsBox.innerHTML = `
        <div class="order-info">
            <div class="order-info-item">
                <label>Order Number</label>
                <strong>${orderDetails.orderNumber}</strong>
            </div>
            <div class="order-info-item">
                <label>Date</label>
                <strong>${orderDetails.date}</strong>
            </div>
        </div>
        
        <div class="ship-to">
            <label>Ship To</label>
            <p><strong>${orderDetails.customer.name}</strong></p>
            <p>${orderDetails.customer.address}</p>
            <p>${orderDetails.customer.city}, ${orderDetails.customer.zipCode}</p>
        </div>

        <div class="order-items">
            ${orderDetails.items.map(item => `
                <div class="order-item">
                    <span>${item.name} x${item.quantity}</span>
                    <span>$${(item.price * item.quantity).toFixed(2)}</span>
                </div>
            `).join('')}
        </div>

        <div class="order-total-line">
            <span>Total</span>
            <span class="total-amount">$${orderDetails.total.toFixed(2)}</span>
        </div>
    `;

    document.getElementById('downloadInvoiceBtn').onclick = downloadInvoice;
    document.getElementById('continueShoppingBtn').onclick = () => {
        showProducts();
        loadProducts(); // Refresh products
    };
}

// Download Invoice
function downloadInvoice() {
    if (!orderDetails) return;

    const invoice = `INVOICE
================================
Order #: ${orderDetails.orderNumber}
Date: ${orderDetails.date}

BILL TO:
${orderDetails.customer.name}
${orderDetails.customer.email}
${orderDetails.customer.address}
${orderDetails.customer.city}, ${orderDetails.customer.zipCode}

================================
ITEMS:
${orderDetails.items.map(item => 
    `${item.name} x${item.quantity} - $${(item.price * item.quantity).toFixed(2)}`
).join('\n')}

================================
Subtotal: $${orderDetails.subtotal.toFixed(2)}
Tax (8%): $${orderDetails.tax.toFixed(2)}
--------------------------------
TOTAL: $${orderDetails.total.toFixed(2)}

Thank you for your purchase!`;

    try {
        const blob = new Blob([invoice], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice-${orderDetails.orderNumber}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showNotification('Invoice downloaded!', 'success');
    } catch (error) {
        console.error('Download error:', error);
        showNotification('Failed to download invoice', 'error');
    }
}

// Show Notification
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    const bgColor = type === 'success' ? '#10b981' : '#ef4444';
    
    notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: ${bgColor};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 9999;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add animations to CSS dynamically
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(400px); opacity: 0; }
    }
`;
document.head.appendChild(style);