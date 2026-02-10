# trymito.io responsive UI — best practices

## Visibility (show/hide by viewport)

Instead of using js to check the viewport size (e.g. `useIsMobile`), we use css media queries to show and hide elements based on the viewport size.

- **Hide on mobile:** `className="only-on-desktop"` (or `only-on-desktop-inline-block`). See `styles/globals.css`: hidden by default, visible at 50em.
- **Show only on mobile:** `only-on-mobile`, `only-on-mobile-block`, `only-on-mobile-inline-block`.

## Grids / Card layouts

- When creating grids, unless there is a good reason, prefer flex + wrap over fixed grid columns. Cards will then wrap by space; fewer per row on small screens, more on wide. Tune `min-width` at 40em / 50em if needed.
- Make sure to use flex-grow and flex-shrink to make sure the cards are consistent sizes.

## Verification

- Check wide desktop, medium, small, and mobile. Confirm nothing overlaps and visibility matches intent at each size.
