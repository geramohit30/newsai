const natural = require("natural");
const stopwords = require("stopword");
const he = require("he");

const tokenizer = new natural.SentenceTokenizer();

const HEADING_PATTERN = /^[A-Z\s0-9,.:]{5,}$/; // to detect headings and dates
const DATE_PATTERN = /\b(?:\d{1,2} [A-Za-z]+ \d{4}|[A-Za-z]+ \d{1,2}, \d{4}|[A-Za-z]{3,} \d{1,2})\b/; // detect specific dates like 'APRIL 13' and 'April 13, 1919'
const WEAK_PATTERNS = [
    /^but\b/i,
    /^so\b/i,
    /^one day\b/i,
    /^meanwhile\b/i,
    /^we will return\b/i,
    /^let's\b/i,
    /fast-forward/i
];

function cleanText(text) {
    let cleaned = he.decode(text);

    // Fix missing space after date colons like "13:On"
    cleaned = cleaned.replace(/(\d{1,2}[:])([A-Za-z])/g, "$1 $2");

    // Fix heading merging with next word, like "JALLIANWALA BAGHOn"
    cleaned = cleaned.replace(/([A-Z]{3,}(?: [A-Z]{3,})*):?([A-Z][a-z])/g, '$1: $2');

    cleaned = cleaned
        .replace(/\s+([.,!?;:])/g, "$1")
        .replace(/([.,!?;:])(?=\S)/g, "$1 ")
        .replace(/\s+/g, " ")
        .replace(/[“”]/g, '"')
        .replace(/[‘’]/g, "'")
        .replace(/&#039;/g, "'")
        .replace(/&nbsp;/g, ' ')
        .trim();

    return cleaned;
}

function getSentenceScores(sentences, wordFrequencies) {
    const scores = {};
    sentences.forEach(sentence => {
        const words = sentence.toLowerCase().split(/\W+/).filter(Boolean);
        let score = 0;
        words.forEach(word => {
            score += wordFrequencies[word] || 0;
        });

        if (WEAK_PATTERNS.some(p => p.test(sentence))) {
            score *= 0.5;
        }

        if (HEADING_PATTERN.test(sentence.trim()) || DATE_PATTERN.test(sentence)) {
            score = 0; // Remove headings and dates
        }

        scores[sentence] = score;
    });
    return scores;
}

function formatSentences(sentences) {
    const seen = new Set();
    return sentences
        .map(s => s.trim())
        .filter(s => s.length > 30 && !seen.has(s) && !HEADING_PATTERN.test(s) && !DATE_PATTERN.test(s) && seen.add(s))
        .map(s => s.charAt(0).toUpperCase() + s.slice(1))
        .join(" ");
}

function summarize(text, maxLines = 3) {
    const cleanedText = cleanText(text);
    const sentences = tokenizer.tokenize(cleanedText);

    // Remove irrelevant lines like dates and headings before scoring
    const validSentences = sentences.filter(sentence => !HEADING_PATTERN.test(sentence) && !DATE_PATTERN.test(sentence));

    const words = cleanedText.split(/\W+/).filter(Boolean);
    const filteredWords = stopwords.removeStopwords(words.map(w => w.toLowerCase()));

    const wordFrequencies = {};
    filteredWords.forEach(word => {
        wordFrequencies[word] = (wordFrequencies[word] || 0) + 1;
    });

    const sentenceScores = getSentenceScores(validSentences, wordFrequencies);

    const topSentences = Object.entries(sentenceScores)
        .sort((a, b) => b[1] - a[1])
        .map(([s]) => s)
        .filter(s => s.length > 40 && /[a-zA-Z]/.test(s))
        .slice(0, maxLines * 2); // Get more for better selection

    return formatSentences(topSentences.slice(0, maxLines));
}

module.exports = summarize;