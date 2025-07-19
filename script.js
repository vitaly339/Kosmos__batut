// --- DOM Elements ---
const tabButtons = document.querySelectorAll('.tab-button');
const bookingSections = document.querySelectorAll('.booking-section');

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

// Admin Panel Elements
const adminToggleBtn = document.getElementById('admin-toggle');
const adminPanel = document.getElementById('admin-panel');
const closeAdminBtn = document.getElementById('close-admin');
const syncBookingsBtn = document.getElementById('sync-bookings');
const clearTestBtn = document.getElementById('clear-test-btn');
const bookingsList = document.getElementById('bookings-list');
const adminPasswordInput = document.getElementById('admin-password');
const adminLinkDiv = document.getElementById('admin-link');

// Old Booking Form Elements (from the bottom of the original HTML)
const oldBookingForm = document.getElementById('booking-form-old');
const oldNameInput = document.getElementById('name-old');
const oldPhoneInput = document.getElementById('phone-old');
const oldDatetimeInput = document.getElementById('datetime-old');


// --- Telegram Bot Configuration ---
const botToken = '7861899004:AAHHUEAolQwwsSXkz7YLddd_qnnxesQIj24';
const chatId = '465087814';

// --- Global State ---
// Stores booked slots. In a real app, this would be fetched from a backend.
// Structure: { date: 'YYYY-MM-DD', startHour: H, startMinute: M, durationMinutes: D, people: N, type: 'regular' | 'birthday' | 'group', name: 'N', phone: 'P' }
let bookedSlots = [];

// Define holidays for price calculation (example for 2025)
const holidays = [
    '2025-01-01', // Новый год
    '2025-01-07', // Рождество
    '2025-02-23', // День защитника Отечества
    '2025-03-08', // Международный женский день
    '2025-05-01', // Праздник Весны и Труда
    '2025-05-09', // День Победы
    '2025-06-12', // День России
    '2025-11-04'  // День народного единства
];

const CAPACITY_PER_SLOT = 12; // Max people per 30-min segment for regular bookings

// --- Utility Functions ---

/**
 * Displays a custom message box.
 * @param {string} message - The message to display.
 */
function showMessageBox(message) {
    messageText.textContent = message;
    messageBox.classList.remove('hidden');
}

/**
 * Hides the custom message box.
 */
function hideMessageBox() {
    messageBox.classList.add('hidden');
}

/**
 * Formats a number to always have two digits (e.g., 5 -> "05").
 * @param {number} num - The number to format.
 * @returns {string} The formatted string.
 */
function formatTime(num) {
    return num < 10 ? '0' + num : '' + num;
}

/**
 * Sends a message to the configured Telegram chat.
 * @param {string} message - The text message to send.
 */
