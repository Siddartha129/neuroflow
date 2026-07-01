export function cleanText(text = '') {
  return String(text)
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function splitSentences(text = '') {
  return cleanText(text)
    .split(/(?<=[.!?])\s+|\n+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

export function summarizeText(text = '', maxSentences = 4) {
  const sentences = splitSentences(text);
  if (!sentences.length) return '';
  const scored = sentences.map((sentence, index) => ({
    sentence,
    index,
    score: scoreSentence(sentence, text)
  }));
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, maxSentences)
    .sort((a, b) => a.index - b.index)
    .map((item) => item.sentence)
    .join(' ');
}

export function makeChunks(text = '', targetSize = 1200, overlap = 200) {
  const paragraphs = cleanText(text).split(/\n\s*\n/).filter(Boolean);
  const chunks = [];
  let current = '';

  for (const paragraph of paragraphs) {
    if ((current + '\n\n' + paragraph).trim().length <= targetSize) {
      current = (current + '\n\n' + paragraph).trim();
      continue;
    }
    if (current) chunks.push(current);
    if (paragraph.length <= targetSize) {
      current = paragraph;
    } else {
      for (let start = 0; start < paragraph.length; start += targetSize - overlap) {
        chunks.push(paragraph.slice(start, start + targetSize).trim());
      }
      current = '';
    }
  }

  if (current) chunks.push(current);

  return chunks.map((chunk, index) => ({
    chunkIndex: index,
    text: chunk,
    tokenCountApprox: Math.ceil(chunk.length / 4)
  }));
}

export function keywordScore(query = '', text = '') {
  const queryTerms = terms(query);
  if (!queryTerms.length) return 0;
  const textTerms = new Set(terms(text));
  return queryTerms.filter((term) => textTerms.has(term)).length / queryTerms.length;
}

export function terms(text = '') {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((term) => term.length > 2);
}

function scoreSentence(sentence, corpus) {
  const corpusTerms = terms(corpus);
  const frequencies = corpusTerms.reduce((acc, term) => {
    acc[term] = (acc[term] || 0) + 1;
    return acc;
  }, {});
  return terms(sentence).reduce((score, term) => score + (frequencies[term] || 0), 0) / Math.max(sentence.length, 1);
}
