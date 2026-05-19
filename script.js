document.addEventListener("DOMContentLoaded", () => {
	const seatsOverlay = document.getElementById("seats-overlay")
	const floorplanContainer = document.getElementById("floorplan-container")

	/**
	 * EXPERT COORDINATE SYSTEM:
	 * Reset for the new SVG floorplan.
	 * Please use the Calibration Tool (click the map) to find the correct spots
	 * and update these values.
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
	]

	// Create seat buttons
	garageSeats.forEach((pos, index) => {
		const btn = document.createElement("button")
		btn.className = "seat-btn"
		btn.style.top = `${pos.top}%`
		btn.style.left = `${pos.left}%`
		btn.textContent = index + 1
		btn.title = `Plaats ${index + 1}`

		btn.addEventListener("click", (e) => {
			e.stopPropagation() // Prevent trigger calibration tool
			alert("Plaats is al gereserveerd")
		})

		seatsOverlay.appendChild(btn)
	})

	/**
	 * CALIBRATION TOOL (DEVELOPER MODE)
	 * Click anywhere on the map to see the exact percentage coordinates in the console.
	 * Use these to perfectly place your seats.
	 */
	floorplanContainer.addEventListener("mousedown", (e) => {
		const rect = floorplanContainer.getBoundingClientRect()

		// Calculate relative coordinates in percentage
		const x = ((e.clientX - rect.left) / rect.width) * 100
		const y = ((e.clientY - rect.top) / rect.height) * 100

		console.log(
			`Expert Coordinate Found: { top: ${Math.round(y)}, left: ${Math.round(x)} }`,
		)
	})

	// Set default date to today
	const dateInput = document.getElementById("start-date")
	if (dateInput) {
		const today = new Date().toISOString().split("T")[0]
		dateInput.value = today
	}
})
