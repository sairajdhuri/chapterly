# Chapterly

Better chapters. Clearer writing.

A free, private English readability editor built with Next.js App Router, TypeScript, Tailwind CSS, Motion, and Lucide. Parchment surfaces, literary typography, oxblood actions, and amber sentence annotations follow the supplied Dark Academia direction.

## Run

Use Node.js 22.18 or newer.

```sh
npm install
npm run dev
```

Open http://127.0.0.1:3000.

```sh
npm run typecheck
npm test
npm run build
npm start
```

## What works

- Paste or type a full chapter; paragraph breaks, dialogue, and punctuation are preserved.
- Live word and Unicode character counts, and reading time at an estimated 238 words/minute.
- Explicit chapter analysis using the npm `text-readability` library for Flesch Reading Ease and Flesch–Kincaid grade estimates.
- A display score bounded to 0–100, with the original unbounded Flesch value also shown.
- Up to five sentences ranked from most to least demanding using their original scores; amber highlights link to editorial notes by exact source offsets.
- Edit and Review tabs, a sample original chapter, and confirmation before replacing a writer's draft.
- Keyboard navigation, visible focus, accessible native confirmation dialogs, responsive layouts, and reduced-motion support.

## Privacy and scoring

The application has no chapter API, account, analytics, database, or draft storage. All chapter analysis happens in the browser. Closing the tab loses the draft; a before-unload prompt protects nonempty writing, and the interface reminds authors to keep a copy.

The browser-native `Intl.Segmenter` locates sentences without rewriting the manuscript. Live word counts use Unicode-aware tokens. `text-readability` supplies the actual scoring, including its own syllable estimation, sentence counting, and rounding rules. Those counting rules may differ from the visible manuscript statistics, especially for short dialogue and abbreviations. English readability estimates do not measure story quality, voice, or literary merit.

Google Fonts supplies Cormorant Garamond, EB Garamond, Inter, and DM Mono through an external stylesheet; Garamond, Georgia, Arial, and monospace are fallbacks. No chapter content is included in font requests. Font loading requires an internet connection.

The sample, “The bookshop at the end of Bellwether Lane,” is original demonstration copy. It is explicitly loaded by the author; it is not presented as a customer manuscript or testimonial.

## Python textstat cross-check

Python is a development reference, not an application server or a requirement for authors. With Python 3.10+:

```sh
python -m venv .venv
# Windows PowerShell:
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
npm run test:textstat
```

The check sends fixed local fixtures to Node and Python and prints both libraries' scores and differences. It checks a known simple sentence and easy-versus-difficult ordering. It deliberately does not assert exact equality: `textstat` and `text-readability` use different syllable methods and rounding. No user chapter is sent anywhere.

## Verification in the build environment

The npm `text-readability` dependency is installed. Verification after the FAQ key fix and interface audit:

- `npm run typecheck` passes.
- `npm test` passes all 9 readability tests, including exact sentence offsets, repeated text, dialogue, and long chapters.
- `npm run build` produces the static production routes successfully.
- The production server returns HTTP 200 and passes 13 automated browser checks in installed Chrome, covering analysis, highlighting, editing, validation, draft-replacement confirmations, keyboard FAQ controls, keyboard focus, reduced motion, and long unbroken text.
- Screenshots and overflow checks cover 1440, 768, 390, and 320 pixels. Automated axe-core WCAG checks report no violations across 8 tested UI states, including the confirmation dialog and mobile review.
- Development-mode browser checks reproduce the original `motion.details` key warning before the fix and confirm no key warnings, hydration errors, or application exceptions after it. Production-mode checks also report no application errors.

Evidence and the guidelines audit are in `.taste-skill/verification/`. The browser-check script uses an available Playwright installation through `CHAPTERLY_PLAYWRIGHT_MODULE` and an optional axe-core script through `CHAPTERLY_AXE_SCRIPT`; it adds no runtime dependencies to the app.

Google Fonts requests remain blocked in this environment, so screenshot review uses the configured fallback fonts. The installed Windows Store Python launcher cannot execute, so `npm run test:textstat` remains unverified. Firefox, Safari, and a deployed host have not been tested.
