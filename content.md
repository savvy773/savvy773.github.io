# Content routes

- `index.html`: introduction, public project cards, GitHub and preview links, Journey overview, SEO metadata.
- `css/site.css`: layout, theme, project cards, responsive breakpoints.
- `js/app.js`: project category filters, document previews, scroll effects, interactions.
- `journey/`: individual career documents.
- `resume/resume.html`: resume displayed from the navigation.
- `assets/thumbs/`: existing project and Journey thumbnails.
- `scripts/version-assets.mjs`: run with Node after changing CSS or JavaScript and before publishing. Adds content hashes to asset URLs so returning visitors receive the matching styles and behavior.

Project descriptions were checked against the public `savvy773` GitHub repositories on 2026-10-17. The seven project cards start with the private PRISM Workspace + ERP card (no source link; it points to the Journey case study), then six public repositories, and exclude the profile repository, this portfolio repository, and shared GitHub Actions workflows. Update the card count and date in `index.html` when changing the selection.

The project map groups three AI tools, two automation projects (PRISM and app-yt-subs), and two developer utilities. When moving or adding a card, update its `data-category` and the corresponding map count and bar share in `index.html`. Screenshots for the three latest projects come from their public README images or deployed introduction page.

PRISM, built solo from scratch, is the largest project and the featured solo, from-scratch Workspace + ERP build case study in the introduction and Journey. Its repositories are private and it has no public introduction site, so do not link to one. Its web version is complete (since 2026-10-17); keep that completed status explicit, list only live features as built (purchase, inventory, production and HR are next steps), and screenshots in `assets/shots/` are either example data (`실제 화면 · 예시 데이터`) or real screens with every figure, customer/supplier name and order number pixelated (`실제 화면 · … 가림`); never publish unmasked business data, hostnames or emails. List PRISM first in Repositories, followed by public tools; Journey contains the ERP case study and historical work documents without repeating the project cards.

Project cards use compact previews and spacing on desktop, and a thumbnail beside the content on narrow screens. Keep descriptions fully visible and project links available. The main page follows the resume and Journey work documents: beige backgrounds, ivory surfaces, brown accents, and muted green secondary accents across Projects, Journey, navigation, and dialogs.

Keep the introduction and summary metrics compact. The PRISM feature shows facts and 2-by-2 development steps, a five-step data-flow strip, a tabbed showcase of five real screens (figures redacted in the DOM before capture, see `assets/shots/`) with a three.js ring transition on desktop, then built features, design points and stack (one column on mobile); five work records use three columns on desktop, two on tablet, and one on mobile, with short summaries and a clear section heading.

Google Fonts links use `display=optional`, not `swap`: a late font swap shifts the layout on first visit (CLS). Keep it on every page.
