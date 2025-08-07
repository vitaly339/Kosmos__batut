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
const birthdayIsHonoreeCheckbox = document.getElementById('birthday-is-honoree'); // New: Honoree checkbox
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

// Loyalty Widget Elements
const loyaltyPointsSpan = document.getElementById('loyalty-points');
const loyaltyProgressBar = document.getElementById('loyalty-progress');
const loyaltyDiscountBadge = document.getElementById('loyalty-discount');

// --- Telegram Bot Configuration ---
const botToken = '7861899004:AAGmjXa-MMemKhV_L-X35WoI2Itfk9aLv4E'; // ВАШ ТОКЕН БОТА
const chatId = '465087814'; // ВАШ ID ЧАТА

// --- Global State ---
let bookedSlots = [];
let loyaltyPoints = 0; // Initial loyalty points

// Define prices (more structured)
const prices = {
    regular: {
        'monday_thursday': { '30': 350, '60': 350, '120': 350 }, // Base price for Mon/Thu
        'other_weekday': { '30': 300, '60': 500, '120': 800 },
        'weekend_holiday': { '30': 400, '60': 600, '120': 1000 }
    },
    birthday: {
        'basePricePer2Hours': {
            'other_weekday': 800,
            'weekend_holiday': 1000
        },
        'honoreeDiscount': 1 // 100% discount for honoree (1 means one person is free)
    },
    group: {
        'basePricePerPerson': {
            'monday_thursday': 300, // 350 - 50 = 300
            'other_weekday': 450,   // 500 - 50 = 450 (assuming 60 min for groups)
            'weekend_holiday': 550  // 600 - 50 = 550 (assuming 60 min for groups)
        },
        'minPeople': 10, // Adjusted to 10
        'durationMinutes': 60 // Group bookings are 60 minutes
    }
};

// Define holidays for price calculation
const holidays = [
    '2025-01-01', '2025-01-07', '2025-02-23', '2025-03-08',
    '2025-05-01', '2025-05-09', '2025-06-12', '2025-11-04'
];

const CAPACITY_PER_SLOT = 12; // Max people in a 30-min segment of the park

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

// Function to update loyalty points and UI
function updateLoyaltyPoints(pointsToAdd) {
    loyaltyPoints = Math.min(100, loyaltyPoints + pointsToAdd); // Max 100 points
    loyaltyPointsSpan.textContent = loyaltyPoints;
    loyaltyProgressBar.style.width = `${loyaltyPoints}%`;

    if (loyaltyPoints >= 100) {
        loyaltyDiscountBadge.classList.remove('hidden');
    } else {
        loyaltyDiscountBadge.classList.add('hidden');
    }
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
        showMessageBox("Ошибка при отправке уведомления в Telegram. Пожалуйста, попробуйте еще раз.");
    }
}

