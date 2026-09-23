from pathlib import Path
import plistlib
import struct
import tempfile
import unittest
import zipfile

from verify_ipa import verify_ipa


def executable(cpu=0x0100000C):
    return struct.pack('<8I', 0xFEEDFACF, cpu, 0, 2, 0, 0, 0, 0)


def contents(platform='iphoneos', plist_format=plistlib.FMT_BINARY):
    return {
        'Payload/Saluteca.app/Info.plist': plistlib.dumps({
            'CFBundleExecutable': 'Saluteca', 'DTPlatformName': platform,
            'CFBundleSupportedPlatforms': ['iPhoneOS' if platform == 'iphoneos' else 'iPhoneSimulator'],
        }, fmt=plist_format),
        'Payload/Saluteca.app/Saluteca': executable(),
        'Payload/Saluteca.app/main.jsbundle': b'\xc6\x1f\xbc\x03\xc1\x03\x19\x1f\x00\xff',
    }


def write_ipa(path, files):
    with zipfile.ZipFile(path, 'w') as archive:
        for name, data in files.items():
            archive.writestr(name, data)


class VerifyTests(unittest.TestCase):
    def test_accepts_universal_arm64_executable(self):
        files = contents()
        thin = executable()
        files['Payload/Saluteca.app/Saluteca'] = struct.pack('>7I', 0xCAFEBABE, 1, 0x0100000C, 0, 28, len(thin), 0) + thin
        self.assertEqual(self.check_files(files)['executable'], 'Saluteca')

    def test_accepts_fat64_and_rejects_invalid_slices(self):
        thin = executable()
        valid = struct.pack('>4I2Q2I', 0xCAFEBABF, 1, 0x0100000C, 0, 40, len(thin), 0, 0) + thin
        for binary, error in ((valid, None), (valid[:40], 'Ejecutable'),
                              (struct.pack('>2I', 0xCAFEBABE, 100), 'Ejecutable'),
                              (struct.pack('>7I', 0xCAFEBABE, 1, 0x0100000C, 0, 28, 32, 0) + executable(cpu=0x01000007), 'Ejecutable')):
            with self.subTest(binary=binary):
                files = contents()
                files['Payload/Saluteca.app/Saluteca'] = binary
                self.check_files(files, error)

    def check_files(self, files, error=None):
        with tempfile.TemporaryDirectory() as directory:
            ipa = Path(directory) / 'case.ipa'
            write_ipa(ipa, files)
            if error:
                with self.assertRaisesRegex(ValueError, error):
                    verify_ipa(ipa)
            else:
                return verify_ipa(ipa)

    def test_accepts_xml_plist_and_text_bundle(self):
        files = contents(plist_format=plistlib.FMT_XML)
        files['Payload/Saluteca.app/main.jsbundle'] = b'console.log("local");'
        self.assertEqual(self.check_files(files)['bundle_bytes'], 21)

    def test_rejects_arm64_simulator(self):
        self.check_files(contents(platform='iphonesimulator'), 'Plataforma incompatible')

    def test_rejects_missing_or_empty_bundle(self):
        for missing in (True, False):
            with self.subTest(missing=missing):
                files = contents()
                if missing:
                    del files['Payload/Saluteca.app/main.jsbundle']
                else:
                    files['Payload/Saluteca.app/main.jsbundle'] = b''
                self.check_files(files, 'Bundle main.jsbundle')

    def test_rejects_missing_or_wrong_architecture_executable(self):
        for data in (None, executable(cpu=0x01000007), b'not-mach-o'):
            with self.subTest(data=data):
                files = contents()
                if data is None:
                    del files['Payload/Saluteca.app/Saluteca']
                else:
                    files['Payload/Saluteca.app/Saluteca'] = data
                self.check_files(files, 'Ejecutable')

    def test_rejects_payload_errors(self):
        for files in ({}, {'Saluteca.app/Info.plist': b'bad'},
                      {**contents(), 'Payload/Otra.app/file': b'other'},
                      {**contents(), 'Payload/Saluteca.app/../outside': b'bad'}):
            with self.subTest(files=list(files)):
                self.check_files(files, 'Payload')

    def test_rejects_missing_or_invalid_plist(self):
        for data in (None, b'bad-plist', plistlib.dumps(['not-a-dict'])):
            with self.subTest(data=data):
                files = contents()
                if data is None:
                    del files['Payload/Saluteca.app/Info.plist']
                else:
                    files['Payload/Saluteca.app/Info.plist'] = data
                self.check_files(files, 'Info.plist')

    def test_rejects_invalid_zip(self):
        with tempfile.TemporaryDirectory() as directory:
            ipa = Path(directory) / 'bad.ipa'
            ipa.write_bytes(b'not a zip')
            with self.assertRaisesRegex(ValueError, 'ZIP inválido'):
                verify_ipa(ipa)

    def test_rejects_duplicate_entries(self):
        with tempfile.TemporaryDirectory() as directory:
            ipa = Path(directory) / 'duplicate.ipa'
            write_ipa(ipa, contents())
            import warnings
            with warnings.catch_warnings():
                warnings.simplefilter('ignore', UserWarning)
                with zipfile.ZipFile(ipa, 'a') as archive:
                    archive.writestr('Payload/Saluteca.app/main.jsbundle', b'other')
            with self.assertRaisesRegex(ValueError, 'duplicadas'):
                verify_ipa(ipa)

    def test_rejects_conflicting_platform_metadata(self):
        files = contents()
        info = plistlib.loads(files['Payload/Saluteca.app/Info.plist'])
        info['CFBundleSupportedPlatforms'] = ['iPhoneSimulator']
        files['Payload/Saluteca.app/Info.plist'] = plistlib.dumps(info)
        self.check_files(files, 'Plataforma incompatible')

    def test_accepts_device_binary_plist_and_hermes_bundle(self):
        with tempfile.TemporaryDirectory() as directory:
            ipa = Path(directory) / 'device.ipa'
            write_ipa(ipa, contents())
            self.assertEqual(verify_ipa(ipa)['app'], 'Saluteca.app')


if __name__ == '__main__':
    unittest.main()
