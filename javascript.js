// Конфигурация
const BOT_TOKEN = '7861899004:AAHHUEAolQwwsSXkz7YLddd_qnnxesQIj24';
const CHAT_ID = '465087814';
const LOYALTY_THRESHOLD = 100; // Баллов для скидки
const CAPACITY_PER_SLOT = 15; // Максимум людей в один слот

// Праздничные дни
const holidays = [
    '2025-01-01', '2025-01-07', '2025-02-23', '2025-03-08',
    '2025-05-01', '2025-05-09', '2025-06-12', '2025-11-04'
];

// Глобальные переменные
let clientData = {
    points: 0,
    bookings: 0,
    lastVisit: null
};
let bookedSlots = [];

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', function() {
    // Инициализация табов
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            const tabId = this.getAttribute('data-tab');
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            document.getElementById(tabId).classList.add('active');
        });
    });
    
    // Установка текущей даты по умолчанию
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('regular-date').value = today;
    document.getElementById('birthday-date').value = today;
    document.getElementById('group-date').value = today;
    
    // Обработчики бронирования
    document.getElementById('book-regular').addEventListener('click', bookRegular);
    document.getElementById('book-birthday').addEventListener('click', bookBirthday);
    document.getElementById('book-group').addEventListener('click', bookGroup);
    
    // Обработчик сообщений
    document.getElementById('message-ok').addEventListener('click', hideMessage);
    
    // Загрузка данных клиента из localStorage
    loadClientData();
    
    // Инициализация временных слотов
    updateTimeSlots();
});

// Загрузка данных клиента
function loadClientData() {
    const savedData = localStorage.getItem('clientData');
    if (savedData) {
        clientData = JSON.parse(savedData);
        updateLoyaltyUI();
    }
}

// Обновление интерфейса лояльности
function updateLoyaltyUI() {
    document.getElementById('loyalty-points').textContent = clientData.points;
    
    const progress = (clientData.points % LOYALTY_THRESHOLD) / LOYALTY_THRESHOLD * 100;
    document.getElementById('loyalty-progress').style.width = progress + '%';
    
    const discountElement = document.getElementById('loyalty-discount');
    if (clientData.points >= LOYALTY_THRESHOLD) {
        discountElement.classList.remove('hidden');
    } else {
        discountElement.classList.add('hidden');
    }
}

// Показать сообщение
function showMessage(message) {
    document.getElementById('message-text').textContent = message;
    document.getElementById('message-box').classList.remove('hidden');
}

// Скрыть сообщение
function hideMessage() {
    document.getElementById('message-box').classList.add('hidden');
}

// Определение типа дня (будни/выходные/праздники)
function getDayType(dateString) {
    const date = new Date(dateString + 'T00:00:00');
    const dayOfWeek = date.getDay();

    if (holidays.includes(dateString)) return 'weekend_holiday';
    if (dayOfWeek === 0 || dayOfWeek === 6) return 'weekend_holiday';
    if (dayOfWeek === 1 || dayOfWeek === 4) return 'monday_thursday';
    return 'other_weekday';
}

// Расчет базовой цены
function getBasePrice(durationMinutes, dayType) {
    const prices = {
        monday_thursday: { 30: 350, 60: 350, 120: 350 },
        other_weekday: { 30: 300, 60: 500, 120: 800 },
        weekend_holiday: { 30: 400, 60: 600, 120: 1000 }
    };
    
    return prices[dayType]?.[durationMinutes] || 0;
}

