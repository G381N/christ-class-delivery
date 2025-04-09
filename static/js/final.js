document.addEventListener('DOMContentLoaded', () => {
    const studentDetails = JSON.parse(sessionStorage.getItem('studentDetails') || '{}');
    const cart = JSON.parse(sessionStorage.getItem('cart') || '[]');
    
    if (!studentDetails.name || cart.length === 0) {
        window.location.href = '/details';
        return;
    }

    renderOrderSummary(studentDetails, cart);
});

function renderOrderSummary(student, cart) {
    const cartSection = document.getElementById('cart-section');
    
    // Render student details
    const studentDetails = `
        <div class="section-header">
            <h2><i class="fas fa-receipt"></i> Order Summary</h2>
        </div>
        <div class="student-details">
            <div class="details-content">
                Name: ${student.name} | Reg No.: ${student.regNo} | Block: ${student.block} | Room: ${student.room} | Phone: ${student.phone}
            </div>
        </div>
    `;
    
    // Render ordered items
    let itemsHtml = `
        <div class="cart-items">
            <h3>Food Item(s) Ordered:</h3>
            <div class="items-list">
    `;
    
    let subtotal = 0;
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;
        itemsHtml += `
            <div class="cart-item">
                <div class="cart-item-info">
                    <div class="cart-item-title">${item.title} (x${item.quantity}) - ₹${itemTotal.toFixed(2)}</div>
                </div>
            </div>
        `;
    });
    
    itemsHtml += '</div></div>';
    
    // Calculate totals
    const gst = subtotal * 0.18;
    const convenience = 20.00;
    const total = subtotal + gst + convenience;
    
    // Render bill summary
    const billSummary = `
        <div class="order-summary">
            <div class="summary-row">
                <span>Subtotal:</span>
                <span>₹${subtotal.toFixed(2)}</span>
            </div>
            <div class="summary-row">
                <span>GST (18%):</span>
                <span>₹${gst.toFixed(2)}</span>
            </div>
            <div class="summary-row">
                <span>Convenience Charge:</span>
                <span>₹${convenience.toFixed(2)}</span>
            </div>
            <div class="divider"></div>
            <div class="summary-row total">
                <span>Total Cost:</span>
                <span>₹${total.toFixed(2)}</span>
            </div>
        </div>
    `;

    // Update the page content
    cartSection.innerHTML = `
        ${studentDetails}
        ${itemsHtml}
        ${billSummary}
        <div class="nav-buttons">
            <a href="/menu" class="btn btn-outline">
                <i class="fas fa-arrow-left"></i> Back to Menu
            </a>
            <button id="place-order-btn" class="btn btn-primary">
                <i class="fas fa-check"></i> Place Order
            </button>
        </div>
    `;

    // Add event listener to place order button
    document.getElementById('place-order-btn').addEventListener('click', () => {
        cartSection.classList.add('hidden');
        document.getElementById('confirmation-section').classList.remove('hidden');
        sessionStorage.removeItem('cart');
    });
}

function showAlert(message, type) {
    // Create toast element
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
    `;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
} 