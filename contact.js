/* ============================================================================
   WEB ANATOMY — contact.js
   ============================================================================
   Behavior specific to contact.html: clicking "Copy" next to the email
   address writes it to the visitor's clipboard using the Clipboard API,
   then briefly shows "Copied" as confirmation before reverting.

   This file is intentionally small — it's here to demonstrate one more
   real browser API (navigator.clipboard) in isolation, separate from the
   contact-form logic that already lives in script.js.
   ============================================================================ */

const copyBtn = document.getElementById("copyEmailBtn");

if (copyBtn) {
  copyBtn.addEventListener("click", async () => {
    const value = copyBtn.dataset.copyValue;
    const originalLabel = copyBtn.textContent;

    try {
      // navigator.clipboard.writeText returns a Promise — it's async
      // because writing to the clipboard is a permission-gated browser
      // operation, not an instant synchronous one. Only works on
      // secure contexts (https, or localhost during development).
      await navigator.clipboard.writeText(value);

      copyBtn.textContent = "Copied";
      copyBtn.setAttribute("data-copied", "true");
    } catch (error) {
      // Clipboard access can fail — e.g. the page isn't served over
      // HTTPS, or the browser blocked the permission. Fail visibly
      // rather than silently doing nothing.
      copyBtn.textContent = "Copy failed";
    }

    // Revert the button back to its normal label after a couple of
    // seconds, whichever branch above ran. setTimeout schedules this
    // to run later without blocking anything else on the page.
    setTimeout(() => {
      copyBtn.textContent = originalLabel;
      copyBtn.removeAttribute("data-copied");
    }, 2000);
  });
}