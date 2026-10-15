const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const { chromium } = require(process.env.CHAPTERLY_PLAYWRIGHT_MODULE || 'playwright');

const url = process.argv[2] || 'http://127.0.0.1:3100';
const label = process.argv[3] || 'production';
const output = `.taste-skill/verification/${label}`;
const checks = [];
const consoleErrors = [];
const pageErrors = [];
const failedRequests = [];
const accessibility = [];

async function settle(page) {
  await page.waitForFunction(() => {
    const score = document.querySelector('.score-display');
    const expected = score?.getAttribute('aria-label')?.match(/score: (\d+)/)?.[1];
    const scoreSettled = !expected || score.firstElementChild.textContent === expected;
    const revealed = [...document.querySelectorAll('.sentence-list li, .assessment-copy')].every(element => Number(getComputedStyle(element).opacity) >= 0.99);
    const heading = document.querySelector('.assessment-copy h4')?.textContent;
    const status = document.querySelector('[role="status"]')?.textContent;
    const assessmentSettled = !expected || status?.includes(heading);
    return scoreSettled && revealed && assessmentSettled;
  });
}

async function capture(page, filename) {
  await settle(page);
  await page.locator('h1').click();
  await page.screenshot({ path: `${output}/${filename}`, fullPage: true });
}

async function audit(page, state) {
  if (!process.env.CHAPTERLY_AXE_SCRIPT) return;
  await settle(page);
  if (!await page.evaluate(() => Boolean(window.axe))) await page.addScriptTag({ path: process.env.CHAPTERLY_AXE_SCRIPT });
  const results = await page.evaluate(async () => {
    const result = await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] } });
    return { passes: result.passes.length, violations: result.violations.map(({ id, impact, help, nodes }) => ({ id, impact, help, nodes: nodes.map(({ target, failureSummary }) => ({ target, failureSummary })) })) };
  });
  accessibility.push({ state, ...results });
  await fs.writeFile(`${output}/accessibility.json`, JSON.stringify(accessibility, null, 2));
  assert.deepEqual(results.violations, [], `Accessibility violations in ${state}`);
}

async function check(name, run) {
  await run();
  checks.push(name);
  console.log(`PASS ${name}`);
}

