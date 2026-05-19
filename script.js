document.addEventListener('DOMContentLoaded', () => {
    const seatsOverlay = document.getElementById('seats-overlay');
    const floorplanContainer = document.getElementById('floorplan-container');
    const dateInput = document.getElementById('start-date');

    /**
     * EXPERT COORDINATE SYSTEM:
     * Precision placement based on user calibration.
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

    // Create seat buttons
    function renderSeats() {
        seatsOverlay.innerHTML = '';
        garageSeats.forEach((pos, index) => {
            const btn = document.createElement('button');
            btn.className = 'seat-btn';
            btn.style.top = `${pos.top}%`;
            btn.style.left = `${pos.left}%`;
            btn.textContent = index + 1;
            btn.title = `Plaats ${index + 1}`;

            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                alert('Plaats is al gereserveerd');
            });

            seatsOverlay.appendChild(btn);
        });
    }

    renderSeats();

    /**
     * AVAILABILITY LOGIC (CORS-FREE)
     * We use the global BART_BEZETTING constant from bezetting.js.
     * This ensures the app works perfectly when opened as a local file.
     */
    function initAvailability() {
        if (typeof BART_BEZETTING !== 'undefined') {
            setupDatePicker(BART_BEZETTING);
        } else {
            console.error('Fout: BART_BEZETTING is niet gedefinieerd in bezetting.js');
        }
    }

    function setupDatePicker(data) {
        const dates = data.map(item => item.datum).sort();
        if (dates.length > 0) {
            dateInput.min = dates[0];
            dateInput.max = dates[dates.length - 1];
        }

        dateInput.addEventListener('change', () => {
            const selectedDate = dateInput.value;
            const dayInfo = data.find(item => item.datum === selectedDate);

            if (dayInfo) {
                if (!dayInfo.open) {
                    alert(dayInfo.bericht || "Deze datum is niet beschikbaar.");
                } else {
                    console.log(`Drukte op ${selectedDate}: ${dayInfo.drukte}`);
                }
            } else {
                alert("Deze datum staat niet in ons systeem. Kies een andere datum.");
                dateInput.value = dates[0];
            }
        });
    }

    initAvailability();

    /**
     * CALIBRATION TOOL (DEVELOPER MODE)
     */
    floorplanContainer.addEventListener('mousedown', (e) => {
        const rect = floorplanContainer.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        console.log(`Expert Coordinate Found: { top: ${Math.round(y)}, left: ${Math.round(x)} }`);
    });
});
