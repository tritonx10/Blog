require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function listModels() {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('GEMINI_API_KEY not found in .env');
      return;
    }
    const genAI = new GoogleGenerativeAI(apiKey);
    const result = await genAI.listModels();
    console.log('Available Models:');
    result.models.forEach(model => {
      console.log(`- ${model.name} (${model.supportedGenerationMethods.join(', ')})`);
    });
  } catch (err) {
    console.error('Error listing models:', err.message);
  }
}

listModels();
