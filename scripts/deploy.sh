#!/usr/bin/env bash
# Build the static export and mirror it to Hostinger over FTP(S).
#
# Content only changes when you re-seed the DB (`npm run seed:models`, enrich:*),
# so deployment is a manual, local step — no cloud runner, no DATABASE_URL in CI.
#
# Credentials are read from scripts/.env.deploy (gitignored). Required vars:
#   FTP_HOST    e.g. ftp.czechsubaruclub.cz
#   FTP_USER    Hostinger FTP username
#   FTP_PASS    Hostinger FTP password
#   FTP_DIR     remote target dir, e.g. /public_html  (or /domains/czechsubaruclub.cz/public_html)
set -euo pipefail

cd "$(dirname "$0")/.."

ENV_FILE="scripts/.env.deploy"
if [[ -f "$ENV_FILE" ]]; then
  set -a; source "$ENV_FILE"; set +a
fi

: "${FTP_HOST:?set FTP_HOST in scripts/.env.deploy}"
: "${FTP_USER:?set FTP_USER in scripts/.env.deploy}"
: "${FTP_PASS:?set FTP_PASS in scripts/.env.deploy}"
: "${FTP_DIR:?set FTP_DIR in scripts/.env.deploy}"

echo "▶ Building static export…"
npm run build

echo "▶ Uploading out/ → ${FTP_HOST}:${FTP_DIR}"
lftp -u "${FTP_USER},${FTP_PASS}" "${FTP_HOST}" <<EOF
set ftp:ssl-allow true
set ssl:verify-certificate no
mirror --reverse --delete --verbose --parallel=4 \
  --exclude-glob .git/ \
  out/ ${FTP_DIR}/
bye
EOF

echo "✓ Deploy hotov."
