from pathlib import Path
import tempfile
import unittest

from PIL import Image
from generate_app_icon import generate_app_icon


class IconTests(unittest.TestCase):
    def test_converts_rectangular_symbol_to_centered_opaque_rgb(self):
        with tempfile.TemporaryDirectory() as directory:
            source = Path(directory) / 'source.png'
            output = Path(directory) / 'icon.png'
            Image.new('RGBA', (200, 100), (47, 65, 106, 255)).save(source)
            generate_app_icon(source, output)
            with Image.open(output) as icon:
                self.assertEqual(icon.size, (1024, 1024))
                self.assertEqual(icon.mode, 'RGB')
                self.assertEqual(icon.getpixel((0, 0)), (255, 255, 255))
                self.assertEqual(icon.getpixel((512, 512)), (47, 65, 106))
                # Wider source stays wider; the symbol must not stretch to a square.
                self.assertEqual(icon.getpixel((100, 512)), (47, 65, 106))
                self.assertEqual(icon.getpixel((512, 100)), (255, 255, 255))

    def test_flattens_alpha_over_white_and_preserves_the_original_colors(self):
        with tempfile.TemporaryDirectory() as directory:
            source = Path(directory) / 'source.png'
            output = Path(directory) / 'icon.png'
            original = Image.new('RGBA', (40, 40), (0, 0, 0, 0))
            original.paste((122, 187, 133, 255), (10, 10, 30, 30))
            original.save(source)
            generate_app_icon(source, output)
            with Image.open(output) as icon:
                self.assertEqual(icon.mode, 'RGB')
                self.assertEqual(icon.getpixel((512, 512)), (122, 187, 133))
                self.assertEqual(icon.getpixel((120, 120)), (255, 255, 255))

    def test_rejects_invalid_image_without_writing_an_icon(self):
        with tempfile.TemporaryDirectory() as directory:
            source = Path(directory) / 'broken.ico'
            output = Path(directory) / 'icon.png'
            source.write_bytes(b'not an image')
            with self.assertRaises(OSError):
                generate_app_icon(source, output)
            self.assertFalse(output.exists())

    def test_rejects_missing_source_without_writing_an_icon(self):
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory) / 'icon.png'
            with self.assertRaises(FileNotFoundError):
                generate_app_icon(Path(directory) / 'missing.ico', output)
            self.assertFalse(output.exists())


if __name__ == '__main__':
    unittest.main()
