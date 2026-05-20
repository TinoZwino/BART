import os
import re
from svglib.svglib import svg2rlg
from reportlab.graphics import renderPDF
from reportlab.pdfgen import canvas

# Configuration
OUTPUT_FILENAME = "cards.pdf"

def mm_to_pt(val):
    """Converts millimeters to points (ReportLab's unit)."""
    return val * 72.0 / 25.4

def get_sorted_svg_files(directory):
    """Finds all kaart-n.svg files and sorts them numerically."""
    pattern = re.compile(r"^kaart-(\d+)\.svg$")
    files = []
    for f in os.listdir(directory):
        match = pattern.match(f)
        if match:
            files.append((int(match.group(1)), f))
    
    # Sort by the card number
    files.sort(key=lambda x: x[0])
    return [f[1] for f in files]

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    output_dir = os.path.join(script_dir, "output")
    
    if not os.path.exists(output_dir):
        print(f"Error: Output directory {output_dir} does not exist.")
        return
        
    svg_files = get_sorted_svg_files(output_dir)
    if not svg_files:
        print("No SVG cards found in output folder. Please run generate_cards.py first.")
        return
        
    print(f"Found {len(svg_files)} SVG cards to compile.")

    # A4 Dimensions
    a4_width = mm_to_pt(210)
    a4_height = mm_to_pt(297)

    # Change working directory to output folder so reportlab resolves the
    # relative QR code PNG image paths correctly
    orig_cwd = os.getcwd()
    os.chdir(output_dir)
    
    pdf_path = OUTPUT_FILENAME
    c = canvas.Canvas(pdf_path, pagesize=(a4_width, a4_height))

    for idx, svg_file in enumerate(svg_files):
        print(f"Adding {svg_file}...")
        drawing = svg2rlg(svg_file)
        if drawing is None:
            print(f"Error parsing {svg_file}")
            continue

        # Page and cell math
        cell_idx = idx % 8
        if idx > 0 and cell_idx == 0:
            c.showPage() # Create a new page

        # Determine row and col in the 2x4 grid
        col = cell_idx % 2
        row = 3 - (cell_idx // 2)  # 3 is top row, 0 is bottom row

        # Center coordinates of the cell in points
        cx = mm_to_pt(col * 105 + 52.5)
        cy = mm_to_pt(row * 74.25 + 37.125)

        # Bottom of card points to center line (x = 105mm / 297.6pt):
        # - Left column (col = 0): center line is to the right, so bottom points right. Rotate counter-clockwise (90 degrees).
        # - Right column (col = 1): center line is to the left, so bottom points left. Rotate clockwise (-90 degrees).
        angle = 90 if col == 0 else -90

        c.saveState()
        # Translate to the center of the grid cell
        c.translate(cx, cy)
        # Rotate the canvas around the cell center
        c.rotate(angle)
        # Draw the drawing centered at (0,0) in the rotated system
        renderPDF.draw(drawing, c, -drawing.width / 2, -drawing.height / 2, showBoundary=False)
        c.restoreState()

    c.save()
    os.chdir(orig_cwd)
    
    final_pdf_path = os.path.join(output_dir, OUTPUT_FILENAME)
    print(f"Successfully generated combined PDF: {final_pdf_path}")

if __name__ == "__main__":
    main()
