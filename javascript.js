const GAS_URL = 'https://script.google.com/macros/s/AKfycbzyvuyhw4EAU5xWP35fanJ71eyJEbKVxSUwBdx_1sZ2Y8-O3kJ1ouvhokEXj__wZ4jT/exec';
const API_KEY = 'batut-cosmos-api-2025';
const botToken = '7861899004:AAHHUEAolQwwsSXkz7YLddd_qnnxesQIj24';
const chatId = '465087814';

// Глобальные переменные для данных клиента и системы бронирования
let clientData = {
  points: 0,
  bookings: 0,
  lastVisit: null
};

let bookedSlots = [];
const CAPACITY_PER_SLOT = 12;
const LOYALTY_THRESHOLD = 100; // 100 баллов = 10% скидка

// Праздничные дни
const holidays = [
  '2025-01-01', '2025-01-07', '2025-02-23', '2025-03-08',
  '2025-05-01', '2025-05-09', '2025-06-12', '2025-11-04'
];

// --- Система лояльности ---

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
      updateLoyaltyUI();
      return true;
    }
  } catch (error) {
    console.error('Ошибка при получении данных клиента:', error);
  }
  return false;
}

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

    if (!response.ok) {
      throw new Error(`Ошибка сервера: ${response.status}`);
    }
    
    const data = await response.json();
    if (!data.error) {
      clientData = {
        points: data.points || 0,
        bookings: data.bookings || 0,
        lastVisit: data.lastVisit || null
      };
      updateLoyaltyUI();
      return true;
    }
  } catch (error) {
    console.error('Ошибка при обновлении данных клиента:', error);
  }
  return false;
}

function updateLoyaltyUI() {
  const pointsDisplay = document.getElementById('loyalty-points');
  const progressBar = document.getElementById('loyalty-progress');
  const discountBadge = document.getElementById('loyalty-discount');
  
  if (pointsDisplay && progressBar) {
    pointsDisplay.textContent = clientData.points;
    const progressPercent = Math.min((clientData.points % LOYALTY_THRESHOLD) / LOYALTY_THRESHOLD * 100, 100);
    progressBar.style.width = `${progressPercent}%`;
    
    if (discountBadge) {
      if (clientData.points >= LOYALTY_THRESHOLD) {
        discountBadge.classList.remove('hidden');
      } else {
        discountBadge.classList.add('hidden');
      }
    }
  }
}

function applyLoyaltyDiscount(price) {
  if (clientData.points >= LOYALTY_THRESHOLD) {
    const discount = Math.floor(price * 0.1);
    return { discountedPrice: price - discount, discountApplied: discount };
  }
  return { discountedPrice: price, discountApplied: 0 };
}

// --- Утилиты ---

function formatTime(num) {
  return num < 10 ? '0' + num : '' + num;
}

function showMessageBox(message) {
  const messageBox = document.getElementById('message-box');
  const messageText = document.getElementById('message-text');
  
  if (messageBox && messageText) {
    messageText.textContent = message;
    messageBox.classList.remove('hidden');
  }
}

function hideMessageBox() {
  const messageBox = document.getElementById('message-box');
  if (messageBox) {
    messageBox.classList.add('hidden');
  }
}

function getDayType(dateString) {
  const date = new Date(dateString + 'T00:00:00');
  const dayOfWeek = date.getDay();

  if (holidays.includes(dateString)) return 'weekend_holiday';
  if (dayOfWeek === 0 || dayOfWeek === 6) return 'weekend_holiday';
  if (dayOfWeek === 1 || dayOfWeek === 4) return 'monday_thursday';
  return 'other_weekday';
}

function getBasePrice(durationMinutes, dayType) {
  const prices = {
    monday_thursday: { 30: 350, 60: 350, 120: 350 },
    other_weekday: { 30: 300, 60: 500, 120: 800 },
    weekend_holiday: { 30: 400, 60: 600, 120: 1000 }
  };
  
  return prices[dayType]?.[durationMinutes] || 0;
}

// --- Бронирование ---

function checkAvailability(dateString, startHour, startMinute, durationMinutes, newPeople, bookingType) {
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
      if (slotPeople + newPeople > CAPACITY_PER_SLOT) {
        return false;
      }
    }
  }
  
  return true;
}

