const GAS_URL = 'https://script.google.com/macros/s/AKfycbzyvuyhw4EAU5xWP35fanJ71eyJEbKVxSUwBdx_1sZ2Y8-O3kJ1ouvhokEXj__wZ4jT/exec'; // Замените на реальный URL
const API_KEY = 'batut-cosmos-api-2025';

// Глобальные переменные для данных клиента
let clientData = {
  points: 0,
  bookings: 0
};

// Получение данных клиента
async function fetchClientData(phone) {
  try {
    const response = await fetch(GAS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': API_KEY
      },
      body: JSON.stringify({
        action: 'getClient',
        phone: phone
      })
    });
    
    const data = await response.json();
    if (!data.error) {
      clientData = {
        points: data.points || 0,
        bookings: data.bookings || 0,
        lastVisit: data.lastVisit || null
      };
      return true;
    }
  } catch (error) {
    console.error('Ошибка при получении данных клиента:', error);
  }
  return false;
}

// Обновление данных клиента
async function updateClientData(phone, name, points, bookingType, amount) {
  try {
    const response = await fetch(GAS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': API_KEY
      },
      body: JSON.stringify({
        action: 'updateClient',
        phone: phone,
        name: name,
        points: points,
        bookingType: bookingType,
        amount: amount
      })
    });
    
    const data = await response.json();
    if (!data.error) {
      clientData = {
        points: data.points || 0,
        bookings: data.bookings || 0
      };
      return true;
    }
  } catch (error) {
    console.error('Ошибка при обновлении данных клиента:', error);
  }
  return false;
async function handleBookRegular() {
  const name = regularNameInput.value.trim();
  const phone = regularPhoneInput.value.trim();
  const dateString = regularDateInput.value;
  // ... остальные данные
  
  // Расчет стоимости
  const totalAmount = parseInt(regularTotalPriceSpan.textContent);
  
  // Начисление баллов (10 баллов за каждые 100 рублей)
  const pointsToAdd = Math.floor(totalAmount / 100) * 10;
  
  // Обновление данных клиента
  const success = await updateClientData(
    phone,
    name,
    pointsToAdd,
    'regular',
    totalAmount
  );
  
  if (success) {
    // Показать сообщение об успехе
    showMessageBox(`Бронирование успешно! Начислено ${pointsToAdd} космических баллов.`);
    
    // Отправка в Telegram
    const message = `<b>Новое бронирование:</b>\nИмя: ${name}\nТелефон: ${phone}\nТип: Разовое\nСумма: ${totalAmount} ₽`;
    sendTelegramMessage(message);
  } else {
    showMessageBox("Ошибка при сохранении данных лояльности. Бронирование выполнено, но баллы не начислены.");
  }
}

// Аналогично для handleBookBirthday и handleBookGroup
    function setupPhoneInputListeners() {
  const phoneInputs = [
    regularPhoneInput,
    birthdayPhoneInput,
    groupPhoneInput
  ];
  
  phoneInputs.forEach(input => {
    input.addEventListener('blur', async function() {
      const phone = this.value.trim();
      if (phone.length >= 10) {
        await fetchClientData(phone);
        updateLoyaltyUI();
        updatePricesWithLoyalty();
      }
    });
  });
}

// Вызовите в DOMContentLoaded
setupPhoneInputListeners();
}
// --- DOM Elements ---
const tabButtons = document.querySelectorAll('.tab-button');
const bookingSections = document.querySelectorAll('.booking-section');

// Birthday Booking Elements
const birthdayNameInput = document.getElementById('birthday-name');
// ... другие элементы дня рождения ...
const birthdayTotalPriceSpan = document.getElementById('birthday-total-price');
const bookBirthdayBtn = document.getElementById('book-birthday');
const birthdayIsHonoreeCheckbox = document.getElementById('birthday-is-honoree'); // <-- ДОБАВЬТЕ ЭТУ СТРОКУ

// Regular Booking Elements
const regularNameInput = document.getElementById('regular-name');
const regularPhoneInput = document.getElementById('regular-phone');
const regularDateInput = document.getElementById('regular-date');
const regularPeopleInput = document.getElementById('regular-people');
const regularMinusBtn = document.getElementById('regular-minus');
const regularPlusBtn = document.getElementById('regular-plus');
const regularDurationRadios = document.querySelectorAll('input[name="regular-duration"]');
const regularTimeSlotSelect = document.getElementById('regular-time-slot');
const regularAvailabilityMessage = document.getElementById('regular-availability-message');
const regularTotalPriceSpan = document.getElementById('regular-total-price');
const bookRegularBtn = document.getElementById('book-regular');

