require('dotenv').config();
const { OpenAI } = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPEN_AI_KEY,
});

async function chatWithGPT4Mini(userPrompt, lang = 'en') {
const englishPrompt = `Summarize the given English news article in less than 80 words. The summary should be crisp, up-to-date, and factually accurate, covering all the key elements of the story. Ensure the summary answers the 5Ws and 1H — What, Who, When, Where, Why, and How.
Include any relevant data points, statistics, or factual figures, if mentioned.
The language must be clear, precise, and professional, as if written by an experienced news editor. Maintain a neutral and objective tone throughout. Avoid unnecessary adjectives, emotional framing, or commentary. 
Text : ${userPrompt}`;
const hindiPrompt = `Summarize the given Hindi news article in less than 80 words. The summary should be crisp, up-to-date, and factually accurate, covering all the key elements of the story. Ensure the summary answers the 5Ws and 1H — What, Who, When, Where, Why, and How.
Include any relevant data points, statistics, or factual figures, if mentioned.
The summary should be written in pure Hindi, with no use of English words, not even commonly used ones.
The language must be clear, precise, and professional, as if written by an experienced Hindi news editor. Maintain a neutral and objective tone throughout. Avoid unnecessary adjectives, emotional framing, or commentary. 
Text : ${userPrompt}`;
  try {
    let prompt = lang === 'en' ? englishPrompt : hindiPrompt;
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 120,
      temperature: 0.7,
      top_p: 1,
    });

    // console.log('GPT-4 Mini Response:', response.choices[0].message.content);
    return response.choices[0].message.content;
  } catch (error) {
    console.error('Error while calling OpenAI API:', error);
    return null
  }
}

module.exports = chatWithGPT4Mini;
