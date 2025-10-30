import { GoogleGenAI } from "@google/genai";
import { type GenerateContentResponse } from "@google/genai";

// Declare window.GEMINI_API_KEY to avoid TypeScript errors
declare global {
  interface Window {
    GEMINI_API_KEY: string | undefined;
  }
}

const getGeminiInstance = () => {
  // Use window.GEMINI_API_KEY for browser-side access, which should be injected by the build process (e.g., Vercel)
  const apiKey = window.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set or accessible.");
  }
  return new GoogleGenAI({ apiKey: apiKey });
};

export const geminiService = {
  async generateProductDescription(productName: string, keywords: string[]): Promise<string> {
    try {
      const ai = getGeminiInstance();
      const prompt = `Generate a concise and engaging product description for "${productName}". Focus on these keywords: ${keywords.join(', ')}. Keep it under 100 words.`;

      const response: GenerateContentResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          temperature: 0.7,
          maxOutputTokens: 100
        }
      });
      return response.text;
    } catch (error) {
      console.error("Error generating product description with Gemini:", error);
      throw new Error("Failed to generate description. Please try again.");
    }
  },

  async chatWithGemini(message: string, history: {role: 'user' | 'model'; parts: string[]}[] = []): Promise<string> {
    try {
      const ai = getGeminiInstance();
      const chat = ai.chats.create({
        model: "gemini-2.5-flash",
        config: {
          temperature: 0.5,
          systemInstruction: "You are a helpful and friendly e-commerce customer support assistant. You provide information about products and help customers with their queries. Be concise and polite."
        }
      });

      // Add previous messages to history
      for (const msg of history) {
        await chat.sendMessage({ message: msg.parts[0] });
      }

      const response: GenerateContentResponse = await chat.sendMessage({ message: message });
      return response.text;
    } catch (error) {
      console.error("Error chatting with Gemini:", error);
      throw new Error("Failed to get response from chatbot. Please try again.");
    }
  }
};