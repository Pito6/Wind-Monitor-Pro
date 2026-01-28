
import { GoogleGenAI } from "@google/genai";
import { WindData, GroundingSource } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

export async function fetchWindData(location: string): Promise<{ data: WindData; sources: GroundingSource[] }> {
  const prompt = `Zisti aktuálne podmienky vetra pre lokalitu: ${location}. 
  Potrebujem presné informácie: 
  1. Aktuálna rýchlosť vetra v km/h.
  2. Nárazy vetra v km/h.
  3. Smer vetra (napr. Severozápadný alebo 315°).
  4. Stupeň Beaufortovej stupnice (0-12).
  5. Stručný opis podmienok v slovenčine.
  6. Predpoveď rýchlosti vetra na najbližších 6 hodín (v hodinových intervaloch).

  Dôležité: Výstup formátuj tak, aby obsahoval textové informácie, ktoré môžem zobraziť. 
  Taktiež sa uisti, že rýchlosť je v km/h.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || "";
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources: GroundingSource[] = chunks
      .filter(chunk => chunk.web)
      .map(chunk => ({
        title: chunk.web!.title || "Zdroj",
        uri: chunk.web!.uri || "#"
      }));

    const extractionPrompt = `Z nasledujúceho textu o počasí extrahuj dáta do formátu JSON:
    Text: "${text}"
    
    Požadovaný formát JSON:
    {
      "location": "${location}",
      "speedKmh": číslo,
      "gustsKmh": číslo,
      "direction": "text",
      "directionDeg": číslo (0-360),
      "description": "stručný opis",
      "beaufortScale": číslo (0-12),
      "forecast": [{"time": "HH:00", "speed": číslo}, ...]
    }`;

    const extractionResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: extractionPrompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const data = JSON.parse(extractionResponse.text || "{}") as WindData;
    data.timestamp = new Date().toLocaleTimeString('sk-SK');

    // Generate a visualization of the wind
    try {
      const visualPrompt = `A high quality cinematic photograph of the landscape in ${location} during a wind speed of ${data.speedKmh} km/h. The visual should reflect a wind force of ${data.beaufortScale} on the Beaufort scale. Show moving trees, flying debris or calm air depending on the strength. Photorealistic.`;
      const imageResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: visualPrompt }],
        },
      });
      
      for (const part of imageResponse.candidates[0].content.parts) {
        if (part.inlineData) {
          data.visualImageUrl = `data:image/png;base64,${part.inlineData.data}`;
          break;
        }
      }
    } catch (imgErr) {
      console.warn("Failed to generate wind visualization image", imgErr);
    }
    
    return { data, sources };
  } catch (error) {
    console.error("Chyba pri získavaní dát:", error);
    throw new Error("Nepodarilo sa načítať dáta o vetre. Skúste to prosím neskôr.");
  }
}
