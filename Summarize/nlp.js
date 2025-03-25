const natural = require("natural");
const stopwords = require("stopword");

// Tokenizer for splitting text into sentences
const tokenizer = new natural.SentenceTokenizer();

// Unwanted phrases to remove
const UNWANTED_PHRASES = [
    "also read",
    "click here",
    "watch video",
    "exclusive interview",
    "breaking news"
];

// Function to clean text
function cleanText(text) {
    let cleanedText = text;

    // Remove unwanted phrases
    UNWANTED_PHRASES.forEach(phrase => {
        const regex = new RegExp(`\\b${phrase}\\b.*?(?=\\.|\\!|\\?)`, "gi");
        cleanedText = cleanedText.replace(regex, "").trim();
    });

    // Fix multiple spaces
    cleanedText = cleanedText.replace(/\s+/g, " ");

    return cleanedText;
}

// Function to calculate sentence scores
function getSentenceScores(sentences, wordFrequencies) {
    const sentenceScores = {};
    sentences.forEach((sentence) => {
        const words = sentence.toLowerCase().split(/\W+/).filter(word => word);
        const score = words.reduce((sum, word) => sum + (wordFrequencies[word] || 0), 0);
        sentenceScores[sentence] = score;
    });
    return sentenceScores;
}

// Function to capitalize the first letter of each sentence
function capitalizeSentences(text) {
    return text.replace(/(^\s*\w|[.!?]\s*\w)/g, match => match.toUpperCase());
}

// Function to summarize text
function summarize(text, numSentences = 3) {
    // Clean the text
    let cleanedText = cleanText(text);

    // Tokenize into sentences
    const sentences = tokenizer.tokenize(cleanedText);

    // Tokenize words and remove stopwords
    const words = cleanedText.split(/\W+/).filter(word => word);
    const filteredWords = stopwords.removeStopwords(words);

    // Calculate word frequencies
    const wordFrequencies = {};
    filteredWords.forEach((word) => {
        wordFrequencies[word] = (wordFrequencies[word] || 0) + 1;
    });

    // Score sentences
    const sentenceScores = getSentenceScores(sentences, wordFrequencies);

    // Sort sentences by score and select top ones
    const summarySentences = Object.entries(sentenceScores)
        .sort((a, b) => b[1] - a[1]) // Sort by score (descending)
        .slice(0, numSentences) // Pick top `numSentences`
        .map(entry => entry[0]);

    // Reconstruct for better readability &  scorrect capitalization
    let summary = summarySentences.join(" ");
    return capitalizeSentences(summary);
}
module.exports = summarize;
