"""Empaquetar una aplicación iOS preservando modos y enlaces simbólicos."""
import argparse
from pathlib import Path
import stat
import tempfile
import zipfile
from verify_ipa import verify_ipa


def package_ipa(source, output):
    source = Path(source)
    if not source.is_dir():
        raise ValueError('Origen de aplicación ausente')
    apps = [source] if source.suffix == '.app' else list(source.glob('*.app'))
    if len(apps) != 1 or not apps[0].is_dir():
        raise ValueError('El origen debe contener exactamente una aplicación .app')
    app = apps[0]
    output = Path(output)
    output.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(dir=output.parent, suffix='.tmp', delete=False) as handle:
        temporary = Path(handle.name)
    try:
        _write_archive(app, temporary)
        verify_ipa(temporary)
        temporary.replace(output)
    finally:
        temporary.unlink(missing_ok=True)
    return output


def _write_archive(app, output):
    with zipfile.ZipFile(output, 'w', zipfile.ZIP_DEFLATED) as archive:
        for path in [app, *sorted(app.rglob('*'))]:
            name = 'Payload/' + path.relative_to(app.parent).as_posix()
            mode = path.lstat().st_mode
            info = zipfile.ZipInfo(name + ('/' if stat.S_ISDIR(mode) else ''))
            info.create_system = 3
            info.external_attr = mode << 16
            info.compress_type = zipfile.ZIP_DEFLATED
            data = str(path.readlink()).encode() if path.is_symlink() else b'' if path.is_dir() else path.read_bytes()
            archive.writestr(info, data)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source')
    parser.add_argument('output')
    args = parser.parse_args()
    try:
        package_ipa(args.source, args.output)
    except (ValueError, OSError) as error:
        parser.exit(1, f'Error de empaquetado: {error}\n')


if __name__ == '__main__':
    main()
