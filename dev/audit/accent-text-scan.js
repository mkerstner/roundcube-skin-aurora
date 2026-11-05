#!/usr/bin/env node
/**
 * Scan the BUILT stylesheet for places where a raw accent fill colour ends up
 * as a text colour (`color:`), after resolving rules with identical selectors
 * the way the cascade does (the later one wins).
 *
 * Why: Aurora's accent roles (tokens.less) reserve @color-main and the primary
 * button colour for FILLS that carry white. As text on a light ground the
 * accent's role is @color-link, on a dark ground @color-aurora-accent-light.
 * Seeds cannot reach Elastic rules that hard-code `color: @color-main`; this
 * scan is how those were found (see the "Dark-mode accent foregrounds" block in
 * _styles.less).
 *
 *   node skins/aurora/dev/audit/accent-text-scan.js
 *   node skins/aurora/dev/audit/accent-text-scan.js --diff old/styles.min.css   also list colour-value changes
 *
 * Exit code 1 if any raw accent text colour remains. Icon glyphs (`::before`)
 * are text-coloured too, so an intended graphic use would show up here; none
 * does today.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../../../..');
const less = require('less');
const CSS = path.join(ROOT, 'skins/aurora/styles/styles.min.css');
const fwd = p => p.replace(/\\/g, '/');
const diffIdx = process.argv.indexOf('--diff');
const oldCss = diffIdx > 0 ? process.argv[diffIdx + 1] : null;

const rules = css => {
    const out = [];
    const re = /([^{}]+)\{([^{}]*)\}/g;
    let m;
    while ((m = re.exec(css))) {
        for (const d of m[2].split(';')) {
            const i = d.indexOf(':');
            if (i > 0) out.push({ sel: m[1].trim(), prop: d.slice(0, i).trim(), val: d.slice(i + 1).trim().toLowerCase() });
        }
    }
    return out;
};

(async () => {
    const src = [
        `@import (reference) "${fwd(path.join(ROOT, 'skins/elastic/styles/variables.less'))}";`,
        `@import "${fwd(path.join(ROOT, 'skins/aurora/styles/tokens.less'))}";`,
        '.a { main: @color-main; btn: @color-btn-primary-background; }',
    ].join('\n');
    const out = (await less.render(src, { filename: path.join(__dirname, '_scan.less') })).css;
    const accents = [...out.matchAll(/:\s*(#[0-9a-f]{3,6})/gi)].map(m => m[1].toLowerCase());

    const css = fs.readFileSync(CSS, 'utf8');
    const last = new Map();
    for (const r of rules(css)) {
        if (r.prop !== 'color') continue;
        for (const s of r.sel.split(',')) last.set(s.trim(), r.val);
    }
    const hits = [...last].filter(([, v]) => accents.some(a => v.includes(a)));

    console.log(`accent fills: ${accents.join(', ')} — scanning ${path.relative(ROOT, CSS)}`);
    if (hits.length) hits.forEach(([s, v]) => console.log(`  TEXT  ${s}  { color: ${v} }`));
    else console.log('  none: no raw accent fill is used as a text colour');

    if (oldCss) {
        const count = c => { const o = {}; for (const h of c.toLowerCase().match(/#[0-9a-f]{3,8}\b|rgba?\([^)]*\)/g) || []) { const k = h.replace(/\s+/g, ''); o[k] = (o[k] || 0) + 1; } return o; };
        const a = count(fs.readFileSync(oldCss, 'utf8')), b = count(css);
        const keys = [...new Set([...Object.keys(a), ...Object.keys(b)])].filter(k => (a[k] || 0) !== (b[k] || 0));
        console.log(`\ncolour values whose occurrence count changed (${path.basename(oldCss)} -> current):`);
        keys.sort((x, y) => ((b[y] || 0) - (a[y] || 0)) - ((b[x] || 0) - (a[x] || 0)))
            .forEach(k => console.log(`  ${k.padEnd(28)} ${String(a[k] || 0).padStart(3)} -> ${String(b[k] || 0).padStart(3)}`));
    }
    process.exit(hits.length ? 1 : 0);
})();
