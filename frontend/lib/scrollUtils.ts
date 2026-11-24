/**
 * Utility functions for managing scroll behavior across the application.
 */

/**
 * Instantly scrolls the window and any inner scrollable containers to the top (0, 0),
 * temporarily overriding any smooth-scrolling CSS and browser/router scroll restoration.
 */
export function scrollToTopInstant(): void {
  if (typeof window === "undefined") return;

  // 1. Prevent browser/Next.js scroll restoration from overriding manual position
  try {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  } catch {
    // Ignore environments where history manipulation is restricted
  }

  // 2. Temporarily disable smooth scroll behavior on html and body so jump is truly instant
  const html = document.documentElement;
  const body = document.body;
  const prevHtmlScrollBehavior = html.style.scrollBehavior;
  const prevBodyScrollBehavior = body.style.scrollBehavior;

  html.style.scrollBehavior = "auto";
  body.style.scrollBehavior = "auto";

  // 3. Reset window and document scrolling
  window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
  html.scrollTop = 0;
  body.scrollTop = 0;

  // 4. Reset scroll on main content wrappers and any scrollable containers
  const scrollableElements = document.querySelectorAll<HTMLElement>(
    "main, #org-admin-main, [data-scrollable], .overflow-y-auto, .overflow-y-scroll"
  );
  scrollableElements.forEach((el) => {
    el.scrollTop = 0;
    el.scrollLeft = 0;
  });

  // 5. Restore previous scrollBehavior after next animation frame so future intended smooth scrolls work
  requestAnimationFrame(() => {
    html.style.scrollBehavior = prevHtmlScrollBehavior;
    body.style.scrollBehavior = prevBodyScrollBehavior;
  });
}
