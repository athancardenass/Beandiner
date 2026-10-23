// ↓ BULLETPROOF CLIPBOARD COPY: Synchronous execCommand inside active modal/container + Async navigator.clipboard
export const copyToClipboard = async (text: string): Promise<boolean> => {
  if (!text) return false;
  let copied = false;

  // 1. Synchronous fallback: Executes immediately inside the user click/submit gesture.
  // Critical fix: When dialog.showModal() is active, elements appended to document.body
  // are marked inert by the browser, which silently breaks textarea.focus() and selection!
  // Appending inside dialog[open] ensures the element is in the active focusable subtree.
  try {
    const container =
      document.querySelector<HTMLElement>("dialog[open]") ||
      document.body;

    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "absolute";
    textarea.style.left = "0";
    textarea.style.top = "0";
    textarea.style.width = "1px";
    textarea.style.height = "1px";
    textarea.style.padding = "0";
    textarea.style.border = "none";
    textarea.style.outline = "none";
    textarea.style.boxShadow = "none";
    textarea.style.background = "transparent";
    textarea.style.color = "transparent";
    textarea.style.opacity = "0.01";
    textarea.style.pointerEvents = "none";
    textarea.style.zIndex = "-1";
    textarea.style.fontSize = "16px";
    textarea.setAttribute("readonly", "");

    container.appendChild(textarea);
    textarea.focus({ preventScroll: true });
    textarea.select();
    textarea.setSelectionRange(0, text.length);

    copied = document.execCommand("copy");
    container.removeChild(textarea);
  } catch {
    /* fallback handled below */
  }

  // 2. Await the modern clipboard backup after the synchronous click-gesture attempt.
  try {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
      await navigator.clipboard.writeText(text);
      copied = true;
    }
  } catch {
    /* Keep the result of the synchronous attempt when the backup fails. */
  }

  return copied;
};
