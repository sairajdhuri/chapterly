"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, MotionConfig, animate, motion, useReducedMotion } from "motion/react";
import { ArrowDown, ArrowRight, BookOpen, Check, ChevronDown, Feather, FileText, Info, Leaf, LockKeyhole, MoveUpRight, PencilLine, RotateCcw, X } from "lucide-react";
import { analyzeChapter, getAssessment, getReadingLabel, getSentenceAdvice, getWords, type Analysis, type Sentence } from "@/lib/readability";
import { SAMPLE_CHAPTER } from "@/lib/sample";

function Score({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();
  useEffect(() => {
    const animation = animate(0, value, {
      duration: reduced ? 0 : 0.65,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (latest) => { if (ref.current) ref.current.textContent = String(Math.round(latest)); },
    });
    return () => animation.stop();
  }, [value, reduced]);
  return <span ref={ref} aria-hidden="true">{value}</span>;
}

function Review({ result, selected, onSelect }: { result: Analysis; selected: number | null; onSelect: (sentence: Sentence) => void }) {
  const hard = new Set(result.hardest.map(sentence => sentence.start));
  let cursor = 0;
  const fragments: React.ReactNode[] = [];
  for (const sentence of result.sentences) {
    fragments.push(result.text.slice(cursor, sentence.start));
    fragments.push(hard.has(sentence.start)
      ? <mark key={sentence.start} id={`sentence-${sentence.start}`} tabIndex={0} role="button" aria-label={`Review sentence: ${sentence.text}`} aria-pressed={selected === sentence.start} className={selected === sentence.start ? "sentence-highlight selected" : "sentence-highlight"} onClick={() => onSelect(sentence)} onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onSelect(sentence); } }}>{sentence.text}</mark>
      : sentence.text);
    cursor = sentence.end;
  }
  fragments.push(result.text.slice(cursor));
  return <div className="review-text manuscript-text" id="review-panel" role="tabpanel" aria-labelledby="review-tab" tabIndex={0}>{fragments}</div>;
}

const questions = [
  { question: "What does the readability score mean?", answer: "Chapterly uses Flesch Reading Ease, an English-language measure of sentence length and syllables per word. A higher score means an easier read. Around 60–70 is a comfortable reading level for a broad audience. The display is limited to 0–100; the original score is available in your assessment." },
  { question: "How are the hardest sentences chosen?", answer: "Each sentence gets its own Flesch Reading Ease score. The five lowest-scoring sentences appear in your editorial notes, with the most demanding first. If your chapter has fewer than five sentences, we show only those that exist. Select a note to find its passage in Review." },
  { question: "Is my writing private?", answer: "Yes. Analysis runs in your browser. Your chapter is never uploaded, stored on a server, or used to train a model. There is no account and no tracking. Keep your own copy before closing the tab: Chapterly does not save your draft." },
  { question: "Should every sentence be simple?", answer: "No. A long sentence can be exactly what your story needs. Readability is a useful perspective on the effort your prose asks of a reader, not a verdict on its quality. Use the notes to make deliberate choices, and keep the rhythm that sounds like you." },
];

