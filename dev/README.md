Aurora development tools
========================

Not part of the shipped skin: the whole `dev/` folder is excluded from release
tarballs via `../.gitattributes` (`export-ignore`).

| Path | What it is |
|------|------------|
| `instance/` | A local Roundcube to look at Aurora in the real app (Docker). |
| `audit/contrast.js` | WCAG contrast audit of every colour pair Aurora puts on screen. |
| `audit/accent-text-scan.js` | Finds raw accent fills used as text colours in the built CSS. |
| `live-checks.js` | Helpers to paste into the running instance's browser console. |
| `thumbnail.js` | Draws `thumbnail.png` for the skin chooser (rerun after palette changes). |

Everything here assumes this repository sits at `skins/aurora` of a Roundcube
checkout: the audits read Elastic's variables, and the instance serves that
checkout. Run commands from the Roundcube root. The audits need `npm install` in
either folder (they use `less`); the instance needs Docker.

Local instance
--------------

```sh
docker compose -f skins/aurora/dev/instance/compose.yaml up -d
# http://localhost:8765 — user test-message-rendering@localhost, any password
docker compose -f skins/aurora/dev/instance/compose.yaml down
```

It uses the two images from the repo's own `.ci/compose.yaml`: Roundcube's CI
test runner and GreenMail (authentication disabled, preloaded with the 16
messages from `tests/MessageRendering`).

**It never touches your real Roundcube.** The checkout is mounted read-only and
copied inside the container *without* `config/config.inc.php`; a throwaway
config (SQLite inside the container) is copied in, and `start.sh` refuses to
start unless the active config carries the `AURORA-DEV-INSTANCE` marker. A test
run against the real config could otherwise drop the real database.

`skins/aurora` is mounted live: rebuild the CSS and reload the page. Recreating
the container starts with an empty database (log in again).

To check Aurora with plugins, list them when starting the instance:

```sh
AURORA_DEV_PLUGINS=acl,enigma,help,managesieve docker compose -f skins/aurora/dev/instance/compose.yaml up -d
```

If the checkout has no `program/js/tinymce` (`bin/install-jsdeps.sh` not run),
`start.sh` copies the matching TinyMCE from `node_modules`; without it the
compose editor fails to initialise and Send silently does nothing.

Audits
------

```sh
node skins/aurora/dev/audit/contrast.js             # every pair, exit 1 on any failure
node skins/aurora/dev/audit/contrast.js --fails     # failures only
node skins/aurora/dev/audit/contrast.js try.less    # try candidate values without editing tokens.less
node skins/aurora/dev/audit/accent-text-scan.js     # raw accent fill used as a text colour?
node skins/aurora/dev/audit/accent-text-scan.js --diff old/styles.min.css
```

`contrast.js` reads the values through LESS from Elastic's variables and
Aurora's `tokens.less`, so `mix()`, `lighten()` and friends are computed by LESS
itself, and translucent layers are composited onto their real ground. A
candidate file is appended after `tokens.less`; LESS's last-definition-wins rule
lets it override any value. Add a pair whenever a new colour reaches the screen.

The audits check values; they cannot see the cascade. When a change could be
overridden by a more specific Elastic rule (dark mode is full of them), confirm
it in the instance: `live-checks.js` reports computed colours, focus indicators
and hit-testing from the real DOM.
