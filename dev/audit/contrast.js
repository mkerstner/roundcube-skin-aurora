#!/usr/bin/env node
/**
 * Aurora contrast audit (WCAG 2.x).
 *
 * Every foreground/background pair Aurora puts on screen, resolved by LESS
 * itself from Elastic's variables + Aurora's tokens.less — no hand-written
 * lighten()/mix() maths. Translucent layers (washes, faded labels, notice
 * backgrounds) are composited onto their real ground before measuring.
 *
 *   node skins/aurora/dev/audit/contrast.js                 audit the shipped tokens
 *   node skins/aurora/dev/audit/contrast.js try.less        …with candidate overrides appended
 *   node skins/aurora/dev/audit/contrast.js --fails         print failing pairs only
 *
 * Exit code 1 if any pair fails, so it can gate a build.
 * Thresholds: 'text' 4.5:1, 'ui' 3:1 (non-text: controls, focus indicators, icons).
 *
 * Literal hexes appear only where Aurora itself writes one outside tokens.less
 * (the white button label, Elastic's #fff surfaces).
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../../../..');
const less = require('less');
const args = process.argv.slice(2);
const onlyFails = args.includes('--fails');
const candidate = args.find(a => !a.startsWith('--'));
const fwd = p => p.replace(/\\/g, '/');

// name -> LESS expression
const X = {
    white: '#fff', ink: '@color-font', canvas: '@color-layout-content-background', muted: '@color-black-shade-text',
    link: '@color-link', linkHover: '@color-link-hover', accent: '@color-main',
    btnLabel: '@color-btn-primary', btn: '@color-btn-primary-background',
    btnTop: 'mix(#fff, @color-btn-primary-background, 12%)',
    btnHoverBottom: 'darken(@color-btn-primary-background, 5%)',
    btnHoverTop: 'mix(#fff, darken(@color-btn-primary-background, 5%), 12%)',
    secLabel: '@color-btn-secondary', secBg: '@color-btn-secondary-background',
    menuHover: '@color-menu-hover', menuHoverBg: '@color-menu-hover-background',
    badge: '@color-list-badge', badgeBg: '@color-list-badge-background',
    recent: '@color-list-recent', recentBadge: '@color-list-recent-badge', recentBadgeBg: '@color-list-recent-badge-background',
    selRow: '@color-list-selected-background', gutter: '@color-list-focus-indicator',
    inputFocus: '@color-input-border-focus', checkbox: '@color-checkbox-checked',
    messageLink: '@color-message-link', messageBg: '@color-message-background',
    dpHi: '@color-datepicker-highlight', dpHiBg: '@color-datepicker-highlight-background',
    dpActive: '@color-datepicker-active', dpActiveBg: '@color-datepicker-active-background',
    mobileHeader: '@color-popover-mobile-header', mobileHeaderBg: '@color-popover-mobile-header-background',
    spark: '@color-aurora-spark', sparkVivid: '@color-aurora-spark-vivid',
    accentLight: '@color-aurora-accent-light', accentLighter: '@color-aurora-accent-lighter',
    errorLight: '@color-aurora-error-light',
    washIndigo: 'fade(@color-main, 13%)', washTeal: 'fade(@color-aurora-spark, 10%)',
    // rail / phone tab bar (a dark ground in both themes)
    rail: '@color-taskmenu-background', railEnd: '@color-aurora-rail-end', railHover: 'lighten(@color-taskmenu-background, 10%)',
    railLabel: '@color-taskmenu-button', compose: '@color-taskmenu-button-action', composeHover: '@color-taskmenu-button-action-hover',
    logout: '@color-taskmenu-button-logout', logoutHover: '@color-taskmenu-button-logout-hover', navFg: 'fade(#fff, 62%)',
    // status toasts
    tInfo: '@color-aurora-toast-info', tSuccess: '@color-aurora-toast-success', tWarning: '@color-aurora-toast-warning', tError: '@color-aurora-toast-error',
    iInfo: '@color-aurora-toast-info-icon', iSuccess: '@color-aurora-toast-success-icon', iWarning: '@color-aurora-toast-warning-icon', iError: '@color-aurora-toast-error-icon',
    // dark mode
    dcanvas: '@color-dark-background', dsurface: '@color-aurora-dark-surface', dfont: '@color-dark-font', dhint: '@color-dark-hint',
    dsel: '@color-dark-list-selected-background', dselText: '@color-dark-list-selected', dpopover: '@color-dark-popover-background',
    dlink: '@color-aurora-dark-link', dlinkHover: 'lighten(@color-aurora-dark-link, 5%)',
    dbtn: '@color-dark-btn', dbtnBg: '@color-dark-btn-primary-background', dbtnHover: 'lighten(@color-dark-btn-primary-background, 5%)',
    dinputFocus: '@color-dark-input-border-focus', dcheckbox: '@color-dark-checkbox-checked', dnotice: '@color-dark-message-information',
    drailTop: '@color-aurora-dark-rail-top', drailEnd: '@color-aurora-dark-rail-end',
    dthumb: '@color-dark-scrollbar-thumb', dtrack: '@color-dark-scrollbar-track',
    dwashIndigo: 'fade(@color-main, 22%)', dwashTeal: 'fade(@color-aurora-spark-vivid, 10%)',
    dtInfo: '@color-aurora-dark-toast-info', dtSuccess: '@color-aurora-dark-toast-success', dtWarning: '@color-aurora-dark-toast-warning', dtError: '@color-aurora-dark-toast-error',
    diInfo: '@color-aurora-dark-toast-info-icon', diSuccess: '@color-aurora-dark-toast-success-icon', diWarning: '@color-aurora-dark-toast-warning-icon', diError: '@color-aurora-dark-toast-error-icon',
};

// [label, fg, bg, kind]; a colour may be [layer, ground] for a translucent layer on a ground
const GROUPS = {
    'Light — text and controls': [
        ['link on surface', 'link', 'white', 'text'], ['link on content canvas', 'link', 'canvas', 'text'],
        ['link hover on surface', 'linkHover', 'white', 'text'],
        ['primary button label (gradient top)', 'btnLabel', 'btnTop', 'text'], ['primary button label (gradient bottom)', 'btnLabel', 'btn', 'text'],
        ['primary button label (hover top)', 'btnLabel', 'btnHoverTop', 'text'], ['primary button label (hover bottom)', 'btnLabel', 'btnHoverBottom', 'text'],
        ['secondary button label', 'secLabel', 'secBg', 'text'],
        ['menu item hover', 'menuHover', 'menuHoverBg', 'text'], ['folder unread badge', 'badge', 'badgeBg', 'text'],
        ['recent-folder name', 'recent', 'white', 'text'], ['recent-folder badge', 'recentBadge', 'recentBadgeBg', 'text'],
        ['ink on selected row', 'ink', 'selRow', 'text'], ['muted on selected row', 'muted', 'selRow', 'text'],
        ['notice link', 'messageLink', ['messageBg', 'white'], 'text'],
        ['datepicker today', 'dpHi', 'dpHiBg', 'text'], ['datepicker selected day', 'dpActive', 'dpActiveBg', 'text'],
        ['phone dialog header', 'mobileHeader', 'mobileHeaderBg', 'text'],
        ['header ink under the indigo wash', 'ink', ['washIndigo', 'white'], 'text'], ['header ink under the teal wash', 'ink', ['washTeal', 'white'], 'text'],
        ['list gutter vs selected row', 'gutter', 'selRow', 'ui'], ['input focus border', 'inputFocus', 'white', 'ui'],
        ['checked checkbox / switch track', 'checkbox', 'white', 'ui'],
        ['unread dot on a row', 'spark', 'white', 'ui'], ['unread dot on a selected row', 'spark', 'selRow', 'ui'],
        ['focus outline on surface', 'accent', 'white', 'ui'], ['focus outline on canvas', 'accent', 'canvas', 'ui'],
        ['phone compose field label', 'muted', 'white', 'text'],
        ['focus outline on a selected row', 'accent', 'selRow', 'ui'], ['focus outline under the wash', 'accent', ['washIndigo', 'white'], 'ui'],
        ['focus outline on the phone dialog header', 'accentLight', 'mobileHeaderBg', 'ui'],
        ['login footer on the card', 'muted', 'white', 'text'],
    ],
    'Task rail and phone tab bar (dark ground in both themes)': [
        ['label on rail top', 'railLabel', 'rail', 'text'], ['label on rail bottom', 'railLabel', 'railEnd', 'text'],
        ['label on hover/selected fill', 'railLabel', 'railHover', 'text'],
        ['Compose on rail top', 'compose', 'rail', 'text'], ['Compose on rail bottom', 'compose', 'railEnd', 'text'],
        ['Compose hover', 'composeHover', 'railHover', 'text'],
        ['Logout on rail top', 'logout', 'rail', 'text'], ['Logout on rail bottom', 'logout', 'railEnd', 'text'], ['Logout hover', 'logoutHover', 'railHover', 'text'],
        ['focus outline on the hover fill', 'accentLight', 'railHover', 'ui'],
        ['phone tab label (62% white), top', ['navFg', 'rail'], 'rail', 'text'], ['phone tab label, bottom', ['navFg', 'railEnd'], 'railEnd', 'text'],
        ['phone selected tab icon', 'accentLight', 'railEnd', 'ui'], ['phone Logout icon', 'errorLight', 'railEnd', 'ui'],
        ['phone compose button icon', 'white', 'btnTop', 'ui'],
    ],
    'Status toasts (light)': [
        ['information text', 'ink', 'tInfo', 'text'], ['information icon', 'iInfo', 'tInfo', 'ui'],
        ['success text', 'ink', 'tSuccess', 'text'], ['success icon', 'iSuccess', 'tSuccess', 'ui'],
        ['warning text', 'ink', 'tWarning', 'text'], ['warning icon', 'iWarning', 'tWarning', 'ui'],
        ['error text', 'ink', 'tError', 'text'], ['error icon', 'iError', 'tError', 'ui'],
    ],
    'Dark mode': [
        ['selected row subject', 'dselText', 'dsel', 'text'],
        ['link on canvas', 'dlink', 'dcanvas', 'text'], ['link on raised surface', 'dlink', 'dsurface', 'text'], ['link hover on canvas', 'dlinkHover', 'dcanvas', 'text'],
        ['primary button label', 'dbtn', 'dbtnBg', 'text'], ['primary button label (hover)', 'dbtn', 'dbtnHover', 'text'],
        ['notice toast text', 'dfont', 'dnotice', 'text'],
        ['rail label on top', 'dfont', 'drailTop', 'text'], ['rail label on bottom', 'dfont', 'drailEnd', 'text'], ['rail label on hover/selected', 'dfont', 'dsel', 'text'],
        ['Compose on rail', 'accentLight', 'drailTop', 'text'], ['Compose hover', 'accentLighter', 'dsel', 'text'],
        ['Logout on rail', 'errorLight', 'drailTop', 'text'], ['Logout hover', 'errorLight', 'dsel', 'text'],
        ['datepicker today', 'accentLight', 'dsel', 'text'], ['editor dialog active tab', 'accentLight', 'dpopover', 'text'],
        ['header font under the indigo wash', 'dfont', ['dwashIndigo', 'dcanvas'], 'text'], ['header font under the teal wash', 'dfont', ['dwashTeal', 'dcanvas'], 'text'],
        ['input focus border', 'dinputFocus', 'dcanvas', 'ui'], ['switch track vs canvas', 'dcheckbox', 'dcanvas', 'ui'], ['switch knob vs track', 'dfont', 'dcheckbox', 'ui'],
        ['list gutter vs selected row', 'accentLight', 'dsel', 'ui'], ['phone selected tab icon', 'accentLight', 'drailEnd', 'ui'],
        ['unread dot on canvas', 'sparkVivid', 'dcanvas', 'ui'], ['unread dot on a selected row', 'sparkVivid', 'dsel', 'ui'],
        ['focus outline on canvas', 'accentLight', 'dcanvas', 'ui'], ['focus outline on a selected row', 'accentLight', 'dsel', 'ui'],
        ['focus outline under the wash', 'accentLight', ['dwashIndigo', 'dcanvas'], 'ui'],
        ['login footer on the card', 'dhint', 'dsurface', 'text'],
        ['phone compose field label', 'dhint', 'dsurface', 'text'], ['phone compose focus line', 'accentLight', 'dsurface', 'ui'],
        ['scrollbar thumb vs track', 'dthumb', 'dtrack', 'ui'], ['scrollbar thumb vs canvas', 'dthumb', 'dcanvas', 'ui'],
    ],
    'Status toasts (dark)': [
        ['information text', 'dfont', 'dtInfo', 'text'], ['information icon', 'diInfo', 'dtInfo', 'ui'],
        ['success text', 'dfont', 'dtSuccess', 'text'], ['success icon', 'diSuccess', 'dtSuccess', 'ui'],
        ['warning text', 'dfont', 'dtWarning', 'text'], ['warning icon', 'diWarning', 'dtWarning', 'ui'],
        ['error text', 'dfont', 'dtError', 'text'], ['error icon', 'diError', 'dtError', 'ui'],
    ],
};

// --- colour maths -----------------------------------------------------------
const parse = s => {
    s = String(s).trim();
    let m;
    if ((m = s.match(/^#([0-9a-f]{3})$/i))) return [...m[1]].map(c => parseInt(c + c, 16)).concat(1);
    if ((m = s.match(/^#([0-9a-f]{6})$/i))) return [0, 2, 4].map(i => parseInt(m[1].slice(i, i + 2), 16)).concat(1);
    if ((m = s.match(/^rgba?\(([^)]+)\)$/i))) { const p = m[1].split(',').map(Number); return [p[0], p[1], p[2], p[3] ?? 1]; }
    if (s === 'white') return [255, 255, 255, 1];
    if (s === 'black') return [0, 0, 0, 1];
    throw new Error('cannot parse colour "' + s + '"');
};
const over = (f, b) => (f[3] >= 1 ? f : [0, 1, 2].map(i => f[i] * f[3] + b[i] * (1 - f[3])).concat(1));
const lum = c => {
    const l = c.slice(0, 3).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
    return 0.2126 * l[0] + 0.7152 * l[1] + 0.0722 * l[2];
};
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const hex = c => '#' + c.slice(0, 3).map(v => Math.round(v).toString(16).padStart(2, '0')).join('');

(async () => {
    const src = [
        `@import (reference) "${fwd(path.join(ROOT, 'skins/elastic/styles/variables.less'))}";`,
        `@import "${fwd(path.join(ROOT, 'skins/aurora/styles/tokens.less'))}";`,
        candidate ? `@import "${fwd(path.resolve(candidate))}";` : '',
        '.audit {', ...Object.entries(X).map(([k, e]) => `  ${k}: ${e};`), '}',
    ].join('\n');

    let css;
    try {
        css = (await less.render(src, { filename: path.join(__dirname, '_audit.less') })).css;
    } catch (e) {
        console.error('LESS error:', e.message);
        process.exit(2);
    }
    const V = {};
    for (const m of css.matchAll(/^\s*(\w+):\s*([^;]+);/gm)) V[m[1]] = m[2].trim();
    const C = s => (Array.isArray(s) ? over(C(s[0]), C(s[1])) : parse(V[s] ?? s));

    let fails = 0, total = 0;
    console.log(candidate ? `Aurora contrast audit — tokens.less + ${path.basename(candidate)}` : 'Aurora contrast audit — tokens.less');
    for (const [group, pairs] of Object.entries(GROUPS)) {
        const lines = [];
        for (const [label, f, b, kind] of pairs) {
            const bg = C(b), fg = over(C(f), bg), r = ratio(fg, bg), need = kind === 'text' ? 4.5 : 3, ok = r >= need;
            total++;
            if (!ok) fails++;
            if (!ok || !onlyFails) lines.push(`  ${ok ? 'pass' : 'FAIL'}  ${label.padEnd(44)} ${r.toFixed(2).padStart(5)}  (${kind} ${need})  ${hex(fg)} on ${hex(bg)}`);
        }
        if (lines.length) console.log('\n' + group + '\n' + lines.join('\n'));
    }
    console.log(`\n${total - fails}/${total} pairs pass${fails ? ` — ${fails} FAILING` : ''}`);
    process.exit(fails ? 1 : 0);
})();
