document.addEventListener('DOMContentLoaded', () => {
    const seatsOverlay = document.getElementById('seats-overlay');
    const floorplanContainer = document.getElementById('floorplan-container');
    const dateInput = document.getElementById('start-date');
    const messageWrapper = document.getElementById('message-wrapper');
    const messageTitle = document.getElementById('message-title');
    const messageContent = document.getElementById('message-content');
    const reservationAction = document.getElementById('reservation-action');
    const reserveBtn = document.getElementById('reserve-btn');

    let lastClickedSeatIndex = -1;
    let autoSelectIndex = -1;
    
    /**
     * LOCAL RESERVATION STATE
     */
    let userReservations = {};

    /**
     * EXPERT COORDINATE SYSTEM
     */
    const garageSeats = [
        { top: 29, left: 30 },
        { top: 34, left: 30 },
        { top: 44, left: 37 },
        { top: 44, left: 44 },
        { top: 44, left: 51 },
        { top: 34, left: 59 },
        { top: 29, left: 59 },
        { top: 25, left: 66 },
        { top: 30, left: 66 },
        { top: 35, left: 66 },
		{ top: 40, left: 66 },
		{ top: 53, left: 46 },
        { top: 57, left: 42 },
    ];

    /**
     * PSEUDORANDOM GENERATOR (Seeded)
     */
    function seededRandom(seed) {
        let hash = 0;
        for (let i = 0; i < seed.length; i++) {
            hash = seed.charCodeAt(i) + ((hash << 5) - hash);
        }
        return function() {
            hash = (hash * 9301 + 49297) % 233280;
            return hash / 233280;
        };
    }

    function shuffle(array, seed) {
        const rng = seededRandom(seed);
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(rng() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    /**
     * SEAT RENDERING LOGIC
     */
    function renderSeats(date, drukte, isOpen, closedMessage) {
        seatsOverlay.innerHTML = '';
        
        let allTakenIndices = [];
        const userReservedIndex = userReservations[date] !== undefined ? userReservations[date] : -1;

        if (isOpen) {
            const primaryIndices = [0, 1, 2, 3, 4, 5, 6];
            const secondaryIndices = [7, 8, 9, 10];
            let takenPrimaryCount = Math.min(drukte, 7);
            let takenSecondaryCount = Math.max(0, drukte - 7);
            const takenPrimary = shuffle(primaryIndices, date + "-p").slice(0, takenPrimaryCount);
            const takenSecondary = shuffle(secondaryIndices, date + "-s").slice(0, takenSecondaryCount);
            allTakenIndices = [...takenPrimary, ...takenSecondary];
        }

        garageSeats.forEach((pos, index) => {
            const btn = document.createElement('button');
            btn.style.top = `${pos.top}%`;
            btn.style.left = `${pos.left}%`;
            btn.textContent = index + 1;
            
            if (!isOpen) {
                btn.className = 'seat-btn closed';
                btn.title = `Gesloten: ${closedMessage}`;
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (lastClickedSeatIndex === index) {
                        alert(closedMessage);
                    } else {
                        lastClickedSeatIndex = index;
                    }
                });
            } else if (index === userReservedIndex) {
                // USER RESERVED STATE (Blue)
                btn.className = 'seat-btn user-reserved';
                btn.title = `Plaats ${index + 1} (door jou gereserveerd)`;
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    showUserReservedMessage(index);
                });
            } else {
                const isTaken = allTakenIndices.includes(index);
                btn.className = `seat-btn ${isTaken ? 'unavailable' : 'available'}`;
                btn.title = `Plaats ${index + 1} (${isTaken ? 'Gereserveerd' : 'Beschikbaar'})`;
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    
                    if (isTaken) {
                        showReservedMessage(index);
                    } else {
                        showAvailableMessage(index);
                    }
                });
            }

            seatsOverlay.appendChild(btn);
        });

        // Handle auto-selection from URL
        if (autoSelectIndex !== -1 && autoSelectIndex < garageSeats.length) {
            const index = autoSelectIndex;
            const userReservedIndex = userReservations[date] !== undefined ? userReservations[date] : -1;
            
            if (!isOpen) {
                // Do nothing for closed seats on auto-select
            } else if (index === userReservedIndex) {
                showUserReservedMessage(index);
            } else {
                const primaryIndices = [0, 1, 2, 3, 4, 5, 6];
                const secondaryIndices = [7, 8, 9, 10];
                let takenPrimaryCount = Math.min(drukte, 7);
                let takenSecondaryCount = Math.max(0, drukte - 7);
                const takenPrimary = shuffle(primaryIndices, date + "-p").slice(0, takenPrimaryCount);
                const takenSecondary = shuffle(secondaryIndices, date + "-s").slice(0, takenSecondaryCount);
                const allTakenIndices = [...takenPrimary, ...takenSecondary];
                
                if (allTakenIndices.includes(index)) {
                    showReservedMessage(index);
                } else {
                    showAvailableMessage(index);
                }
            }
            autoSelectIndex = -1; // Reset after selection
        }
    }

    /**
     * UI FEEDBACK LOGIC
     */
    function showAvailableMessage(index) {
        messageWrapper.classList.remove('reserved', 'user-reserved');
        messageWrapper.classList.add('selected');
        messageTitle.textContent = `Plaats ${index + 1}: beschikbaar`;
        messageContent.textContent = `Je hebt plaats ${index + 1} geselecteerd. Deze plek is nog vrij om te reserveren.`;
        
        reserveBtn.textContent = "Deze plek reserveren";
        reservationAction.style.display = 'block';
        
        messageWrapper.style.display = 'block';
        lastClickedSeatIndex = index;
    }

    function showReservedMessage(index) {
        messageWrapper.classList.remove('selected', 'user-reserved');
        messageWrapper.classList.add('reserved');
        messageTitle.textContent = `Plaats ${index + 1}: gereserveerd`;
        messageContent.textContent = "De plaats die je hebt geselecteerd is al gereserveerd door iemand anders, probeer een andere plek te reserveren.";
        
        reservationAction.style.display = 'none';
        messageWrapper.style.display = 'block';
        
        if (lastClickedSeatIndex === index) {
            alert('Deze plaats is al gereserveerd.');
        } else {
            lastClickedSeatIndex = index;
        }
    }

    function showUserReservedMessage(index) {
        messageWrapper.classList.remove('selected', 'reserved');
        messageWrapper.classList.add('user-reserved');
        messageTitle.textContent = `Plaats ${index + 1}: door jou gereserveerd`;
        messageContent.textContent = `Je hebt deze plaats gereserveerd voor de geselecteerde dag.`;
        
        reserveBtn.textContent = "Reservatie verwijderen";
        reservationAction.style.display = 'block';
        
        messageWrapper.style.display = 'block';
        lastClickedSeatIndex = index;
    }

    /**
     * RESERVATION ACTION
     */
    reserveBtn.addEventListener('click', () => {
        const date = dateInput.value;
        const currentRes = userReservations[date];
        
        // 1. Update State
        if (currentRes === lastClickedSeatIndex) {
            delete userReservations[date];
        } else {
            userReservations[date] = lastClickedSeatIndex;
        }
        
        // 2. Direct UI Update for the box (No flicker)
        if (userReservations[date] === lastClickedSeatIndex) {
            showUserReservedMessage(lastClickedSeatIndex);
        } else {
            showAvailableMessage(lastClickedSeatIndex);
        }

        // 3. Update the dots in the background
        const dayInfo = window.BART_BEZETTING.find(item => item.datum === date);
        renderSeats(date, dayInfo ? (dayInfo.open ? dayInfo.drukte : 11) : 11, dayInfo ? dayInfo.open : false, dayInfo ? dayInfo.bericht : "");
    });

    function initAvailability() {
        const data = window.BART_BEZETTING;
        if (data) {
            // Set date to today (local time)
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const today = `${year}-${month}-${day}`;
            dateInput.value = today;

            // Robust URL Parsing: checks search (?2), hash (#2), and pathname (/2)
            const getSeatFromURL = () => {
                const searchMatch = window.location.search.match(/\d+/);
                if (searchMatch) return parseInt(searchMatch[0]);
                
                const hashMatch = window.location.hash.match(/\d+/);
                if (hashMatch) return parseInt(hashMatch[0]);
                
                const pathMatch = window.location.pathname.match(/\/(\d+)\/?$/);
                if (pathMatch) return parseInt(pathMatch[1]);
                
                return NaN;
            };

            const seatFromUrl = getSeatFromURL();
            if (!isNaN(seatFromUrl) && seatFromUrl > 0) {
                autoSelectIndex = seatFromUrl - 1;
            }

            setupDatePicker(data);
            handleDateChange(dateInput.value, data);
        }
    }

    function handleDateChange(selectedDate, data) {
        const dayInfo = data.find(item => item.datum === selectedDate);
        
        messageWrapper.classList.remove('reserved', 'selected', 'user-reserved');
        messageTitle.textContent = "Garage niet beschikbaar op de gekozen datum";
        reservationAction.style.display = 'none';

        if (dayInfo) {
            if (!dayInfo.open) {
                messageContent.textContent = dayInfo.bericht || "Deze locatie is vandaag gesloten.";
                messageWrapper.style.display = 'block';
                renderSeats(selectedDate, 11, false, dayInfo.bericht || "Deze locatie is vandaag gesloten.");
            } else {
                messageWrapper.style.display = 'none';
                renderSeats(selectedDate, dayInfo.drukte, true);
            }
        } else {
            messageContent.textContent = "Geen informatie beschikbaar voor deze datum.";
            messageWrapper.style.display = 'block';
            renderSeats(selectedDate, 11, false, "Geen informatie beschikbaar.");
        }
    }

    function setupDatePicker(data) {
        const dates = data.map(item => item.datum).sort();
        if (dates.length > 0) {
            dateInput.min = dates[0];
            dateInput.max = dates[dates.length - 1];
        }
        dateInput.addEventListener('change', () => {
            handleDateChange(dateInput.value, data);
        });
    }

    initAvailability();

    /**
     * CALIBRATION TOOL
     */
    floorplanContainer.addEventListener('mousedown', (e) => {
        const rect = floorplanContainer.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        console.log(`Expert Coordinate Found: { top: ${Math.round(y)}, left: ${Math.round(x)} }`);
    });
});
