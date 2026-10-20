import { checkBackground, runBrowserCheck } from './site-checks.mjs';

await runBrowserCheck(checkBackground, ['chromium', 'webkit']);
