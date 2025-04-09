let cart = [];
const MAX_QUANTITY = 3;

// Define menu items with prices matching your Go program
const menuPrices = {
    "Idli": 30.40,
    "Dosa": 40.30,
    "Poori": 35.20,
    "Sandwich": 50.00,
    "VegRoll": 60.70,
    "Pasta": 100.00,
    "Pizza": 120.00,
    "Burger": 80.70
};

document.addEventListener('DOMContentLoaded', () => {
    // Check if student details exist
    const studentDetails = sessionStorage.getItem('studentDetails');
    if (!studentDetails) {
        // Redirect back to details if no student info
        window.location.href = '/details';
        return;
    }

    // Initialize quantity controls
    initializeQuantityControls();

    // Handle view cart button
    const viewCartBtn = document.getElementById('view-cart-btn');
    viewCartBtn.addEventListener('click', () => {
        if (cart.length > 0) {
            showBill();
        }
    });

    // Add close bill panel handler
    document.getElementById('close-bill').addEventListener('click', () => {
        document.getElementById('bill-panel').classList.remove('active');
    });

    // Add continue shopping handler
    document.getElementById('continue-shopping').addEventListener('click', () => {
        document.getElementById('bill-panel').classList.remove('active');
    });

    // Add place order handler
    document.getElementById('place-order').addEventListener('click', () => {
        // Save order details to sessionStorage
        const orderDetails = {
            student: JSON.parse(sessionStorage.getItem('studentDetails')),
            items: cart,
            orderTime: new Date().toISOString(),
            deliveryTime: 17 // minutes
        };
        sessionStorage.setItem('orderDetails', JSON.stringify(orderDetails));
        
        // Redirect to final page
        window.location.href = '/final';
    });
});

function initializeQuantityControls() {
    const menuItems = document.querySelectorAll('.menu-item');
    
    menuItems.forEach((item, index) => {
        const decreaseBtn = item.querySelector('.decrease-btn');
        const increaseBtn = item.querySelector('.increase-btn');
        const quantitySpan = item.querySelector('.quantity-value');
        const addBtn = item.querySelector('.add-btn');
        
        // Initialize buttons state
        decreaseBtn.disabled = true;
        addBtn.disabled = true; // Initially disable add button

        // Decrease quantity
        decreaseBtn.addEventListener('click', () => {
            let quantity = parseInt(quantitySpan.textContent);
            quantity = Math.max(0, quantity - 1);
            quantitySpan.textContent = quantity;
            
            // Update button states
            decreaseBtn.disabled = quantity === 0;
            increaseBtn.disabled = quantity === MAX_QUANTITY;
            addBtn.disabled = quantity === 0; // Disable add button when quantity is 0
        });

        // Increase quantity
        increaseBtn.addEventListener('click', () => {
            let quantity = parseInt(quantitySpan.textContent);
            quantity = Math.min(MAX_QUANTITY, quantity + 1);
            quantitySpan.textContent = quantity;
            
            // Update button states
            decreaseBtn.disabled = quantity === 0;
            increaseBtn.disabled = quantity === MAX_QUANTITY;
            addBtn.disabled = quantity === 0; // Enable add button when quantity > 0
        });

        // Add to cart
        addBtn.addEventListener('click', () => {
            const quantity = parseInt(quantitySpan.textContent);
            if (quantity > 0) {
                const itemTitle = item.querySelector('.menu-item-title').textContent;
                const itemPrice = parseFloat(item.querySelector('.menu-item-price').textContent.replace('₹', ''));
                
                // Add to cart
                addToCart(itemTitle, quantity, itemPrice);
                
                // Reset quantity
                quantitySpan.textContent = '0';
                decreaseBtn.disabled = true;
                addBtn.disabled = true;
                increaseBtn.disabled = false;
            }
        });
    });
}

function addToCart(title, quantity, price) {
    if (quantity <= 0) {
        showAlert('Please select a quantity greater than 0', 'error');
        return;
    }

    // Remove any existing instance of this item
    cart = cart.filter(item => item.title !== title);
    
    cart.push({
        title: title,
        quantity: quantity,
        price: menuPrices[title] || price
    });
    
    updateCartCount();
    updateViewCartButton();
    showToast(`Added ${quantity} ${title} to cart!`);
}

function updateCartCount() {
    const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
    document.getElementById('cart-count').textContent = cartCount;
}

function updateViewCartButton() {
    const viewCartBtn = document.getElementById('view-cart-btn');
    viewCartBtn.disabled = cart.length === 0;
}

function showToast(message) {
    // Create toast element if it doesn't exist
    let toast = document.getElementById('toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        document.body.appendChild(toast);
    }

    // Add styles for toast
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: var(--success);
        color: white;
        padding: 1rem 2rem;
        border-radius: var(--radius);
        box-shadow: var(--shadow);
        opacity: 0;
        transition: opacity 0.3s ease;
        z-index: 1000;
    `;

    // Show message
    toast.textContent = message;
    toast.style.opacity = '1';

    // Hide after 3 seconds
    setTimeout(() => {
        toast.style.opacity = '0';
    }, 3000);
}

async function loadMenu() {
    try {
        const response = await fetch('/api/menu');
        const data = await response.json();
        if (data.success) {
            renderMenu(data.data);
        } else {
            showAlert('Failed to load menu items', 'error');
        }
    } catch (error) {
        showAlert('Error loading menu', 'error');
        console.error('Error:', error);
    }
}

function renderMenu(menuItems) {
    // Implementation of renderMenu function
}

function showAlert(message, type) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: ${type === 'error' ? 'var(--danger)' : 'var(--success)'};
        color: white;
        padding: 1rem 2rem;
        border-radius: var(--radius);
        box-shadow: var(--shadow);
        z-index: 1000;
        opacity: 0;
        transition: opacity 0.3s ease;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    // Show toast
    setTimeout(() => toast.style.opacity = '1', 10);
    
    // Hide and remove toast
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function showBill() {
    const studentDetails = JSON.parse(sessionStorage.getItem('studentDetails') || '{}');
    const billPanel = document.getElementById('bill-panel');
    
    // Display student details
    document.getElementById('student-info').innerHTML = 
        `Name: ${studentDetails.name} | Reg No.: ${studentDetails.regNo} | Block: ${studentDetails.block} | Room: ${studentDetails.room} | Phone: ${studentDetails.phone}`;

    // Display ordered items
    const orderedItemsList = document.getElementById('ordered-items-list');
    orderedItemsList.innerHTML = '';
    
    let subtotal = 0;
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;
        
        const itemElement = document.createElement('div');
        itemElement.className = 'bill-item';
        itemElement.innerHTML = `
            <span>${item.title} (x${item.quantity})</span>
            <span>₹${itemTotal.toFixed(2)}</span>
        `;
        orderedItemsList.appendChild(itemElement);
    });

    // Calculate and display totals
    const gst = subtotal * 0.18;
    const convenience = 20.00;
    const total = subtotal + gst + convenience;

    document.getElementById('bill-subtotal').textContent = `₹${subtotal.toFixed(2)}`;
    document.getElementById('bill-gst').textContent = `₹${gst.toFixed(2)}`;
    document.getElementById('bill-convenience').textContent = `₹20.00`;
    document.getElementById('bill-total').textContent = `₹${total.toFixed(2)}`;

    // Show the panel
    billPanel.classList.add('active');
} 