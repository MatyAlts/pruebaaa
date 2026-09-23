"""Comprobar un IPA candidato para firma local; no demuestra instalación."""
import argparse
from pathlib import PurePosixPath
import plistlib
import struct
import zipfile


def _is_arm64(data):
    # Universal/FAT: comprobar el slice ARM64 real, no solo la tabla.
    if len(data) >= 8:
        magic, count = struct.unpack_from('>2I', data)
        if magic in (0xCAFEBABE, 0xCAFEBABF):
            width = 20 if magic == 0xCAFEBABE else 32
            if count > (len(data) - 8) // width:
                return False
            for index in range(count):
                offset = 8 + index * width
                if width == 20:
                    cpu, _, start, size, _ = struct.unpack_from('>5I', data, offset)
                else:
                    cpu, _, start, size, _, _ = struct.unpack_from('>2I2Q2I', data, offset)
                if cpu == 0x0100000C and start >= 8 + count * width and start + size <= len(data):
                    return _is_arm64_thin(data[start:start + size])
            return False
    return _is_arm64_thin(data)


def _is_arm64_thin(data):
    # Mach-O de 64 bits, CPU_TYPE_ARM64 y MH_EXECUTE.
    if len(data) < 32:
        return False
    for order in ('<', '>'):
        magic, cpu, _, kind = struct.unpack_from(order + '4I', data)
        if magic == 0xFEEDFACF:
            return cpu == 0x0100000C and kind == 2
    return False


def verify_ipa(path):
    try:
        with zipfile.ZipFile(path) as archive:
            entries = archive.namelist()
            if len(entries) != len(set(entries)):
                raise ValueError('Estructura ZIP: entradas duplicadas')
            apps = set()
            for name in entries:
                parts = PurePosixPath(name).parts
                if name.startswith('/') or '..' in parts or '\\' in name:
                    raise ValueError('Estructura Payload inválida')
                if len(parts) >= 2 and parts[0] == 'Payload' and parts[1].endswith('.app'):
                    apps.add(parts[1])
                elif name != 'Payload/':
                    raise ValueError('Estructura Payload inválida')
            if len(apps) != 1:
                raise ValueError('Payload debe contener exactamente una aplicación .app')
            app = apps.pop()
            prefix = 'Payload/' + app + '/'
            try:
                info = plistlib.loads(archive.read(prefix + 'Info.plist'))
            except (KeyError, ValueError, plistlib.InvalidFileException) as error:
                raise ValueError('Info.plist ausente o inválido') from error
            if not isinstance(info, dict):
                raise ValueError('Info.plist inválido')
            if info.get('DTPlatformName') != 'iphoneos' or info.get('CFBundleSupportedPlatforms') != ['iPhoneOS']:
                raise ValueError('Plataforma incompatible: requiere iphoneos/iPhoneOS, no simulador')
            executable = info.get('CFBundleExecutable')
            if not isinstance(executable, str) or not executable or '/' in executable or '\\' in executable or executable in ('.', '..'):
                raise ValueError('Ejecutable declarado inválido')
            try:
                binary = archive.read(prefix + executable)
            except KeyError as error:
                raise ValueError('Ejecutable ausente') from error
            if not _is_arm64(binary):
                raise ValueError('Ejecutable debe ser Mach-O ARM64 para dispositivo')
            try:
                bundle = archive.read(prefix + 'main.jsbundle')
            except KeyError as error:
                raise ValueError('Bundle main.jsbundle ausente') from error
            if not bundle:
                raise ValueError('Bundle main.jsbundle vacío')
            bad = archive.testzip()
            if bad:
                raise ValueError(f'ZIP corrupto: {bad}')
            return {'app': app, 'executable': executable, 'platform': 'iphoneos', 'bundle_bytes': len(bundle)}
    except (zipfile.BadZipFile, EOFError) as error:
        raise ValueError('ZIP inválido o corrupto') from error


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('ipa')
    args = parser.parse_args()
    try:
        info = verify_ipa(args.ipa)
    except (ValueError, OSError) as error:
        parser.exit(1, f'IPA rechazado: {error}\n')
    print(f"Candidato para firma local: {info['app']} ({info['platform']}); instalación pendiente.")


if __name__ == '__main__':
    main()
