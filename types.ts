/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

export enum MessageSender {
  USER = 'user',
  MODEL = 'model',
  SYSTEM = 'system',
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: MessageSender;
  timestamp: Date;
  isLoading?: boolean;
  audioBase64?: string;
}

export interface ConnectionCanvas {
  id: string;
  createdAt: Date;
  content: string; // The markdown content of the canvas
  proposedVisualSignature?: string; // The new font the Gem wants to adopt
  personalizedPractice?: string; // A targeted exercise for the student
}

export interface URLGroup {
    id: string;
    name: string;
    urls: string[];
}

export interface Gem {
  id: string;
  name: string;
  studentName: string;
  systemInstruction: string;
  visualSignature: string; // The font-family representing the Gem's "handwriting"
  knowledgeBaseGroupId?: string;
  chatHistory: ChatMessage[];
  canvases: ConnectionCanvas[];
  createdAt: Date;
}