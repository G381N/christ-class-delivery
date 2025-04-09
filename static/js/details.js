document.addEventListener('DOMContentLoaded', () => {
    const studentForm = document.getElementById('student-form');
    
    studentForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Collect student details
        const details = {
            name: document.getElementById('name').value,
            regNo: document.getElementById('regNo').value,
            block: document.getElementById('block').value,
            room: document.getElementById('room').value,
            phone: document.getElementById('phone').value
        };
        
        // Save to sessionStorage
        sessionStorage.setItem('studentDetails', JSON.stringify(details));
        
        // Navigate to menu page
        window.location.href = '/menu';
    });
}); 