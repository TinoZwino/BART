import qrcode
import os
import re

def get_garage_seats():
    # Path to script.js relative to this script
    script_path = os.path.join('..', 'script.js')
    
    try:
        with open(script_path, 'r') as f:
            content = f.read()
            
        # Look for the garageSeats array
        # This is a bit brittle but should work for the current format
        match = re.search(r'const garageSeats = \[(.*?)\];', content, re.DOTALL)
        if match:
            seats_content = match.group(1)
            # Count the number of { top: ..., left: ... } blocks
            seat_count = len(re.findall(r'\{', seats_content))
            return seat_count
    except Exception as e:
        print(f"Error reading script.js: {e}")
        
    return 0

def generate_qr_codes():
    base_url = "https://tinozwino.github.io/BART?{}"
    output_dir = "out"
    
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        print(f"Created directory: {output_dir}")

    seat_count = get_garage_seats()
    if seat_count == 0:
        print("No seats found in script.js. Please check the file path and format.")
        return

    print(f"Generating {seat_count} QR codes...")

    for i in range(1, seat_count + 1):
        url = base_url.format(i)
        
        # Create QR code
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(url)
        qr.make(fit=True)

        img = qr.make_image(fill_color="black", back_color="white")
        
        # Save image
        file_path = os.path.join(output_dir, f"{i}.png")
        img.save(file_path)
        print(f"Generated: {file_path} -> {url}")

    print("Done!")

if __name__ == "__main__":
    generate_qr_codes()