// Birthday Booking Elements
const birthdayNameInput = document.getElementById('birthday-name');
const birthdayPhoneInput = document.getElementById('birthday-phone');
const birthdayDateInput = document.getElementById('birthday-date');
const birthdayPeopleInput = document.getElementById('birthday-people');
const birthdayMinusBtn = document.getElementById('birthday-minus');
const birthdayPlusBtn = document.getElementById('birthday-plus');
const birthdayStartHourInput = document.getElementById('birthday-start-hour');
const birthdayStartMinuteInput = document.getElementById('birthday-start-minute');
const birthdayEndHourInput = document.getElementById('birthday-end-hour');
const birthdayEndMinuteInput = document.getElementById('birthday-end-minute');
const birthdayDurationMessage = document.getElementById('birthday-duration-message');
const birthdayAvailabilityMessage = document.getElementById('birthday-availability-message');
const birthdayTotalPriceSpan = document.getElementById('birthday-total-price');
const bookBirthdayBtn = document.getElementById('book-birthday');

// Group Booking Elements
const groupNameInput = document.getElementById('group-name');
const groupPhoneInput = document.getElementById('group-phone');
const groupDateInput = document.getElementById('group-date');
const groupPeopleInput = document.getElementById('group-people');
const groupMinusBtn = document.getElementById('group-minus');
const groupPlusBtn = document.getElementById('group-plus');
const groupTimeSlotSelect = document.getElementById('group-time-slot');
const groupAvailabilityMessage = document.getElementById('group-availability-message');
const groupTotalPriceSpan = document.getElementById('group-total-price');
const bookGroupBtn = document.getElementById('book-group');

// Message Box Elements
const messageBox = document.getElementById('message-box');
const messageText = document.getElementById('message-text');
const messageOkButton = document.getElementById('message-ok-button');

// Cubes Container Element
const cubesContainer = document.getElementById('cubes-container');

// --- Telegram Bot Configuration ---
const botToken = '7861899004:AAHHUEAolQwwsSXkz7YLddd_qnnxesQIj24';
const chatId = '465087814';

// --- Global State ---
let bookedSlots = [];

// Define holidays for price calculation
const holidays = [
    '2025-01-01', '2025-01-07', '2025-02-23', '2025-03-08',
    '2025-05-01', '2025-05-09', '2025-06-12', '2025-11-04'
];

const CAPACITY_PER_SLOT = 12;

// --- Utility Functions ---
function showMessageBox(message) {
    messageText.textContent = message;
    messageBox.classList.remove('hidden');
}

function hideMessageBox() {
    messageBox.classList.add('hidden');
}

function formatTime(num) {
    return num < 10 ? '0' + num : '' + num;
}

async function sendTelegramMessage(message) {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const params = {
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML'
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(params)
        });

        const data = await response.json();
        if (!data.ok) {
            console.error('Error sending Telegram message:', data.description);
        }
    } catch (error) {
        console.error('Network error while sending Telegram message:', error);
    }
}

function getDayType(dateString) {
    const date = new Date(dateString + 'T00:00:00');
    const dayOfWeek = date.getDay();

    if (holidays.includes(dateString)) {
        return 'weekend_holiday';
    }
    if (dayOfWeek === 0 || dayOfWeek === 6) {
        return 'weekend_holiday';
    }
    if (dayOfWeek === 1 || dayOfWeek === 4) {
        return 'monday_thursday';
    }
    return 'other_weekday';
}

function getBasePrice(durationMinutes, dayType) {
    if (dayType === 'monday_thursday') {
        return 350;
    } else if (dayType === 'other_weekday') {
        if (durationMinutes === 30) return 300;
        if (durationMinutes === 60) return 500;
        if (durationMinutes === 120) return 800;
    } else if (dayType === 'weekend_holiday') {
        if (durationMinutes === 30) return 400;
        if (durationMinutes === 60) return 600;
        if (durationMinutes === 120) return 1000;
    }
    return 0;
}