function populateTimeSlots(selectElement, dateString, durationMinutes, numPeople, bookingType) {
  if (!selectElement) return;

  selectElement.innerHTML = '';
  const now = new Date();
  const todayString = now.toISOString().split('T')[0];
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  let hasAvailableSlots = false;

  for (let hour = 10; hour < 22; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const slotEndHour = hour + Math.floor((minute + durationMinutes) / 60);
      const slotEndMinute = (minute + durationMinutes) % 60;

      if (slotEndHour > 22 || (slotEndHour === 22 && slotEndMinute > 0)) continue;
      if (dateString === todayString && (hour < currentHour || (hour === currentHour && minute <= currentMinute))) continue;

      const isAvailable = checkAvailability(dateString, hour, minute, durationMinutes, numPeople, bookingType);
      const option = document.createElement('option');
      option.value = `${hour}:${minute}`;
      option.textContent = `${formatTime(hour)}:${formatTime(minute)} - ${formatTime(slotEndHour)}:${formatTime(slotEndMinute)}`;

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

  if (!hasAvailableSlots) {
    const noSlotsOption = document.createElement('option');
    noSlotsOption.textContent = "Нет доступных слотов на выбранную дату.";
    noSlotsOption.disabled = true;
    selectElement.appendChild(noSlotsOption);
    selectElement.value = '';
  }
}

// --- Обработчики бронирования ---

async function handleBookRegular() {
  const name = document.getElementById('regular-name')?.value.trim();
  const phone = document.getElementById('regular-phone')?.value.trim();
  const dateString = document.getElementById('regular-date')?.value;
  const numPeople = parseInt(document.getElementById('regular-people')?.value || 0);
  const durationMinutes = parseInt(document.querySelector('input[name="regular-duration"]:checked')?.value || 0);
  const selectedTimeSlot = document.getElementById('regular-time-slot')?.value;
  const totalPriceElement = document.getElementById('regular-total-price');

  if (!name || !phone || !dateString || numPeople < 1 || durationMinutes < 1 || !selectedTimeSlot || !totalPriceElement) {
    showMessageBox("Пожалуйста, заполните все поля для бронирования.");
    return;
  }

  const totalPrice = parseInt(totalPriceElement.textContent) || 0;
  const [startHour, startMinute] = selectedTimeSlot.split(':').map(Number);
  
  if (!checkAvailability(dateString, startHour, startMinute, durationMinutes, numPeople, 'regular')) {
    showMessageBox("Извините, выбранное время занято. Пожалуйста, выберите другое время.");
    return;
  }

  // Начисление баллов (10 баллов за каждые 100 рублей)
  const pointsToAdd = Math.floor(totalPrice / 100) * 10;
  const updateSuccess = await updateClientData(phone, name, pointsToAdd, 'regular', totalPrice);

  if (updateSuccess) {
    bookedSlots.push({
      date: dateString,
      startHour,
      startMinute,
      durationMinutes,
      people: numPeople,
      type: 'regular',
      name,
      phone
    });

    const message = `<b>Новое бронирование (Разовое):</b>\n` +
                   `Имя: ${name}\nТелефон: ${phone}\n` +
                   `Дата: ${dateString}\nВремя: ${selectedTimeSlot}\n` +
                   `Людей: ${numPeople}\nДлительность: ${durationMinutes} мин\n` +
                   `Сумма: ${totalPrice} ₽\nНачислено баллов: ${pointsToAdd}`;
    
    await sendTelegramMessage(message);
    showMessageBox(`Бронирование успешно! Начислено ${pointsToAdd} баллов.`);
    
    // Обновляем интерфейс
    populateTimeSlots(document.getElementById('regular-time-slot'), dateString, durationMinutes, numPeople, 'regular');
  } else {
    showMessageBox("Бронирование выполнено, но возникла ошибка при начислении баллов.");
  }
}

async function handleBookBirthday() {
  const name = document.getElementById('birthday-name')?.value.trim();
  const phone = document.getElementById('birthday-phone')?.value.trim();
  const isHonoree = document.getElementById('birthday-is-honoree')?.checked;
  const dateString = document.getElementById('birthday-date')?.value;
  const numPeople = parseInt(document.getElementById('birthday-people')?.value || 0);
  const startHour = parseInt(document.getElementById('birthday-start-hour')?.value || 0);
  const startMinute = parseInt(document.getElementById('birthday-start-minute')?.value || 0);
  const endHour = parseInt(document.getElementById('birthday-end-hour')?.value || 0);
  const endMinute = parseInt(document.getElementById('birthday-end-minute')?.value || 0);

  if (!name || !phone || !dateString || numPeople < 1 || isNaN(startHour) || isNaN(startMinute) || isNaN(endHour) || isNaN(endMinute)) {
    showMessageBox("Пожалуйста, заполните все поля для бронирования.");
    return;
  }

  const durationMinutes = (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
  if (durationMinutes <= 0) {
    showMessageBox("Время окончания должно быть позже времени начала.");
    return;
  }

  if (!checkAvailability(dateString, startHour, startMinute, durationMinutes, numPeople, 'birthday')) {
    showMessageBox("Извините, выбранное время занято. Пожалуйста, выберите другое время.");
    return;
  }

  const dayType = getDayType(dateString);
  const basePrice = getBasePrice(60, dayType) * (isHonoree ? numPeople - 1 : numPeople);
  const { discountedPrice } = applyLoyaltyDiscount(basePrice);

  // Начисление баллов (10 баллов за каждые 100 рублей)
  const pointsToAdd = Math.floor(discountedPrice / 100) * 10;
  const updateSuccess = await updateClientData(phone, name, pointsToAdd, 'birthday', discountedPrice);

  if (updateSuccess) {
    bookedSlots.push({
      date: dateString,
      startHour,
      startMinute,
      durationMinutes,
      people: numPeople,
      type: 'birthday',
      name,
      phone
    });

    const message = `<b>Новое бронирование (День рождения):</b>\n` +
                   `Имя: ${name}\nТелефон: ${phone}\n` +
                   `Дата: ${dateString}\nВремя: ${formatTime(startHour)}:${formatTime(startMinute)}-${formatTime(endHour)}:${formatTime(endMinute)}\n` +
                   `Людей: ${numPeople}\nИменинник: ${isHonoree ? 'Да' : 'Нет'}\n` +
                   `Длительность: ${durationMinutes} мин\nСумма: ${discountedPrice} ₽\n` +
                   `Начислено баллов: ${pointsToAdd}`;
    
    await sendTelegramMessage(message);
    showMessageBox(`Бронирование на день рождения успешно! Начислено ${pointsToAdd} баллов.`);
  } else {
    showMessageBox("Бронирование выполнено, но возникла ошибка при начислении баллов.");
  }
}

async function handleBookGroup() {
  const name = document.getElementById('group-name')?.value.trim();
  const phone = document.getElementById('group-phone')?.value.trim();
  const dateString = document.getElementById('group-date')?.value;
  const numPeople = parseInt(document.getElementById('group-people')?.value || 0);
  const selectedTimeSlot = document.getElementById('group-time-slot')?.value;
  const totalPriceElement = document.getElementById('group-total-price');

  if (!name || !phone || !dateString || numPeople < 15 || !selectedTimeSlot || !totalPriceElement) {
    showMessageBox("Пожалуйста, заполните все поля для бронирования (минимум 15 человек).");
    return;
  }

  const totalPrice = parseInt(totalPriceElement.textContent) || 0;
  const [startHour, startMinute] = selectedTimeSlot.split(':').map(Number);
  const durationMinutes = 60; // Фиксированная длительность для групповых бронирований
  
  if (!checkAvailability(dateString, startHour, startMinute, durationMinutes, numPeople, 'group')) {
    showMessageBox("Извините, выбранное время занято. Пожалуйста, выберите другое время.");
    return;
  }

  // Начисление баллов (10 баллов за каждые 100 рублей)
  const pointsToAdd = Math.floor(totalPrice / 100) * 10;
  const updateSuccess = await updateClientData(phone, name, pointsToAdd, 'group', totalPrice);

  if (updateSuccess) {
    bookedSlots.push({
      date: dateString,
      startHour,
      startMinute,
      durationMinutes,
      people: numPeople,
      type: 'group',
      name,
      phone
    });

    const message = `<b>Новое бронирование (Групповое):</b>\n` +
                   `Имя: ${name}\nТелефон: ${phone}\n` +
                   `Дата: ${dateString}\nВремя: ${selectedTimeSlot}\n` +
                   `Людей: ${numPeople}\nДлительность: ${durationMinutes} мин\n` +
                   `Сумма: ${totalPrice} ₽\nНачислено баллов: ${pointsToAdd}`;
    
    await sendTelegramMessage(message);
    showMessageBox(`Групповое бронирование успешно! Начислено ${pointsToAdd} баллов.`);
    
    // Обновляем интерфейс
    populateTimeSlots(document.getElementById('group-time-slot'), dateString, durationMinutes, numPeople, 'group');
  } else {
    showMessageBox("Бронирование выполнено, но возникла ошибка при начислении баллов.");
  }
}

// --- Инициализация ---

document.addEventListener('DOMContentLoaded', () => {
  // Инициализация дат
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('regular-date').value = today;
  document.getElementById('birthday-date').value = today;
  document.getElementById('group-date').value = today;

  // Инициализация системы лояльности
  updateLoyaltyUI();

  // Обработчики вкладок
  document.getElementById('tab-regular').addEventListener('click', () => {
    document.getElementById('regular-booking').classList.remove('hidden');
    document.getElementById('birthday-booking').classList.add('hidden');
    document.getElementById('group-booking').classList.add('hidden');
    document.getElementById('tab-regular').classList.add('active');
    document.getElementById('tab-birthday').classList.remove('active');
    document.getElementById('tab-group').classList.remove('active');
  });

  document.getElementById('tab-birthday').addEventListener('click', () => {
    document.getElementById('regular-booking').classList.add('hidden');
    document.getElementById('birthday-booking').classList.remove('hidden');
    document.getElementById('group-booking').classList.add('hidden');
    document.getElementById('tab-regular').classList.remove('active');
    document.getElementById('tab-birthday').classList.add('active');
    document.getElementById('tab-group').classList.remove('active');
  });

  document.getElementById('tab-group').addEventListener('click', () => {
    document.getElementById('regular-booking').classList.add('hidden');
    document.getElementById('birthday-booking').classList.add('hidden');
    document.getElementById('group-booking').classList.remove('hidden');
    document.getElementById('tab-regular').classList.remove('active');
    document.getElementById('tab-birthday').classList.remove('active');
    document.getElementById('tab-group').classList.add('active');
  });

  // Обработчики кнопок бронирования
  document.getElementById('book-regular').addEventListener('click', handleBookRegular);
  document.getElementById('book-birthday').addEventListener('click', handleBookBirthday);
  document.getElementById('book-group').addEventListener('click', handleBookGroup);

  // Обработчик кнопки OK в сообщении
  document.getElementById('message-ok-button').addEventListener('click', hideMessageBox);

  // Обработчики изменения количества людей
  document.getElementById('regular-minus').addEventListener('click', () => {
    const input = document.getElementById('regular-people');
    if (input && parseInt(input.value) > 1) {
      input.value = parseInt(input.value) - 1;
      updateRegularPrice();
    }
  });

  document.getElementById('regular-plus').addEventListener('click', () => {
    const input = document.getElementById('regular-people');
    if (input && parseInt(input.value) < 20) {
      input.value = parseInt(input.value) + 1;
      updateRegularPrice();
    }
  });

  document.getElementById('birthday-minus').addEventListener('click', () => {
    const input = document.getElementById('birthday-people');
    if (input && parseInt(input.value) > 1) {
      input.value = parseInt(input.value) - 1;
      updateBirthdayPrice();
    }
  });

  document.getElementById('birthday-plus').addEventListener('click', () => {
    const input = document.getElementById('birthday-people');
    if (input && parseInt(input.value) < 20) {
      input.value = parseInt(input.value) + 1;
      updateBirthdayPrice();
    }
  });

  document.getElementById('group-minus').addEventListener('click', () => {
    const input = document.getElementById('group-people');
    if (input && parseInt(input.value) > 15) {
      input.value = parseInt(input.value) - 1;
      updateGroupPrice();
    }
  });

  document.getElementById('group-plus').addEventListener('click', () => {
    const input = document.getElementById('group-people');
    if (input && parseInt(input.value) < 100) {
      input.value = parseInt(input.value) + 1;
      updateGroupPrice();
    }
  });

  // Обработчики изменения даты
  document.getElementById('regular-date').addEventListener('change', function() {
    const duration = parseInt(document.querySelector('input[name="regular-duration"]:checked')?.value || 0);
    const people = parseInt(document.getElementById('regular-people')?.value || 1);
    populateTimeSlots(document.getElementById('regular-time-slot'), this.value, duration, people, 'regular');
    updateRegularPrice();
  });

  document.getElementById('birthday-date').addEventListener('change', updateBirthdayPrice);
  document.getElementById('group-date').addEventListener('change', function() {
    populateTimeSlots(document.getElementById('group-time-slot'), this.value, 60, parseInt(document.getElementById('group-people')?.value || 15), 'group');
    updateGroupPrice();
  });

  // Обработчики изменения длительности
  document.querySelectorAll('input[name="regular-duration"]').forEach(radio => {
    radio.addEventListener('change', function() {
      const date = document.getElementById('regular-date')?.value;
      const people = parseInt(document.getElementById('regular-people')?.value || 1);
      if (date) {
        populateTimeSlots(document.getElementById('regular-time-slot'), date, parseInt(this.value), people, 'regular');
        updateRegularPrice();
      }
    });
  });

  // Обработчики изменения времени для дня рождения
  document.getElementById('birthday-start-hour').addEventListener('change', updateBirthdayPrice);
  document.getElementById('birthday-start-minute').addEventListener('change', updateBirthdayPrice);
  document.getElementById('birthday-end-hour').addEventListener('change', updateBirthdayPrice);
  document.getElementById('birthday-end-minute').addEventListener('change', updateBirthdayPrice);
  document.getElementById('birthday-is-honoree').addEventListener('change', updateBirthdayPrice);

  // Обработчики изменения времени для группового бронирования
  document.getElementById('group-time-slot').addEventListener('change', updateGroupPrice);

  // Функции обновления цен
  function updateRegularPrice() {
    const dateString = document.getElementById('regular-date')?.value;
    const numPeople = parseInt(document.getElementById('regular-people')?.value || 1);
    const durationMinutes = parseInt(document.querySelector('input[name="regular-duration"]:checked')?.value || 0);
    const totalPriceElement = document.getElementById('regular-total-price');

    if (!dateString || !totalPriceElement) return;

    const dayType = getDayType(dateString);
    const basePrice = getBasePrice(durationMinutes, dayType) * numPeople;
    const { discountedPrice } = applyLoyaltyDiscount(basePrice);

    totalPriceElement.textContent = discountedPrice;
  }

  function updateBirthdayPrice() {
    const dateString = document.getElementById('birthday-date')?.value;
    const numPeople = parseInt(document.getElementById('birthday-people')?.value || 1);
    const isHonoree = document.getElementById('birthday-is-honoree')?.checked;
    const startHour = parseInt(document.getElementById('birthday-start-hour')?.value || 0);
    const startMinute = parseInt(document.getElementById('birthday-start-minute')?.value || 0);
    const endHour = parseInt(document.getElementById('birthday-end-hour')?.value || 0);
    const endMinute = parseInt(document.getElementById('birthday-end-minute')?.value || 0);
    const totalPriceElement = document.getElementById('birthday-total-price');

    if (!dateString || !totalPriceElement) return;

    const durationMinutes = (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
    if (durationMinutes <= 0) {
      document.getElementById('birthday-duration-message').textContent = "Время окончания должно быть позже времени начала.";
      document.getElementById('birthday-duration-message').classList.remove('hidden');
      return;
    } else {
      document.getElementById('birthday-duration-message').classList.add('hidden');
    }

    const dayType = getDayType(dateString);
    const basePrice = getBasePrice(60, dayType) * (isHonoree ? numPeople - 1 : numPeople);
    const { discountedPrice } = applyLoyaltyDiscount(basePrice);

    totalPriceElement.textContent = discountedPrice;
  }

  function updateGroupPrice() {
    const dateString = document.getElementById('group-date')?.value;
    const numPeople = parseInt(document.getElementById('group-people')?.value || 15);
    const totalPriceElement = document.getElementById('group-total-price');

    if (!dateString || !totalPriceElement) return;

    const dayType = getDayType(dateString);
    const basePrice = getBasePrice(60, dayType) * numPeople * 0.9; // 10% скидка для групп
    const { discountedPrice } = applyLoyaltyDiscount(basePrice);

    totalPriceElement.textContent = discountedPrice;
  }

  // Инициализация цен
  updateRegularPrice();
  updateBirthdayPrice();
  updateGroupPrice();
});

// --- Telegram интеграция ---

async function sendTelegramMessage(message) {
  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
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

// Анимация кубов
function createCubes() {
  const container = document.getElementById('cubes-container');
  if (!container) return;

  const cubeCount = 20;
  for (let i = 0; i < cubeCount; i++) {
    const cube = document.createElement('div');
    cube.classList.add('cube');
    
    // Случайные параметры для куба
    const size = Math.random() * 20 + 5;
    const posX = Math.random() * 100;
    const posY = Math.random() * 100;
    const delay = Math.random() * 5;
    const duration = Math.random() * 5 + 5;
    
    cube.style.width = `${size}px`;
    cube.style.height = `${size}px`;
    cube.style.left = `${posX}%`;
    cube.style.top = `${posY}%`;
    cube.style.animationDelay = `${delay}s`;
    cube.style.animationDuration = `${duration}s`;
    cube.style.backgroundColor = `hsl(${Math.random() * 360}, 70%, 60%)`;
    
    container.appendChild(cube);
  }
}

// Инициализация анимации кубов при загрузке
window.addEventListener('load', createCubes);
