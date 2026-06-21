
## 2026-06-20 - [ARIA Live Regions for Dynamic Search]
**Learning:** Screen readers often miss dynamic DOM updates, like search results updating asynchronously on the fly. By adding `aria-live="polite"` and `role="status"` to elements whose content changes (e.g., `#search-status` displaying "Loading..." or "Found N results"), we can dramatically improve accessibility for users relying on audio feedback.
**Action:** Always ensure that any live search patterns or dynamically updating status text containers implement `aria-live="polite"` or `role="status"` to properly announce state changes without interrupting the user's current flow.