function populateTimeSlots(selectElement, dateString, durationMinutes, numPeople, bookingType) {
    selectElement.innerHTML = '';
    const now = new Date();
    const todayString = now.toISOString().split('T')[0];
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    let hasAvailableSlots = false;

    for (let hour = 10; hour < 22; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
            const slotStartHour = hour;
            const slotStartMinute = minute;
            const slotEndHour = hour + Math.floor((minute + durationMinutes) / 60);
            const slotEndMinute = (minute + durationMinutes) % 60;

            if (slotEndHour > 22 || (slotEndHour === 22 && slotEndMinute > 0)) {
                continue;
            }

            if (dateString === todayString &&
                (slotStartHour < currentHour || (slotStartHour === currentHour && slotStartMinute <= currentMinute))) {
                continue;
            }

            const slotStartTime = `${formatTime(slotStartHour)}:${formatTime(slotStartMinute)}`;
            const slotEndTime = `${formatTime(slotEndHour)}:${formatTime(slotEndMinute)}`;

            const isAvailable = checkAvailability(dateString, slotStartHour, slotStartMinute, durationMinutes, numPeople, bookingType);

            const option = document.createElement('option');
            option.value = `${slotStartHour}:${slotStartMinute}`;
            option.textContent = `${slotStartTime} - ${slotEndTime}`;

            if (!isAvailable) {
                option.disabled = true;
                option.textContent += " (Занято)";
                option.classList.add('text-gray-400', 'italic');
            } else {
                hasAvailableSlots = true;
            }
            selectElement.appendChild(option);
        }
    }

    if (!hasAvailableSlots && selectElement.options.length > 0) {
        const noSlotsOption = document.createElement('option');
        noSlotsOption.textContent = "Нет доступных слотов на выбранную дату и продолжительность.";
        noSlotsOption.disabled = true;
        selectElement.appendChild(noSlotsOption);
        selectElement.value = '';
    } else if (selectElement.options.length === 0) {
        const noSlotsOption = document.createElement('option');
        noSlotsOption.textContent = "Нет доступных слотов.";
        noSlotsOption.disabled = true;
        selectElement.appendChild(noSlotsOption);
        selectElement.value = '';
    } else {
        selectElement.value = selectElement.options[0].value;
    }
}

function checkAvailability(dateString, startHour, startMinute, durationMinutes, newPeople, bookingType) {
    const newBookingStart = new Date(`${dateString}T${formatTime(startHour)}:${formatTime(startMinute)}:00`);
    const newBookingEnd = new Date(newBookingStart.getTime() + durationMinutes * 60 * 1000);

    if (bookingType === 'birthday' || bookingType === 'group') {
        const overlappingExclusiveBookings = bookedSlots.filter(slot =>
            slot.date === dateString &&
            (slot.type === 'birthday' || slot.type === 'group') &&
            (newBookingStart < new Date(`${slot.date}T${formatTime(slot.startHour)}:${formatTime(slot.startMinute)}:00`) + slot.durationMinutes * 60 * 1000 &&
            newBookingEnd > new Date(`${slot.date}T${formatTime(slot.startHour)}:${formatTime(slot.startMinute)}:00`))
        );
        if (overlappingExclusiveBookings.length > 0) {
            return false;
        }

        if (bookingType === 'group') {
            const segmentStart = new Date(newBookingStart);
            while (segmentStart < newBookingEnd) {
                const segmentEnd = new Date(segmentStart.getTime() + 30 * 60 * 1000);

                let peopleInSegment = 0;
                bookedSlots.forEach(slot => {
                    if (slot.date === dateString && slot.type === 'regular') {
                        const existingStart = new Date(`${slot.date}T${formatTime(slot.startHour)}:${formatTime(slot.startMinute)}:00`);
                        const existingEnd = new Date(existingStart.getTime() + slot.durationMinutes * 60 * 1000);

                        if (segmentStart < existingEnd && segmentEnd > existingStart) {
                            peopleInSegment += slot.people;
                        }
                    }
                });

                if (peopleInSegment > 0) {
                    return false;
                }
                segmentStart.setTime(segmentEnd.getTime());
            }
        }
        return true;
    }

    const segmentStart = new Date(newBookingStart);
    while (segmentStart < newBookingEnd) {
        const segmentEnd = new Date(segmentStart.getTime() + 30 * 60 * 1000);

        let peopleInSegment = 0;
        bookedSlots.forEach(slot => {
            if (slot.date === dateString) {
                const existingStart = new Date(`${slot.date}T${formatTime(slot.startHour)}:${formatTime(slot.startMinute)}:00`);
                const existingEnd = new Date(existingStart.getTime() + slot.durationMinutes * 60 * 1000);

                if (segmentStart < existingEnd && segmentEnd > existingStart) {
                    if (slot.type === 'birthday' || slot.type === 'group') {
                        peopleInSegment += CAPACITY_PER_SLOT;
                    } else {
                        peopleInSegment += slot.people;
                    }
                }
            }
        });

        if (peopleInSegment + newPeople > CAPACITY_PER_SLOT) {
            return false;
        }
        segmentStart.setTime(segmentEnd.getTime());
    }

    return true;
}

