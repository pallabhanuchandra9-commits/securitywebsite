/* ============================================================================
   WEB ANATOMY — product.js
   ============================================================================
   Behavior specific to product.html: clicking a filter button shows only
   the product cards whose category matches, and hides the rest.

   This is a separate file from script.js on purpose — script.js holds
   behavior every page shares (nav toggle, footer year, contact form);
   this file holds behavior only product.html needs. Loading both keeps
   each file focused on one job, and means script.js never has to know
   product.html exists.
   ============================================================================ */

/* ----------------------------------------------------------------------
   DOM REFERENCES
   ---------------------------------------------------------------------- */
const filterButtons = document.querySelectorAll(".filter-btn");
const productCards = document.querySelectorAll(".product-card");
const emptyState = document.getElementById("emptyState");

/* ----------------------------------------------------------------------
   FILTERING
   applyFilter(category) is the one function that actually changes what's
   on screen; the click handler below just figures out WHICH category was
   requested and hands it off. Separating "decide what to do" from "do it"
   is a small habit that keeps event handlers easy to read.
   ---------------------------------------------------------------------- */
function applyFilter(category) {
  let visibleCount = 0;

  productCards.forEach((card) => {
    // "all" matches everything; otherwise compare the button's category
    // against the card's data-category attribute read via .dataset.
    const matches = category === "all" || card.dataset.category === category;

    // The `hidden` attribute is a real HTML/DOM feature (not just a CSS
    // class convention): setting card.hidden = true is equivalent to
    // adding the `hidden` attribute, which removes the element from
    // layout AND from the accessibility tree — screen readers skip it
    // too, not just sighted users.
    card.hidden = !matches;

    if (matches) visibleCount += 1;
  });

  // Only show the "no products" message when a filter genuinely
  // matches nothing — with the current catalog this never happens, but
  // the check keeps the UI honest if products are added or removed later.
  emptyState.hidden = visibleCount > 0;
}

/* ----------------------------------------------------------------------
   EVENT WIRING
   One click listener per button (rather than a single delegated
   listener on the container) is fine here since there are only four
   buttons and they don't change after page load — delegation earns its
   complexity mainly when elements are added/removed dynamically.
   ---------------------------------------------------------------------- */
filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    // Reset every button to unpressed, then mark only the one that was
    // clicked — this is what gives the filter bar its "pick exactly
    // one" behavior, both visually (CSS keys off aria-pressed) and for
    // screen readers.
    filterButtons.forEach((btn) => btn.setAttribute("aria-pressed", "false"));
    button.setAttribute("aria-pressed", "true");

    applyFilter(button.dataset.filter);
  });
});