const natural = require("natural");
const stopwords = require("stopword");
const he = require("he"); // ✅ For decoding HTML entities

const tokenizer = new natural.SentenceTokenizer();

const UNWANTED_PHRASES = [
    "also read",
    "click here",
    "watch video",
    "exclusive interview",
    "breaking news"
];

function cleanText(text) {
    // ✅ Decode HTML entities like &quot; → ", &#039; → ', etc.
    let cleanedText = he.decode(text);

    // Remove unwanted phrases
    UNWANTED_PHRASES.forEach(phrase => {
        const regex = new RegExp(`\\b${phrase}\\b.*?(?=\\.|\\!|\\?)`, "gi");
        cleanedText = cleanedText.replace(regex, "").trim();
    });

    // Fix multiple spaces
    cleanedText = cleanedText.replace(/\s+/g, " ");

    return cleanedText;
}

function getSentenceScores(sentences, wordFrequencies) {
    const sentenceScores = {};
    sentences.forEach((sentence) => {
        const words = sentence.toLowerCase().split(/\W+/).filter(word => word);
        const score = words.reduce((sum, word) => sum + (wordFrequencies[word] || 0), 0);
        sentenceScores[sentence] = score;
    });
    return sentenceScores;
}

function capitalizeSentences(text) {
    return text.replace(/(^\s*\w|[.!?]\s*\w)/g, match => match.toUpperCase());
}

function summarize(text, numSentences = 3) {
    let cleanedText = cleanText(text);

    const sentences = tokenizer.tokenize(cleanedText);

    const words = cleanedText.split(/\W+/).filter(word => word);
    const filteredWords = stopwords.removeStopwords(words);

    const wordFrequencies = {};
    filteredWords.forEach((word) => {
        wordFrequencies[word] = (wordFrequencies[word] || 0) + 1;
    });

    const sentenceScores = getSentenceScores(sentences, wordFrequencies);

    const summarySentences = Object.entries(sentenceScores)
        .sort((a, b) => b[1] - a[1])
        .slice(0, numSentences)
        .map(entry => entry[0]);

    let summary = summarySentences.join(" ");
    return capitalizeSentences(summary);
}

module.exports = summarize;