function getDayType(dateString) {
    const date = new Date(dateString + 'T00:00:00'); // Use 'T00:00:00' to avoid timezone issues
    const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

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

function populateTimeSlots(selectElement, dateString, durationMinutes, numPeople, bookingType) {
    selectElement.innerHTML = '';
    const now = new Date();
    const todayString = now.toISOString().split('T')[0];
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    let hasAvailableSlots = false;

    // Iterate through available slots from 10:00 to 22:00
    for (let hour = 10; hour < 22; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
            const slotStartHour = hour;
            const slotStartMinute = minute;
            const slotEndHour = hour + Math.floor((minute + durationMinutes) / 60);
            const slotEndMinute = (minute + durationMinutes) % 60;

            // Ensure slot does not extend beyond closing time (22:00)
            if (slotEndHour > 22 || (slotEndHour === 22 && slotEndMinute > 0)) {
                continue;
            }

            // Disable past times for today
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

    // Handle case where no slots are available
    if (!hasAvailableSlots && selectElement.options.length > 0) {
        const noSlotsOption = document.createElement('option');
        noSlotsOption.textContent = "Нет доступных слотов на выбранную дату и продолжительность.";
        noSlotsOption.disabled = true;
        selectElement.innerHTML = ''; // Clear existing options
        selectElement.appendChild(noSlotsOption);
        selectElement.value = '';
    } else if (selectElement.options.length === 0) {
        const noSlotsOption = document.createElement('option');
        noSlotsOption.textContent = "Нет доступных слотов.";
        noSlotsOption.disabled = true;
        selectElement.appendChild(noSlotsOption);
        selectElement.value = '';
    } else {
        // Select the first available option by default
        selectElement.value = selectElement.options.length > 0 ? selectElement.options[0].value : '';
        // If the first option is disabled, try to find the first enabled one
        if (selectElement.options[0] && selectElement.options[0].disabled) {
            const firstEnabled = Array.from(selectElement.options).find(opt => !opt.disabled);
            if (firstEnabled) {
                selectElement.value = firstEnabled.value;
            } else {
                selectElement.value = ''; // No enabled options
            }
        }
    }
}


function checkAvailability(dateString, startHour, startMinute, durationMinutes, newPeople, bookingType) {
    const newBookingStart = new Date(`${dateString}T${formatTime(startHour)}:${formatTime(startMinute)}:00`);
    const newBookingEnd = new Date(newBookingStart.getTime() + durationMinutes * 60 * 1000);

    // Filter out past bookings if the date is today
    const now = new Date();
    const filteredBookedSlots = bookedSlots.filter(slot => {
        const slotEnd = new Date(`${slot.date}T${formatTime(slot.startHour)}:${formatTime(slot.startMinute)}:00`).getTime() + slot.durationMinutes * 60 * 1000;
        return slotEnd > now.getTime(); // Keep only future or ongoing bookings
    });


    // --- Exclusive Booking Logic (Birthday/Group) ---
    // If the new booking is a Birthday or Group, check if any existing exclusive booking overlaps
    if (bookingType === 'birthday' || bookingType === 'group') {
        const overlappingExclusiveBookings = filteredBookedSlots.filter(slot =>
            slot.date === dateString &&
            (slot.type === 'birthday' || slot.type === 'group') &&
            // Check for overlap: (StartA < EndB) && (EndA > StartB)
            (newBookingStart.getTime() < new Date(`${slot.date}T${formatTime(slot.startHour)}:${formatTime(slot.startMinute)}:00`).getTime() + slot.durationMinutes * 60 * 1000 &&
             newBookingEnd.getTime() > new Date(`${slot.date}T${formatTime(slot.startHour)}:${formatTime(slot.startMinute)}:00`).getTime())
        );

        if (overlappingExclusiveBookings.length > 0) {
            return false; // Cannot book if an exclusive booking already exists
        }

        // Special check for group bookings: they cannot overlap with ANY regular bookings
        // This assumes a group booking takes over the entire capacity.
        if (bookingType === 'group') {
            const overlappingRegularBookings = filteredBookedSlots.filter(slot =>
                slot.date === dateString &&
                slot.type === 'regular' &&
                (newBookingStart.getTime() < new Date(`${slot.date}T${formatTime(slot.startHour)}:${formatTime(slot.startMinute)}:00`).getTime() + slot.durationMinutes * 60 * 1000 &&
                 newBookingEnd.getTime() > new Date(`${slot.date}T${formatTime(slot.startHour)}:${formatTime(slot.startMinute)}:00`).getTime())
            );
            if (overlappingRegularBookings.length > 0) {
                return false; // Group booking cannot overlap with any regular booking
            }
        }
        return true; // If no exclusive or conflicting regular bookings, it's available for exclusive types
    }

    // --- Regular Booking Logic (Capacity Check) ---
    // For regular bookings, check capacity in 30-minute segments
    const segmentDuration = 30 * 60 * 1000; // 30 minutes in milliseconds
    let currentSegmentStart = new Date(newBookingStart);

    while (currentSegmentStart.getTime() < newBookingEnd.getTime()) {
        const currentSegmentEnd = new Date(currentSegmentStart.getTime() + segmentDuration);

        let peopleInSegment = 0;
        filteredBookedSlots.forEach(slot => {
            if (slot.date === dateString) {
                const existingStart = new Date(`${slot.date}T${formatTime(slot.startHour)}:${formatTime(slot.startMinute)}:00`);
                const existingEnd = new Date(existingStart.getTime() + slot.durationMinutes * 60 * 1000);

                // Check if existing slot overlaps with current 30-min segment
                if (currentSegmentStart.getTime() < existingEnd.getTime() && currentSegmentEnd.getTime() > existingStart.getTime()) {
                    if (slot.type === 'birthday' || slot.type === 'group') {
                        // If an exclusive booking (birthday/group) exists, it takes full capacity
                        peopleInSegment += CAPACITY_PER_SLOT;
                    } else {
                        peopleInSegment += slot.people;
                    }
                }
            }
        });

        if (peopleInSegment + newPeople > CAPACITY_PER_SLOT) {
            return false; // Not enough capacity in this segment
        }

        currentSegmentStart.setTime(currentSegmentEnd.getTime()); // Move to next segment
    }

    return true; // Available if all segments have capacity
}

// --- Calculation Functions ---
function calculateRegularPrice() {
    const dateString = regularDateInput.value;
    const numPeople = parseInt(regularPeopleInput.value);
    const durationMinutes = parseInt(document.querySelector('input[name="regular-duration"]:checked').value);
    const selectedTimeSlot = regularTimeSlotSelect.value;

    if (!dateString || isNaN(numPeople) || numPeople < 1 || isNaN(durationMinutes) || !selectedTimeSlot) {
        regularTotalPriceSpan.textContent = '0';
        regularAvailabilityMessage.classList.add('hidden');
        bookRegularBtn.disabled = true;
        bookRegularBtn.classList.add('opacity-50', 'cursor-not-allowed');
        return;
    }

    const dayType = getDayType(dateString);
    const pricePerPerson = prices.regular[dayType][durationMinutes.toString()];
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

    // Reset messages and button state
    birthdayDurationMessage.classList.add('hidden');
    birthdayAvailabilityMessage.classList.add('hidden');
    bookBirthdayBtn.disabled = true;
    bookBirthdayBtn.classList.add('opacity-50', 'cursor-not-allowed');
    birthdayTotalPriceSpan.textContent = '0'; // Reset price initially

    // Check if fields are filled and valid
    if (!dateString || isNaN(numPeople) || numPeople < 1 || isNaN(startHour) || isNaN(startMinute) || isNaN(endHour) || isNaN(endMinute)) {
        return; // Do not calculate if inputs are incomplete
    }

    const startTime = new Date(`${dateString}T${formatTime(startHour)}:${formatTime(startMinute)}:00`);
    const endTime = new Date(`${dateString}T${formatTime(endHour)}:${formatTime(endMinute)}:00`);

    // Basic time validation
    if (endTime.getTime() <= startTime.getTime()) {
        birthdayDurationMessage.textContent = "Время окончания должно быть позже времени начала.";
        birthdayDurationMessage.classList.remove('hidden');
        return;
    }

    const durationMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);

    // Duration validation
    if (durationMinutes < 120) {
        birthdayDurationMessage.textContent = "Минимальная продолжительность для Дня рождения - 2 часа (120 минут).";
        birthdayDurationMessage.classList.remove('hidden');
        return;
    }
    if (durationMinutes % 30 !== 0) {
        birthdayDurationMessage.textContent = "Продолжительность должна быть кратна 30 минутам.";
        birthdayDurationMessage.classList.remove('hidden');
        return;
    }

    // Calculate price
    const dayType = getDayType(dateString);
    const basePricePer2Hours = prices.birthday.basePricePer2Hours[dayType];
    const pricePerMinute = basePricePer2Hours / 120; // Price per minute for birthday
    
    let effectivePeople = numPeople;
    if (isHonoree && numPeople > 0) { // If honoree is checked and there's at least one person
        effectivePeople = numPeople - prices.birthday.honoreeDiscount; // One person jumps free
        if (effectivePeople < 0) effectivePeople = 0; // Ensure it doesn't go negative
    }

    const totalPrice = Math.round(pricePerMinute * durationMinutes * effectivePeople);

    birthdayTotalPriceSpan.textContent = totalPrice;

    // Check availability
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
    const durationMinutes = prices.group.durationMinutes; // Always 60 minutes for group
    const selectedTimeSlot = groupTimeSlotSelect.value;

    // Reset messages and button state
    groupTotalPriceSpan.textContent = '0';
    groupAvailabilityMessage.classList.add('hidden');
    bookGroupBtn.disabled = true;
    bookGroupBtn.classList.add('opacity-50', 'cursor-not-allowed');

    if (!dateString || isNaN(numPeople) || !selectedTimeSlot) {
        return; // Do not calculate if inputs are incomplete
    }

    if (numPeople < prices.group.minPeople) {
        groupAvailabilityMessage.textContent = `Минимальное количество человек для группы - ${prices.group.minPeople}.`;
        groupAvailabilityMessage.classList.remove('hidden');
        return;
    }

    const dayType = getDayType(dateString);
    const pricePerPerson = prices.group.basePricePerPerson[dayType];
    const totalPrice = pricePerPerson * numPeople;

    groupTotalPriceSpan.textContent = totalPrice;

    const [startHour, startMinute] = selectedTimeSlot.split(':').map(Number);
    const isAvailable = checkAvailability(dateString, startHour, startMinute, durationMinutes, numPeople, 'group');

    if (!isAvailable) {
        groupAvailabilityMessage.textContent = "Это время занято или недостаточно места для вашей группы.";
        groupAvailabilityMessage.classList.remove('hidden');
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

    // Trigger recalculation and slot population when tab changes
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
    const selectedTimeSlotValue = regularTimeSlotSelect.value;
    const selectedTimeSlotText = regularTimeSlotSelect.options[regularTimeSlotSelect.selectedIndex].textContent;
    const totalPrice = regularTotalPriceSpan.textContent;

    if (!name || !phone || !dateString || isNaN(numPeople) || !durationMinutes || !selectedTimeSlotValue) {
        showMessageBox("Пожалуйста, заполните все обязательные поля для бронирования.");
        return;
    }
    if (!regularPhoneInput.checkValidity()) {
        showMessageBox("Пожалуйста, введите номер телефона в формате +79000000000 (11 цифр).");
        return;
    }

    const [startHour, startMinute] = selectedTimeSlotValue.split(':').map(Number);
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
                        `Время: ${selectedTimeSlotText}\n` + // Use text content for better display
                        `Человек: ${numPeople}\n` +
                        `Продолжительность: ${durationMinutes} мин\n` +
                        `Общая стоимость: ${totalPrice} ₽`;
        sendTelegramMessage(message);
        showMessageBox(`Бронирование успешно! Дата: ${dateString}, Время: ${selectedTimeSlotText}, Человек: ${numPeople}, Продолжительность: ${durationMinutes} мин. Общая стоимость: ${totalPrice} ₽`);
        updateLoyaltyPoints(5); // Add loyalty points for successful booking
        populateRegularTimeSlots();
        calculateRegularPrice();
        // Clear form fields
        regularNameInput.value = '';
        regularPhoneInput.value = '';
        regularPeopleInput.value = '1';
        document.querySelector('input[name="regular-duration"][value="30"]').checked = true;
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
    const isHonoree = birthdayIsHonoreeCheckbox.checked;
    const totalPrice = birthdayTotalPriceSpan.textContent;

    if (!name || !phone || !dateString || isNaN(numPeople) || isNaN(startHour) || isNaN(startMinute) || isNaN(endHour) || isNaN(endMinute)) {
        showMessageBox("Пожалуйста, заполните все обязательные поля для бронирования Дня рождения.");
        return;
    }
    if (!birthdayPhoneInput.checkValidity()) {
        showMessageBox("Пожалуйста, введите номер телефона в формате +79000000000 (11 цифр).");
        return;
    }

    const startTime = new Date(`${dateString}T${formatTime(startHour)}:${formatTime(startMinute)}:00`);
    const endTime = new Date(`${dateString}T${formatTime(endHour)}:${formatTime(endMinute)}:00`);
    const durationMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);

    if (endTime.getTime() <= startTime.getTime()) {
        showMessageBox("Время окончания должно быть позже времени начала.");
        return;
    }
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
                        `Человек: ${numPeople} ${isHonoree ? '(1 именинник бесплатно)' : ''}\n` +
                        `Продолжительность: ${durationMinutes} мин\n` +
                        `Общая стоимость: ${totalPrice} ₽`;
        sendTelegramMessage(message);
        showMessageBox(`Бронирование Дня рождения успешно! Дата: ${dateString}, Время: ${formatTime(startHour)}:${formatTime(startMinute)} - ${formatTime(endHour)}:${formatTime(endMinute)}, Человек: ${numPeople}${isHonoree ? ' (1 именинник бесплатно)' : ''}. Общая стоимость: ${totalPrice} ₽`);
        updateLoyaltyPoints(10); // Add more loyalty points for birthday booking
        calculateBirthdayPrice(); // Recalculate to update availability
        // Clear form fields
        birthdayNameInput.value = '';
        birthdayPhoneInput.value = '';
        birthdayPeopleInput.value = '1';
        birthdayIsHonoreeCheckbox.checked = false;
        birthdayStartHourInput.value = '10';
        birthdayStartMinuteInput.value = '00';
        birthdayEndHourInput.value = '12';
        birthdayEndMinuteInput.value = '00';
    } else {
        showMessageBox("Извините, выбранное время занято для бронирования Дня рождения.");
    }
}

