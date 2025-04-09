// Add this at the beginning of the file
let foodMenu = []; // Will store the menu data

// Enhanced menu item rendering
function renderMenuItem(item, index) {
    return `
        <div class="menu-item slideIn" style="animation-delay: ${0.1 * index}s">
            <div class="menu-item-image" style="background-image: url('${item.image}')">
                ${item.badge ? `<div class="menu-item-badge">${item.badge}</div>` : ''}
            </div>
            <div class="menu-item-content">
                <h3 class="menu-item-title">${item.name}</h3>
                <p class="menu-item-description">${item.description}</p>
                <div class="menu-item-price">₹${item.price.toFixed(2)}</div>
                <div class="menu-item-footer">
                    <div class="item-quantity">
                        <button class="quantity-btn decrease-btn" data-index="${index}">
                            <i class="fas fa-minus"></i>
                        </button>
                        <span class="quantity-value" id="quantity-${index}">0</span>
                        <button class="quantity-btn increase-btn" data-index="${index}">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                    <button class="add-btn" data-index="${index}">
                        <i class="fas fa-cart-plus"></i> Add
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Enhanced alert system
function showAlert(message, type = 'success') {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} slideIn`;
    alert.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 
                          type === 'error' ? 'times-circle' : 
                          'exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(alert);
    
    setTimeout(() => {
        alert.classList.add('slideOut');
        setTimeout(() => alert.remove(), 300);
    }, 3000);
}

// Store DOM elements
const welcomeSection = document.getElementById('welcome-section');
const studentDetailsSection = document.getElementById('student-details-section');
const menuSection = document.getElementById('menu-section');
const cartSection = document.getElementById('cart-section');
const confirmationSection = document.getElementById('confirmation-section');
const loadingSection = document.getElementById('loading-section');

// Store form elements
const studentForm = document.getElementById('student-form');
const startOrderBtn = document.getElementById('start-order-btn');
const backToWelcomeBtn = document.getElementById('back-to-welcome-btn');
const backToDetailsBtn = document.getElementById('back-to-details-btn');
const backToMenuBtn = document.getElementById('back-to-menu-btn');
const viewCartBtn = document.getElementById('view-cart-btn');
const placeOrderBtn = document.getElementById('place-order-btn');
const newOrderBtn = document.getElementById('new-order-btn');

// Store cart data
let cart = [];
let studentDetails = {};

// Navigation functions
function showSection(sectionToShow) {
    // Hide all sections
    [welcomeSection, studentDetailsSection, menuSection, cartSection, confirmationSection, loadingSection].forEach(section => {
        section.classList.add('hidden');
    });
    // Show the requested section
    sectionToShow.classList.remove('hidden');
}

// Event Listeners
startOrderBtn.addEventListener('click', () => {
    showSection(studentDetailsSection);
});

backToWelcomeBtn.addEventListener('click', () => {
    showSection(welcomeSection);
});

backToDetailsBtn.addEventListener('click', () => {
    showSection(studentDetailsSection);
});

backToMenuBtn.addEventListener('click', () => {
    showSection(menuSection);
});

// Handle student form submission
studentForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Collect student details
    studentDetails = {
        name: document.getElementById('name').value,
        regNo: document.getElementById('regNo').value,
        block: document.getElementById('block').value,
        room: document.getElementById('room').value,
        phone: document.getElementById('phone').value
    };
    
    // Show menu section
    showSection(menuSection);
    loadMenu();
});

// Load menu items
async function loadMenu() {
    try {
        showSection(loadingSection); // Show loading while fetching menu
        const response = await fetch('/api/menu');
        const data = await response.json();
        if (data.success) {
            foodMenu = data.data; // Store the menu data
            renderMenu(data.data);
            showSection(menuSection);
        } else {
            showAlert('Failed to load menu items', 'error');
            showSection(studentDetailsSection);
        }
    } catch (error) {
        showAlert('Error loading menu', 'error');
        console.error('Error:', error);
        showSection(studentDetailsSection);
    }
}

// Render menu items
function renderMenu(menuItems) {
    const menuContainer = document.getElementById('menu-container');
    menuContainer.innerHTML = menuItems.map((item, index) => renderMenuItem(item, index)).join('');
    
    // Add event listeners to quantity buttons
    document.querySelectorAll('.quantity-btn').forEach(btn => {
        btn.addEventListener('click', handleQuantityChange);
    });
    
    // Add event listeners to add buttons
    document.querySelectorAll('.add-btn').forEach(btn => {
        btn.addEventListener('click', handleAddToCart);
    });
}

// Handle quantity changes
function handleQuantityChange(e) {
    const index = e.target.closest('.quantity-btn').dataset.index;
    const quantityElement = document.getElementById(`quantity-${index}`);
    let quantity = parseInt(quantityElement.textContent);
    
    if (e.target.closest('.increase-btn')) {
        quantity = Math.min(quantity + 1, 5);
    } else if (e.target.closest('.decrease-btn')) {
        quantity = Math.max(quantity - 1, 0);
    }
    
    quantityElement.textContent = quantity;
}

