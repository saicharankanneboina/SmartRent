const { GoogleGenAI } = require('@google/genai');

let ai;

// Initialize conditionally to avoid crashing if key is missing during testing
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
}

/**
 * Analyzes natural language requirement and returns structured data
 * @param {string} prompt - User's natural language request
 */
const analyzeRequirement = async (prompt) => {
  if (!ai) {
    throw new Error('Gemini API is not configured.');
  }

  const systemInstruction = `
    You are an AI assistant for an equipment rental platform (SmartRent). 
    A user will describe their task or project in natural language.
    Analyze the request and return ONLY a valid JSON object (no markdown, no backticks).
    The JSON must match this structure:
    {
      "task": "short summary of the task",
      "projectType": "general category e.g., construction, agriculture, event, industrial, residential",
      "projectScale": "small, medium, or large",
      "primaryEquipmentType": "The specific primary equipment requested",
      "suggestedEquipmentTypes": ["Primary Equipment", "Alternative 1", "Alternative 2"]
    }
    Only suggest generic equipment types (e.g. "Mini Excavator", "Generator", "Tractor"), do not suggest specific brand names unless the user asked for one.
    primaryEquipmentType should represent exactly what the user asked for (if they specified one), or the most direct fit if they only described a task.
    suggestedEquipmentTypes must be genuinely suitable alternatives for the specific task, not just unrelated items in the same category.
  `;

  try {
    const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
            systemInstruction: systemInstruction,
            temperature: 0.2
        }
    });

    let textResponse = response.text;
    // Clean up if the model includes markdown code blocks
    textResponse = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();

    const parsedData = JSON.parse(textResponse);
    return parsedData;

  } catch (error) {
    console.error('Gemini API Error:', error);
    throw new Error('Failed to analyze requirement with AI.');
  }
};

module.exports = { analyzeRequirement };
