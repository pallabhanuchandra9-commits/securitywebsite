/* ============================================================================
   WEB ANATOMY — services.js
   ============================================================================
   Behavior specific to services.html: makes the "Our process" accordion
   exclusive — opening one step closes the others, so the page doesn't
   grow into one long scroll of every step expanded at once.

   Note what this file is NOT doing: it isn't writing the open/close
   logic itself. The native <details>/<summary> element already handles
   expand/collapse for free (that's plain HTML, no JS needed at all).
   This script only listens for the "toggle" event — fired automatically
   whenever a <details> opens or closes — and closes its siblings.
   ============================================================================ */

const accordion = document.getElementById("processAccordion");

// Guard clause: if this page doesn't have the accordion (shouldn't
// happen on services.html, but keeps this file safe to include
// anywhere without risk of a null-reference crash), stop here.
if (accordion) {
  const panels = accordion.querySelectorAll(".accordion-item");

  panels.forEach((panel) => {
    // The "toggle" event is native to <details> — it fires once right
    // after the element's open/closed state changes, whether that
    // change came from a click or a keyboard Enter/Space press.
    panel.addEventListener("toggle", () => {
      // Only act when THIS panel was the one that just opened; we don't
      // want to do anything when a panel closes, or we'd fight with the
      // clicks below.
      if (!panel.open) return;

      panels.forEach((other) => {
        if (other !== panel) {
          other.open = false;
        }
      });
    });
  });
}