export default function Home() {
  const [text, setText] = useState("");
  const deferredText = useDeferredValue(text);
  const [result, setResult] = useState<Analysis | null>(null);
  const [mode, setMode] = useState<"edit" | "review">("edit");
  const [selected, setSelected] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [replacement, setReplacement] = useState<"clear" | "sample" | null>(null);
  const editor = useRef<HTMLTextAreaElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const reduced = useReducedMotion();
  const words = useMemo(() => getWords(deferredText).length, [deferredText]);
  const characters = useMemo(() => Array.from(deferredText).length, [deferredText]);
  const assessment = result ? getAssessment(result.score) : null;

  useEffect(() => {
    if (!text) return;
    const protectDraft = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener("beforeunload", protectDraft);
    return () => window.removeEventListener("beforeunload", protectDraft);
  }, [text]);

  useEffect(() => {
    if (replacement) dialog.current?.showModal();
    else dialog.current?.close();
  }, [replacement]);

  function updateText(value: string) {
    setText(value);
    setResult(null);
    setSelected(null);
    setError("");
    setMode("edit");
  }

  function analyze() {
    const analysis = analyzeChapter(text);
    if (!analysis) {
      setError("A few words are all you need. Add some writing to begin.");
      editor.current?.focus();
      return;
    }
    setResult(analysis);
    setMode("review");
    setSelected(null);
    setError("");
  }

  function replace(action: "clear" | "sample") {
    setReplacement(null);
    updateText(action === "sample" ? SAMPLE_CHAPTER : "");
    if (action === "sample") {
      setResult(analyzeChapter(SAMPLE_CHAPTER));
      setMode("review");
    } else requestAnimationFrame(() => editor.current?.focus());
  }

  function requestReplacement(action: "clear" | "sample") {
    if (text.trim() && text !== SAMPLE_CHAPTER) setReplacement(action);
    else replace(action);
  }

  function selectSentence(sentence: Sentence) {
    setSelected(sentence.start);
    setMode("review");
    requestAnimationFrame(() => {
      const element = document.getElementById(`sentence-${sentence.start}`);
      element?.scrollIntoView({ behavior: reduced ? "instant" : "smooth", block: "center" });
      element?.focus({ preventScroll: true });
    });
  }

  const reveal = { initial: { opacity: 1, y: reduced ? 0 : 12 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, amount: 0.15 }, transition: { duration: reduced ? 0 : 0.45 } };

  return (
    <MotionConfig reducedMotion="user">
      <a className="skip-link" href="#workspace">Skip to chapter editor</a>
      <header className="site-header page-width">
        <a className="wordmark" href="#" aria-label="Chapterly home" translate="no"><BookOpen aria-hidden="true" strokeWidth={1.3} /><span>Chapterly<span className="wordmark-period">.</span></span></a>
        <nav aria-label="Main navigation">
          <a href="#how-it-works">How it works</a>
          <a href="#about" className="about-nav">A note for writers</a>
          <a href="#workspace" className="nav-action">Open the editor <MoveUpRight size={14} aria-hidden="true" /></a>
        </nav>
      </header>

      <main>
        <section className="hero page-width" aria-labelledby="hero-heading">
          <motion.p {...reveal} className="editorial-label hero-label"><span /> A little clarity for your next chapter <span /></motion.p>
          <motion.h1 {...reveal} transition={{ duration: reduced ? 0 : 0.55, delay: 0.05 }} id="hero-heading">Every great chapter<br /><em>deserves a second read.</em></motion.h1>
          <motion.p {...reveal} transition={{ duration: reduced ? 0 : 0.5, delay: 0.1 }} className="hero-description">Discover how your writing reads. Analyze readability, find difficult<br className="desktop-break" /> sentences, and make every word count.</motion.p>
          <motion.div {...reveal} transition={{ duration: reduced ? 0 : 0.5, delay: 0.15 }} className="hero-action"><a href="#workspace" className="primary-button">Analyze your chapter <ArrowDown size={16} aria-hidden="true" /></a><span>Free to use. Yours to write.</span></motion.div>
        </section>

        <section className="workspace-section page-width" id="workspace" aria-labelledby="workspace-heading" data-ui>
          <motion.div {...reveal} className="workspace-heading-row">
            <div><h2 id="workspace-heading">A fresh pair of eyes.</h2><p>Your words on the left. A little perspective on the right.</p></div>
            <span className="privacy-label"><LockKeyhole size={14} aria-hidden="true" /> Only in your browser</span>
          </motion.div>
          <p className="sr-only" role="status">{result ? `Analysis complete. Readability ${result.score} out of 100. ${assessment?.label}. ${result.hardest.length} sentences highlighted in Review.` : ""}</p>

          <div className="workspace-grid">
            <motion.div {...reveal} className="editor-sheet">
              <div className="editor-toolbar">
                <label className="editorial-label" htmlFor="chapter"><Feather size={16} aria-hidden="true" /> Your manuscript</label>
                <div className="mode-switch" role="tablist" aria-label="Editor mode">
                  <button id="edit-tab" role="tab" aria-selected={mode === "edit"} aria-controls="edit-panel" tabIndex={mode === "edit" ? 0 : -1} onClick={() => { setMode("edit"); requestAnimationFrame(() => editor.current?.focus()); }} onKeyDown={event => { if (event.key === "ArrowRight" && result) { setMode("review"); document.getElementById("review-tab")?.focus(); } }}>
                    {mode === "edit" && <motion.span className="active-tab" layoutId="editor-tab" transition={{ duration: reduced ? 0 : 0.2 }} />}<PencilLine size={13} aria-hidden="true" /><span>Edit</span>
                  </button>
                  <button id="review-tab" role="tab" aria-selected={mode === "review"} aria-controls="review-panel" tabIndex={mode === "review" ? 0 : -1} disabled={!result} onClick={() => setMode("review")} onKeyDown={event => { if (event.key === "ArrowLeft") { setMode("edit"); document.getElementById("edit-tab")?.focus(); } }}>
                    {mode === "review" && <motion.span className="active-tab" layoutId="editor-tab" transition={{ duration: reduced ? 0 : 0.2 }} />}<BookOpen size={13} aria-hidden="true" /><span>Review</span>
                  </button>
                </div>
              </div>

              <div className="manuscript-heading"><span className="chapter-marker">The beginning of something good</span><span className="manuscript-flourish" aria-hidden="true">✧</span></div>
              <div className="manuscript-area">
                {mode === "review" && result ? <Review result={result} selected={selected} onSelect={sentence => setSelected(sentence.start)} /> : <div id="edit-panel" role="tabpanel" aria-labelledby="edit-tab"><textarea ref={editor} id="chapter" name="chapter" autoComplete="off" className="manuscript-text" placeholder={"Every story starts with a few words.\nPaste your chapter here, or simply begin…"} aria-label="Your chapter" aria-describedby={error ? "editor-error" : "editor-help"} value={text} onChange={event => updateText(event.target.value)} spellCheck={false} /></div>}
                {!text && <div className="editor-invitation"><BookOpen size={35} strokeWidth={1} aria-hidden="true" /><p>A first draft. A final chapter.<br />There’s room for your story here.</p></div>}
              </div>

              <div className="editor-bottom">
                {error && <p id="editor-error" className="editor-error" role="alert">{error}</p>}
                <div className="editor-stats" aria-live="polite" aria-atomic="true"><span><strong>{words.toLocaleString("en-US")}</strong> words</span><span><strong>{characters.toLocaleString("en-US")}</strong> characters</span><span><strong>{getReadingLabel(words)}</strong> read</span></div>
                <div className="editor-actions"><div className="secondary-actions"><button className="text-button" onClick={() => requestReplacement("sample")}><FileText size={14} aria-hidden="true" /> Load a sample</button><button className="text-button clear-button" disabled={!text} onClick={() => requestReplacement("clear")}><RotateCcw size={13} aria-hidden="true" /> Clear</button></div><button className="primary-button analyze-button" onClick={analyze}>{result ? "Analyze again" : "Analyze chapter"}<ArrowRight size={15} aria-hidden="true" /></button></div>
              </div>
            </motion.div>

            <aside className="assessment-column" aria-label="Chapter assessment">
              <motion.div {...reveal} className="score-sheet">
                <div className="score-heading"><h3 className="editorial-label">The reading room</h3><a href="#methodology" aria-label="How readability is measured"><Info size={16} strokeWidth={1.5} aria-hidden="true" /></a></div>
                <div className="score-display" aria-label={result ? `Readability score: ${result.score} out of 100` : "Readability score: awaiting your chapter"}>{result ? <Score key={result.rawScore} value={result.score} /> : <span className="empty-score">—</span>}<span className="score-denominator">/ 100</span></div>
                <p className="score-name">Flesch Reading Ease</p>
                <div className="score-scale" aria-hidden="true"><span className="scale-track" />{result && <motion.span className="scale-marker" style={{ left: `${Math.max(1, Math.min(99, result.score))}%` }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: reduced ? 0 : 0.2 }} />}</div>
                <div className="scale-labels"><span>More demanding</span><span>Easier to read</span></div>
                <AnimatePresence mode="wait"><motion.div className="assessment-copy" key={assessment?.label ?? "empty"} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}><h4>{assessment?.label ?? "Your story, a little clearer."}</h4><p>{assessment?.description ?? "Add your chapter and we’ll take a thoughtful look at how it reads."}</p></motion.div></AnimatePresence>
                {result && <dl className="assessment-details"><div><dt>Sentences</dt><dd>{result.sentences.length}</dd></div><div><dt>Words per sentence</dt><dd>{result.averageLength}</dd></div><div><dt>U.S. grade estimate</dt><dd>{result.grade.toFixed(1)}</dd></div><div><dt>Original Flesch score</dt><dd>{result.rawScore.toFixed(2)}</dd></div></dl>}
              </motion.div>

              <motion.div {...reveal} className="sentence-notes">
                <div className="notes-heading"><h3>A second look</h3><span className="notes-count">{result ? String(result.hardest.length).padStart(2, "0") : "05"}</span></div>
                <p className="notes-description">{result ? `Your ${result.hardest.length === 1 ? "most demanding sentence" : `${result.hardest.length} most demanding sentences`}, worth another read.` : "Your five hardest sentences will find their way here."}</p>
                {result ? <ol className="sentence-list">{result.hardest.map((sentence, index) => <motion.li key={sentence.start} initial={{ opacity: 0, y: reduced ? 0 : 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: reduced ? 0 : index * 0.06 }}><button className={`sentence-note ${selected === sentence.start ? "is-selected" : ""}`} aria-label={`Find sentence ${index + 1} in your chapter`} aria-pressed={selected === sentence.start} onClick={() => selectSentence(sentence)}><span className="note-topline"><span>Sentence {result.sentences.indexOf(sentence) + 1}</span><span>{sentence.words} words <MoveUpRight size={12} aria-hidden="true" /></span></span><q>{sentence.text}</q><span className="note-advice">{getSentenceAdvice(sentence)}</span></button></motion.li>)}</ol> : <div className="notes-empty"><Feather size={28} strokeWidth={1} aria-hidden="true" /><p>A little space<br /><em>for a little perspective.</em></p><span>No red pen. Just helpful notes.</span></div>}
              </motion.div>
            </aside>
          </div>
          <p className="workspace-footnote" id="editor-help"><LockKeyhole size={12} aria-hidden="true" /> Your words stay yours. Nothing is uploaded or saved. <span>English-language analysis.</span></p>
        </section>

        <section className="how-section page-width" id="how-it-works" aria-labelledby="how-heading">
          <motion.div {...reveal} className="how-intro"><span className="editorial-label">Less friction. More writing.</span><h2 id="how-heading">From first draft<br />to fresh perspective.</h2><p>No sign-ups, no subscriptions, no complicated reports. Just you and your next chapter.</p><a className="inline-link" href="#workspace">Make a little room for clarity <ArrowRight size={15} aria-hidden="true" /></a></motion.div>
          <div className="how-steps">
            <motion.article {...reveal}><span className="step-symbol"><PencilLine size={19} strokeWidth={1.3} aria-hidden="true" /></span><div><h3>Bring your words.</h3><p>Paste a whole chapter, an opening scene, or the passage you keep coming back to.</p></div></motion.article>
            <motion.article {...reveal}><span className="step-symbol"><BookOpen size={19} strokeWidth={1.3} aria-hidden="true" /></span><div><h3>See how they read.</h3><p>Get a readability score and find the five sentences asking the most of your reader.</p></div></motion.article>
            <motion.article {...reveal}><span className="step-symbol"><Leaf size={19} strokeWidth={1.3} aria-hidden="true" /></span><div><h3>Make it sound like you.</h3><p>Follow a note, keep a beautiful long sentence, or try another draft. You’re the author.</p></div></motion.article>
          </div>
        </section>

        <section className="author-note" id="about" aria-labelledby="author-note-heading"><div className="page-width author-note-inner"><motion.div {...reveal} className="author-note-icon"><Feather size={43} strokeWidth={0.8} aria-hidden="true" /></motion.div><motion.div {...reveal}><span className="editorial-label">A note in the margin</span><h2 id="author-note-heading">Good writing is more than a number.</h2><p>A winding sentence can be wonderful. A simple one can stay with you forever. Chapterly is here to help you notice the rhythm of your writing, never to write the rules.</p><span className="author-note-signoff">Keep your voice. Find your clarity.</span></motion.div></div></section>

        <section className="faq-section page-width" id="methodology" aria-labelledby="faq-heading">
          <motion.div {...reveal} className="faq-intro"><h2 id="faq-heading">A few things<br />worth knowing.</h2><p>A little context for your next read.</p></motion.div>
          <div className="faq-list">
            {questions.map(({ question, answer }) => (
              <motion.details {...reveal} key={question}>
                <summary key="question">{question}<ChevronDown size={17} aria-hidden="true" /></summary>
                <p key="answer">{answer}</p>
              </motion.details>
            ))}
          </div>
        </section>
      </main>

      <footer className="site-footer page-width"><a className="wordmark" href="#" translate="no"><BookOpen size={22} strokeWidth={1.3} aria-hidden="true" /><span>Chapterly<span className="wordmark-period">.</span></span></a><p>Better chapters. Clearer writing.</p><span>Made with care, for the words that matter. — Sairaj Dhuri</span></footer>

      <dialog ref={dialog} className="confirm-dialog" aria-labelledby="confirm-heading" aria-describedby="confirm-description" onCancel={() => setReplacement(null)}><button className="dialog-close icon-button" aria-label="Cancel" onClick={() => setReplacement(null)}><X size={19} aria-hidden="true" /></button><BookOpen size={28} strokeWidth={1} aria-hidden="true" /><h2 id="confirm-heading">{replacement === "sample" ? "Make room for a sample?" : "A clean sheet?"}</h2><p id="confirm-description">{replacement === "sample" ? "This replaces your current chapter with our sample. Copy your writing first if you’d like to keep it." : "This clears your current chapter. Copy your writing first if you’d like to keep it."}</p><div className="dialog-actions"><button className="secondary-button" autoFocus onClick={() => setReplacement(null)}>Keep my writing</button><button className="primary-button" onClick={() => replace(replacement ?? "clear")}>{replacement === "sample" ? "Load sample" : "Clear chapter"}<Check size={15} aria-hidden="true" /></button></div></dialog>
      <noscript><div className="noscript-notice">Enable JavaScript to analyze your chapter. All analysis happens privately in your browser.</div></noscript>
    </MotionConfig>
  );
}
