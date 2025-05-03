require('dotenv').config();
const { OpenAI } = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPEN_AI_KEY,
});

async function chatWithGPT4Mini(userPrompt) {
const prompt = `Summarize this text in max 80 words : ${userPrompt}`;
  try {
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
