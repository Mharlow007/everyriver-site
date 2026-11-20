# EveryRiver public site

This repository contains the static public holding site for EveryRiver.

## Current public story

The July 2026 redesign uses a muted looping river film behind the opening story and one approved river photograph for the “For the love of rivers everywhere” statement. It remains complete without product screenshots or the planned demonstration film.

## Design language

The public site follows the development product’s shared grammar:

- Roboto typography
- deep navy `#192841`
- deep teal `#00665D`
- warm cream `#F6F1E7`
- rounded 12px content panels and pill-shaped actions
- the product theme colours for geography, nature, heritage, visiting, water and boating

Shared public-site styles are in `assets/css/site.css`.

## Product media

- `introduction-film`: the 1:51 film "EveryRiver – An Atlas and Guide to rivers and canals" (YouTube `bswgtiMFQeA`), under the opening section. Poster `assets/images/raster/film-intro-poster.webp`, the film's own YouTube picture.
- `demonstration-video`: the 24-minute "EveryRiver atlas and guide DEMO" (YouTube `My-8iGAPJmw`), after the six beta screens and before the first-40 offer. Poster `assets/images/raster/film-demo-poster.webp`, the film's own YouTube picture.
- `assets/images/screens/`: one real beta screen for each of the six interests the beta asks a first visitor about (Walks and days out, Boating, Watersports, Wildlife, History, Water and landscape). Captured from the beta's feature panel on 18 November 2026, 452 × 860 WebP, cropped to the panel itself.
- `assets/images/svg/interests/`: the beta's own six interest icons, copied from `rivers/static/rivers/SVG/` in the website repository.

Do not reveal an empty slot. Add product media only after its alternative text, caption, credit and permission details are complete. A screen may show only photos that are public domain, CC0 or EveryRiver's own; iNaturalist photos are often non-commercial and are not used. Layer names on the page are exactly the beta layer menu's names.

For YouTube, use the privacy-enhanced `youtube-nocookie.com` embed, and only once a visitor presses play. Each film is a `.video-poster` link to the film on YouTube carrying `data-youtube-id`; the home page script swaps it for the player on a click, so a visitor who never plays a film never connects to YouTube, and without the script the link still works. The privacy notice's "Embedded video" section says exactly this; change it if that ever changes.
