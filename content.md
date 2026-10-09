# Content routes

- `index.html`: introduction, public project cards, GitHub and preview links, Journey overview, SEO metadata.
- `css/site.css`: layout, theme, project cards, responsive breakpoints.
- `js/app.js`: project category filters, document previews, scroll effects, interactions.
- `journey/`: individual career documents.
- `resume/resume.html`: resume displayed from the navigation.
- `assets/thumbs/`: existing project and Journey thumbnails.
- `scripts/version-assets.mjs`: run with Node after changing CSS or JavaScript and before publishing. Adds content hashes to asset URLs so returning visitors receive the matching styles and behavior.

Project descriptions were checked against the public `savvy773` GitHub repositories on 2026-10-10. The seven project cards exclude the profile repository, this portfolio repository, and shared GitHub Actions workflows. Update the card count and date in `index.html` when changing the selection.

The project map groups three AI tools, two automation projects, and two developer utilities. When moving or adding a card, update its `data-category` and the corresponding map count and bar share in `index.html`. Screenshots for the three latest projects come from their public README images or deployed introduction page.

PRISM is the featured initial ERP setup case study in the introduction and Journey. Its original repository is private; link visitors only to the public introduction site. Keep its in-development status explicit. List public tools in Repositories; Journey contains the ERP case study and historical work documents without repeating the project cards.