// Проверка доступности времени
function checkAvailability(dateString, startHour, startMinute, durationMinutes, people, bookingType) {
    const newBookingStart = new Date(`${dateString}T${formatTime(startHour)}:${formatTime(startMinute)}:00`);
    const newBookingEnd = new Date(newBookingStart.getTime() + durationMinutes * 60 * 1000);

    // Проверка для дней рождения и групповых бронирований
    if (bookingType === 'birthday' || bookingType === 'group') {
        const isOverlapping = bookedSlots.some(slot => 
            slot.date === dateString && 
            (slot.type === 'birthday' || slot.type === 'group') &&
            newBookingStart < new Date(`${slot.date}T${formatTime(slot.startHour)}:${formatTime(slot.startMinute)}:00`).getTime() + slot.durationMinutes * 60 * 1000 &&
            newBookingEnd > new Date(`${slot.date}T${formatTime(slot.startHour)}:${formatTime(slot.startMinute)}:00`).getTime()
        );
        
        if (isOverlapping) return false;
        
        if (bookingType === 'group') {
            for (let slot of bookedSlots) {
                if (slot.date === dateString && slot.type === 'regular') {
                    const slotStart = new Date(`${slot.date}T${formatTime(slot.startHour)}:${formatTime(slot.startMinute)}:00`);
                    const slotEnd = new Date(slotStart.getTime() + slot.durationMinutes * 60 * 1000);
                    
                    if (newBookingStart < slotEnd && newBookingEnd > slotStart) {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    // Проверка для обычных бронирований
    for (let slot of bookedSlots) {
        const slotStart = new Date(`${slot.date}T${formatTime(slot.startHour)}:${formatTime(slot.startMinute)}:00`);
        const slotEnd = new Date(slotStart.getTime() + slot.durationMinutes * 60 * 1000);
        
        if (newBookingStart < slotEnd && newBookingEnd > slotStart) {
            const slotPeople = slot.type === 'regular' ? slot.people : CAPACITY_PER_SLOT;
            if (slotPeople + people > CAPACITY_PER_SLOT) {
                return false;
            }
        }
    }
    
    return true;
}

// Форматирование времени (добавление ведущего нуля)
function formatTime(num) {
    return num < 10 ? '0' + num : '' + num;
}

// Обновление временных слотов
function updateTimeSlots() {
    // Здесь должна быть логика обновления доступных временных слотов
    // В демо-версии просто добавляем тестовые значения
    const timeSlots = [
        '10:00', '11:00', '12:00', '13:00', '14:00', 
        '15:00', '16:00', '17:00', '18:00', '19:00'
    ];
    
    const regularSelect = document.getElementById('regular-time');
    const birthdaySelect = document.getElementById('birthday-time');
    const groupSelect = document.getElementById('group-time');
    
    timeSlots.forEach(time => {
        const option = document.createElement('option');
        option.value = time;
        option.textContent = time;
        
        regularSelect.appendChild(option.cloneNode(true));
        birthdaySelect.appendChild(option.cloneNode(true));
        groupSelect.appendChild(option.cloneNode(true));
    });
}

// Расчет стоимости с учетом скидки
function calculatePrice(basePrice, people) {
    let discount = 0;
    if (clientData.points >= LOYALTY_THRESHOLD) {
        discount = Math.floor(basePrice * 0.1); // 10% скидка
    }
    return (basePrice - discount) * people;
}

// Бронирование разового посещения
async function bookRegular() {
    const name = document.getElementById('regular-name').value.trim();
    const phone = document.getElementById('regular-phone').value.trim();
    const date = document.getElementById('regular-date').value;
    const people = parseInt(document.getElementById('regular-people').value);
    const duration = parseInt(document.querySelector('input[name="regular-duration"]:checked').value);
    const time = document.getElementById('regular-time').value;
    
    if (!name || !phone || !date || !time) {
        showMessage('Пожалуйста, заполните все поля');
        return;
    }
    
    const [hour, minute] = time.split(':').map(Number);
    if (!checkAvailability(date, hour, minute, duration, people, 'regular')) {
        showMessage('Выбранное время недоступно');
        return;
    }
    
    // Расчет стоимости
    const dayType = getDayType(date);
    const basePrice = getBasePrice(duration, dayType);
    const price = calculatePrice(basePrice, people);
    
    // Начисление баллов (10 баллов за каждые 100 рублей)
    const points = Math.floor(price / 100) * 10;
    clientData.points += points;
    clientData.bookings++;
    clientData.lastVisit = new Date().toISOString();
    
    // Сохранение данных
    localStorage.setItem('clientData', JSON.stringify(clientData));
    updateLoyaltyUI();
    
    // Добавление в список бронирований
    bookedSlots.push({
        date,
        startHour: hour,
        startMinute: minute,
        durationMinutes: duration,
        people,
        type: 'regular',
        name,
        phone
    });
    
    // Отправка уведомления в Telegram
    const message = `Новое бронирование (Разовое):\nИмя: ${name}\nТелефон: ${phone}\nДата: ${date}\nВремя: ${time}\nЛюдей: ${people}\nДлительность: ${duration} мин\nСумма: ${price} ₽`;
    await sendTelegramMessage(message);
    
    showMessage(`Бронирование успешно! Начислено ${points} баллов.`);
}

// Бронирование дня рождения
async function bookBirthday() {
    const name = document.getElementById('birthday-name').value.trim();
    const phone = document.getElementById('birthday-phone').value.trim();
    const date = document.getElementById('birthday-date').value;
    const people = parseInt(document.getElementById('birthday-people').value);
    const time = document.getElementById('birthday-time').value;
    
    if (!name || !phone || !date || !time) {
        showMessage('Пожалуйста, заполните все поля');
        return;
    }
    
    if (people < 5) {
        showMessage('Для бронирования дня рождения нужно минимум 5 человек');
        return;
    }
    
    const [hour, minute] = time.split(':').map(Number);
    if (!checkAvailability(date, hour, minute, 120, people, 'birthday')) {
        showMessage('Выбранное время недоступно');
        return;
    }
    
    // Расчет стоимости (фиксированная цена для дней рождения)
    const basePrice = 1000; // Базовая цена за человека
    const price = calculatePrice(basePrice, people);
    
    // Начисление баллов (15 баллов за каждые 100 рублей)
    const points = Math.floor(price / 100) * 15;
    clientData.points += points;
    clientData.bookings++;
    clientData.lastVisit = new Date().toISOString();
    
    // Сохранение данных
    localStorage.setItem('clientData', JSON.stringify(clientData));
    updateLoyaltyUI();
    
    // Добавление в список бронирований
    bookedSlots.push({
        date,
        startHour: hour,
        startMinute: minute,
        durationMinutes: 120,
        people,
        type: 'birthday',
        name,
        phone
    });
    
    // Отправка уведомления в Telegram
    const message = `Новое бронирование (День рождения):\nИмя: ${name}\nТелефон: ${phone}\nДата: ${date}\nВремя: ${time}\nГостей: ${people}\nСумма: ${price} ₽`;
    await sendTelegramMessage(message);
    
    showMessage(`Бронирование дня рождения успешно! Начислено ${points} баллов.`);
}

// Бронирование группового посещения
async function bookGroup() {
    const name = document.getElementById('group-name').value.trim();
    const phone = document.getElementById('group-phone').value.trim();
    const date = document.getElementById('group-date').value;
    const people = parseInt(document.getElementById('group-people').value);
    const time = document.getElementById('group-time').value;
    
    if (!name || !phone || !date || !time) {
        showMessage('Пожалуйста, заполните все поля');
        return;
    }
    
    if (people < 10) {
        showMessage('Для группового бронирования нужно минимум 10 человек');
        return;
    }
    
    const [hour, minute] = time.split(':').map(Number);
    if (!checkAvailability(date, hour, minute, 60, people, 'group')) {
        showMessage('Выбранное время недоступно');
        return;
    }
    
    // Расчет стоимости (специальная цена для групп)
    const basePrice = 600; // Базовая цена за человека
    const price = calculatePrice(basePrice, people);
    
    // Начисление баллов (12 баллов за каждые 100 рублей)
    const points = Math.floor(price / 100) * 12;
    clientData.points += points;
    clientData.bookings++;
    clientData.lastVisit = new Date().toISOString();
    
    // Сохранение данных
    localStorage.setItem('clientData', JSON.stringify(clientData));
    updateLoyaltyUI();
    
    // Добавление в список бронирований
    bookedSlots.push({
        date,
        startHour: hour,
        startMinute: minute,
        durationMinutes: 60,
        people,
        type: 'group',
        name,
        phone
    });
    
    // Отправка уведомления в Telegram
    const message = `Новое бронирование (Групповое):\nИмя: ${name}\nТелефон: ${phone}\nДата: ${date}\nВремя: ${time}\nУчастников: ${people}\nСумма: ${price} ₽`;
    await sendTelegramMessage(message);
    
    showMessage(`Групповое бронирование успешно! Начислено ${points} баллов.`);
}

// Отправка сообщения в Telegram
async function sendTelegramMessage(message) {
    try {
        const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: CHAT_ID,
                text: message,
                parse_mode: 'HTML'
            })
        });
        
        const data = await response.json();
        if (!data.ok) {
            console.error('Ошибка отправки в Telegram:', data.description);
        }
    } catch (error) {
        console.error('Ошибка сети при отправке в Telegram:', error);
    }
}
