#!/usr/bin/env bash
set -euo pipefail
# macOS only. Build outside versioned files; requires installed Xcode SDK.
mobile_dir="$(cd "$(dirname "$0")/.." && pwd)"
ocr_temp="$(mktemp -d)"
trap 'rm -rf "$ocr_temp"' EXIT
xcrun swiftc -parse-as-library \
  "$mobile_dir/modules/saluteca-preview/ios/SalutecaOcrEngine.swift" \
  "$mobile_dir/scripts/native-ocr-fixtures.swift" \
  -o "$ocr_temp/native-ocr-fixtures"
"$ocr_temp/native-ocr-fixtures"
