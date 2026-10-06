/**
 * ElementResolver - Ranks candidates and resolves natural language targets into concrete PageElements
 */

import { PageElement, TargetQuery } from './BrowserTypes';
import { TargetMemory } from './TargetMemory';

export interface ResolutionResult {
  bestMatch: PageElement | null;
  confidence: number;
  isAmbiguous: boolean;
  alternativeMatches?: PageElement[];
  reason?: string;
}

export class ElementResolver {
  private static ORDINAL_MAP: Record<string, number> = {
    // English
    first: 1,
    '1st': 1,
    one: 1,
    second: 2,
    '2nd': 2,
    two: 2,
    third: 3,
    '3rd': 3,
    three: 3,
    fourth: 4,
    '4th': 4,
    four: 4,
    fifth: 5,
    '5th': 5,
    five: 5,
    last: -1,

    // Urdu / Roman Urdu
    pehli: 1,
    pehla: 1,
    pehley: 1,
    shuru: 1,
    doosri: 2,
    doosra: 2,
    dusri: 2,
    dusra: 2,
    teesri: 3,
    teesra: 3,
    tisri: 3,
    chauthi: 4,
    chautha: 4,
    panchwi: 5,
    panchwa: 5,
    aakhri: -1,
  };

  /**
   * Resolves a user's natural language query to the best PageElement
   */
  public static resolve(
    query: TargetQuery,
    elements: PageElement[],
    targetMemory = TargetMemory.getInstance()
  ): ResolutionResult {
    if (!elements || elements.length === 0) {
      return { bestMatch: null, confidence: 0, isAmbiguous: false, reason: 'No elements on current page.' };
    }

    // Direct elementId match
    if (query.elementId) {
      const match = elements.find((e) => e.id === query.elementId);
      if (match) {
        return { bestMatch: match, confidence: 1.0, isAmbiguous: false };
      }
    }

    const desc = query.description.toLowerCase().trim();

    // Contextual pronoun resolution first
    const contextualTarget = targetMemory.resolveContextualTarget(desc, elements);
    if (contextualTarget) {
      return {
        bestMatch: contextualTarget,
        confidence: 0.9,
        isAmbiguous: false,
        reason: 'Resolved from conversational target memory',
      };
    }

    // Detect requested ordinal
    const requestedOrdinal = this.extractOrdinal(desc) ?? query.ordinal;

    // Detect requested entity type
    const wantsVideo = desc.includes('video') || desc.includes('lecture') || desc.includes('tutorial');
    const wantsChannel = desc.includes('channel');
    const wantsButton = desc.includes('button') || desc.includes('btn') || desc.includes('subscribe');
    const wantsLink = desc.includes('link') || desc.includes('result');

    // Filter and score candidates
    const scoredCandidates = elements.map((el) => {
      let score = 0;
      const elText = (el.text || '').toLowerCase();
      const elAria = (el.ariaLabel || '').toLowerCase();
      const elTitle = (el.title || '').toLowerCase();
      const elCombined = `${elText} ${elAria} ${elTitle}`;

      // Entity type scoring
      if (wantsChannel && (el.isChannel || el.elementType === 'channel')) score += 0.35;
      if (wantsVideo && (el.isVideo || el.elementType === 'video')) score += 0.35;
      if (wantsButton && el.elementType === 'button') score += 0.3;
      if (wantsLink && el.elementType === 'link') score += 0.2;

      // Extract cleaned search tokens (remove stop words)
      const cleanTokens = desc
        .replace(/\b(click|open|kholo|play|pe|par|is|us|jo|wali|wala|the|video|channel|button|pehli|doosri|first|second)\b/gi, '')
        .trim()
        .split(/\s+/)
        .filter((t) => t.length > 2);

      // Exact substring match
      if (cleanTokens.length > 0) {
        const queryPhrase = cleanTokens.join(' ');
        if (elCombined.includes(queryPhrase)) {
          score += 0.55;
        } else {
          // Token overlap matching
          let matchedTokens = 0;
          for (const token of cleanTokens) {
            if (elCombined.includes(token)) matchedTokens++;
          }
          score += (matchedTokens / cleanTokens.length) * 0.45;
        }
      }

      return { el, score };
    });

    // Handle Ordinal Selection (e.g. "first video", "second lecture", "pehli video")
    if (requestedOrdinal !== undefined) {
      let pool = elements;
      if (wantsVideo) pool = elements.filter((e) => e.isVideo || e.elementType === 'video');
      else if (wantsChannel) pool = elements.filter((e) => e.isChannel || e.elementType === 'channel');
      else if (wantsButton) pool = elements.filter((e) => e.elementType === 'button');

      if (pool.length > 0) {
        let targetEl: PageElement;
        if (requestedOrdinal === -1) {
          targetEl = pool[pool.length - 1]; // Last item
        } else {
          const idx = Math.max(0, Math.min(requestedOrdinal - 1, pool.length - 1));
          targetEl = pool[idx];
        }
        return {
          bestMatch: targetEl,
          confidence: 0.95,
          isAmbiguous: false,
          reason: `Resolved ordinal #${requestedOrdinal} from matching elements`,
        };
      }
    }

    // Sort by descending score
    scoredCandidates.sort((a, b) => b.score - a.score);

    const top = scoredCandidates[0];
    if (!top || top.score < 0.25) {
      // Fallback: first visible video or link if query asked for a general click
      if (wantsVideo) {
        const firstVid = elements.find((e) => e.isVideo || e.elementType === 'video');
        if (firstVid) return { bestMatch: firstVid, confidence: 0.6, isAmbiguous: false };
      }
      return { bestMatch: null, confidence: 0, isAmbiguous: false, reason: 'No confident match found.' };
    }

    // Ambiguity check: if top 2 candidates have almost identical high score
    const second = scoredCandidates[1];
    if (second && top.score - second.score < 0.05 && top.score > 0.55 && top.el.text !== second.el.text) {
      return {
        bestMatch: top.el,
        confidence: top.score,
        isAmbiguous: true,
        alternativeMatches: [top.el, second.el],
        reason: 'Multiple matching candidates with similar confidence',
      };
    }

    return {
      bestMatch: top.el,
      confidence: Math.min(1.0, top.score),
      isAmbiguous: false,
    };
  }

  public static extractOrdinal(text: string): number | undefined {
    const words = text.toLowerCase().split(/\s+/);
    for (const w of words) {
      if (this.ORDINAL_MAP[w] !== undefined) {
        return this.ORDINAL_MAP[w];
      }
    }
    return undefined;
  }
}