function handleBookGroup() {
    const name = groupNameInput.value.trim();
    const phone = groupPhoneInput.value.trim();
    const dateString = groupDateInput.value;
    const numPeople = parseInt(groupPeopleInput.value);
    const durationMinutes = prices.group.durationMinutes; // Always 60 minutes
    const selectedTimeSlotValue = groupTimeSlotSelect.value;
    const selectedTimeSlotText = groupTimeSlotSelect.options[groupTimeSlotSelect.selectedIndex].textContent;
    const totalPrice = groupTotalPriceSpan.textContent;

    if (!name || !phone || !dateString || isNaN(numPeople) || !selectedTimeSlotValue) {
        showMessageBox("Пожалуйста, заполните все обязательные поля для группового бронирования.");
        return;
    }
    if (!groupPhoneInput.checkValidity()) {
        showMessageBox("Пожалуйста, введите номер телефона в формате +79000000000 (11 цифр).");
        return;
    }
    if (numPeople < prices.group.minPeople) {
        showMessageBox(`Минимальное количество человек для группы - ${prices.group.minPeople}.`);
        return;
    }

    const [startHour, startMinute] = selectedTimeSlotValue.split(':').map(Number);
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
                        `Время: ${selectedTimeSlotText}\n` +
                        `Человек: ${numPeople}\n` +
                        `Продолжительность: ${durationMinutes} мин\n` +
                        `Общая стоимость: ${totalPrice} ₽`;
        sendTelegramMessage(message);
        showMessageBox(`Групповое бронирование успешно! Дата: ${dateString}, Время: ${selectedTimeSlotText}, Человек: ${numPeople}. Общая стоимость: ${totalPrice} ₽`);
        updateLoyaltyPoints(20); // Add more loyalty points for group booking
        populateGroupTimeSlots();
        calculateGroupPrice(); // Recalculate to update availability
        // Clear form fields
        groupNameInput.value = '';
        groupPhoneInput.value = '';
        groupPeopleInput.value = '15'; // Reset to min group size
    } else {
        showMessageBox("Извините, выбранное время занято или недостаточно места для вашей группы.");
    }
}

