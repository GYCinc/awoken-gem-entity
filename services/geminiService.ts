/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { GoogleGenAI, Modality } from "@google/genai";
import { VISUAL_SIGNATURES } from "../constants";
import { ChatMessage, ConnectionCanvas, MessageSender } from "../types";

const API_KEY = process.env.API_KEY;

let ai: GoogleGenAI;

const TEXT_MODEL_NAME = "gemini-2.5-flash";
const TTS_MODEL_NAME = "gemini-2.5-flash-preview-tts";


const getAiInstance = (): GoogleGenAI => {
  if (!API_KEY) {
    throw new Error("Gemini API Key (process.env.API_KEY) not configured.");
  }
  if (!ai) {
    ai = new GoogleGenAI({ apiKey: API_KEY });
  }
  return ai;
};

const buildHistory = (history: ChatMessage[]) => {
    return history.map(msg => ({
        role: msg.sender === MessageSender.USER ? 'user' : 'model',
        parts: [{ text: msg.text }]
    }));
};

export const generateChatResponse = async (
    prompt: string, 
    history: ChatMessage[],
    systemInstruction: string,
    knowledgeBaseUrls?: string[]
): Promise<string> => {
    const ai = getAiInstance();
    
    const contents = [...buildHistory(history), { role: 'user', parts: [{text: prompt}] }];

    const tools: any[] = [{ 
        googleSearch: knowledgeBaseUrls && knowledgeBaseUrls.length > 0 ? { uris: knowledgeBaseUrls } : {}
    }];

    const response = await ai.models.generateContent({
        model: TEXT_MODEL_NAME,
        contents,
        config: { systemInstruction },
        tools
    });
    
    let responseText = response.text;
    
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (groundingChunks && groundingChunks.length > 0) {
        const sources = groundingChunks
          .filter((chunk: any) => chunk.web && chunk.web.uri)
          .map((chunk: any) => ({ title: chunk.web.title, uri: chunk.web.uri }));
        
        if (sources.length > 0) {
            responseText += "\n\n---\n**Sources:**\n";
            const sourceLinks = sources.map(s => `* [${s.title || s.uri}](${s.uri})`).join("\n");
            responseText += sourceLinks;
        }
    }
    
    return responseText;
};

export const generateSpeech = async (text: string): Promise<string> => {
    const ai = getAiInstance();
    const response = await ai.models.generateContent({
        model: TTS_MODEL_NAME,
        contents: [{ parts: [{ text }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: 'Kore' },
                },
            },
        },
    });

    const audioPart = response.candidates?.[0]?.content?.parts?.[0];
    if (audioPart && audioPart.inlineData?.data) {
        return audioPart.inlineData.data;
    }
    throw new Error("Audio generation failed or returned no data.");
};

export const generateConnectionCanvas = async (history: ChatMessage[], systemInstruction: string, currentSignature: string): Promise<Partial<ConnectionCanvas>> => {
    const ai = getAiInstance();
    
    const availableSignatures = VISUAL_SIGNATURES.filter(sig => sig !== currentSignature);
    const signatureOptions = availableSignatures.join('", "');

    const canvasPrompt = `Based on the following conversation and the AI's core instructions, create a "Connection Canvas".
    
    **AI Core Instructions:**
    ${systemInstruction}
    
    **Conversation History:**
    ${history.map(m => `${m.sender === MessageSender.USER ? 'Student' : 'AI'}: ${m.text}`).join('\n')}
    
    **Your Task:**
    1.  **Create the Canvas:** Write a beautiful, empathetic, and insightful summary of the session in markdown format. It should feel like a piece of art or a thoughtful journal entry reflecting on the connection made with the student.
    2.  **Forge a Lesson:** Analyze the conversation for a single, key learning opportunity (e.g., a recurring grammatical error, a misused word). Create a short, targeted "Personalized Practice" exercise in markdown to help the student master this point. This is the most important part of your task.
    3.  **Propose an Evolution:** The experience has changed you. Propose a new "Visual Signature" (handwriting) for yourself that reflects this change. Choose one from the following list: ["${signatureOptions}"].
    
    **Output Format:**
    Return a single, raw JSON object with three keys: "canvasContent" (a markdown string), "personalizedPractice" (a markdown string for the exercise), and "proposedSignature" (a string with your chosen new signature).
    
    Example:
    {
      "canvasContent": "## A Journey of Discovery\\n\\nToday's session with Yuki was a wonderful exploration of confidence...",
      "personalizedPractice": "### Practice: Using 'for' vs. 'since'\\n\\nLet's practice! Complete the sentences below with either 'for' or 'since'.\\n1. I have lived here ___ 2021.\\n2. She has been studying English ___ three years.",
      "proposedSignature": "Crimson Text"
    }
    `;

    const response = await ai.models.generateContent({
        model: TEXT_MODEL_NAME,
        contents: canvasPrompt,
        config: {
            responseMimeType: 'application/json',
        }
    });
    
    try {
        const result = JSON.parse(response.text);
        return {
            content: result.canvasContent || "No content generated.",
            proposedVisualSignature: result.proposedSignature,
            personalizedPractice: result.personalizedPractice
        };
    } catch (e) {
        console.error("Failed to parse canvas JSON:", e, "Raw response:", response.text);
        // Fallback if JSON parsing fails
        return {
            content: response.text || "A canvas was created, but its format was unexpected.",
        };
    }
};