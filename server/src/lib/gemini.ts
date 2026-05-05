import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../config/env";

export const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

export const getGeminiModel = (modelName: string = "gemini-1.5-flash", systemInstruction?: string) => {
  const config: any = { model: modelName };
  if (systemInstruction) config.systemInstruction = systemInstruction;
  return genAI.getGenerativeModel(config);
};
