#!/usr/bin/env bash
set -euo pipefail

HERDR_HOME="${HOME}/.config/herdr-app"
TARGET_DIR="${HERDR_HOME}/mods/mod-manager"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_DIR="${SCRIPT_DIR}/mods/mod-manager"

if [ ! -d "${SOURCE_DIR}" ]; then
  echo "Error: Source directory not found: ${SOURCE_DIR}" >&2
  exit 1
fi

echo "==> Installing mod-manager to ${TARGET_DIR} ..."
mkdir -p "${TARGET_DIR}"
cp -R "${SOURCE_DIR}/"* "${TARGET_DIR}/"

echo "==> Verifying mod with herdr-app check..."
if command -v herdr-app >/dev/null 2>&1; then
  herdr-app check "${TARGET_DIR}"
  echo "==> mod-manager installed and verified successfully!"
else
  echo "==> Copied files. (herdr-app command not found in PATH to verify)"
fi

echo ""
echo "To open Mod Manager:"
echo "  1. Run command: herdr-app do mod.open --name mod-manager"
echo "  2. Or bind a shortcut in keys.json, e.g.: \"ctrl-shift-m\": \"mod.open:mod-manager\""
echo "  3. Or add a Mods button into your sidebar mod!"
echo ""
echo "Enjoy managing your Herdr mods!"
