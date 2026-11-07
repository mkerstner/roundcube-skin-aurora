/**
 * Aurora skin — progressive enhancement (Phase 5)
 *
 * Aurora extends Elastic and therefore inherits Elastic's ui.js unchanged; this
 * file is Aurora's OWN small script, loaded after ui.js from Aurora's
 * footer.html. It uses framework-agnostic web components (self-hosted Shoelace,
 * see deps/shoelace/aurora-shoelace.min.js) to modernise a few dated widgets.
 *
 * Design principles:
 *  - Progressive enhancement only. Every enhanced control keeps its original
 *    native element in the DOM, so form submission and Elastic's ui.js handlers
 *    keep working. If the web component fails to load, the native control
 *    remains fully functional.
 *  - Scoped and reversible. Only checkboxes inside preference forms
 *    (`.propform`) — or explicitly marked `[data-aurora-switch]` — are upgraded.
 *    Data-grid / message-list checkboxes are never touched.
 *  - POC: currently enhances toggle checkboxes into <sl-switch>. Validate in a
 *    live install before widening the selector.
 */
(function () {
    'use strict';

    var SELECTOR = '.propform input[type="checkbox"], input[type="checkbox"][data-aurora-switch]';

    function textFor(cb) {
        // A wrapping <label> or an associated <label for="id"> provides the text.
        var lbl = cb.closest('label');
        if (!lbl && cb.id) {
            lbl = document.querySelector('label[for="' + CSS.escape(cb.id) + '"]');
        }
        return lbl ? lbl.textContent.trim() : '';
    }

    function enhance(cb) {
        if (cb.dataset.auroraEnhanced || cb.classList.contains('aurora-skip')) {
            return;
        }
        // Bail out gracefully if the component never registered.
        if (typeof customElements === 'undefined' || !customElements.get('sl-switch')) {
            return;
        }

        try {
            var sw = document.createElement('sl-switch');
            sw.size = 'small';
            sw.checked = cb.checked;
            sw.disabled = cb.disabled;
            sw.setAttribute('aria-label', textFor(cb) || 'toggle');

            // switch -> native checkbox (fire native change so ui.js/handlers run)
            sw.addEventListener('sl-change', function () {
                if (cb.checked !== sw.checked) {
                    cb.checked = sw.checked;
                    cb.dispatchEvent(new Event('change', { bubbles: true }));
                }
            });
            // native checkbox -> switch (e.g. label click or programmatic change)
            cb.addEventListener('change', function () {
                if (sw.checked !== cb.checked) {
                    sw.checked = cb.checked;
                }
            });

            cb.classList.add('aurora-enhanced-checkbox');
            cb.dataset.auroraEnhanced = '1';
            // the switch is the control now: one Tab stop, one announcement
            cb.tabIndex = -1;
            cb.setAttribute('aria-hidden', 'true');
            cb.parentNode.insertBefore(sw, cb.nextSibling);
        } catch (e) {
            // Never let enhancement break the page — leave the native control.
            if (window.console) {
                console.warn('[aurora] switch enhancement skipped:', e);
            }
        }
    }

    function enhanceAll(root) {
        (root || document).querySelectorAll(SELECTOR).forEach(enhance);
    }

    /**
     * The header controls of the phone compose sheet (see _mobile.less). The
     * tab bar is hidden there, and its Mail tab is what ui.js turns into the
     * way back, so the header needs its own. Registering Send keeps it in step
     * with Roundcube's command state, like the buttons ui.js clones.
     */
    function initComposeSheet() {
        var env = rcmail.env,
            header = document.querySelector('#layout-content > .header'),
            source = document.querySelector('.formbuttons button.send'),
            back, send;

        if (!header || !source || env.task !== 'mail' || env.action !== 'compose' || env.extwin) {
            return;
        }

        back = document.createElement('a');
        back.href = '#';
        back.className = 'button icon aurora-compose-back';
        back.title = rcmail.gettext('back');
        back.setAttribute('aria-label', back.title);
        back.addEventListener('click', function (e) {
            e.preventDefault();
            rcmail.command('list', '', this, e);
        });

        send = document.createElement('a');
        send.href = '#';
        send.id = 'aurora-compose-send';
        send.className = 'button aurora-compose-send disabled';
        send.textContent = source.textContent.trim();
        send.addEventListener('click', function (e) {
            e.preventDefault();
            rcmail.command('send', '', this, e);
        });

        header.insertBefore(back, header.firstChild);
        header.insertBefore(send, header.querySelector('.toolbar-menu-button'));
        rcmail.register_button('send', send.id, 'link', 'button aurora-compose-send');
    }

    function init() {
        // Wait until the component is defined, then enhance existing controls.
        if (window.customElements && customElements.whenDefined) {
            customElements.whenDefined('sl-switch').then(function () {
                enhanceAll(document);
            });
        }

        // Roundcube re-renders parts of the UI via AJAX; pick up new controls.
        if (window.MutationObserver) {
            var pending = false;
            new MutationObserver(function () {
                if (pending) {
                    return;
                }
                pending = true;
                setTimeout(function () {
                    pending = false;
                    enhanceAll(document);
                }, 100);
            }).observe(document.documentElement, { childList: true, subtree: true });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // After ui.js, which registered first: it builds the ⋮ menu button on init
    if (window.rcmail) {
        rcmail.addEventListener('init', initComposeSheet);
    }
})();
