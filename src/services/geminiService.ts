
import { GoogleGenAI, Type } from "@google/genai";

const API_KEY = process.env.API_KEY || "";

export const getMaterialEstimation = async (prompt: string) => {
  if (!API_KEY) return "AI advisor is currently unavailable (API Key missing).";

  const ai = new GoogleGenAI({ apiKey: API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Siz professional qurilish maslahatchisisiz. Foydalanuvchi so'roviga asoslanib kerakli materiallar miqdorini hisoblang va o'zbek tilida qisqa javob bering.
      So'rov: ${prompt}`,
      config: {
        temperature: 0.7,
        maxOutputTokens: 500,
      },
    });
    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Kechirasiz, hisoblashda xatolik yuz berdi.";
  }
};
