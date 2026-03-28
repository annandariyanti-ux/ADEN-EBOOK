import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface EbookOutline {
  title: string;
  chapters: {
    title: string;
    subheadings: string[];
  }[];
}

export async function generateOutline(params: {
  topic: string;
  tone: string;
  author: string;
  pageCount: number;
}): Promise<EbookOutline> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Generate a detailed eBook outline in Indonesian for the topic: "${params.topic}". 
    The target length is ${params.pageCount} pages. 
    Tone: ${params.tone}. 
    Author: ${params.author}.
    The outline should include a catchy title and at least 8-12 chapters, each with 3-4 subheadings.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          chapters: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                subheadings: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                }
              },
              required: ["title", "subheadings"]
            }
          }
        },
        required: ["title", "chapters"]
      }
    }
  });

  return JSON.parse(response.text);
}

export async function generateChapterContent(params: {
  topic: string;
  tone: string;
  chapterTitle: string;
  subheadings: string[];
  context: string; // Previous chapters summary or context
}): Promise<string> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Write a detailed chapter for an eBook.
    Topic: ${params.topic}
    Tone: ${params.tone}
    Chapter Title: ${params.chapterTitle}
    Subheadings to cover: ${params.subheadings.join(", ")}
    
    Context from previous parts: ${params.context}
    
    Write in clear, professional Indonesian. Use Markdown formatting. Make it practical and engaging. 
    Aim for approximately 1500-2000 words for this chapter to ensure depth.`,
  });

  return response.text;
}
