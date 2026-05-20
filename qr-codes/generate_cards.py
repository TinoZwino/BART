import os
import re
import xml.etree.ElementTree as ET

# Configuration
SCRIPT_JS_PATH = "../script.js"
TEMPLATE_PATH = "kaart.svg"
OUTPUT_DIR = "output"

# Namespaces
NAMESPACES = {
    'svg': 'http://www.w3.org/2000/svg',
    'inkscape': 'http://www.inkscape.org/namespaces/inkscape',
    'xlink': 'http://www.w3.org/1999/xlink'
}

def get_seat_count():
    """Parses script.js to find the number of seats in garageSeats."""
    script_path = os.path.abspath(os.path.join(os.path.dirname(__file__), SCRIPT_JS_PATH))
    if not os.path.exists(script_path):
        print(f"Error: Could not find script.js at {script_path}")
        return 0
    
    with open(script_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    match = re.search(r'const\s+garageSeats\s*=\s*\[(.*?)\];', content, re.DOTALL)
    if not match:
        return 0
    
    return len(re.findall(r'\{[^}]+\}', match.group(1)))

def generate_cards(count):
    """Generates a customized SVG card for each seat."""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    template_abs_path = os.path.join(script_dir, TEMPLATE_PATH)
    output_dir_abs_path = os.path.join(script_dir, OUTPUT_DIR)

    if not os.path.exists(template_abs_path):
        print(f"Error: Template {template_abs_path} not found.")
        return

    # Ensure output directory exists
    if not os.path.exists(output_dir_abs_path):
        os.makedirs(output_dir_abs_path)
        print(f"Created directory: {output_dir_abs_path}")

    # Register namespaces to keep the output clean and compatible with Inkscape
    for prefix, uri in NAMESPACES.items():
        if prefix != 'svg':
            ET.register_namespace(prefix, uri)
        else:
            ET.register_namespace('', uri)
    
    # We load the template once
    tree = ET.parse(template_abs_path)
    root = tree.getroot()

    label_attr = f"{{{NAMESPACES['inkscape']}}}label"
    xlink_href = f"{{{NAMESPACES['xlink']}}}href"

    for i in range(1, count + 1):
        # Update elements in the tree
        found_number = False
        found_qr = False

        for elem in root.iter():
            label = elem.get(label_attr)
            
            # 1. Update Seat Number
            if label == 'number':
                # The label is on the <text> element, we need to update the <tspan> inside it
                # Or if the text is directly in the element (depending on Inkscape version)
                # We'll look for any tspan or just set text if no children
                tspan = elem.find('.//svg:tspan', NAMESPACES)
                if tspan is not None:
                    tspan.text = str(i)
                else:
                    elem.text = str(i)
                found_number = True

            # 2. Update QR Code Image
            if label == 'qr-code':
                new_href = f"qr-code-{i:02d}.png"
                elem.set(xlink_href, new_href)
                found_qr = True

        if not found_number:
            print(f"Warning: Could not find element with inkscape:label='number' for seat {i}")
        if not found_qr:
            print(f"Warning: Could not find element with inkscape:label='qr-code' for seat {i}")

        output_filename = os.path.join(output_dir_abs_path, f"kaart-{i}.svg")
        tree.write(output_filename, encoding='utf-8', xml_declaration=True)
        print(f"Generated {output_filename}")

if __name__ == "__main__":
    count = get_seat_count()
    if count > 0:
        print(f"Generating cards for {count} seats...")
        generate_cards(count)
    else:
        print("No seats found.")
