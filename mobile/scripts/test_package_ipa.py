from pathlib import Path
import stat
import tempfile
import unittest
import zipfile

from package_ipa import package_ipa
from test_verify_ipa import contents


def populate(app):
    for name, data in contents().items():
        path = app / name.split('.app/', 1)[1]
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(data)


class PackageTests(unittest.TestCase):
    def test_discovers_distinct_application_and_resources(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            app = root / 'Otra.app'
            (app / 'assets').mkdir(parents=True)
            populate(app)
            (app / 'assets/icon.png').write_bytes(b'local-image')
            output = root / 'otra.ipa'
            package_ipa(root, output)
            with zipfile.ZipFile(output) as archive:
                self.assertEqual(archive.read('Payload/Otra.app/assets/icon.png'), b'local-image')
                self.assertEqual({name.split('/')[1] for name in archive.namelist()}, {'Otra.app'})

    def test_rejects_missing_and_ambiguous_origin(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            output = root / 'test.ipa'
            with self.assertRaisesRegex(ValueError, 'ausente'):
                package_ipa(root / 'missing.app', output)
            with self.assertRaisesRegex(ValueError, 'exactamente una'):
                package_ipa(root, output)
            (root / 'Uno.app').mkdir()
            (root / 'Dos.app').mkdir()
            with self.assertRaisesRegex(ValueError, 'exactamente una'):
                package_ipa(root, output)
            self.assertFalse(output.exists())

    def test_preserves_contents_and_executable_permissions(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            app = root / 'Saluteca.app'
            app.mkdir()
            populate(app)
            executable = app / 'Saluteca'
            original = executable.read_bytes()
            executable.chmod(0o755)
            output = root / 'test.ipa'
            package_ipa(app, output)
            with zipfile.ZipFile(output) as archive:
                self.assertEqual(archive.read('Payload/Saluteca.app/Saluteca'), original)
                self.assertEqual(archive.getinfo('Payload/Saluteca.app/Saluteca').external_attr >> 16 & 0o777, executable.stat().st_mode & 0o777)

    def test_invalid_application_does_not_deliver_output(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            app = root / 'Incomplete.app'
            app.mkdir()
            output = root / 'bad.ipa'
            with self.assertRaisesRegex(ValueError, 'Info.plist'):
                package_ipa(app, output)
            self.assertFalse(output.exists())
            self.assertEqual(list(root.glob('*.tmp')), [])

    def test_preserves_framework_symlink(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            app = root / 'Saluteca.app'
            app.mkdir()
            populate(app)
            framework = app / 'Frameworks/Hermes.framework'
            (framework / 'Versions/A').mkdir(parents=True)
            (framework / 'Versions/A/Hermes').write_bytes(b'framework')
            try:
                (framework / 'Hermes').symlink_to('Versions/A/Hermes')
            except OSError as error:
                self.skipTest(f'Enlaces requieren permisos del SO: {error}')
            output = root / 'linked.ipa'
            package_ipa(app, output)
            with zipfile.ZipFile(output) as archive:
                name = 'Payload/Saluteca.app/Frameworks/Hermes.framework/Hermes'
                self.assertEqual(archive.read(name), b'Versions/A/Hermes')
                self.assertTrue(stat.S_ISLNK(archive.getinfo(name).external_attr >> 16))


if __name__ == '__main__':
    unittest.main()