// --- Calculation Functions ---
function calculateRegularPrice() {
    const dateString = regularDateInput.value;
    const numPeople = parseInt(regularPeopleInput.value);
    const durationMinutes = parseInt(document.querySelector('input[name="regular-duration"]:checked').value);
    const selectedTimeSlot = regularTimeSlotSelect.value;

    if (!dateString || !numPeople || !durationMinutes || !selectedTimeSlot) {
        regularTotalPriceSpan.textContent = '0';
        regularAvailabilityMessage.classList.add('hidden');
        bookRegularBtn.disabled = true;
        bookRegularBtn.classList.add('opacity-50', 'cursor-not-allowed');
        return;
    }

    const dayType = getDayType(dateString);
    const pricePerPerson = getBasePrice(durationMinutes, dayType);
    const totalPrice = pricePerPerson * numPeople;

    regularTotalPriceSpan.textContent = totalPrice;

    const [startHour, startMinute] = selectedTimeSlot.split(':').map(Number);
    const isAvailable = checkAvailability(dateString, startHour, startMinute, durationMinutes, numPeople, 'regular');

    if (!isAvailable) {
        regularAvailabilityMessage.textContent = "Это время занято или недостаточно места.";
        regularAvailabilityMessage.classList.remove('hidden');
        bookRegularBtn.disabled = true;
        bookRegularBtn.classList.add('opacity-50', 'cursor-not-allowed');
    } else {
        regularAvailabilityMessage.classList.add('hidden');
        bookRegularBtn.disabled = false;
        bookRegularBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    }
}

function calculateBirthdayPrice() {
    const dateString = birthdayDateInput.value;
    const numPeople = parseInt(birthdayPeopleInput.value);
    const startHour = parseInt(birthdayStartHourInput.value);
    const startMinute = parseInt(birthdayStartMinuteInput.value);
    const endHour = parseInt(birthdayEndHourInput.value);
    const endMinute = parseInt(birthdayEndMinuteInput.value);
    const isHonoree = birthdayIsHonoreeCheckbox.checked;
    
    // Сброс сообщений и состояния кнопки
    birthdayDurationMessage.classList.add('hidden');
    birthdayAvailabilityMessage.classList.add('hidden');
    bookBirthdayBtn.disabled = true;
    bookBirthdayBtn.classList.add('opacity-50', 'cursor-not-allowed');

    // Проверка заполнения полей
    if (!dateString || !numPeople || isNaN(startHour) || isNaN(startMinute) || isNaN(endHour) || isNaN(endMinute)) {
        birthdayTotalPriceSpan.textContent = '0';
        return;
    }

    // Расчет длительности
    const startTime = new Date(`${dateString}T${formatTime(startHour)}:${formatTime(startMinute)}:00`);
    const endTime = new Date(`${dateString}T${formatTime(endHour)}:${formatTime(endMinute)}:00`);
    const durationMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);

    // Валидация длительности
    if (durationMinutes < 120) {
        birthdayDurationMessage.textContent = "Минимальная продолжительность для Дня рождения - 2 часа (120 минут).";
        birthdayDurationMessage.classList.remove('hidden');
        birthdayTotalPriceSpan.textContent = '0';
        return;
    }

    if (durationMinutes % 30 !== 0) {
        birthdayDurationMessage.textContent = "Продолжительность должна быть кратна 30 минутам.";
        birthdayDurationMessage.classList.remove('hidden');
        birthdayTotalPriceSpan.textContent = '0';
        return;
    }

    // Расчет цены с округлением
    const dayType = getDayType(dateString);
    const basePricePer2Hours = (dayType === 'weekend_holiday') ? 1000 : 800;
    const pricePerMinutePerPerson = basePricePer2Hours / 120;
    const totalPrice = Math.round(pricePerMinutePerPerson * durationMinutes * numPeople);

    // Обновление UI
    birthdayTotalPriceSpan.textContent = totalPrice;

    // Проверка доступности
    const isAvailable = checkAvailability(dateString, startHour, startMinute, durationMinutes, numPeople, 'birthday');
    if (!isAvailable) {
        birthdayAvailabilityMessage.textContent = "Это время занято для бронирования Дня рождения.";
        birthdayAvailabilityMessage.classList.remove('hidden');
    } else {
        bookBirthdayBtn.disabled = false;
        bookBirthdayBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    }
}
function calculateGroupPrice() {
    const dateString = groupDateInput.value;
    const numPeople = parseInt(groupPeopleInput.value);
    const durationMinutes = 60;
    const selectedTimeSlot = groupTimeSlotSelect.value;

    if (!dateString || !numPeople || !selectedTimeSlot) {
        groupTotalPriceSpan.textContent = '0';
        groupAvailabilityMessage.classList.add('hidden');
        bookGroupBtn.disabled = true;
        bookGroupBtn.classList.add('opacity-50', 'cursor-not-allowed');
        return;
    }

    if (numPeople < 15) {
        groupTotalPriceSpan.textContent = '0';
        groupAvailabilityMessage.textContent = "Минимальное количество человек для группы - 10.";
        groupAvailabilityMessage.classList.remove('hidden');
        bookGroupBtn.disabled = true;
        bookGroupBtn.classList.add('opacity-50', 'cursor-not-allowed');
        return;
    }

    const dayType = getDayType(dateString);
    const standardPricePerPerson = getBasePrice(durationMinutes, dayType);
    const discountedPricePerPerson = standardPricePerPerson - 50;
    const totalPrice = discountedPricePerPerson * numPeople;

    groupTotalPriceSpan.textContent = totalPrice;

    const [startHour, startMinute] = selectedTimeSlot.split(':').map(Number);
    const isAvailable = checkAvailability(dateString, startHour, startMinute, durationMinutes, numPeople, 'group');

    if (!isAvailable) {
        groupAvailabilityMessage.textContent = "Это время занято или недостаточно места.";
        groupAvailabilityMessage.classList.remove('hidden');
        bookGroupBtn.disabled = true;
        bookGroupBtn.classList.add('opacity-50', 'cursor-not-allowed');
    } else {
        groupAvailabilityMessage.classList.add('hidden');
        bookGroupBtn.disabled = false;
        bookGroupBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    }
}