async function sendTelegramMessage(message) {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const params = {
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML' // Use HTML for basic formatting like bold
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

/**
 * Calculates the day type (weekday, weekend, holiday) for pricing.
 * @param {string} dateString - Date in 'YYYY-MM-DD' format.
 * @returns {'monday_thursday' | 'other_weekday' | 'weekend_holiday'}
 */
function getDayType(dateString) {
    const date = new Date(dateString + 'T00:00:00'); // Add T00:00:00 to avoid timezone issues
    const dayOfWeek = date.getDay(); // 0 for Sunday, 1 for Monday, ..., 6 for Saturday

    if (holidays.includes(dateString)) {
        return 'weekend_holiday';
    }
    if (dayOfWeek === 0 || dayOfWeek === 6) { // Sunday or Saturday
        return 'weekend_holiday';
    }
    if (dayOfWeek === 1 || dayOfWeek === 4) { // Monday or Thursday
        return 'monday_thursday';
    }
    return 'other_weekday'; // Tuesday, Wednesday, Friday
}

/**
 * Calculates the base price per person for a given duration and day type.
 * @param {number} durationMinutes - Duration in minutes (30, 60, 120).
 * @param {'monday_thursday' | 'other_weekday' | 'weekend_holiday'} dayType - Type of day.
 * @returns {number} Price per person.
 */
function getBasePrice(durationMinutes, dayType) {
    // Corrected pricing logic based on common practices for duration.
    // Assuming 'monday_thursday' is a special discount, applied if duration is 60 minutes.
    // If you have different prices for 30/120 on Mon/Thu, adjust this.
    if (dayType === 'monday_thursday') {
        if (durationMinutes === 30) return 300; // Example, adjust if needed
        if (durationMinutes === 60) return 350;
        if (durationMinutes === 120) return 600; // Example, adjust if needed
    } else if (dayType === 'other_weekday') {
        if (durationMinutes === 30) return 300;
        if (durationMinutes === 60) return 500;
        if (durationMinutes === 120) return 800;
    } else if (dayType === 'weekend_holiday') {
        if (durationMinutes === 30) return 400;
        if (durationMinutes === 60) return 600;
        if (durationMinutes === 120) return 1000;
    }
    return 0; // Should not happen
}

/**
 * Populates the time slot dropdown for regular and group bookings.
 * @param {HTMLSelectElement} selectElement - The select element to populate.
 * @param {string} dateString - The selected date.
 * @param {number} durationMinutes - The selected duration (e.g., 60 for 1 hour).
 * @param {number} numPeople - The number of people for the booking.
 * @param {string} bookingType - 'regular' or 'group'.
 */
function populateTimeSlots(selectElement, dateString, durationMinutes, numPeople, bookingType) {
    selectElement.innerHTML = ''; // Clear previous options
    const now = new Date();
    const todayString = now.toISOString().split('T')[0];
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    let hasAvailableSlots = false;

    for (let hour = 10; hour < 22; hour++) { // Park operating hours: 10:00 to 21:00 (last booking starts at 21:00 for 60 min, ends 22:00)
        for (let minute = 0; minute < 60; minute += 30) {
            const slotStartHour = hour;
            const slotStartMinute = minute;
            const slotEndHour = hour + Math.floor((minute + durationMinutes) / 60);
            const slotEndMinute = (minute + durationMinutes) % 60;

            // Ensure the slot ends within operating hours (e.g., before 22:00 for last full hour)
            if (slotEndHour > 22 || (slotEndHour === 22 && slotEndMinute > 0)) {
                continue;
            }

            // Don't show past slots for today
            if (dateString === todayString &&
                (slotStartHour < currentHour || (slotStartHour === currentHour && slotStartMinute <= currentMinute))) {
                continue;
            }

            const slotStartTime = `${formatTime(slotStartHour)}:${formatTime(slotStartMinute)}`;
            const slotEndTime = `${formatTime(slotEndHour)}:${formatTime(slotEndMinute)}`;

            // Check availability for this specific slot
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
        selectElement.value = ''; // Clear selection
    } else if (selectElement.options.length === 0) {
         const noSlotsOption = document.createElement('option');
        noSlotsOption.textContent = "Нет доступных слотов.";
        noSlotsOption.disabled = true;
        selectElement.appendChild(noSlotsOption);
        selectElement.value = ''; // Clear selection
    } else {
        selectElement.value = selectElement.options[0].value; // Select the first available slot
    }
}

/**
 * Checks if a given time slot is available for a new booking.
 * Capacity is 12 people per 30-minute segment.
 * @param {string} dateString - Date in 'YYYY-MM-DD' format.
 * @param {number} startHour - Start hour of the new booking.
 * @param {number} startMinute - Start minute of the new booking.
 * @param {number} durationMinutes - Duration of the new booking.
 * @param {number} newPeople - Number of people for the new booking.
 * @param {string} bookingType - 'regular' | 'birthday' | 'group'.
 * @returns {boolean} True if available, false otherwise.
 */
function checkAvailability(dateString, startHour, startMinute, durationMinutes, newPeople, bookingType) {
    const newBookingStart = new Date(`${dateString}T${formatTime(startHour)}:${formatTime(startMinute)}:00`);
    const newBookingEnd = new Date(newBookingStart.getTime() + durationMinutes * 60 * 1000);

    // Filter booked slots for the specific date
    const relevantBookedSlots = bookedSlots.filter(slot => slot.date === dateString);

    // If the new booking is a birthday or group (exclusive types)
    if (bookingType === 'birthday' || bookingType === 'group') {
        // Check for any full overlaps with ANY existing bookings (regular, birthday, or group)
        // Exclusive bookings typically require the entire park or a dedicated large area,
        // so any overlap with another booking (even regular) makes the slot unavailable for them.
        for (const slot of relevantBookedSlots) {
            const existingStart = new Date(`${slot.date}T${formatTime(slot.startHour)}:${formatTime(slot.startMinute)}:00`);
            const existingEnd = new Date(existingStart.getTime() + slot.durationMinutes * 60 * 1000);

            // Check for overlap: [start1, end1) overlaps with [start2, end2) if start1 < end2 AND start2 < end1
            if (newBookingStart < existingEnd && existingStart < newBookingEnd) {
                return false; // Overlap detected with any existing booking
            }
        }
        return true; // No overlaps with any existing bookings for this exclusive type
    }

    // If the new booking is a regular type
    // We need to check capacity for each 30-minute segment within the new regular booking's duration.
    const segmentStart = new Date(newBookingStart);
    while (segmentStart < newBookingEnd) {
        const segmentEnd = new Date(segmentStart.getTime() + 30 * 60 * 1000); // Current 30-min segment

        let peopleInSegment = 0;
        for (const slot of relevantBookedSlots) {
            const existingStart = new Date(`${slot.date}T${formatTime(slot.startHour)}:${formatTime(slot.startMinute)}:00`);
            const existingEnd = new Date(existingStart.getTime() + slot.durationMinutes * 60 * 1000);

            // Check if the existing booking overlaps with the current 30-min segment
            if (segmentStart < existingEnd && existingStart < segmentEnd) {
                // If an exclusive booking (birthday/group) overlaps with this segment,
                // it means this segment is completely unavailable for regular bookings.
                if (slot.type === 'birthday' || slot.type === 'group') {
                    return false; // Exclusive booking occupies this segment fully
                } else {
                    peopleInSegment += slot.people;
                }
            }
        }

        if (peopleInSegment + newPeople > CAPACITY_PER_SLOT) {
            return false; // Capacity exceeded for this 30-min segment
        }
        segmentStart.setTime(segmentEnd.getTime()); // Move to the next 30-min segment
    }

    return true; // All segments are available
}

// --- Calculation Functions ---

/**
 * Calculates the total price for a regular booking.
 */
function calculateRegularPrice() {
    const dateString = regularDateInput.value;
    const numPeople = parseInt(regularPeopleInput.value);
    const durationRadio = document.querySelector('input[name="regular-duration"]:checked');
    const durationMinutes = durationRadio ? parseInt(durationRadio.value) : 0; // Default to 0 if none selected
    const selectedTimeSlot = regularTimeSlotSelect.value;

    if (!dateString || isNaN(numPeople) || numPeople < 1 || !durationMinutes || !selectedTimeSlot) {
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

    // Check availability for the selected slot and update message
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

/**
 * Calculates the total price for a birthday booking.
 */
function calculateBirthdayPrice() {
    const dateString = birthdayDateInput.value;
    const numPeople = parseInt(birthdayPeopleInput.value);
    const startHour = parseInt(birthdayStartHourInput.value);
    const startMinute = parseInt(birthdayStartMinuteInput.value);
    const endHour = parseInt(birthdayEndHourInput.value);
    const endMinute = parseInt(birthdayEndMinuteInput.value);

    birthdayDurationMessage.classList.add('hidden');
    birthdayAvailabilityMessage.classList.add('hidden');
    bookBirthdayBtn.disabled = true;
    bookBirthdayBtn.classList.add('opacity-50', 'cursor-not-allowed');

    if (!dateString || isNaN(numPeople) || numPeople < 1 || isNaN(startHour) || isNaN(startMinute) || isNaN(endHour) || isNaN(endMinute)) {
        birthdayTotalPriceSpan.textContent = '0';
        return;
    }

    const startTime = new Date(`${dateString}T${formatTime(startHour)}:${formatTime(startMinute)}:00`);
    const endTime = new Date(`${dateString}T${formatTime(endHour)}:${formatTime(endMinute)}:00`);

    if (endTime <= startTime) {
        birthdayDurationMessage.textContent = "Время окончания должно быть позже времени начала.";
        birthdayDurationMessage.classList.remove('hidden');
        birthdayTotalPriceSpan.textContent = '0';
        return;
    }

    const durationMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);

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

    const dayType = getDayType(dateString);
    // Birthday pricing can be fixed or scaled. Assuming a base for 2 hours and then scale.
    // Example: Fixed price for birthday events, regardless of people or scaling by duration.
    // Let's assume a fixed base price for a 2-hour birthday, and add per additional 30 mins.
    const baseBirthdayPricePer2Hours = (dayType === 'weekend_holiday') ? 5000 : 4000; // Example prices
    const pricePerExtra30Mins = (dayType === 'weekend_holiday') ? 1000 : 800; // Example for additional 30 mins
    
    let totalPrice = baseBirthdayPricePer2Hours;
    if (durationMinutes > 120) {
        totalPrice += ((durationMinutes - 120) / 30) * pricePerExtra30Mins;
    }
    // Consider adding a per-person charge or a flat fee for the party.
    // For simplicity, let's keep it based on duration and a flat rate.
    // If it's truly "per person", you need to define that pricing.
    // For now, I'll assume the total price is for the event, not per person.
    
    // If it's a fixed per-person rate for birthdays (e.g., higher than regular)
    const birthdayPricePerPerson = (dayType === 'weekend_holiday') ? 600 : 500; // Example higher rate for birthdays
    totalPrice = birthdayPricePerPerson * numPeople * (durationMinutes / 60); // Price per hour per person

    birthdayTotalPriceSpan.textContent = totalPrice;

    // Check availability for birthday booking
    const isAvailable = checkAvailability(dateString, startHour, startMinute, durationMinutes, numPeople, 'birthday');
    if (!isAvailable) {
        birthdayAvailabilityMessage.textContent = "Это время занято для бронирования Дня рождения.";
        birthdayAvailabilityMessage.classList.remove('hidden');
    } else {
        bookBirthdayBtn.disabled = false;
        bookBirthdayBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    }
}

/**
 * Calculates the total price for a group booking.
 */
function calculateGroupPrice() {
    const dateString = groupDateInput.value;
    const numPeople = parseInt(groupPeopleInput.value);
    const durationMinutes = 60; // Fixed to 1 hour for group bookings
    const selectedTimeSlot = groupTimeSlotSelect.value;

    if (!dateString || isNaN(numPeople) || numPeople < 15 || !selectedTimeSlot) {
        groupTotalPriceSpan.textContent = '0';
        groupAvailabilityMessage.classList.add('hidden');
        bookGroupBtn.disabled = true;
        bookGroupBtn.classList.add('opacity-50', 'cursor-not-allowed');
        return;
    }

    if (numPeople < 15) {
        groupTotalPriceSpan.textContent = '0';
        groupAvailabilityMessage.textContent = "Минимальное количество человек для группы - 15.";
        groupAvailabilityMessage.classList.remove('hidden');
        bookGroupBtn.disabled = true;
        bookGroupBtn.classList.add('opacity-50', 'cursor-not-allowed');
        return;
    }

    const dayType = getDayType(dateString);
    const standardPricePerPerson = getBasePrice(durationMinutes, dayType);
    const discountedPricePerPerson = standardPricePerPerson - 50; // Apply discount
    const totalPrice = discountedPricePerPerson * numPeople;

    groupTotalPriceSpan.textContent = totalPrice;

    // Check availability for the selected slot and update message
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

/**
 * Handles tab switching.
 * @param {Event} event - The click event.
 */
function handleTabClick(event) {
    tabButtons.forEach(button => {
        button.classList.remove('active', 'bg-purple-700', 'hover:bg-purple-800', 'text-white', 'shadow-md');
        button.classList.add('bg-gray-700', 'hover:bg-gray-600', 'text-gray-200');
    });
    event.target.classList.add('active', 'bg-purple-700', 'hover:bg-purple-800', 'text-white', 'shadow-md');
    event.target.classList.remove('bg-gray-700', 'hover:bg-gray-600', 'text-gray-200');

    bookingSections.forEach(section => section.classList.add('hidden'));
    document.getElementById(event.target.id.replace('tab-', '') + '-booking').classList.remove('hidden');

    // Trigger initial calculation/population for the active tab
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

/**
 * Handles booking for regular visits.
 */
function handleBookRegular() {
    const name = regularNameInput.value.trim();
    const phone = regularPhoneInput.value.trim();
    const dateString = regularDateInput.value;
    const numPeople = parseInt(regularPeopleInput.value);
    const durationRadio = document.querySelector('input[name="regular-duration"]:checked');
    const durationMinutes = durationRadio ? parseInt(durationRadio.value) : 0;
    const selectedTimeSlot = regularTimeSlotSelect.value;
    const totalPrice = regularTotalPriceSpan.textContent;

    if (!name || !phone || !dateString || isNaN(numPeople) || numPeople < 1 || !durationMinutes || !selectedTimeSlot) {
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
        // Re-populate time slots to reflect new booking
        populateRegularTimeSlots();
        calculateRegularPrice(); // Recalculate price and availability
        renderBookings(); // Update admin panel
    } else {
        showMessageBox("Извините, выбранное время занято или недостаточно места. Пожалуйста, выберите другое время.");
    }
}

/**
 * Handles booking for birthdays.
 */
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

    if (!name || !phone || !dateString || isNaN(numPeople) || numPeople < 1 || isNaN(startHour) || isNaN(startMinute) || isNaN(endHour) || isNaN(endMinute)) {
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
        calculateBirthdayPrice(); // Recalculate price and availability
        renderBookings(); // Update admin panel
    } else {
        showMessageBox("Извините, выбранное время занято для бронирования Дня рождения.");
    }
}

/**
 * Handles booking for groups.
 */
function handleBookGroup() {
    const name = groupNameInput.value.trim();
    const phone = groupPhoneInput.value.trim();
    const dateString = groupDateInput.value;
    const numPeople = parseInt(groupPeopleInput.value);
    const durationMinutes = 60; // Fixed for group
    const selectedTimeSlot = groupTimeSlotSelect.value;
    const totalPrice = groupTotalPriceSpan.textContent;

    if (!name || !phone || !dateString || isNaN(numPeople) || numPeople < 15 || !selectedTimeSlot) {
        showMessageBox("Пожалуйста, заполните все поля для группового бронирования.");
        return;
    }
    if (!groupPhoneInput.checkValidity()) {
        showMessageBox("Пожалуйста, введите номер телефона в формате +79000000000.");
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
        calculateGroupPrice(); // Recalculate price and availability
        renderBookings(); // Update admin panel
    } else {
        showMessageBox("Извините, выбранное время занято или недостаточно места для вашей группы.");
    }
}

/**
 * Populates time slots for regular booking based on current selections.
 */
function populateRegularTimeSlots() {
    const dateString = regularDateInput.value;
    const durationRadio = document.querySelector('input[name="regular-duration"]:checked');
    const durationMinutes = durationRadio ? parseInt(durationRadio.value) : 0;
    const numPeople = parseInt(regularPeopleInput.value);
    if (dateString && !isNaN(numPeople) && numPeople >= 1 && durationMinutes) {
        populateTimeSlots(regularTimeSlotSelect, dateString, durationMinutes, numPeople, 'regular');
    } else {
        regularTimeSlotSelect.innerHTML = '<option value="">Выберите дату, количество человек и продолжительность</option>';
    }
}

 /**
 * Populates time slots for group booking based on current selections.
 */
function populateGroupTimeSlots() {
    const dateString = groupDateInput.value;
    const numPeople = parseInt(groupPeopleInput.value);
    const durationMinutes = 60; // Fixed for group bookings
    if (dateString && !isNaN(numPeople) && numPeople >= 15) {
        populateTimeSlots(groupTimeSlotSelect, dateString, durationMinutes, numPeople, 'group');
    } else {
        groupTimeSlotSelect.innerHTML = '<option value="">Выберите дату и количество человек (от 15)</option>';
    }
}

// --- Cube Generation Function ---
function createCubes() {
    const colors = ['bg-fuchsia-500', 'bg-cyan-400', 'bg-purple-500', 'bg-pink-500', 'bg-blue-500'];
    const numCubes = 50; // Number of cubes to generate

    for (let i = 0; i < numCubes; i++) {
        const cube = document.createElement('div');
        cube.classList.add('cube');

        // Random size (small cubes)
        const size = Math.random() * 8 + 2; // Size between 2px and 10px
        cube.style.width = `${size}px`;
        cube.style.height = `${size}px`;

        // Random position
        cube.style.top = `${Math.random() * 100}%`;
        cube.style.left = `${Math.random() * 100}%`;

        // Random color
        cube.classList.add(colors[Math.floor(Math.random() * colors.length)]);

        // Random animation delay for staggered effect
        cube.style.animationDelay = `${Math.random() * 3}s`; // Delay up to 3 seconds

        cubesContainer.appendChild(cube);
    }
}

// --- Admin Panel Functions ---
function renderBookings() {
    bookingsList.innerHTML = '';
    if (bookedSlots.length === 0) {
        bookingsList.innerHTML = '<p class="text-gray-400">Нет активных бронирований.</p>';
        return;
    }

    // Sort bookings by date and time
    bookedSlots.sort((a, b) => {
        const dateA = new Date(`${a.date}T${formatTime(a.startHour)}:${formatTime(a.startMinute)}:00`);
        const dateB = new Date(`${b.date}T${formatTime(b.startHour)}:${formatTime(b.startMinute)}:00`);
        return dateA - dateB;
    });

    bookedSlots.forEach((booking, index) => {
        const bookingEl = document.createElement('div');
        bookingEl.classList.add('bg-gray-700', 'p-3', 'rounded-md', 'flex', 'flex-col', 'gap-1', 'text-sm');
        bookingEl.innerHTML = `
            <p class="text-white font-semibold">${booking.name} (<span class="capitalize">${booking.type === 'regular' ? 'разовое' : (booking.type === 'birthday' ? 'др' : 'группа')}</span>)</p>
            <p class="text-gray-300">${booking.phone}</p>
            <p class="text-gray-300">Дата: ${booking.date}</p>
            <p class="text-gray-300">Время: ${formatTime(booking.startHour)}:${formatTime(booking.startMinute)} - ${formatTime(booking.startHour + Math.floor((booking.startMinute + booking.durationMinutes) / 60))}:${formatTime((booking.startMinute + booking.durationMinutes) % 60)}</p>
            <p class="text-gray-300">Человек: ${booking.people}</p>
            <button data-index="${index}" class="clear-booking-btn mt-2 bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded text-xs self-end">
                Отменить
            </button>
        `;
        bookingsList.appendChild(bookingEl);
    });

    // Add event listeners to newly created clear buttons
    document.querySelectorAll('.clear-booking-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const indexToRemove = parseInt(event.target.dataset.index);
            bookedSlots.splice(indexToRemove, 1);
            renderBookings(); // Re-render the list
            // Re-populate time slots and recalculate prices for all tabs
            populateRegularTimeSlots();
            calculateRegularPrice();
            calculateBirthdayPrice();
            populateGroupTimeSlots();
            calculateGroupPrice();
        });
    });
}

// Old booking form submission (if still needed, otherwise remove related HTML and JS)
function submitToGoogleSheets(data) {
    fetch('https://script.google.com/macros/s/AKfycbxMubmFZDMtCnNgpJ43nP6w4w8SKKqYt3Tlx66zhRm1VoIaqfUqkMjswArUSnbIlEXj/exec', {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(data)
    })
    .then(() => {
      alert("Бронирование отправлено!");
      oldBookingForm.reset(); // Reset the old form
    })
    .catch(error => {
      console.error("Ошибка:", error);
      alert("Ошибка при отправке.");
    });
}

function handleOldFormSubmit(event) {
    event.preventDefault();
    const formData = {
      name: oldNameInput.value,
      phone: oldPhoneInput.value,
      datetime: oldDatetimeInput.value
    };
    submitToGoogleSheets(formData);
}

function checkAdminAccess() {
    const input = adminPasswordInput.value;
    if (input === 'cosmos2105') {
      adminLinkDiv.style.display = 'block';
      alert("Доступ разрешен!");
    } else {
      alert("Неверный пароль!");
    }
}


// --- Initial Setup and Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
    // Set today's date as default
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    regularDateInput.value = todayString;
    birthdayDateInput.value = todayString;
    groupDateInput.value = todayString;

    // Initial population and calculation for the default tab
    populateRegularTimeSlots();
    calculateRegularPrice();

    // Tab navigation listeners
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
        birthdayStartMinuteInput.value = Math.round(val / 30) * 30; // Snap to 0 or 30
        calculateBirthdayPrice();
    });
    birthdayEndHourInput.addEventListener('input', calculateBirthdayPrice);
    birthdayEndMinuteInput.addEventListener('input', () => {
        let val = parseInt(birthdayEndMinuteInput.value);
        if (isNaN(val) || val < 0) birthdayEndMinuteInput.value = 0;
        if (val > 59) birthdayEndMinuteInput.value = 59;
        birthdayEndMinuteInput.value = Math.round(val / 30) * 30; // Snap to 0 or 30
        calculateBirthdayPrice();
    });
    bookBirthdayBtn.addEventListener('click', handleBookBirthday);

    // Group Booking Listeners
    groupNameInput.addEventListener('input', calculateGroupPrice);
    groupPhoneInput.addEventListener('input', calculateGroupPrice);
    groupMinusBtn.addEventListener('click', () => {
        let val = parseInt(groupPeopleInput.value);
        if (val > 15) groupPeopleInput.value = val - 1; // Min 15
        populateGroupTimeSlots();
        calculateGroupPrice();
    });
    groupPlusBtn.addEventListener('click', () => {
        let val = parseInt(groupPeopleInput.value);
        if (val < 100) groupPeopleInput.value = val + 1; // Max 100 for group
        populateGroupTimeSlots();
        calculateGroupPrice();
    });
    groupPeopleInput.addEventListener('input', () => {
        let val = parseInt(groupPeopleInput.value);
        if (isNaN(val) || val < 15) groupPeopleInput.value = 15; // Min 15
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

    // Generate cubes on page load
    createCubes();

    // Admin Panel Listeners
    adminToggleBtn.addEventListener('click', () => {
        adminPanel.classList.toggle('hidden');
        if (!adminPanel.classList.contains('hidden')) {
            renderBookings(); // Render bookings when panel opens
        }
    });
    closeAdminBtn.addEventListener('click', () => {
        adminPanel.classList.add('hidden');
    });
    syncBookingsBtn.addEventListener('click', () => {
        // In a real app, you'd send bookedSlots to a backend to sync with Google Sheets
        // For this frontend-only example, we'll just show a message.
        showMessageBox("Функция синхронизации с Google Таблицей не реализована в данной версии. Записи отправляются в Telegram.");
    });
    clearTestBtn.addEventListener('click', () => {
        if (confirm("Вы уверены, что хотите очистить все тестовые бронирования?")) {
            bookedSlots = []; // Clear all bookings
            renderBookings(); // Update admin panel
            populateRegularTimeSlots(); // Refresh availability everywhere
            calculateRegularPrice();
            calculateBirthdayPrice();
            populateGroupTimeSlots();
            calculateGroupPrice();
            showMessageBox("Все тестовые бронирования очищены.");
        }
    });

    // Old booking form event listener
    if (oldBookingForm) {
        oldBookingForm.addEventListener('submit', handleOldFormSubmit);
    }

    // Smooth scroll for anchor links
    document.querySelectorAll("a[href^='#']").forEach(anchor => {
        anchor.addEventListener("click", function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute("href"));
            if (target) {
                target.scrollIntoView({ behavior: "smooth" });
            }
        });
    });
});