(async () => {
  await fs.mkdir(output, { recursive: true });
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    page.on('console', message => {
      if (message.type() === 'error') consoleErrors.push({ text: message.text(), url: message.location().url });
    });
    page.on('pageerror', error => pageErrors.push(error.message));
    page.on('requestfailed', request => failedRequests.push({ url: request.url(), error: request.failure()?.errorText }));
    page.on('dialog', dialog => dialog.dismiss());
    const response = await page.goto(url, { waitUntil: 'networkidle' });
    assert.equal(response.status(), 200);
    assert.match(await page.title(), /Chapterly/);
    await capture(page, 'desktop-empty.png');
    await check('Empty workspace passes automated WCAG accessibility checks', () => audit(page, 'desktop-empty'));

    await check('FAQ toggles with pointer and keyboard', async () => {
      assert.equal(await page.locator('.faq-list details').count(), 4);
      for (const summary of await page.locator('.faq-list summary').all()) {
        await summary.click();
        assert.equal(await summary.evaluate(element => element.parentElement.open), true);
        await summary.press('Enter');
        assert.equal(await summary.evaluate(element => element.parentElement.open), false);
      }
    });

    await check('Empty analysis validates inline and focuses the editor', async () => {
      await page.getByRole('button', { name: 'Analyze chapter', exact: true }).click();
      assert.match(await page.locator('#editor-error').innerText(), /Add some writing/);
      assert.equal(await page.getByRole('textbox', { name: 'Your chapter' }).evaluate(element => document.activeElement === element), true);
    });

    const chapter = '“Go home!”\n\nShe stayed. She stayed.\nAn unfinished thought';
    await check('Analysis preserves paragraphs, dialogue, repeated sentences, and counters', async () => {
      await page.getByRole('textbox', { name: 'Your chapter' }).fill(chapter);
      await page.getByRole('button', { name: 'Analyze chapter', exact: true }).click();
      await page.locator('#review-panel').waitFor();
      assert.equal(await page.locator('#review-panel').textContent(), chapter);
      assert.equal(await page.locator('#review-panel mark').count(), 4);
      assert.equal(await page.locator('.sentence-note').count(), 4);
      assert.match(await page.getByRole('status').innerText(), /Analysis complete/);
      const counters = await page.locator('.editor-stats strong').allTextContents();
      assert.equal(Number(counters[1].replaceAll(',', '')), Array.from(chapter).length);
      const ids = await page.locator('#review-panel mark').evaluateAll(elements => elements.map(element => element.id));
      assert.equal(new Set(ids).size, 4);
    });

    await check('A sentence note selects and focuses its exact source passage', async () => {
      const note = page.locator('.sentence-note').first();
      const sentence = await note.locator('q').textContent();
      await note.click();
      assert.equal(await page.locator('mark.selected').textContent(), sentence);
      assert.equal(await page.locator('mark.selected').evaluate(element => document.activeElement === element), true);
      await page.locator('mark.selected').press('Enter');
      assert.equal(await page.locator('mark.selected').count(), 1);
    });

    await check('Editing invalidates stale results and preserves the manuscript', async () => {
      await page.getByRole('tab', { name: 'Edit', exact: true }).click();
      assert.equal(await page.getByRole('textbox', { name: 'Your chapter' }).inputValue(), chapter);
      await page.getByRole('textbox', { name: 'Your chapter' }).fill(chapter + ' A fresh line.');
      assert.equal(await page.getByRole('tab', { name: 'Review', exact: true }).isDisabled(), true);
      assert.equal(await page.locator('.sentence-note').count(), 0);
    });

    await check('Cancel, Escape, and confirmation protect draft replacement', async () => {
      const editor = page.getByRole('textbox', { name: 'Your chapter' });
      const draft = await editor.inputValue();
      await page.getByRole('button', { name: 'Clear', exact: true }).click();
      await page.getByRole('dialog').waitFor();
      await audit(page, 'confirmation-dialog');
      await page.getByRole('button', { name: 'Keep my writing' }).click();
      assert.equal(await editor.inputValue(), draft);
      await page.getByRole('button', { name: 'Load a sample' }).click();
      await page.getByRole('dialog').waitFor();
      await page.keyboard.press('Escape');
      assert.equal(await editor.inputValue(), draft);
      await page.getByRole('button', { name: 'Clear', exact: true }).click();
      await page.getByRole('button', { name: 'Clear chapter', exact: true }).click();
      assert.equal(await editor.inputValue(), '');
    });

    await check('Sample analysis displays five notes, five highlights, and a numeric score', async () => {
      await page.getByRole('button', { name: 'Load a sample' }).click();
      await page.locator('#review-panel').waitFor();
      assert.equal(await page.locator('.sentence-note').count(), 5);
      assert.equal(await page.locator('#review-panel mark').count(), 5);
      assert.match(await page.locator('.score-display').getAttribute('aria-label'), /Readability score: \d+ out of 100/);
      await capture(page, 'desktop-review.png');
      await audit(page, 'desktop-review');
    });

    await check('Desktop, tablet, mobile, and small mobile have no horizontal overflow', async () => {
      for (const [width, height] of [[1440, 900], [768, 1024], [390, 844], [320, 812]]) {
        await page.setViewportSize({ width, height });
        await page.getByRole('tab', { name: 'Edit', exact: true }).click();
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, `Overflow at ${width}px`);
        for (const selector of ['.editor-toolbar', '.editor-actions', '.score-sheet']) {
          const rect = await page.locator(selector).boundingBox();
          assert.ok(rect.x >= 0 && rect.x + rect.width <= width + 1, `${selector} outside ${width}px viewport`);
        }
        await page.getByRole('tab', { name: 'Review', exact: true }).click();
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, `Review overflow at ${width}px`);
        await page.locator('#workspace').scrollIntoViewIfNeeded();
        await capture(page, `${width}-review.png`);
        await audit(page, `${width}-review`);
      }
    });

    await check('Reduced motion disables smooth scrolling and preserves analysis', async () => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior), 'auto');
      await page.locator('.sentence-note').first().click();
      assert.equal(await page.locator('mark.selected').count(), 1);
      await capture(page, 'mobile-reduced-motion.png');
    });

    await check('The manuscript has a visible keyboard focus outline', async () => {
      await page.getByRole('tab', { name: 'Edit', exact: true }).click();
      const editor = page.getByRole('textbox', { name: 'Your chapter' });
      await editor.press('ArrowRight');
      const outline = await editor.evaluate(element => {
        const style = getComputedStyle(element);
        return { style: style.outlineStyle, width: style.outlineWidth };
      });
      assert.deepEqual(outline, { style: 'solid', width: '2px' });
    });

    await check('An unbroken word stays inside the mobile manuscript and sentence notes', async () => {
      const text = 'A'.repeat(512) + '. A short line. One more sentence.';
      await page.getByRole('textbox', { name: 'Your chapter' }).fill(text);
      await page.getByRole('button', { name: 'Analyze chapter', exact: true }).click();
      await page.locator('#review-panel').waitFor();
      assert.equal(await page.locator('#review-panel').textContent(), text);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
      assert.equal(await page.locator('#review-panel').evaluate(element => element.scrollWidth <= element.clientWidth), true);
      await audit(page, '320-long-word-review');
    });

    await check('No React key warnings, hydration errors, or application exceptions', async () => {
      assert.deepEqual(pageErrors, []);
      const applicationErrors = consoleErrors.filter(error => !/fonts\.(googleapis|gstatic)\.com/.test(error.url || ''));
      assert.deepEqual(applicationErrors, []);
      assert.deepEqual(failedRequests.filter(request => !/fonts\.(googleapis|gstatic)\.com/.test(request.url)), []);
    });

    await fs.writeFile(`${output}/results.json`, JSON.stringify({ url, checks, accessibility, consoleErrors, pageErrors, failedRequests }, null, 2));
    console.log(`Completed ${checks.length} checks. Evidence: ${output}`);
    await context.close();
  } finally {
    await browser.close();
  }
})().catch(async error => {
  console.error(error);
  await fs.writeFile(`${output}/failure.json`, JSON.stringify({ error: error.stack, checks, consoleErrors, pageErrors, failedRequests }, null, 2));
  process.exitCode = 1;
});
