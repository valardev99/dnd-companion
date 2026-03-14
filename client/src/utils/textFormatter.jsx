// ═══════════════════════════════════════════════════════════════
// TEXT FORMATTER — Formats DM narrative text into React elements
// ═══════════════════════════════════════════════════════════════

import React from 'react';

export function formatDMText(text) {
  if (!text) return null;

  // Helper: convert **bold** markers to <strong> within a string
  function parseBold(str) {
    const parts = str.split(/\*\*(.+?)\*\*/g);
    if (parts.length === 1) return str;
    return parts.map((part, i) =>
      i % 2 === 1 ? React.createElement('strong', { key: i }, part) : part
    );
  }

  // Helper: detect decorative separator lines (═══, ───, ***, ---, etc.)
  function isSeparator(line) {
    const t = line.trim();
    return /^[═─━\-*_~]{3,}$/.test(t);
  }

  // Split text into lines for processing
  const lines = text.split('\n');
  const sections = [];
  let currentNarrative = [];
  let currentCombat = [];
  let inCombat = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip decorative separator lines (═══, ───, etc.)
    if (isSeparator(trimmed)) {
      // If we're in combat, just skip it (it's a border around the block)
      // If not in combat, also skip — it's a pre-combat separator
      continue;
    }

    // Detect combat status block start
    if (/^\*{0,2}\*?COMBAT STATUS/i.test(trimmed)) {
      // Flush any narrative before combat
      if (currentNarrative.length > 0) {
        sections.push({ type: 'narrative', text: currentNarrative.join('\n') });
        currentNarrative = [];
      }
      inCombat = true;
      currentCombat = [trimmed];
      continue;
    }

    if (inCombat) {
      if (trimmed === '') {
        // Empty line ends combat block
        sections.push({ type: 'combat', lines: currentCombat });
        currentCombat = [];
        inCombat = false;
      } else {
        currentCombat.push(trimmed);
      }
    } else {
      currentNarrative.push(line);
    }
  }

  // Flush remaining
  if (inCombat && currentCombat.length > 0) {
    sections.push({ type: 'combat', lines: currentCombat });
  }
  if (currentNarrative.length > 0) {
    sections.push({ type: 'narrative', text: currentNarrative.join('\n') });
  }

  // If no sections parsed, treat whole text as narrative
  if (sections.length === 0) {
    sections.push({ type: 'narrative', text });
  }

  const elements = [];
  let key = 0;

  for (const section of sections) {
    if (section.type === 'combat') {
      // Render combat status as structured block
      const header = section.lines[0].replace(/\*+/g, '').trim();
      const dataLines = section.lines.slice(1);

      elements.push(
        React.createElement('div', { className: 'combat-status', key: key++ },
          React.createElement('div', { className: 'combat-header' }, header),
          ...dataLines.map((ln, j) => {
            // Clean up: strip bold markers, fix [Name]: bracket patterns
            let clean = ln.replace(/\*+/g, '').trim();
            // Convert [Guardian A (Right)]: Action → Guardian A (Right): Action
            clean = clean.replace(/^\[([^\]]+)\]:\s*/g, '$1: ');
            // Also handle [Distance]: pattern
            clean = clean.replace(/^\[([^\]]+)\]\s*/g, '$1 ');
            return React.createElement('div', { className: 'combat-line', key: j },
              /^(distance|range)/i.test(clean) ? '📏 ' + clean : '⚔ ' + clean
            );
          })
        )
      );
    } else {
      // Split narrative into paragraphs
      let paragraphs = section.text.split(/\n\n+/);

      // Smart-split long single paragraphs (>3 sentences)
      const expanded = [];
      for (const para of paragraphs) {
        const trimmedPara = para.trim();
        if (!trimmedPara) continue;

        // Count sentences (rough: split on ". " followed by uppercase or end)
        const sentences = trimmedPara.split(/(?<=[.!?])\s+(?=[A-Z"'\u201C])/);
        if (sentences.length > 4) {
          // Split into chunks of ~3 sentences
          let chunk = [];
          for (let i = 0; i < sentences.length; i++) {
            chunk.push(sentences[i]);
            if (chunk.length >= 3 && i < sentences.length - 1) {
              expanded.push(chunk.join(' '));
              chunk = [];
            }
          }
          if (chunk.length > 0) expanded.push(chunk.join(' '));
        } else {
          expanded.push(trimmedPara);
        }
      }

      for (const para of expanded) {
        if (para.trim()) {
          elements.push(
            React.createElement('p', { key: key++ }, parseBold(para.trim()))
          );
        }
      }
    }
  }

  return elements;
}
