#!/bin/bash
# Entry point of the aurora-dev webmail container. See compose.yaml (same dir).
set -euo pipefail

# 1. Copy the checkout (read-only at /app) into /work. Excluded: the host's REAL
#    config (never used here), git metadata, node_modules, temp/ and logs/
#    contents, and skins/aurora, which is bind-mounted live at /work/skins/aurora.
rsync -a --delete \
    --exclude '/config/config.inc.php' \
    --exclude '/.git' \
    --exclude '/node_modules' \
    --exclude '/temp/*' \
    --exclude '/logs/*' \
    --exclude '/skins/aurora' \
    /app/ /work/

# 1b. TinyMCE: the checkout has no program/js/tinymce (bin/install-jsdeps.sh was
#     never run for it), so the compose editor fails ("tinymce is not defined")
#     and Send does nothing. node_modules already holds the exact version that
#     jsdeps.json pins (5.10.9); place it where install-jsdeps would. No download.
if [ ! -f /work/program/js/tinymce/tinymce.min.js ] && [ -d /app/node_modules/tinymce ]; then
    rsync -a /app/node_modules/tinymce/ /work/program/js/tinymce/
fi

# 2. Throwaway config: SQLite inside the container, GreenMail for IMAP/SMTP.
cp /dev-config/config.inc.php /work/config/config.inc.php

# Safety net: refuse to start unless the effective config is the dev one.
if ! grep -q 'AURORA-DEV-INSTANCE' /work/config/config.inc.php; then
    echo 'refusing to start: /work/config/config.inc.php is not the aurora-dev config' >&2
    exit 1
fi

mkdir -p /work/temp /work/logs
chmod 777 /work/temp /work/logs

# 3. Database: none to create. Roundcube's SQLite driver builds the schema itself
#    when the file does not exist yet, and the file lives inside the container
#    (/work/temp), so every `up` starts from an empty database.

# 4. Serve public_html exactly like the browser tests do (tests/Browser/TestCase.php).
cd /work/public_html
echo 'aurora-dev: serving on :8000'
exec php -S 0.0.0.0:8000
