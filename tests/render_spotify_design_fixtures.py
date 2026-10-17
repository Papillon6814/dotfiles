"""Render owned, deliberately incomplete UI samples. No external assets/fonts."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent / 'fixtures/spotify-design'


def render(dark):
    image = Image.new('RGB', (390, 680), '#181818' if dark else '#ffffff')
    draw = ImageDraw.Draw(image)
    text = '#ffffff' if dark else '#10223c'
    card = '#282828' if dark else '#eef4fc'
    accent = '#50d98a' if dark else '#1e65b8'
    small = ImageFont.load_default(size=17)
    title = ImageFont.load_default(size=30)
    draw.text((24, 30), 'Saved notes' if dark else 'Your booking', fill=text, font=title)
    draw.text((24, 85), 'Example only - not an actual product', fill=text, font=small)
    for y, name in [(140, 'Evening session'), (248, 'Weekend session')]:
        draw.rounded_rectangle((20, y, 370, y + 88), radius=14, fill=card)
        draw.text((38, y + 20), name, fill=text, font=small)
        draw.text((38, y + 50), 'Open details', fill=text, font=small)
    for x, label in [(24, 'Save'), (208, 'Delete')]:
        draw.rounded_rectangle((x, 390, x + 158, 438), radius=20, fill=accent)
        draw.text((x + 34, 405), label, fill='#000000' if dark else '#ffffff', font=small)
    draw.rectangle((342, 485, 366, 509), outline=text, width=2)
    draw.text((24, 590), 'Visual sample only; behavior is unspecified', fill=text, font=small)
    return image


if __name__ == '__main__':
    for name, dark in [('ui-light.png', False), ('ui-dark.png', True)]:
        path = ROOT / name
        if path.exists():
            raise SystemExit(f'Refusing to overwrite existing fixture: {path}')
        with path.open('xb') as output:
            render(dark).save(output, format='PNG')
        print(path)
