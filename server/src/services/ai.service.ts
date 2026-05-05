import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY || "";
const cache = new Map<string, any>();

export const AiService = {
  async fetchCompanyDetails(companyName: string) {
    if (!apiKey) throw new Error("GEMINI_API_KEY is not configured.");

    const normalizedName = companyName.trim().toLowerCase();
    if (cache.has(normalizedName)) {
      console.log(`Returning cached data for ${companyName}`);
      return cache.get(normalizedName);
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = `You are a business intelligence assistant. Please find public information and details about the company "${companyName}".
Return a JSON object with exactly these fields:
{
  "companyType": "string (e.g., Private (Digital Consultancy))",
  "founded": "string (e.g., 2014)",
  "sectors": ["string", "string"],
  "employees": "string (e.g., ~50-100)",
  "email": "string",
  "timezone": "string",
  "coreFocus": ["string", "string"],
  "website": "string",
  "description": "string (A paragraph describing the company)"
}
If a field cannot be determined, make a best guess or return an empty string/array. Do your best to find accurate information.`;

    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const parsed = JSON.parse(text);
      cache.set(normalizedName, parsed);
      return parsed;
    } catch (err) {
      console.error("AI fetch failed:", err);
      throw new Error("Failed to fetch company details from AI.");
    }
  }
};
