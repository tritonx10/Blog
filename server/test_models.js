require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  const genAI = new GoogleGenerativeAI(apiKey);
  const models = ['gemini-1.5-flash', 'gemini-1.5-flash-latest', 'gemini-1.5-pro', 'gemini-pro-vision'];
  
  for (const m of models) {
    try {
      console.log(`Testing model: ${m}...`);
      const model = genAI.getGenerativeModel({ model: m });
      const result = await model.generateContent('test');
      console.log(`✅ ${m} works! Response: ${result.response.text().substring(0, 20)}...`);
      return; // Stop if one works
    } catch (err) {
      console.error(`❌ ${m} failed: ${err.message}`);
    }
  }
}

testModels();