function populateRegularTimeSlots() {
    const dateString = regularDateInput.value;
    const durationMinutes = parseInt(document.querySelector('input[name="regular-duration"]:checked').value);
    const numPeople = parseInt(regularPeopleInput.value);
    if (dateString && !isNaN(numPeople) && numPeople >= 1 && !isNaN(durationMinutes)) {
        populateTimeSlots(regularTimeSlotSelect, dateString, durationMinutes, numPeople, 'regular');
    } else {
        regularTimeSlotSelect.innerHTML = '<option value="">Выберите дату, количество человек и продолжительность</option>';
        regularTimeSlotSelect.value = ''; // Ensure no option is selected if invalid inputs
    }
}

function populateGroupTimeSlots() {
    const dateString = groupDateInput.value;
    const numPeople = parseInt(groupPeopleInput.value);
    const durationMinutes = prices.group.durationMinutes; // Group duration is fixed at 60 minutes
    if (dateString && !isNaN(numPeople) && numPeople >= prices.group.minPeople) {
        populateTimeSlots(groupTimeSlotSelect, dateString, durationMinutes, numPeople, 'group');
    } else {
        groupTimeSlotSelect.innerHTML = `<option value="">Выберите дату и количество человек (от ${prices.group.minPeople})</option>`;
        groupTimeSlotSelect.value = ''; // Ensure no option is selected if invalid inputs
    }
}

