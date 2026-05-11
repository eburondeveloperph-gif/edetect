import { GoogleGenAI } from '@google/genai';

async function listModels() {
  const ai = new GoogleGenAI({
    apiKey: process.env['GEMINI_API_KEY'],
  });
  
  // Actually, how to list models with @google/genai?
  // The documentation usually has ai.models.list()
  // Let me try that.
  
  try {
    const models = await ai.models.list();
    console.log(models);
  } catch (e) {
    console.error(e);
  }
}

listModels();