// --- Event Handlers ---
function handleTabClick(event) {
    tabButtons.forEach(button => {
        button.classList.remove('active', 'bg-purple-700', 'hover:bg-purple-800', 'text-white', 'shadow-md');
        button.classList.add('bg-gray-700', 'hover:bg-gray-600', 'text-gray-200');
    });
    event.target.classList.add('active', 'bg-purple-700', 'hover:bg-purple-800', 'text-white', 'shadow-md');
    event.target.classList.remove('bg-gray-700', 'hover:bg-gray-600', 'text-gray-200');

    bookingSections.forEach(section => section.classList.add('hidden'));
    document.getElementById(event.target.id.replace('tab-', '') + '-booking').classList.remove('hidden');

    if (event.target.id === 'tab-regular') {
        populateRegularTimeSlots();
        calculateRegularPrice();
    } else if (event.target.id === 'tab-birthday') {
        calculateBirthdayPrice();
    } else if (event.target.id === 'tab-group') {
        populateGroupTimeSlots();
        calculateGroupPrice();
    }
}

function handleBookRegular() {
    const name = regularNameInput.value.trim();
    const phone = regularPhoneInput.value.trim();
    const dateString = regularDateInput.value;
    const numPeople = parseInt(regularPeopleInput.value);
    const durationMinutes = parseInt(document.querySelector('input[name="regular-duration"]:checked').value);
    const selectedTimeSlot = regularTimeSlotSelect.value;
    const totalPrice = regularTotalPriceSpan.textContent;

    if (!name || !phone || !dateString || !numPeople || !durationMinutes || !selectedTimeSlot) {
        showMessageBox("Пожалуйста, заполните все поля для бронирования.");
        return;
    }
    if (!regularPhoneInput.checkValidity()) {
        showMessageBox("Пожалуйста, введите номер телефона в формате +79000000000.");
        return;
    }

    const [startHour, startMinute] = selectedTimeSlot.split(':').map(Number);
    const isAvailable = checkAvailability(dateString, startHour, startMinute, durationMinutes, numPeople, 'regular');

    if (isAvailable) {
        bookedSlots.push({
            date: dateString,
            startHour: startHour,
            startMinute: startMinute,
            durationMinutes: durationMinutes,
            people: numPeople,
            type: 'regular',
            name: name,
            phone: phone
        });
        const message = `<b>Новое бронирование (Разовое посещение):</b>\n` +
                        `Имя: ${name}\n` +
                        `Телефон: ${phone}\n` +
                        `Дата: ${dateString}\n` +
                        `Время: ${selectedTimeSlot}\n` +
                        `Человек: ${numPeople}\n` +
                        `Продолжительность: ${durationMinutes} мин\n` +
                        `Общая стоимость: ${totalPrice} ₽`;
        sendTelegramMessage(message);
        showMessageBox(`Бронирование успешно! Дата: ${dateString}, Время: ${selectedTimeSlot}, Человек: ${numPeople}, Продолжительность: ${durationMinutes} мин. Общая стоимость: ${totalPrice} ₽`);
        populateRegularTimeSlots();
        calculateRegularPrice();
    } else {
        showMessageBox("Извините, выбранное время занято или недостаточно места. Пожалуйста, выберите другое время.");
    }
}

