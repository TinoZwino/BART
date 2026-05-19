document.addEventListener('DOMContentLoaded', () => {
    const seatsOverlay = document.getElementById('seats-overlay');
    const floorplanContainer = document.getElementById('floorplan-container');
    const dateInput = document.getElementById('start-date');
    const messageWrapper = document.getElementById('message-wrapper');
    const messageContent = document.getElementById('message-content');

    /**
     * EXPERT COORDINATE SYSTEM
     */
    const garageSeats = [
        { top: 29, left: 30 },
        { top: 34, left: 30 },
        { top: 44, left: 37 },
        { top: 45, left: 45 },
        { top: 44, left: 52 },
        { top: 35, left: 59 },
        { top: 29, left: 59 },
        { top: 25, left: 66 },
        { top: 30, left: 66 },
        { top: 35, left: 66 },
        { top: 40, left: 66 }
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
                    alert(closedMessage);
                });
            } else {
                const isTaken = allTakenIndices.includes(index);
                btn.className = `seat-btn ${isTaken ? 'unavailable' : 'available'}`;
                btn.title = `Plaats ${index + 1} (${isTaken ? 'Niet beschikbaar' : 'Beschikbaar'})`;
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (isTaken) {
                        alert('Deze plaats is al gereserveerd.');
                    } else {
                        alert(`Je hebt plaats ${index + 1} geselecteerd.`);
                    }
                });
            }

            seatsOverlay.appendChild(btn);
        });
    }

    /**
     * CONFIG-BASED AVAILABILITY LOGIC
     */
    function initAvailability() {
        const data = window.BART_BEZETTING;
        if (data) {
            setupDatePicker(data);
            handleDateChange(dateInput.value, data);
        }
    }

    function handleDateChange(selectedDate, data) {
        const dayInfo = data.find(item => item.datum === selectedDate);
        if (dayInfo) {
            if (!dayInfo.open) {
                // Show message box
                messageContent.textContent = dayInfo.bericht || "Deze locatie is vandaag gesloten.";
                messageWrapper.style.display = 'block';
                // Render all seats red
                renderSeats(selectedDate, 11, false, dayInfo.bericht || "Deze locatie is vandaag gesloten.");
            } else {
                // Hide message box
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
