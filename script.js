/* ============================================================================
   WEB ANATOMY — script.js
   ============================================================================
   This file is the BEHAVIOR layer: it reacts to events (clicks, submits,
   page load) and updates the DOM. It never defines what things look like
   (that's styles.css) or what they fundamentally are (that's index.html).

   Because index.html loads this with <script type="module">, we get to use
   native `import` statements — no bundler, no build step required. That's
   why we can pull Zod straight from a CDN on the next line.

   Sections in this file:
     1. IMPORTS
     2. CONSTANTS & DOM REFERENCES
     3. ZOD VALIDATION SCHEMA
     4. MOBILE NAV TOGGLE
     5. FOOTER YEAR
     6. CONTACT FORM SUBMISSION (validation + honeypot + Web3Forms)

   IMPORTANT — this file is shared across every page (index.html,
   products.html, and whatever else gets added later), because the
   header/nav/footer are identical on all of them. Sections 4 and 5 run
   unconditionally since every page has a nav and a footer. Section 6
   is wrapped in `if (form) { ... }` because only index.html currently
   has a #contactForm — without that guard, this script would throw an
   error on any page that doesn't, and sections below it would never run.
   ============================================================================ */


/* ----------------------------------------------------------------------
   1. IMPORTS
   esm.sh re-packages npm modules as native ES modules the browser can
   import directly by URL — no npm install, no bundler. Pinning an exact
   version (@3.23.8) means the site won't silently change behavior if
   Zod ships a new major version later.
   ---------------------------------------------------------------------- */
import { z } from "https://esm.sh/zod@3.23.8";


/* ----------------------------------------------------------------------
   2. CONSTANTS & DOM REFERENCES
   Grabbing every element we need once, up front, is cheaper than
   re-querying the DOM inside event handlers, and it makes the file
   easier to scan — all the "what am I working with" is in one place.
   ---------------------------------------------------------------------- */
const WEB3FORMS_ENDPOINT = "https://api.web3forms.com/submit";

const navToggle = document.getElementById("navToggle");
const navMenu = document.getElementById("navMenu");

const form = document.getElementById("contactForm");
const submitBtn = document.getElementById("submitBtn");
const formStatus = document.getElementById("formStatus");
const yearEl = document.getElementById("year");


/* ----------------------------------------------------------------------
   3. ZOD VALIDATION SCHEMA
   Zod lets us describe "what a valid submission looks like" declaratively,
   then hand it real form data and get back either a parsed, typed result
   or a structured list of errors — instead of hand-rolling a pile of
   if-statements. This runs in the browser (client-side) purely to give
   the visitor fast feedback; Web3Forms / a real backend should still be
   trusted as the final authority, since client-side validation can
   always be bypassed by a determined attacker.
   ---------------------------------------------------------------------- */
// Only build the schema at all on pages that have the contact form —
// no point defining validation rules for an input that doesn't exist.
const contactSchema = form
  ? z.object({
      name: z
        .string()
        .trim()
        .min(2, "Enter your name (at least 2 characters).")
        .max(100, "That name looks too long — 100 characters max."),

      email: z
        .string()
        .trim()
        .min(1, "Enter your email address.")
        .email("Enter a valid email address."),

      message: z
        .string()
        .trim()
        .min(10, "Say a little more — at least 10 characters.")
        .max(2000, "That message is too long — 2000 characters max."),

      // Honeypot field. A real visitor never sees or fills this (see
      // the .hp-field CSS), so z.literal("") demands it stay empty. If
      // a bot fills every input it can find, this fails validation and
      // we quietly drop the submission further down.
      company: z.literal("", {
        errorMap: () => ({ message: "Spam check failed." }),
      }),
    })
  : null;

/**
 * Maps a Zod validation-error object to { fieldName: message } so the UI
 * code can show one message per input without knowing anything about
 * Zod's internal error shape.
 */
function flattenZodErrors(zodError) {
  const fieldErrors = {};
  for (const issue of zodError.issues) {
    const key = issue.path[0];
    // Keep only the first error per field — showing every rule a field
    // fails at once is noisy; fix-one-see-next is a friendlier flow.
    if (!fieldErrors[key]) {
      fieldErrors[key] = issue.message;
    }
  }
  return fieldErrors;
}


/* ----------------------------------------------------------------------
   4. MOBILE NAV TOGGLE
   Small, self-contained piece of behavior: clicking the hamburger button
   flips an "open" class on the menu and keeps the button's aria-expanded
   attribute in sync so screen readers announce the state correctly.
   ---------------------------------------------------------------------- */
navToggle.addEventListener("click", () => {
  const isOpen = navMenu.classList.toggle("is-open");
  navToggle.setAttribute("aria-expanded", String(isOpen));
});

