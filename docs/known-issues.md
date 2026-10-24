# Known issues

## Legacy iPhone Safari order sheet (`?docscroll=0`)

In this legacy fixed-sheet mode, Safari's top and bottom browser bars can
appear black, and a button can look faded or clipped (reported on
"Proceed to Details"). Normal URLs use document-scroll mode on touch Safari
and were confirmed by the user to be unaffected.

**Pre-change baseline:** The user reproduced both symptoms on the 4191
production-build preview of main commit `024ec12`, with `?docscroll=0`, and
on the navigation preview. This is a pre-existing legacy-mode issue.
Native iPhone rendering was not independently reproduced by the agent;
headless WebKit does not validate Safari's native browser-bar rendering.