function handleBookBirthday() {
    const name = birthdayNameInput.value.trim();
    const phone = birthdayPhoneInput.value.trim();
    const dateString = birthdayDateInput.value;
    const numPeople = parseInt(birthdayPeopleInput.value);
    const startHour = parseInt(birthdayStartHourInput.value);
    const startMinute = parseInt(birthdayStartMinuteInput.value);
    const endHour = parseInt(birthdayEndHourInput.value);
    const endMinute = parseInt(birthdayEndMinuteInput.value);
    const totalPrice = birthdayTotalPriceSpan.textContent;

    if (!name || !phone || !dateString || !numPeople || isNaN(startHour) || isNaN(startMinute) || isNaN(endHour) || isNaN(endMinute)) {
        showMessageBox("Пожалуйста, заполните все поля для бронирования Дня рождения.");
        return;
    }
    if (!birthdayPhoneInput.checkValidity()) {
        showMessageBox("Пожалуйста, введите номер телефона в формате +79000000000.");
        return;
    }

    const startTime = new Date(`${dateString}T${formatTime(startHour)}:${formatTime(startMinute)}:00`);
    const endTime = new Date(`${dateString}T${formatTime(endHour)}:${formatTime(endMinute)}:00`);
    const durationMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);

    if (durationMinutes < 120) {
        showMessageBox("Минимальная продолжительность для Дня рождения - 2 часа (120 минут).");
        return;
    }
    if (durationMinutes % 30 !== 0) {
        showMessageBox("Продолжительность должна быть кратна 30 минутам.");
        return;
    }

    const isAvailable = checkAvailability(dateString, startHour, startMinute, durationMinutes, numPeople, 'birthday');

    if (isAvailable) {
        bookedSlots.push({
            date: dateString,
            startHour: startHour,
            startMinute: startMinute,
            durationMinutes: durationMinutes,
            people: numPeople,
            type: 'birthday',
            name: name,
            phone: phone
        });
        const message = `<b>Новое бронирование (День рождения):</b>\n` +
                        `Имя: ${name}\n` +
                        `Телефон: ${phone}\n` +
                        `Дата: ${dateString}\n` +
                        `Время: ${formatTime(startHour)}:${formatTime(startMinute)} - ${formatTime(endHour)}:${formatTime(endMinute)}\n` +
                        `Человек: ${numPeople}\n` +
                        `Продолжительность: ${durationMinutes} мин\n` +
                        `Общая стоимость: ${totalPrice} ₽`;
        sendTelegramMessage(message);
        showMessageBox(`Бронирование Дня рождения успешно! Дата: ${dateString}, Время: ${formatTime(startHour)}:${formatTime(startMinute)} - ${formatTime(endHour)}:${formatTime(endMinute)}, Человек: ${numPeople}. Общая стоимость: ${totalPrice} ₽`);
        calculateBirthdayPrice();
    } else {
        showMessageBox("Извините, выбранное время занято для бронирования Дня рождения.");
    }
}

function handleBookGroup() {
    const name = groupNameInput.value.trim();
    const phone = groupPhoneInput.value.trim();
    const dateString = groupDateInput.value;
    const numPeople = parseInt(groupPeopleInput.value);
    const durationMinutes = 60;
    const selectedTimeSlot = groupTimeSlotSelect.value;
    const totalPrice = groupTotalPriceSpan.textContent;

    if (!name || !phone || !dateString || !numPeople || !selectedTimeSlot) {
        showMessageBox("Пожалуйста, заполните все поля для группового бронирования.");
        return;
    }
    if (!groupPhoneInput.checkValidity()) {
        showMessageBox("Пожалуйста, введите номер телефона в формате +79000000000.");
        return;
    }

    if (numPeople < 15) {
        showMessageBox("Минимальное количество человек для группы - 10.");
        return;
    }

    const [startHour, startMinute] = selectedTimeSlot.split(':').map(Number);
    const isAvailable = checkAvailability(dateString, startHour, startMinute, durationMinutes, numPeople, 'group');

    if (isAvailable) {
        bookedSlots.push({
            date: dateString,
            startHour: startHour,
            startMinute: startMinute,
            durationMinutes: durationMinutes,
            people: numPeople,
            type: 'group',
            name: name,
            phone: phone
        });
        const message = `<b>Новое бронирование (Группа):</b>\n` +
                        `Имя: ${name}\n` +
                        `Телефон: ${phone}\n` +
                        `Дата: ${dateString}\n` +
                        `Время: ${selectedTimeSlot}\n` +
                        `Человек: ${numPeople}\n` +
                        `Продолжительность: ${durationMinutes} мин\n` +
                        `Общая стоимость: ${totalPrice} ₽`;
        sendTelegramMessage(message);
        showMessageBox(`Групповое бронирование успешно! Дата: ${dateString}, Время: ${selectedTimeSlot}, Человек: ${numPeople}. Общая стоимость: ${totalPrice} ₽`);
        populateGroupTimeSlots();
        calculateGroupPrice();
    } else {
        showMessageBox("Извините, выбранное время занято или недостаточно места для вашей группы.");
    }
}

