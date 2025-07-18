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

async function handleBookRegular() {
    // ... существующий код ...

    if (isAvailable) {
        const isTest = name.toLowerCase().includes('test') || 
                      name.toLowerCase().includes('тест');
        const bookingId = generateBookingId();

        const bookingData = {
            id: bookingId,
            // ... остальные данные бронирования ...
        };

        // Сохраняем в Google Таблицу
        const saveResult = await saveBookingToSheet(bookingData);
        
        if (saveResult && saveResult.status === 'success') {
            // Сохраняем локально
            bookedSlots.push(bookingData);
            
            // Очищаем форму
            resetRegularForm();
            
            // Показываем сообщение
            showMessageBox(`Бронирование успешно! ID: ${bookingId}`);
        }
    }
}

// Инициализация админ-панели
const adminPanel = document.getElementById('admin-panel');
const adminToggle = document.getElementById('admin-toggle');
const closeAdmin = document.getElementById('close-admin');
const clearTestBtn = document.getElementById('clear-test-btn');
const syncBookingsBtn = document.getElementById('sync-bookings');
const bookingsList = document.getElementById('bookings-list');

adminToggle.addEventListener('click','DOMContentLoaded', function () {
    // ... (обработчик из второго кода)
});

// ... остальные обработчики ...
