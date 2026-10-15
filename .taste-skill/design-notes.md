# Chapterly design record

## Brief and inventory

The audience is an author returning to a chapter. The primary action is to paste a manuscript and analyze it. The product's material is the author's actual text: paragraphs, dialogue, a full chapter, five selected sentences, amber annotations, a reading-ease score, a private browser tab, editorial margin notes, and a deliberately preserved authorial voice. The supplied brand fixes parchment, oxblood, antique brass, four font roles, and the exact hero sentence.

## Argument and copy deck

1. Every great chapter deserves a second read. Proof: the real editor is directly below the hero. Action: Analyze your chapter.
2. A fresh pair of eyes. Proof: paste or type, see live counts, and switch from the manuscript to annotated Review.
3. From first draft to fresh perspective. Proof: bring your words, see how they read, then make your own editorial choices.
4. Good writing is more than a number. Proof: the score's limits are stated beside the product, without claiming to assess storytelling.
5. A few things worth knowing. Proof: full explanations of the score, ranking, privacy, and authorial discretion.
6. Better chapters. Clearer writing. The close returns to the product's name and purpose.

## Direction

Dealt: **The page is the object**, seed **692022062**, keeping the specified palette and typography.

The initial “Tabbed folder stack” hero was redrawn once because five colored folders on a dark ground contradicted the user's dominant parchment, understated journal opening, and immediate manuscript workspace. The redraw dealt “Striped card beside the room.” Its dependency on a room image and stripe treatment also does not match this author's browser tool; the explicit user brief takes precedence. The physical-object principle remains in the filled manuscript surface and the assessment in its margin.

Idea: **On this page, the author's chapter and its five hardest sentences become a manuscript with a live editorial margin.** The live interaction is selecting a sentence note to locate and highlight the exact source passage, including repeated sentences.

Motion: source-to-note selection is the signature interaction; the Edit/Review indicator moves between modes, the score counts into place, note reveals are staggered, sentence backgrounds change softly, and controls respond to hover, press, and keyboard focus. Reduced motion removes travel. Initial section content stays visible without motion.

## User-directed exceptions

The explicit brief requests thin rules, archival monospace metadata, small uppercase editorial labels, four font roles, and an italic second line in the supplied headline. These override the skill's conflicting house rules. The product workspace uses `data-ui` and its own functional borders. No photographs, footage, generated illustrations, customer statistics, or testimonials were invented. The working interface is the subject; adding four unrelated library pictures would distract from the writing task.

The small diamond beside the manuscript heading is the requested subtle book ornament. The “05” note count is a functional limit/count, not a numbered marketing section. Original sample chapter copy is identified as a sample.

## Gate and critique status

The source lint ran and identified the explicit brand exceptions above. Its stock-phrase warning in the scoring description was corrected. TypeScript checking passed.

The scoring dependency is now installed. TypeScript, all 9 readability tests, and the production build pass. Development and production browser checks confirm the FAQ key warning is fixed and the writing workflow works. Production checks cover 1440, 768, 390, and 320 pixels; screenshots at all widths were reviewed. No horizontal overflow was observed, including with an unbroken 512-character word. Automated axe-core checks report no WCAG violations across 8 tested UI states.

The follow-up guidelines audit corrected small-text contrast, the textarea keyboard focus outline, wrapping in sentence notes, dialog overscroll containment, form metadata, and the score marker's layout animation. Secondary ink is slightly darker than the original palette (#6B6358 instead of #777064) so it reaches 4.60:1 against parchment and 5.00:1 against the paper surface. Metadata on the darker note surfaces uses primary ink.

Screenshots and reproducible browser-check output are in `verification/`. This follow-up is a functional and accessibility review, not a new art-direction exercise; no jury score is assigned. The specified archival typography, thin rules, and other explicit brand exceptions are retained.

Remaining limits: Google Fonts is blocked, so visual review used the configured fallback faces; the Python launcher cannot execute; Firefox, Safari, and deployment are not tested.
