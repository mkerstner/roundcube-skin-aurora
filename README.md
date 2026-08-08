Roundcube Webmail Skin "Aurora"
===============================

Aurora is a modern, mobile-first refresh of Roundcube's **Elastic** skin.

It **extends** Elastic (`meta.json` → `"extends": "elastic"`) rather than forking
it: templates, `ui.js`, Bootstrap and the JavaScript dependencies are inherited
from the parent skin, so Aurora picks up upstream Elastic fixes automatically.
Aurora ships only what it changes — a design-token layer, component
refinements, a mobile layer, and an accessibility layer.

> **Status: active development.** The mobile layer, token system and
> accessibility layer are in place. The palette is being rolled out in stages —
> see [Palette](#palette) for what has landed and what has not.

---

Design intent
-------------

The skin is named after a light phenomenon, but its first palette shipped Open
Color indigo 5 (`#4c6ef5`) — probably the most-used "modern app blue" on the
web. It was a perfectly good colour that belonged to nobody.

The current design direction is to earn the name: give Aurora a hue of its own,
bias the neutrals toward it, and spend a small, explicitly bounded budget of
gradient and edge-light on the chrome. The working brief, in one line:

> **A mail client should feel calm and current. Joy belongs in the chrome, not
> in the message list.**

Roundcube is a dense, professional tool that people keep open all day. The
message list is where the work happens, so it stays deliberately plain —
unchanged density, unchanged type scale, no decoration competing with content.
Everything expressive happens at the edges.

Design principles
-----------------

**Neutrals are chosen, not inherited.**
A pure blue-grey reads as unconsidered. Aurora's greys carry a slight violet
bias toward the accent, so nothing reads as *coloured* — it reads as
deliberate. This is the single biggest lever on how current an interface feels,
and it costs nothing in legibility.

**Shadows have a hue.**
Elevation derives from a deep violet (`#1f184a`), not from near-black. Same
offsets, same blurs, same opacities — only the hue changes. It is the
difference between a box with a shadow and a surface that looks lit.

**Decoration runs on a fixed budget.**
Gradients are allowed on exactly four surfaces: the task rail / bottom nav,
primary buttons, avatar placeholders, and a faint header wash. Nowhere else.
A budget stated up front is what keeps "a bit more playful" from becoming
noise six months later.

**Accessibility constrains the palette, it does not review it.**
Every colour is checked before it ships, not after. Where a colour cannot meet
its target, the *usage* is constrained rather than the colour diluted — the
planned accent-teal is graphics-only in light mode because it reaches 3.74:1 on
white, short of the 4.5:1 needed for text. The constraint keeps it rare, which
keeps it a treat.

**Extend, don't fork.**
Every visual decision has to be expressible as a token override or an additive
rule on top of Elastic. This rules out some designs, and that is the point:
Aurora stays small, and upstream Elastic keeps improving underneath it.

What Aurora changes
-------------------

Aurora is a re-skin, not a re-build. The list below is the complete surface of
what differs; everything not mentioned is Elastic, unchanged.

### Visual language

| | Elastic | Aurora |
|---|---|---|
| Accent | `#37beff` cyan | `#4c6ef5` indigo (→ `#5b5bf5`, stage 2) |
| Link | `#00acff` | `#3b5bdb` (→ `#4a3fd6`, stage 2) |
| Ink | `#161b1d` green-black | `#171532` violet-black |
| Hairline | `#ddd` | `#e7e4f2` |
| Header bar | `#f4f4f4` grey fill | white, separated by a hairline |
| Content pane | `#fff` | `#fbfaff` — a canvas distinct from the surface |
| Task rail | `#2f3a3f` slate | `#1b2030` navy |
| Dark canvas | `#21292c` | `#0d0f1a` |
| Dark ink | `#c5d1d3` green-grey | `#d2d1e4` violet-grey |
| Semantic colours | `#ff5552` / `#41b849` / `#ffd452` | deepened for AA contrast |
| Elevation | hard borders on floating surfaces | four layered, hue-tinted shadow steps |
| Type | Roboto (webfont) | system UI stack, ~1.2 modular scale |
| Radii | Bootstrap defaults | softer, tokenised scale |

### Behaviour and structure

| | Elastic | Aurora |
|---|---|---|
| Phone task menu | hidden drawer behind a hamburger | persistent bottom tab bar |
| Empty content pane | Roundcube logo watermark | empty pane |
| Selected list row | background tint; pale focus bar only while the list has focus | accent gutter that persists when focus moves to the preview pane |
| Density | fixed | comfortable default + opt-in compact mode |
| Design tokens | LESS variables (build-time only) | LESS seeds **plus** `--aurora-*` custom properties at runtime |
| Web components | none | self-hosted Shoelace bundle, progressive enhancement |
| `forced-colors` | not handled explicitly | dedicated support in `_a11y.less` |

### Inherited unchanged

Templates (except the two overrides below), `ui.js` and all JavaScript
behaviour, Bootstrap 4, FontAwesome, the message-list structure and density,
and every view Aurora does not name above. Aurora adds no PHP and modifies no
Roundcube core file.

Palette
-------

The palette is rolling out in three stages so each can be judged against a
finished ground rather than a moving one.

### Stage 1 — neutrals and elevation ✅ shipped

Neutrals moved off the blue-grey axis onto a violet bias, and elevation was
reseeded onto its own hue.

| Role | Seed | Value |
|------|------|-------|
| Ink | `@color-black` | `#171532` → body text `#282456` |
| Hairline | `@color-border` | `#e7e4f2` |
| Secondary text | `@color-black-shade-text` | `#6a6786` |
| Placeholder | `@color-input-placeholder` | `#75738c` |
| Content canvas | `@color-layout-content-background` | `#fbfaff` |
| Shadow hue | `@color-shadow` | `#1f184a` |
| Dark canvas | `@color-dark-background` | `#0d0f1a` |
| Dark ink | `@color-dark-font` | `#d2d1e4` |

Elastic derives much of its palette from a few seeds, so `@color-black` alone
also moves body text, column dividers and list separators. Dark mode was
reseeded in the same pass: Elastic's dark neutrals are green-teal throughout
(`#c5d1d3`, `#4d6066`, `#2c373a`), which left earlier versions of Aurora with
green-tinted text on a neutral ground.

Light and sidebar surfaces stay pure white; only the content pane is tinted, so
the two read as distinct planes.

### Stage 2 — accent and a second hue ⬜ planned

`@color-main` `#5b5bf5`, links `#4a3fd6`, primary button `#4f46e5`, plus an
aurora-teal "spark" (`#0d9488` light / `#2dd4bf` dark) for unread markers,
tags, avatar gradients and chart marks. **Spark is graphics-only in light
mode** — see the accessibility principle above.

### Stage 3 — the four gradient surfaces ⬜ planned

Task rail / bottom nav, primary buttons, avatar placeholders, and the header
wash: two very faint radials, indigo top-left and teal top-right, at under 13%
alpha and never behind body content. This stage also replaces Elastic's
white-on-solid status toasts with dark-text-on-tint, which fixes an inherited
contrast failure (2.62:1).

Design tokens
-------------

`styles/_system.less` is the single runtime source of truth, exposed as CSS
custom properties (`--aurora-*`): colour, a 4px spacing scale, radii, a ~1.2
modular type scale on a 14px body, four elevation steps, motion, and density.

Density is a first-class token. The comfortable default and an opt-in
`html.aurora-density-compact` mode retune row and control heights from one
place, rather than through scattered per-component overrides.

Colour tokens are bridged from the LESS palette at build time, so the LESS
seeds in `tokens.less` remain the one place a colour is defined.

Mobile
------

Elastic renders the phone task menu as a hidden drawer behind a hamburger.
Aurora restyles it into a **persistent bottom tab bar** — the dominant modern
mobile pattern — entirely in CSS, with no changes to the inherited `ui.js`.
The layer also adds touch-comfort sizing, safe-area insets, a refreshed
floating compose button and elevated sticky headers.

Because the bar is fixed, each layout column reserves its height, so Elastic's
bottom toolbars (list pager, message actions, quota) stay visible and tappable
rather than being buried underneath it.

Accessibility
-------------

Aurora targets **WCAG 2.2 AA**, verified numerically rather than by eye.

- Text and control colours are checked with a contrast script against the
  values parsed out of the *compiled* stylesheet.
- `styles/_a11y.less` provides the keyboard focus indicator, Windows High
  Contrast / `forced-colors` support, and a dark-mode link-contrast bump.
- Lists use Elastic's own focus mechanism — a 2px gutter every row already
  reserves — instead of an overlay ring, so the indicator aligns to the row and
  shifts nothing.
- Motion respects `prefers-reduced-motion`.

**Known inherited limitation:** Elastic's solid status toasts use white text on
a saturated fill and do not reach AA. Scheduled for stage 3.

Architecture
------------

| File | Purpose |
|------|---------|
| `meta.json` | Declares `extends: elastic` and skin config. |
| `styles/styles.less` | Entry point: Elastic's LESS + Aurora's layers. |
| `styles/tokens.less` | Reseeds Elastic's LESS seed variables (the palette). |
| `styles/_system.less` | The design-token system (CSS custom properties). |
| `styles/_styles.less` | Component refinements. |
| `styles/_mobile.less` | Phone layer (bottom tab bar, touch comfort). |
| `styles/_a11y.less` | Focus, `forced-colors`, dark-mode contrast. |
| `styles/_shoelace.less` | Maps `--sl-*` tokens onto Aurora's tokens. |
| `styles/print.less`, `styles/embed.less` | Thin wrappers over Elastic's. |
| `templates/includes/layout.html` | **Required override** (see below). |
| `templates/includes/footer.html` | Loads the web components + `aurora.js`. |
| `watermark.html` | Blank content pane — overrides Elastic's logo watermark. |
| `src/webcomponents.js` | Entry point for the Shoelace bundle. |
| `deps/shoelace/aurora-shoelace.min.js` | Self-hosted Shoelace bundle (built). |
| `aurora.js` | Progressive-enhancement script. |
| `fonts/`, `images/` | Vendored from Elastic (see below). |

Everything else — the other templates, `ui.js`, `deps/bootstrap` — is inherited
from Elastic at runtime via Roundcube's skin-path fallback.

`fonts/` and `images/` must be copied into the child skin because Elastic's
`@font-face url("../fonts/…")` and `data-uri("../images/…")` resolve relative
to the compiling skin's directory.

### Why `layout.html` is overridden

The main stylesheet `<link>` lives in `templates/includes/layout.html`. When
Roundcube parses an included template it sets `base_path` to the skin where the
file is **found** (`rcmail_output_html::xml_command()`) and rewrites the `<link>`
relative to it.

If Aurora inherited `layout.html` from Elastic, `base_path` would be
`skins/elastic`, and an Aurora-selected session would silently load **Elastic's**
compiled CSS — no error, correct skin still reported in `rcmail.env.skin`.
Shipping Aurora's own copy makes `base_path` resolve to `skins/aurora`. The file
is otherwise identical to Elastic's; keep it in sync if Elastic's changes.

Web components
--------------

Aurora self-hosts a **minimal Shoelace 2.x bundle** — only the components it
actually uses, currently `sl-switch`, about 38 KB — under `deps/shoelace/`. It
is **not** loaded from a CDN, so it works under a strict CSP.

`aurora.js` runs after Elastic's inherited `ui.js` and progressively enhances
preference-form checkboxes into `<sl-switch>`. The native `<input>` stays in the
DOM, visually hidden and in sync, so form submission and Elastic's own handlers
keep working; if the bundle fails to load, the native checkbox remains fully
usable.

To add a component: import it in `src/webcomponents.js`, extend the token bridge
in `styles/_shoelace.less`, and rebuild.

Build
-----

Aurora's LESS must be compiled. From the Roundcube root:

```sh
make css-aurora
```

or directly:

```sh
cd skins/aurora && make css
```

`make css-aurora` runs both the LESS and esbuild steps. Elastic's dependencies
must already be installed (`bin/install-jsdeps.sh`), and `npm install` must have
been run at the repository root. After building, run
`bin/updatecss.sh --dir skins/aurora` to add cache-buster marks.

Development previews
--------------------

`preview.html`, `preview-phone.html` and `preview-components.html` are
**dev-only harnesses** that load the compiled CSS for visual checks. They are
excluded from release tarballs via `.gitattributes` (`export-ignore`) and are
not part of the shipped skin.

They are stylized mocks, not faithful reproductions of Roundcube's DOM. For
anything involving layout or overlap, reproduce Elastic's real markup instead —
a mock that omits the per-column bottom toolbars will happily hide a bug.

Non-goals
---------

- **Bootstrap 5.** Elastic's inherited `ui.js` uses Bootstrap's jQuery plugin
  API, which BS5 removed, and its templates use BS4 markup. Migrating would mean
  forking both — the opposite of Aurora's premise. If upstream Elastic moves,
  Aurora inherits it for free.
- **Redesigning the message list.** Density, row structure and type scale stay
  as Elastic ships them.

Credits and licence
-------------------

Aurora is maintained by Matthias Kerstner.

Subject to the Creative Commons Attribution-ShareAlike License, matching the
parent Elastic skin — see <http://creativecommons.org/licenses/by-sa/3.0/>.

This skin depends on and reuses code from the Elastic skin, which in turn
bundles the Bootstrap Framework and FontAwesome under their respective
licences. The bundled Shoelace components are MIT licensed.
