# Favourite bathing sites

Use the star at the top right of the current site's hero or on any list card to save/remove
it. The location picker has a Favourites view with a count, search, water-type and
country filters. Selecting a saved card loads the current catalogue record by ID;
saving or removing its star does not select the site.

Favourites live in `safe-to-swim-favourites` in this browser's localStorage. They
survive reloads and language changes, but are not account-synced. Only stable IDs
and display metadata are saved, never forecasts, safety ratings or user coordinates.
Names continue to use the shared verified-name resolver. Other open tabs receive
storage changes. Invalid stored entries are ignored and duplicate IDs are removed.
If saving fails, the current session retains the change and the interface explains
that it could not persist it. Missing catalogue IDs use the existing unavailable-site
flow; saved items can still be removed from the Favourites list.

Validation: 109 tests, translation validation for all 44 packs, ESLint and the
production build pass. Browser checks covered adding without navigation, persistence
after reload, opening a different saved site, filtered no-results, removal after
reload, and the empty state at mobile width (390px, no horizontal overflow).