function populateRegularTimeSlots() {
    const dateString = regularDateInput.value;
    const durationMinutes = parseInt(document.querySelector('input[name="regular-duration"]:checked').value);
    const numPeople = parseInt(regularPeopleInput.value);
    if (dateString && numPeople && durationMinutes) {
        populateTimeSlots(regularTimeSlotSelect, dateString, durationMinutes, numPeople, 'regular');
    } else {
        regularTimeSlotSelect.innerHTML = '<option value="">Выберите дату, количество человек и продолжительность</option>';
    }
}

function populateGroupTimeSlots() {
    const dateString = groupDateInput.value;
    const numPeople = parseInt(groupPeopleInput.value);
    const durationMinutes = 60;
    if (dateString && numPeople >= 15) {
        populateTimeSlots(groupTimeSlotSelect, dateString, durationMinutes, numPeople, 'group');
    } else {
        groupTimeSlotSelect.innerHTML = '<option value="">Выберите дату и количество человек (от 10)</option>';
    }
}

function createCubes() {
    const colors = ['bg-fuchsia-500', 'bg-cyan-400', 'bg-purple-500', 'bg-pink-500', 'bg-blue-500'];
    const numCubes = 50;

    for (let i = 0; i < numCubes; i++) {
        const cube = document.createElement('div');
        cube.classList.add('cube');

        const size = Math.random() * 8 + 2;
        cube.style.width = `${size}px`;
        cube.style.height = `${size}px`;

        cube.style.top = `${Math.random() * 100}%`;
        cube.style.left = `${Math.random() * 100}%`;

        cube.classList.add(colors[Math.floor(Math.random() * colors.length)]);
        cube.style.animationDelay = `${Math.random() * 3}s`;

        cubesContainer.appendChild(cube);
    }
}

// --- Initial Setup ---
document.addEventListener('DOMContentLoaded', () => {
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    regularDateInput.value = todayString;
    birthdayDateInput.value = todayString;
    groupDateInput.value = todayString;

    populateRegularTimeSlots();
    calculateRegularPrice();

    tabButtons.forEach(button => {
        button.addEventListener('click', handleTabClick);
    });

    // Regular Booking Listeners
    regularNameInput.addEventListener('input', calculateRegularPrice);
    regularPhoneInput.addEventListener('input', calculateRegularPrice);
    regularMinusBtn.addEventListener('click', () => {
        let val = parseInt(regularPeopleInput.value);
        if (val > 1) regularPeopleInput.value = val - 1;
        populateRegularTimeSlots();
        calculateRegularPrice();
    });
    regularPlusBtn.addEventListener('click', () => {
        let val = parseInt(regularPeopleInput.value);
        if (val < 20) regularPeopleInput.value = val + 1;
        populateRegularTimeSlots();
        calculateRegularPrice();
    });
    regularPeopleInput.addEventListener('input', () => {
        let val = parseInt(regularPeopleInput.value);
        if (isNaN(val) || val < 1) regularPeopleInput.value = 1;
        if (val > 20) regularPeopleInput.value = 20;
        populateRegularTimeSlots();
        calculateRegularPrice();
    });
    regularDateInput.addEventListener('change', () => {
        populateRegularTimeSlots();
        calculateRegularPrice();
    });
    regularDurationRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            populateRegularTimeSlots();
            calculateRegularPrice();
        });
    });
    regularTimeSlotSelect.addEventListener('change', calculateRegularPrice);
    bookRegularBtn.addEventListener('click', handleBookRegular);

    // Birthday Booking Listeners
    birthdayNameInput.addEventListener('input', calculateBirthdayPrice);
    birthdayPhoneInput.addEventListener('input', calculateBirthdayPrice);
    birthdayMinusBtn.addEventListener('click', () => {
        let val = parseInt(birthdayPeopleInput.value);
        if (val > 1) birthdayPeopleInput.value = val - 1;
        calculateBirthdayPrice();
    });
    birthdayPlusBtn.addEventListener('click', () => {
        let val = parseInt(birthdayPeopleInput.value);
        if (val < 20) birthdayPeopleInput.value = val + 1;
        calculateBirthdayPrice();
    });
    birthdayPeopleInput.addEventListener('input', () => {
        let val = parseInt(birthdayPeopleInput.value);
        if (isNaN(val) || val < 1) birthdayPeopleInput.value = 1;
        if (val > 20) birthdayPeopleInput.value = 20;
        calculateBirthdayPrice();
    });
    birthdayDateInput.addEventListener('change', calculateBirthdayPrice);
    birthdayStartHourInput.addEventListener('input', calculateBirthdayPrice);
    birthdayStartMinuteInput.addEventListener('input', () => {
        let val = parseInt(birthdayStartMinuteInput.value);
        if (isNaN(val) || val < 0) birthdayStartMinuteInput.value = 0;
        if (val > 59) birthdayStartMinuteInput.value = 59;
        birthdayStartMinuteInput.value = Math.round(val / 30) * 30;
        calculateBirthdayPrice();
    });
    birthdayEndHourInput.addEventListener('input', calculateBirthdayPrice);
    birthdayEndMinuteInput.addEventListener('input', () => {
        let val = parseInt(birthdayEndMinuteInput.value);
        if (isNaN(val) || val < 0) birthdayEndMinuteInput.value = 0;
        if (val > 59) birthdayEndMinuteInput.value = 59;
        birthdayEndMinuteInput.value = Math.round(val / 30) * 30;
        calculateBirthdayPrice();
    });
    bookBirthdayBtn.addEventListener('click', handleBookBirthday);

    // Group Booking Listeners
    groupNameInput.addEventListener('input', calculateGroupPrice);
    groupPhoneInput.addEventListener('input', calculateGroupPrice);
    groupMinusBtn.addEventListener('click', () => {
        let val = parseInt(groupPeopleInput.value);
        if (val > 10) groupPeopleInput.value = val - 1;
        populateGroupTimeSlots();
        calculateGroupPrice();
    });
    groupPlusBtn.addEventListener('click', () => {
        let val = parseInt(groupPeopleInput.value);
        if (val < 100) groupPeopleInput.value = val + 1;
        populateGroupTimeSlots();
        calculateGroupPrice();
    });
    groupPeopleInput.addEventListener('input', () => {
        let val = parseInt(groupPeopleInput.value);
        if (isNaN(val) || val < 10) groupPeopleInput.value = 15;
        if (val > 100) groupPeopleInput.value = 100;
        populateGroupTimeSlots();
        calculateGroupPrice();
    });
    groupDateInput.addEventListener('change', () => {
        populateGroupTimeSlots();
        calculateGroupPrice();
    });
    groupTimeSlotSelect.addEventListener('change', calculateGroupPrice);
    bookGroupBtn.addEventListener('click', handleBookGroup);

    // Message Box Listener
    messageOkButton.addEventListener('click', hideMessageBox);

    // Generate cubes
    createCubes();

    // --- Система лояльности ---
