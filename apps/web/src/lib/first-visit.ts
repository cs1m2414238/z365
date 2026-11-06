export const FIRST_VISIT_STORAGE_KEY = "z365.has_visited";

/**
 * Checks whether this is the user's first visit to the application in this browser.
 * Safely handles environments where localStorage might throw (e.g. privacy mode, sandboxes).
 */
export function isFirstTimeVisitor(): boolean {
  try {
    return localStorage.getItem(FIRST_VISIT_STORAGE_KEY) !== "true";
  } catch {
    return false;
  }
}

/**
 * Marks that the user has visited the application, so subsequent visits proceed directly.
 */
export function markVisitorAsKnown(): void {
  try {
    localStorage.setItem(FIRST_VISIT_STORAGE_KEY, "true");
  } catch {
    /* Optional storage; session still proceeds safely. */
  }
}

/**
 * Resets the first-visit flag (useful for testing or explicit onboarding replays).
 */
export function resetFirstVisitStatus(): void {
  try {
    localStorage.removeItem(FIRST_VISIT_STORAGE_KEY);
  } catch {
    /* Ignore errors */
  }
}
