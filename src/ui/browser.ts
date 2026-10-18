export const isSafariBrowser = () => {
  const userAgent = navigator.userAgent;
  return /Safari/i.test(userAgent) &&
    !/(Android|Brave|Chrome|Chromium|CriOS|DuckDuckGo|Edg|FxiOS|Firefox|OPR|OPiOS|SamsungBrowser)/i.test(userAgent);
};
