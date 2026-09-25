# LLM Pipeline Account Isolation and Cron Resilience

**Status:** Design approved in chat; awaiting user review of this spec.

## Goal

Keep Hermes traffic on Google AI Account 1, reserve OmniRoute for coding and cron workloads on Accounts 2 and 3, and reduce synchronized cron bursts that produce 429 responses.

This checkout currently contains the Saya cafe website and no Hermes, OmniRoute, or cron configuration. The implementation will therefore add a self-contained reference bundle under `ops/llm-pipeline/`. Existing website files and their current working-tree edits are outside scope.

## Requirements

1. Hermes uses the native Google Gemini API endpoint and Account 1's API key. Hermes must not use the OmniRoute base URL for its main model or auxiliary model calls.
2. OmniRoute has three priority combos, with Account 2 first and Account 3 second:
   - `combo-planning-coding`: `gemini-3.8-flash-tiered`, high effort.
   - `combo-ui-polish`: `claude-sonnet-4-6`.
   - `combo-hard-bugs`: `claude-opus-4-6-thinking`.
3. Cron jobs use schedules offset from one another by 1–3 minutes, random pre-call jitter, and API-client retries with exponential backoff, up to three retries.
4. No API keys or other secrets are written to tracked files.

## Proposed artifacts

- `ops/llm-pipeline/README.md` — setup, account mapping, and rollout instructions.
- `ops/llm-pipeline/hermes/config.yaml.example` — Hermes native Gemini provider configuration, using Google's `generativelanguage.googleapis.com` base URL. Auxiliary model settings will use Hermes' main provider where supported, so optional calls follow the same direct Account 1 route.
- `ops/llm-pipeline/hermes/.env.example` — a placeholder for the Account 1 Google API key; the real key remains in the user's local Hermes environment file.
- `ops/llm-pipeline/omniroute/combos.yaml` — a readable setup specification for the three aliases, strategy, target order, model, effort, and account labels. It will be explicitly described as a dashboard/setup reference, not a version-guaranteed OmniRoute import payload.
- `ops/llm-pipeline/cron/crontab.example` — sample entries demonstrating distinct minute offsets 1–3 minutes apart.
- `ops/llm-pipeline/cron/llm-client-retry.mjs` — dependency-free example for retrying an individual model API request, with a maximum of three retries, exponential backoff, jitter, `Retry-After` support, and retry filtering for rate limits/transient failures.
- `ops/llm-pipeline/cron/example-job.sh` — Bash example showing `sleep $((RANDOM % 15))` before an LLM call and invoking the request helper.

The current OmniRoute version and provider connection IDs are not present in this workspace. Account 2 and Account 3 will therefore be labels/placeholders that must be mapped to the corresponding saved connections in the OmniRoute dashboard. The model's high-effort control will be represented as a separate setting in the setup spec; the setup instructions will tell the operator to map it to the installed OmniRoute version's supported effort field or model variant.

## Data flow and isolation

Hermes reads Account 1's key from its own environment and calls Google's native Gemini API endpoint directly. Its main model configuration will use `provider: gemini`; it will not point to OmniRoute. Any configured Hermes auxiliary model calls will use the main provider when supported, and setup instructions will call out removing conflicting proxy/base URL overrides.

Cron scripts call OmniRoute using the relevant combo alias. OmniRoute tries the Account 2 target first and falls back to Account 3 under its priority strategy. The cron request helper retries only the individual API call; it does not replay an entire job that may have side effects.

## Scheduling and retry behavior

The crontab is an example, because this checkout has no existing job inventory. Operators will assign each real job a distinct minute, offset by one to three minutes from related jobs. Each Bash script will wait a random integer from 0 through 14 seconds before a model request.

The API helper will allow three retries after the initial attempt (up to four total attempts). It will retry HTTP 429, transient 5xx responses, and network failures; honor a valid `Retry-After` response; otherwise use bounded exponential delays with added jitter. Authentication, invalid-model, and other non-transient 4xx failures will be returned immediately. Backoff values will be configurable in the example and documented.

These controls reduce bursts but do not provide a global concurrency lock if a job runs long enough to overlap a later schedule. If overlap persists in the real workload, a shared lock or queue can be designed against the actual runner and operating system.

## Validation and acceptance

- Hermes example sets the native Google base URL and contains no OmniRoute endpoint or real secret.
- The combo spec lists all three exact aliases/models and places Account 2 before Account 3 under `priority`.
- Cron sample entries are staggered by 1–3 minutes, and the job example places random jitter before the API call.
- Retry example caps retries at three beyond the initial attempt, applies exponential backoff and jitter, honors `Retry-After`, and filters retryable errors.
- Documentation clearly identifies all version- and account-specific placeholders.

No runtime tests are planned in this design phase. The exact OmniRoute create/import payload and account connection identifiers must be confirmed against the user's installed release before turning the reference spec into an executable API payload.

## Sources

- [Hermes Agent Google Gemini guide](https://github.com/NousResearch/hermes-agent/blob/main/website/docs/guides/google-gemini.md) describes the native Gemini provider, Google base URL, and key environment variables.
- [OmniRoute README](https://github.com/Gods-light/omniroute/blob/main/README.md) describes priority combos as an ordered chain that falls through when a target fails.