function createCubes() {
    const colors = ['bg-fuchsia-500', 'bg-cyan-400', 'bg-purple-500', 'bg-pink-500', 'bg-blue-500'];
    const numCubes = 50;

    for (let i = 0; i < numCubes; i++) {
        const cube = document.createElement('div');
        cube.classList.add('cube'); // This class should be defined in style.css for animation/positioning

        const size = Math.random() * 8 + 2; // Size between 2px and 10px
        cube.style.width = `${size}px`;
        cube.style.height = `${size}px`;

        cube.style.top = `${Math.random() * 100}%`;
        cube.style.left = `${Math.random() * 100}%`;
        cube.style.opacity = `${Math.random() * 0.7 + 0.3}`; // Opacity between 0.3 and 1.0

        cube.classList.add(colors[Math.floor(Math.random() * colors.length)]);
        cube.style.animationDelay = `${Math.random() * 3}s`; // Stagger animation start

        cubesContainer.appendChild(cube);
    }
}

// --- Initial Setup ---
document.addEventListener('DOMContentLoaded', () => {
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    
    // Set initial date inputs
    regularDateInput.value = todayString;
    birthdayDateInput.value = todayString;
    groupDateInput.value = todayString;

    // Initialize loyalty points (can be loaded from localStorage later)
    updateLoyaltyPoints(0);

    // Initial population and calculation for the default tab
    populateRegularTimeSlots();
    calculateRegularPrice();

    // Attach Tab Navigation Listeners
    tabButtons.forEach(button => {
        button.addEventListener('click', handleTabClick);
    });

    // Regular Booking Listeners
    regularNameInput.addEventListener('input', calculateRegularPrice);
    regularPhoneInput.addEventListener('input', calculateRegularPrice);
    regularMinusBtn.addEventListener('click', () => {
        let val = parseInt(regularPeopleInput.value);
        if (val > 1) regularPeopleInput.value = val - 1;
        populateRegularTimeSlots(); // Recalculate slots based on new people count
        calculateRegularPrice();
    });
    regularPlusBtn.addEventListener('click', () => {
        let val = parseInt(regularPeopleInput.value);
        if (val < 20) regularPeopleInput.value = val + 1;
        populateRegularTimeSlots(); // Recalculate slots
        calculateRegularPrice();
    });
    regularPeopleInput.addEventListener('input', () => {
        let val = parseInt(regularPeopleInput.value);
        if (isNaN(val) || val < 1) regularPeopleInput.value = 1;
        if (val > 20) regularPeopleInput.value = 20;
        populateRegularTimeSlots(); // Recalculate slots
        calculateRegularPrice();
    });
    regularDateInput.addEventListener('change', () => {
        populateRegularTimeSlots(); // Recalculate slots for new date
        calculateRegularPrice();
    });
    regularDurationRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            populateRegularTimeSlots(); // Recalculate slots for new duration
            calculateRegularPrice();
        });
    });
    regularTimeSlotSelect.addEventListener('change', calculateRegularPrice);
    bookRegularBtn.addEventListener('click', handleBookRegular);

    // Birthday Booking Listeners
    birthdayNameInput.addEventListener('input', calculateBirthdayPrice);
    birthdayPhoneInput.addEventListener('input', calculateBirthdayPrice);
    birthdayIsHonoreeCheckbox.addEventListener('change', calculateBirthdayPrice); // New: Listen to honoree checkbox
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
        if (isNaN(val) || val < 0) val = 0;
        if (val > 59) val = 59;
        birthdayStartMinuteInput.value = formatTime(Math.round(val / 30) * 30); // Snap to 00 or 30
        calculateBirthdayPrice();
    });
    birthdayEndHourInput.addEventListener('input', calculateBirthdayPrice);
    birthdayEndMinuteInput.addEventListener('input', () => {
        let val = parseInt(birthdayEndMinuteInput.value);
        if (isNaN(val) || val < 0) val = 0;
        if (val > 59) val = 59;
        birthdayEndMinuteInput.value = formatTime(Math.round(val / 30) * 30); // Snap to 00 or 30
        calculateBirthdayPrice();
    });
    bookBirthdayBtn.addEventListener('click', handleBookBirthday);

    // Group Booking Listeners
    groupNameInput.addEventListener('input', calculateGroupPrice);
    groupPhoneInput.addEventListener('input', calculateGroupPrice);
    groupMinusBtn.addEventListener('click', () => {
        let val = parseInt(groupPeopleInput.value);
        if (val > prices.group.minPeople) groupPeopleInput.value = val - 1; // Use minPeople
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
        if (isNaN(val) || val < prices.group.minPeople) groupPeopleInput.value = prices.group.minPeople; // Use minPeople
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
});

