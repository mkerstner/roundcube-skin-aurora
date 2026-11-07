# Changelog

## 1.0.2

**Fixed**
- Phones: the tab bar covered the buttons of every dialog, so Insert or Cancel could
  not be reached and a tap landed on a tab instead
- Settings: every toggle appeared twice, and the hidden checkbox was an extra Tab
  stop
- Phones and tablets: Save was missing from the form for a new contact
- Phones: recipient chips were 46px tall, and the caret never shared a row with one

**Phones**
- Compose is a full-screen sheet: Send and a way back in the header, no tab bar or
  footer toolbar, and more room for the message
- Attach is in the ⋮ menu of compose, no longer behind Options and attachments
- Fields are 16px, the size at which iOS stops zooming in on focus
- Larger switches and header buttons

## 1.0.1

- Phones: the bottom tab bar no longer cuts off descenders in its labels, as in
  "Settings" and "Logout"

## 1.0.0

First public release, built against Elastic from Roundcube 1.7 and tested on
1.7.5.

**Look**
- A palette of its own: an indigo-violet accent, neutrals biased toward it, and
  shadows with a hue, in light and dark
- A teal second hue for unread markers
- Gradients on four surfaces only: the task rail, primary buttons, avatar
  placeholders, and a faint wash behind headers and the login page
- Login page redesigned as a raised card
- System font stack instead of the Roboto webfont, including in the HTML editor
- Softer radii, layered elevation and a modular type scale, all from design tokens

**Phones**
- A persistent bottom tab bar replaces the hidden drawer
- Touch-friendly list rows and safe-area insets on notched phones

**Accessibility (WCAG 2.2 AA)**
- Every text and control colour audited: 93 colour pairs, light and dark
- Fixes for failures inherited from Elastic: white on the accent, the task rail's
  Compose and Logout labels, dark-mode selected rows and links, secondary buttons,
  and the status toasts in both themes
- A solid keyboard focus indicator on every control, including the toolbars and
  the quick search, where Elastic removes it
- `forced-colors` (Windows High Contrast) and `prefers-reduced-motion` support

**Components**
- Settings checkboxes become web-component switches (self-hosted Shoelace, no CDN),
  falling back to the native checkbox
- Compose: recipient chips line up with the text cursor
- Comfortable density by default, with a compact mode in CSS (no setting yet)

**Known limitations**
- Tested in Chromium-based browsers only; Firefox, Safari and real phones are not
  verified yet
- Aurora's stylesheet contains Elastic's CSS, so CSS fixes in Elastic need a new
  Aurora build
