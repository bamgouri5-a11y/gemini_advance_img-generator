import { GoogleGenAI } from "@google/genai";

const apiKey = typeof process !== 'undefined' && process.env && process.env.GEMINI_API_KEY
  ? process.env.GEMINI_API_KEY
  : (import.meta as any).env?.VITE_GEMINI_API_KEY;

const ai = new GoogleGenAI({ apiKey });

export async function generateImage(prompt: string, aspectRatio: string = "1:1", baseImage?: string): Promise<string | null> {
  try {
    const parts: any[] = [];

    if (baseImage) {
      // Extract base64 data and mime type
      const match = baseImage.match(/^data:(.+);base64,(.+)$/);
      if (match) {
        parts.push({
          inlineData: {
            mimeType: match[1],
            data: match[2],
          },
        });
      }
    }

    parts.push({ text: prompt });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio,
        }
      }
    });

    // Iterate through parts to find the image
    if (response.candidates && response.candidates[0].content && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const base64EncodeString = part.inlineData.data;
          return `data:${part.inlineData.mimeType || 'image/png'};base64,${base64EncodeString}`;
        }
      }
    }

    return null;
  } catch (error) {
    console.error("Error generating image:", error);
    throw error;
  }
}

export async function improvePrompt(prompt: string): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-latest',
      contents: `Improve this image generation prompt to be more descriptive, artistic, and detailed. Keep it under 300 characters. Return ONLY the improved prompt text, no explanations or quotes.\n\nOriginal prompt: "${prompt}"`,
    });

    return response.text?.trim() || prompt;
  } catch (error) {
    console.error("Error improving prompt:", error);
    return prompt;
  }
}
