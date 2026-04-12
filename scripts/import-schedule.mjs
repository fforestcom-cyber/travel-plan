/**
 * import-schedule.mjs
 * Parses src/data/import/day1_plan.html → src/data/scheduleDay1.ts
 * Usage: node scripts/import-schedule.mjs
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire }               from 'node:module';
import { dirname, join }               from 'node:path';
import { fileURLToPath }               from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);
const ROOT       = join(__dirname, '..');

const require = createRequire(import.meta.url);
const { JSDOM } = require('jsdom');

// ── text helper ────────────────────────────────────────────────────────
const txt = (el) => (el?.textContent ?? '').replace(/\s+/g, ' ').trim();

// Preserves <strong>…</strong> as **…** markers for red-text rendering
const markedTxt = (el) => {
  if (!el) return '';
  return (el.innerHTML ?? '')
    .replace(/<strong>/gi, '**')
    .replace(/<\/strong>/gi, '**')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

// ── extract helpers ────────────────────────────────────────────────────
function extractAlerts(parent) {
  return Array.from(parent.querySelectorAll(':scope > .alert')).map(el => ({
    variant: ['warn', 'tip', 'note'].find(v => el.classList.contains(v)) ?? 'note',
    text: markedTxt(el),
  }));
}

function extractTickets(parent) {
  return Array.from(parent.querySelectorAll(':scope > .ticket')).map(el => ({
    text: txt(el),
  }));
}

function extractPhotoRefs(parent) {
  return Array.from(parent.querySelectorAll(':scope > .photo-ref')).map(el => ({
    label: txt(el.querySelector('.photo-ref-label')),
    desc:  txt(el.querySelector('.photo-ref-desc')),
    links: Array.from(el.querySelectorAll('.photo-link')).map(a => ({
      text:  txt(a),
      href:  a.getAttribute('href') ?? '',
      style: ['teal', 'amber', 'red'].find(c => a.classList.contains(c)) ?? 'default',
    })),
  }));
}

function extractSteps(stepsEl) {
  return Array.from(stepsEl.querySelectorAll(':scope > .step')).map(step => {
    const dotEl    = step.querySelector('.step-dot');
    const dotColor = ['accent', 'teal', 'gold', 'blue', 'gray']
      .find(c => dotEl?.classList.contains('dot-' + c)) ?? 'gray';
    const bodyEl   = step.querySelector('.step-body');
    const body     = bodyEl
      ? Array.from(bodyEl.querySelectorAll('p')).map(p => markedTxt(p)).join('\n')
      : '';
    return {
      dotColor,
      label:     txt(dotEl),
      title:     txt(step.querySelector('.step-title')),
      body,
      alerts:    extractAlerts(step),
      tickets:   extractTickets(step),
      photoRefs: extractPhotoRefs(step),
    };
  });
}

function extractBlocks(section) {
  const blocks = [];

  for (const child of section.children) {
    const cl = child.classList;

    if (cl.contains('section-header') || cl.contains('timeline-summary')) continue;

    if (cl.contains('info-card')) {
      const variant = ['accent', 'teal', 'gold', 'blue'].find(v => cl.contains(v)) ?? 'blue';
      blocks.push({
        kind: 'info-card',
        variant,
        rows: Array.from(child.querySelectorAll('.info-row')).map(row => ({
          label: txt(row.querySelector('.info-label')),
          value: markedTxt(row.querySelector('.info-val')),
        })),
      });

    } else if (cl.contains('steps')) {
      blocks.push({ kind: 'steps', items: extractSteps(child) });

    } else if (cl.contains('alert')) {
      const variant = ['warn', 'tip', 'note'].find(v => cl.contains(v)) ?? 'note';
      blocks.push({ kind: 'alert', variant, text: markedTxt(child) });

    } else if (cl.contains('ticket')) {
      blocks.push({ kind: 'ticket', text: txt(child) });

    } else if (cl.contains('menu-box')) {
      blocks.push({
        kind:   'menu',
        header: txt(child.querySelector('.menu-header')),
        items:  Array.from(child.querySelectorAll('.menu-item')).map(item => ({
          name: txt(item.querySelector('span:first-child')),
          note: txt(item.querySelector('.menu-note')),
        })),
      });

    } else if (child.tagName === 'UL' && cl.contains('checklist')) {
      blocks.push({
        kind:  'checklist',
        items: Array.from(child.querySelectorAll('li')).map(li => {
          const spans = li.querySelectorAll('span');
          return txt(spans[spans.length - 1]) || txt(li);
        }),
      });

    } else if (cl.contains('photo-ref')) {
      blocks.push({
        kind:  'photo-ref',
        label: txt(child.querySelector('.photo-ref-label')),
        desc:  txt(child.querySelector('.photo-ref-desc')),
        links: Array.from(child.querySelectorAll('.photo-link')).map(a => ({
          text:  txt(a),
          href:  a.getAttribute('href') ?? '',
          style: ['teal', 'amber', 'red'].find(c => a.classList.contains(c)) ?? 'default',
        })),
      });
    }
  }

  return blocks;
}

// ── main parser ────────────────────────────────────────────────────────
function parseDayPlan(htmlPath, dayNumber) {
  const html     = readFileSync(htmlPath, 'utf-8');
  const dom      = new JSDOM(html);
  const document = dom.window.document;

  // Cover — use innerHTML to handle <br> properly
  const coverTitleEl  = document.querySelector('.cover-title');
  const titleLines    = (coverTitleEl?.innerHTML ?? '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .split('\n')
    .map(s => s.trim())
    .filter(Boolean);
  const title = titleLines.slice(1).join(' ') || titleLines[0] || '';
  const subtitle     = txt(document.querySelector('.cover-sub'));
  const tags         = Array.from(document.querySelectorAll('.ctag')).map(el => txt(el));

  // Timeline (section 00)
  const allSections = Array.from(document.querySelectorAll('.section'));
  const section00   = allSections.find(s => txt(s.querySelector('.section-num')) === '00');
  const timeline    = [];

  if (section00) {
    const summaryEl = section00.querySelector('.timeline-summary');
    if (summaryEl) {
      const times    = Array.from(summaryEl.querySelectorAll('.ts-time'));
      const contents = Array.from(summaryEl.querySelectorAll('.ts-content'));
      times.forEach((timeEl, i) => {
        const contentEl = contents[i];
        const dotStyle  = contentEl?.querySelector('.ts-dot')?.getAttribute('style') ?? '';
        const dotColor  = dotStyle.includes('--accent')   ? 'accent'
                        : dotStyle.includes('--gold')     ? 'gold'
                        : dotStyle.includes('--teal')     ? 'teal'
                        : dotStyle.includes('--blue')     ? 'blue'
                        : 'muted';
        // event text = contentEl text minus the dot's empty span
        const event = (contentEl?.textContent ?? '').replace(/\s+/g, ' ').trim();
        timeline.push({ time: txt(timeEl), event, dotColor });
      });
    }
  }

  // Sections 01-10
  const sections = allSections
    .filter(s => {
      const num = txt(s.querySelector('.section-num'));
      return num !== '00' && num !== '';
    })
    .map(s => ({
      num:       txt(s.querySelector('.section-num')),
      title:     txt(s.querySelector('.section-title')),
      timeRange: txt(s.querySelector('.section-time')),
      blocks:    extractBlocks(s),
    }));

  return { day: dayNumber, title, subtitle, tags, timeline, sections };
}

// ── run ────────────────────────────────────────────────────────────────
const htmlPath = join(ROOT, 'src/data/import/day1_plan.html');
const outPath  = join(ROOT, 'src/data/scheduleDay1.ts');

console.log(`\nParsing: ${htmlPath}`);
const data = parseDayPlan(htmlPath, 1);

const output = `// AUTO-GENERATED by scripts/import-schedule.mjs — do not edit manually
import type { DayPlan } from '../types/dayPlan';

const day1Plan: DayPlan = ${JSON.stringify(data, null, 2)};

export default day1Plan;
`;

writeFileSync(outPath, output, 'utf-8');
console.log(`Written: ${outPath}`);
console.log(`  timeline: ${data.timeline.length} entries`);
console.log(`  sections: ${data.sections.length} sections`);
console.log('\nDone! Restart the dev server to see the changes.\n');
