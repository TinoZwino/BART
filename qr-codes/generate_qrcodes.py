import os
import re
import qrcode
from PIL import Image

# Configuration
BASE_URL = "https://tinozwino.github.io/BART/"
SCRIPT_JS_PATH = "../script.js"
OUTPUT_DIR = "output"

def get_seat_count():
    """Parses script.js to find the number of seats in garageSeats."""
    script_path = os.path.abspath(os.path.join(os.path.dirname(__file__), SCRIPT_JS_PATH))
    if not os.path.exists(script_path):
        print(f"Error: Could not find script.js at {script_path}")
        return 0
    
    with open(script_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Look for garageSeats = [ ... ];
    match = re.search(r'const\s+garageSeats\s*=\s*\[(.*?)\];', content, re.DOTALL)
    if not match:
        print("Error: Could not find garageSeats array in script.js")
        return 0
    
    seats_content = match.group(1)
    # Count the number of { top: ..., left: ... } occurrences
    seats = re.findall(r'\{[^}]+\}', seats_content)
    return len(seats)

def generate_qr_codes(count):
    """Generates transparent QR codes for the given number of seats."""
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)
        print(f"Created directory: {OUTPUT_DIR}")

    for i in range(1, count + 1):
        # The script.js handles URLs like ?1, #1, or /1
        # We'll use ?{i} as it's the most standard query param approach
        data = f"{BASE_URL}?{i}"
        
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(data)
        qr.make(fit=True)

        # Create image with white background initially
        img = qr.make_image(fill_color="black", back_color="white").convert("RGBA")
        
        # Make white background transparent
        datas = img.getdata()
        new_data = []
        for item in datas:
            # If it's white (or very close to white), make it transparent
            if item[0] > 240 and item[1] > 240 and item[2] > 240:
                new_data.append((255, 255, 255, 0))
            else:
                new_data.append(item)
        img.putdata(new_data)

        filename = f"qr-code-{i:02d}.png"
        filepath = os.path.join(OUTPUT_DIR, filename)
        img.save(filepath)
        print(f"Generated {filepath} for {data}")

if __name__ == "__main__":
    seat_count = get_seat_count()
    if seat_count > 0:
        print(f"Found {seat_count} seats in script.js")
        generate_qr_codes(seat_count)
    else:
        print("No seats found to generate QR codes for.")
