export const isSafariBrowser = () => {
  const userAgent = navigator.userAgent;
  return /Safari/i.test(userAgent) &&
    !/(Android|Brave|Chrome|Chromium|CriOS|DuckDuckGo|Edg|FxiOS|Firefox|OPR|OPiOS|SamsungBrowser)/i.test(userAgent);
};

export const shouldUseDocumentScrollMode = (search: string, isSafari: boolean, hasTouch: boolean) => {
  const override = new URLSearchParams(search).get("docscroll");
  if (override === "1") return true;
  if (override === "0") return false;
  return isSafari && hasTouch;
};
