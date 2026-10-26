# Wei Jie & Xin Yi: sample wedding invitation

A demo digital invitation for a fictional Malaysian Chinese couple. It is a static site: plain HTML, CSS and JavaScript, with no build step and no dependencies beyond Google Fonts and the Google Maps embed.

## Preview locally

From this folder, run any static server, for example:

```bash
npx --yes serve .
```

Then open the address it prints. Double-clicking `index.html` also works for a quick look.

## Deploy

Upload this whole folder to any static host (Netlify drop, Cloudflare Pages, Vercel, GitHub Pages, S3). `index.html` is the entry point.

## Page structure

1. **Opening gate**: a moon gate (月亮门) over a burgundy peony jacquard, with "Tap to open". It is skipped on reload within the same browser session, or with `?open=1` or a `#section` link.
2. **Hero**: a looping video (9:16 on phones, 16:9 on desktop) over a poster image, gold dust particles, the couple's names in English and Chinese, the date and a live countdown.
3. **Our story**: five milestones (2017 to 2026) with arch-framed photos.
4. **Gallery**: a masonry grid with a lightbox (swipe, arrow keys, Esc).
5. **Wedding details**: date card, add to calendar (Google or .ics), schedule, venue, map, Google Maps and Waze buttons, dress code and parking.
6. **RSVP**: validated form with a thank-you state. If the guest writes a message, it also appears on the wishes wall.
7. **Wishes**: sample guest messages.
8. **Gifts**: ang pow / DuitNow card with a clearly marked sample QR.
9. **Footer**: thank-you note, add to calendar, music toggle and the "Made with love by" line.

The EN / 中文 toggle (top right) translates all visible text, alt text and labels. The language is remembered and can be forced with `?lang=zh` or `?lang=en`.

## Replace before sending a real invitation

| What | Where |
| --- | --- |
| Deployed URL for the WhatsApp / Open Graph preview (WhatsApp needs absolute image URLs) | `index.html`: every `https://your-domain.example` |
| Date, times and map pin | `assets/js/main.js`: `WEDDING` config at the top |
| Map embed | `index.html`: the `<iframe>` `src` inside `.map` |
| Venue, schedule, dress code, parking and all copy (both languages) | `assets/js/i18n.js` |
| Bank details and copy buttons | `index.html`: the `.gift-card__details` block |
| DuitNow QR | `assets/img/sample-qr.svg`; remove the "Sample only" stamp |
| Photos and video | `assets/img/*` (AVIF + WebP at several widths) and `assets/video/*` (WebM + MP4) |
| Background music | `assets/audio/placeholder-music.mp3` (a synthesised placeholder; use a licensed track) |
| Your business name | `assets/js/i18n.js`: `footerBrand` (EN and 中文) |
| "Sample invitation" fine print and sample wishes | `assets/js/i18n.js`: `footerFine`, `w1` to `w6` |

## Connect a real RSVP backend

In `assets/js/main.js`, find the block marked **RSVP SUBMIT HANDLER (DEMO)**. Replace the body of `submitRsvp(data)` with a `fetch` POST to your endpoint (Google Apps Script, Formspree, Supabase or your own API) and return `{ ok: true }` on success. The form already validates its fields, shows a loading state and handles errors.

`data` looks like:

```json
{ "name": "Lee Mei Ling", "attending": "yes", "guests": 2, "diet": "halal", "message": "So happy for you both!" }
```

## Performance and accessibility notes

- Images are served as AVIF with WebP fallback, in 480 to 2560px widths, with 20px blur-up placeholders inlined. Below-the-fold images are lazy-loaded.
- The hero poster is preloaded per orientation. Video loads only after the page settles, is skipped when Save-Data or reduced motion is on, and pauses off-screen.
- A typical first visit on a phone transfers about 1.4 MB from this site. Google Fonts and the map load separately.
- `prefers-reduced-motion` removes the video, particles, parallax and reveal animations.
- Keyboard focus is visible throughout. The lightbox uses a native `<dialog>`, form errors are announced and the first invalid field gets focus.

## Credits

- Photos and hero video: generated with Higgsfield (Nano Banana Pro, GPT Image 2.5, Kling 3.0) from one shared reference image of the fictional couple. The full-resolution originals are in the Higgsfield account's generation history.
- Fonts: Bodoni Moda, Jost, Noto Serif SC and Noto Sans SC (Google Fonts, SIL Open Font License).
- Ornaments, icons, lanterns and the 囍 seal are hand-written SVG in `index.html`.
