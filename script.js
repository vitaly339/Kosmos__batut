// ===== КОНФИГУРАЦИЯ =====
const GOOGLE_SHEET_ID = '1i0Bjp7d59QzeEnZgsbdVR16TQTFcVNPfhSmX6WNm34Q';
const API_URL = 'https://script.google.com/macros/s/AKfycbz3eJd9dYqVv5J4Y8ZxQ1w7Xa6f3Q7k9X9Z0H7t/exec';
const ADMIN_PASSWORD = "cosmos123";

// ===== ФУНКЦИИ ДЛЯ РАБОТЫ С GOOGLE SHEETS =====
async function saveBookingToSheet(booking) {
    // ... (функция из второго кода)
}

async function getBookingsFromSheet() {
    // ... (функция из второго кода)
}

async function cancelBookingInSheet(bookingId) {
    // ... (функция из второго кода)
}

// ===== ОСНОВНЫЕ ФУНКЦИИ =====
function generateBookingId() {
    return 'id-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

function resetRegularForm() {
    // ... (функция из второго кода)
}

function resetBirthdayForm() {
    // ... (функция из второго кода)
}

function resetGroupForm() {
    // ... (функция из второго кода)
}

function refreshBookingsList() {
    // ... (функция из второго кода)
}

async function cancelBooking(bookingId) {
    // ... (функция из второго кода)
}

async function clearTestBookings() {
    // ... (функция из второго кода)
}
