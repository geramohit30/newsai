require('dotenv').config({path:'/usr/src/.env'});
const { OpenAI } = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPEN_AI_KEY,
});

async function chatWithGPT4Mini(userPrompt, lang = 'en', url = '') {
  let englishPrompt = '';
  if(url && url.length > 0){
    `Summarize the following news text in a paragraph of 70–80 words with a clear beginning (what happened), middle (key facts), and end (outcome or implication). Keep it factually accurate, grammatically correct, and written in a neutral, professional tone.
    Use this article URL to understand the context of the news : ${url}
    Text : ${userPrompt}`;
  }
  else{
  englishPrompt = `
  Summarize the following news text in paragraph of 70–80 words with a clear beginning (what happened), middle (key facts), and end (outcome or implication). Keep it factually accurate, grammatically correct, and written in a neutral, professional tone.
  Text : ${userPrompt}`;
}
  const hindiPrompt = `Summarize the given Hindi news article in less than 80 words. The summary should be crisp, up-to-date, and factually accurate, covering all the key elements of the story. Ensure the summary answers the 5Ws and 1H — What, Who, When, Where, Why, and How.
  Include any relevant data points, statistics, or factual figures, if mentioned.
  Make sure all punctuations are correct.
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


async function chatGPTHeading(userPrompt, lang = 'en') {
  const englishPrompt = `Write a English headline in less than 14 words, using pure, grammatically correct English.
  The headline should reflect the essence of the news while generating curiosity and encouraging the reader to know more.
  Keep it sharp, relevant, and professional, as if written by a English news editor.
  And also make sure all punctuation are correct.
  Text : ${userPrompt}`;
  const hindiPrompt = `
  Write a Hindi headline in less than 14 words, using pure, grammatically correct Hindi.
  The headline should reflect the essence of the news while generating curiosity and encouraging the reader to know more.
  Keep it sharp, relevant, and professional, as if written by a Hindi news editor.
  And also make sure all hindi punctuation are correct.
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

module.exports = {chatWithGPT4Mini, chatGPTHeading};
