/* ============================================================================
   WEB ANATOMY — about.js
   ============================================================================
   Behavior specific to about.html: count each .stat-value up from 0 to
   its data-target number, but only once the stats section actually
   scrolls into the visitor's viewport — not immediately on page load,
   where they'd likely finish counting before anyone scrolls down to see it.

   Two browser APIs do the real work here:
     - IntersectionObserver: tells us WHEN an element becomes visible,
       without us having to manually track scroll position ourselves.
     - requestAnimationFrame: drives the count-up smoothly, in sync with
       the browser's own repaint cycle, instead of a janky setInterval.
   ============================================================================ */

const statValues = document.querySelectorAll(".stat-value");

/**
 * Animates a single <span class="stat-value"> from 0 up to its
 * data-target value over `duration` milliseconds.
 */
function animateCount(element, duration = 1200) {
  const target = Number(element.dataset.target);
  const startTime = performance.now();

  function tick(now) {
    // elapsed / duration gives us a 0 → 1 progress value; Math.min caps
    // it at 1 so the animation can't overshoot if a frame is late.
    const progress = Math.min((now - startTime) / duration, 1);

    // Ease-out cubic: fast at the start, settling in gently at the end,
    // instead of a mechanical straight-line count. Purely a feel choice.
    const eased = 1 - Math.pow(1 - progress, 3);

    element.textContent = Math.round(eased * target);

    if (progress < 1) {
      // Ask the browser to run this function again right before its
      // next repaint — this is what makes the animation smooth and
      // battery-friendly compared to a fixed-interval timer.
      requestAnimationFrame(tick);
    } else {
      // Land exactly on the real number — rounding during the animation
      // can land 1 off due to floating point, so we set it precisely
      // on the final frame.
      element.textContent = target;
    }
  }

  requestAnimationFrame(tick);
}

// Guard: about.html always has at least one .stat-value, but this keeps
// the file harmless if it were ever loaded on a page without one.
if (statValues.length > 0) {
  // The observer's callback fires whenever ANY watched element crosses
  // the visibility threshold we configure below — in either direction
  // (entering or leaving view), so we check `isIntersecting` to act
  // only on "entering".
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCount(entry.target);
          // We only want this to happen once per element — without
          // unobserve, scrolling past the section repeatedly would
          // restart the count-up every time.
          observer.unobserve(entry.target);
        }
      });
    },
    {
      // Fire when 50% of the element is visible, rather than the
      // instant a single pixel enters the viewport — feels more
      // intentional than triggering the instant it peeks into view.
      threshold: 0.5,
    }
  );

  statValues.forEach((value) => observer.observe(value));
}