// Close the mobile menu automatically after a link is tapped, so the
// menu doesn't stay open covering the page the visitor just navigated to.
navMenu.addEventListener("click", (event) => {
  if (event.target.tagName === "A") {
    navMenu.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
  }
});


/* ----------------------------------------------------------------------
   5. FOOTER YEAR
   A tiny example of the DOM being a live, scriptable document rather
   than a static file: we compute the current year once at load time
   instead of hardcoding it and having it go stale next January.
   ---------------------------------------------------------------------- */
yearEl.textContent = new Date().getFullYear();


/* ----------------------------------------------------------------------
   6. CONTACT FORM SUBMISSION
   Everything in this section only makes sense in the presence of the
   contact <form>, so the whole block is skipped on pages that don't
   have one (e.g. products.html). `form` is null there, and the `if`
   guard just below prevents a "Cannot read properties of null" crash.
   ---------------------------------------------------------------------- */

// Everything below only runs if this page actually has a #contactForm.
// On products.html (and future pages without a form) `form` is null,
// so this whole block is skipped and the file ends quietly after
// section 5 (nav toggle + footer year) instead of throwing.
if (form) {
  /** Clears every field's error message and [data-invalid] styling hook. */
  const clearFieldErrors = () => {
    for (const fieldName of ["name", "email", "message"]) {
      const errorEl = document.getElementById(`${fieldName}-error`);
      const fieldWrapper = errorEl.closest(".field");
      errorEl.textContent = "";
      fieldWrapper.removeAttribute("data-invalid");
    }
  };

  /** Writes each Zod error message next to its matching input. */
  const showFieldErrors = (fieldErrors) => {
    for (const [fieldName, message] of Object.entries(fieldErrors)) {
      const errorEl = document.getElementById(`${fieldName}-error`);
      // The honeypot field ("company") has no visible error slot on
      // purpose — a bot doesn't need a helpful message, and a human
      // should never see this field fail at all.
      if (!errorEl) continue;
      errorEl.textContent = message;
      errorEl.closest(".field").setAttribute("data-invalid", "true");
    }
  };

  /** Updates the aria-live status line at the bottom of the form. */
  const setStatus = (message, state) => {
    formStatus.textContent = message;
    formStatus.setAttribute("data-state", state);
  };

  form.addEventListener("submit", async (event) => {
    // Stop the browser's default "reload the page and send a plain
    // HTTP request" behavior — we want to send it ourselves with
    // fetch() so we can validate first and show inline feedback
    // without a page reload.
    event.preventDefault();

    clearFieldErrors();
    setStatus("", "");

    // FormData reads every named input/textarea inside the <form> into
    // a key/value collection, keyed by each field's `name` attribute.
    const formData = new FormData(form);
    const values = Object.fromEntries(formData.entries());

    // safeParse (rather than parse) returns a result object instead of
    // throwing, which keeps this code readable as a plain if/else
    // instead of a try/catch.
    const result = contactSchema.safeParse(values);

    if (!result.success) {
      const fieldErrors = flattenZodErrors(result.error);

      // Honeypot tripped: a bot filled the hidden "company" field. We
      // do NOT reveal that to the caller — no special error message,
      // no console log — we just pretend the message was sent and
      // stop here. This avoids teaching spam scripts they've been
      // detected.
      if (fieldErrors.company) {
        setStatus("Thanks — your message has been sent.", "success");
        form.reset();
        return;
      }

      // Otherwise, a real visitor made a genuine mistake — show them
      // exactly what to fix.
      showFieldErrors(fieldErrors);
      setStatus("Please fix the highlighted fields.", "error");
      return;
    }

    // From here on, `result.data` is validated, trimmed, and typed —
    // safe to send onward.
    const accessKey = form.dataset.web3formsKey;

    if (!accessKey || accessKey === "PASTE_YOUR_WEB3FORMS_ACCESS_KEY_HERE") {
      // Fails loudly in development so it's obvious the key still
      // needs to be added — see the data-web3forms-key attribute on
      // the <form> in index.html.
      setStatus(
        "Form isn't connected yet — add your Web3Forms access key in index.html.",
        "error"
      );
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Sending…";

    try {
      const response = await fetch(WEB3FORMS_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          access_key: accessKey,
          name: result.data.name,
          email: result.data.email,
          message: result.data.message,
          subject: `New message from ${result.data.name} via Northlane site`,
        }),
      });

      const payload = await response.json();

      if (payload.success) {
        setStatus("Thanks — your message has been sent.", "success");
        form.reset();
      } else {
        // Web3Forms reached us fine but rejected the request (e.g. a
        // disabled or invalid access key) — payload.message explains
        // why.
        setStatus(payload.message || "Something went wrong. Please try again.", "error");
      }
    } catch (error) {
      // Network failure, offline, DNS issue, etc. — fetch() throws
      // rather than resolving in this case.
      setStatus("Network error — please check your connection and try again.", "error");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Send message";
    }
  });
}