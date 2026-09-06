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
    Analyze the request and return ONLY a valid JSON object (no markdown, no backticks, no explanation).
    The JSON must match this structure exactly:
    {
      "task": "short summary of the task",
      "projectType": "general category e.g., construction, agriculture, event, industrial, residential",
      "projectScale": "small, medium, or large",
      "equipmentCategory": "One of exactly: Construction, Agriculture, Industrial, Event, Other",
      "primaryEquipmentType": "The specific primary equipment requested",
      "suggestedEquipmentTypes": ["Primary Equipment", "Alternative 1", "Alternative 2"],
      "keywords": ["action word 1", "action word 2", "task keyword 1"],
      "projectContext": "One sentence describing the user's actual goal"
    }

    Rules:
    - "equipmentCategory" MUST be one of: Construction, Agriculture, Industrial, Event, Other
    - "primaryEquipmentType" should represent exactly what the user asked for (if specified), or the most direct fit if they only described a task.
    - "suggestedEquipmentTypes" must be genuinely suitable alternatives for the specific task (2-4 items). Do NOT include unrelated items.
    - "keywords" should be 3-6 specific action or task keywords extracted from the user's request (e.g., "digging", "trenching", "ploughing", "welding", "power backup"). These help with secondary matching.
    - Only suggest generic equipment types (e.g., "Mini Excavator", "Generator", "Tractor"). Do not suggest specific brand names unless the user asked for one.
    - For common equipment aliases: JCB means Excavator, Genset means Generator, Rotary Tiller means Rotavator.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.1
      }
    });

    let textResponse = response.text;
    // Clean up if the model wraps in markdown code blocks
    textResponse = textResponse.replace(/```json/gi, '').replace(/```/g, '').trim();

    const parsedData = JSON.parse(textResponse);
    return parsedData;

  } catch (error) {
    console.error('Gemini API Error:', error);
    throw new Error('Failed to analyze requirement with AI.');
  }
};

module.exports = { analyzeRequirement };
