/** Adds a listener and returns its remover (accepts null targets, e.g. no visualViewport). */
export function listen(
  target: EventTarget | null | undefined,
  type: string,
  handler: EventListener,
  options?: AddEventListenerOptions,
) {
  target?.addEventListener(type, handler, options);
  return () => target?.removeEventListener(type, handler, options);
}