let loyaltyPoints = parseInt(localStorage.getItem('loyaltyPoints')) || 0;
const LOYALTY_THRESHOLD = 100; // 100 баллов = 10% скидка

// Обновление баллов лояльности
function updateLoyaltyPoints(pointsToAdd) {
    loyaltyPoints += pointsToAdd;
    localStorage.setItem('loyaltyPoints', loyaltyPoints.toString());
    updateLoyaltyUI();
}

// Обновление интерфейса лояльности
function updateLoyaltyUI() {
    const loyaltyBar = document.getElementById('loyalty-progress');
    const pointsDisplay = document.getElementById('loyalty-points');
    const discountBadge = document.getElementById('loyalty-discount');
    
    if (loyaltyBar && pointsDisplay) {
        const progressPercent = Math.min((loyaltyPoints / LOYALTY_THRESHOLD) * 100, 100);
        loyaltyBar.style.width = `${progressPercent}%`;
        pointsDisplay.textContent = loyaltyPoints;
        
        // Показываем бейдж скидки, если есть доступная
        if (discountBadge) {
            if (loyaltyPoints >= LOYALTY_THRESHOLD) {
                discountBadge.classList.remove('hidden');
            } else {
                discountBadge.classList.add('hidden');
            }
        }
    }
}

// Применить скидку лояльности
function updateLoyaltyUI() {
  const pointsDisplay = document.getElementById('loyalty-points');
  const progressBar = document.getElementById('loyalty-progress');
  const discountBadge = document.getElementById('loyalty-discount');
  const bookingsDisplay = document.getElementById('client-bookings');
  const lastVisitDisplay = document.getElementById('client-last');
  
  // Обновление баллов
  pointsDisplay.textContent = clientData.points;
  
  // Прогресс бар (каждые 100 баллов)
  const progress = (clientData.points % 100) + '%';
  progressBar.style.width = progress;
  
  // Бейдж скидки (при 100+ баллов)
  if (clientData.points >= 100) {
    discountBadge.classList.remove('hidden');
  } else {
    discountBadge.classList.add('hidden');
  }
  
  // Информация о посещениях
  bookingsDisplay.textContent = clientData.bookings;
  
  // Форматирование даты последнего посещения
  if (clientData.lastVisit) {
    const date = new Date(clientData.lastVisit);
    lastVisitDisplay.textContent = date.toLocaleDateString('ru-RU');
  } else {
    lastVisitDisplay.textContent = 'не было';
  }
}

function applyLoyaltyDiscount(price) {
  if (clientData.points >= 100) {
    // Применяем скидку 10% и списываем 100 баллов
    const discount = price * 0.1;
    clientData.points -= 100;
    return price - discount;
  }
  return price;
}

// Добавить в DOMContentLoaded:
updateLoyaltyUI();
});
