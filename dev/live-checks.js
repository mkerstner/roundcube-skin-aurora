/**
 * Aurora live checks — paste into the browser console of the dev instance
 * (dev/instance, http://localhost:8765) or inject with a browser automation
 * tool. Everything reads computed styles from the REAL Roundcube DOM.
 *
 *   auroraLive.toasts()          render every toast type in the current theme, report contrast
 *   auroraLive.focus()           report the focus indicator of document.activeElement
 *   auroraLive.walk()            press Tab, call walk() after each press, then walkLog()
 *   auroraLive.reach('#sel')     is the element's centre actually hittable (not covered)?
 *   auroraLive.contrast(a, b)    WCAG ratio of two CSS colour strings
 *
 * Notes from the first live pass (2026-11-02):
 *  - Real keyboard focus needs the page to have OS focus: click into it once
 *    (document.hasFocus() must be true), otherwise :focus-visible never matches.
 *  - Aurora transitions colours and shadows; read computed values ~300ms after
 *    a state change or you get the start of the transition.
 *  - Bootstrap switches have TWO label[for=id]: the text label comes first; the
 *    visible switch is input.nextElementSibling::before.
 *  - Roundcube de-duplicates identical messages: give each toast unique text.
 */
(function () {
    const rgba = s => { const m = String(s).match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,\/]+/).filter(Boolean).map(Number); return [p[0], p[1], p[2], p[3] ?? 1]; };
    const lum = c => { const l = c.slice(0, 3).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * l[0] + 0.7152 * l[1] + 0.0722 * l[2]; };
    const contrast = (a, b) => { const [x, y] = [lum(rgba(a)), lum(rgba(b))].sort((p, q) => q - p); return +((x + 0.05) / (y + 0.05)).toFixed(2); };
    const describe = a => a.tagName.toLowerCase() + (a.id ? '#' + a.id : '')
        + (typeof a.className === 'string' && a.className.trim() ? '.' + a.className.trim().split(/\s+/).slice(0, 3).join('.') : '')
        + (a.textContent && a.textContent.trim() ? ' "' + a.textContent.trim().slice(0, 24) + '"' : '');

    const focus = (a = document.activeElement) => {
        const cs = getComputedStyle(a);
        const visible = cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0 && rgba(cs.outlineColor)[3] > 0;
        let indicator;
        if (visible) indicator = `outline ${cs.outlineWidth} ${cs.outlineColor} offset ${cs.outlineOffset}`;
        else if (a.classList.contains('custom-control-input') && a.nextElementSibling) {
            const b = getComputedStyle(a.nextElementSibling, '::before');
            indicator = b.outlineStyle !== 'none' ? `switch box outline ${b.outlineWidth} ${b.outlineColor}` : 'NONE (switch box)';
        } else if (a.matches('.form-control, .custom-select')) indicator = `field border ${cs.borderTopColor}`;
        else if (a.closest('.recipient-input')) indicator = a.closest('.recipient-input').classList.contains('focus') ? 'recipient wrapper .focus' : 'NONE (recipient wrapper)';
        else if (a.closest('.listing:not(.toolbar)')) indicator = `list gutter ${cs.borderLeftColor}`;
        else indicator = 'NONE';
        return { el: describe(a), focusVisible: a.matches(':focus-visible'), indicator, pageHasFocus: document.hasFocus() };
    };

    const log = [];
    const walk = () => { const f = focus(); log.push(`${String(log.length).padStart(2)} ${f.focusVisible ? 'fv' : '  '} ${f.indicator}  <- ${f.el}`); return log.length; };

    const toasts = async () => {
        document.querySelectorAll('#messagestack > div').forEach(d => d.remove());
        const stamp = Date.now();
        ['information', 'notice', 'confirmation', 'warning', 'error', 'loading']
            .forEach(t => window.rcmail.display_message(`Aurora ${t} ${stamp}`, t, 60000));
        await new Promise(r => setTimeout(r, 400));
        return [...document.querySelectorAll('#messagestack > div')].map(d => {
            const cs = getComputedStyle(d), ic = d.querySelector('i.icon');
            return { type: d.className.replace(/\bui\b|\balert\b|\bcontent\b/g, '').trim(), bg: cs.backgroundColor,
                text: contrast(cs.color, cs.backgroundColor), icon: ic ? contrast(getComputedStyle(ic, '::before').color, cs.backgroundColor) : '-',
                bar: /3px 0px 0px 0px inset/.test(cs.boxShadow) };
        });
    };

    const reach = sel => {
        const e = typeof sel === 'string' ? document.querySelector(sel) : sel;
        if (!e) return 'not found';
        const b = e.getBoundingClientRect();
        const hit = document.elementFromPoint((b.left + b.right) / 2, (b.top + b.bottom) / 2);
        return !hit ? 'off screen' : (hit === e || e.contains(hit)) ? 'reachable' : 'COVERED by ' + describe(hit);
    };

    window.auroraLive = { contrast, focus, walk, walkLog: () => log.slice(), toasts, reach };
    return 'auroraLive ready';
})();