// Handle adding items to cart
function handleAddToCart(e) {
    const index = e.target.closest('.add-btn').dataset.index;
    const quantity = parseInt(document.getElementById(`quantity-${index}`).textContent);
    
    if (quantity > 0) {
        const menuItem = foodMenu[index];
        cart.push({
            name: menuItem.name,
            price: menuItem.price,
            quantity: quantity,
            total: menuItem.price * quantity
        });
        
        updateCartCount();
        showAlert(`Added ${quantity} ${menuItem.name} to cart`, 'success');
        document.getElementById(`quantity-${index}`).textContent = '0';
    }
}

// Update cart count
function updateCartCount() {
    const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
    document.getElementById('cart-count').textContent = `(${cartCount})`;
    viewCartBtn.disabled = cartCount === 0;
}

// Add view cart functionality
viewCartBtn.addEventListener('click', () => {
    showSection(cartSection);
    renderCart();
});

// Add cart rendering function
function renderCart() {
    const cartContainer = document.getElementById('cart-items');
    if (cart.length === 0) {
        cartContainer.innerHTML = '<div class="empty-cart">Your cart is empty</div>';
        return;
    }

    cartContainer.innerHTML = cart.map((item, index) => `
        <div class="cart-item">
            <div class="cart-item-content">
                <div class="cart-item-title">${item.name}</div>
                <div class="cart-item-price">₹${item.price.toFixed(2)} x ${item.quantity}</div>
            </div>
            <div class="cart-item-actions">
                <span class="cart-quantity">₹${item.total.toFixed(2)}</span>
                <button class="remove-btn" onclick="removeFromCart(${index})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');

    updateOrderSummary();
}

// Add order summary update function
function updateOrderSummary() {
    const subtotal = cart.reduce((total, item) => total + item.total, 0);
    const gst = subtotal * 0.18;
    const convenience = 20;
    const total = subtotal + gst + convenience;

    document.getElementById('subtotal').textContent = `₹${subtotal.toFixed(2)}`;
    document.getElementById('gst').textContent = `₹${gst.toFixed(2)}`;
    document.getElementById('convenience').textContent = `₹${convenience.toFixed(2)}`;
    document.getElementById('total').textContent = `₹${total.toFixed(2)}`;
}

// Add remove from cart function
function removeFromCart(index) {
    cart.splice(index, 1);
    renderCart();
    updateCartCount();
}

// Add place order functionality
placeOrderBtn.addEventListener('click', async () => {
    if (cart.length === 0) {
        showAlert('Please add items to your cart', 'error');
        return;
    }

    try {
        showSection(loadingSection);
        const orderData = {
            student: studentDetails,
            items: cart,
            subtotal: parseFloat(document.getElementById('subtotal').textContent.slice(1)),
            gst: parseFloat(document.getElementById('gst').textContent.slice(1)),
            convenienceCharge: parseFloat(document.getElementById('convenience').textContent.slice(1)),
            total: parseFloat(document.getElementById('total').textContent.slice(1))
        };

        const response = await fetch('/api/order', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderData)
        });

        const data = await response.json();
        if (data.success) {
            showOrderConfirmation(data.data.orderId);
        } else {
            showAlert('Failed to place order', 'error');
            showSection(cartSection);
        }
    } catch (error) {
        showAlert('Error placing order', 'error');
        console.error('Error:', error);
        showSection(cartSection);
    }
});

// Add order confirmation function
function showOrderConfirmation(orderId) {
    const orderDetails = document.getElementById('order-details');
    orderDetails.innerHTML = `
        <h3>Order ID: ${orderId}</h3>
        <p>Status: Processing</p>
        <div class="order-items">
            ${cart.map(item => `
                <div class="order-item">
                    <span>${item.name} x ${item.quantity}</span>
                    <span>₹${item.total.toFixed(2)}</span>
                </div>
            `).join('')}
        </div>
    `;
    
    cart = [];
    updateCartCount();
    showSection(confirmationSection);
}

// Add new order button functionality
newOrderBtn.addEventListener('click', () => {
    showSection(welcomeSection);
});

// Add navigation functions
function goToDetails() {
    window.location.href = '/details';
}

function goToMenu() {
    window.location.href = '/menu';
}

function goToFinal() {
    window.location.href = '/final';
}

// Store student details in sessionStorage
function saveStudentDetails(details) {
    sessionStorage.setItem('studentDetails', JSON.stringify(details));
}

// Get student details from sessionStorage
function getStudentDetails() {
    return JSON.parse(sessionStorage.getItem('studentDetails') || '{}');
}

// Store cart items in sessionStorage
function saveCart(cart) {
    sessionStorage.setItem('cart', JSON.stringify(cart));
}

// Get cart items from sessionStorage
function getCart() {
    return JSON.parse(sessionStorage.getItem('cart') || '[]');
}

// Update the event listeners based on current page
document.addEventListener('DOMContentLoaded', () => {
    const currentPage = window.location.pathname;

    if (currentPage === '/details') {
        // Handle student form submission
        const studentForm = document.getElementById('student-form');
        if (studentForm) {
            studentForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const details = {
                    name: document.getElementById('name').value,
                    regNo: document.getElementById('regNo').value,
                    block: document.getElementById('block').value,
                    room: document.getElementById('room').value,
                    phone: document.getElementById('phone').value
                };
                saveStudentDetails(details);
                goToMenu();
            });
        }
    }

    // Add more page-specific initializations...
});

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    showSection(welcomeSection);
}); 