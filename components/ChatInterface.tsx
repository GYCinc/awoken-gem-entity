/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useRef, useEffect } from 'react';
import { Gem, ChatMessage, MessageSender, URLGroup } from '../types';
import MessageItem from './MessageItem';
import { ArrowLeft, Loader, Sparkles, Send } from 'lucide-react';
import { generateChatResponse, generateSpeech } from '../services/geminiService';

interface ChatInterfaceProps {
  gem: Gem;
  knowledgeBase?: URLGroup;
  onHistoryUpdate: (gemId: string, newHistory: ChatMessage[]) => void;
  onEndSession: (gem: Gem, finalHistory: ChatMessage[]) => void;
  isCreatingCanvas: boolean;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ gem, knowledgeBase, onHistoryUpdate, onEndSession, isCreatingCanvas }) => {
  const [messages, setMessages] = useState<ChatMessage[]>(gem.chatHistory);
  const [userInput, setUserInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Save history whenever it changes
    onHistoryUpdate(gem.id, messages);
    // eslint-disable--next-line react-hooks/exhaustive-deps
  }, [messages]);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!userInput.trim() || isGenerating) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      text: userInput,
      sender: MessageSender.USER,
      timestamp: new Date(),
    };
    
    const loadingMessage: ChatMessage = {
        id: `model-${Date.now()}`,
        text: '',
        sender: MessageSender.MODEL,
        timestamp: new Date(),
        isLoading: true,
    }

    const currentMessages = [...messages, userMessage, loadingMessage];
    setMessages(currentMessages);
    setUserInput('');
    setIsGenerating(true);

    try {
      const responseText = await generateChatResponse(
        userInput,
        currentMessages.slice(0, -1), // Don't include the loading message in history
        gem.systemInstruction,
        knowledgeBase?.urls
      );
      
      const audioBase64 = await generateSpeech(responseText);
      
      const finalMessage: ChatMessage = {
        ...loadingMessage,
        text: responseText,
        isLoading: false,
        audioBase64: audioBase64,
      };

      setMessages(prev => [...prev.slice(0, -1), finalMessage]);
      
    } catch (error) {
        console.error("Error generating response:", error);
        const errorMessage: ChatMessage = {
            ...loadingMessage,
            text: "Sorry, I encountered an error. Please try again.",
            sender: MessageSender.SYSTEM,
            isLoading: false,
        };
        setMessages(prev => [...prev.slice(0,-1), errorMessage]);
    } finally {
        setIsGenerating(false);
    }
  };

  const handleEndAndCreateCanvas = () => {
    onEndSession(gem, messages);
  };
  
  if (isCreatingCanvas) {
    return (
        <div className="flex flex-col h-full bg-[#1E1E1E] rounded-xl shadow-md border border-[rgba(255,255,255,0.05)] items-center justify-center text-center">
            <Sparkles size={48} className="text-[#79B8FF] animate-pulse mb-4" />
            <h2 className="text-xl font-semibold text-white">This Gem is Creating...</h2>
            <p className="text-[#A8ABB4] mt-2">Please wait while it reflects on the session to create its Canvas.</p>
        </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#1E1E1E] rounded-xl shadow-md border border-[rgba(255,255,255,0.05)]">
      <div className="p-4 border-b border-[rgba(255,255,255,0.05)] flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
            <button onClick={handleEndAndCreateCanvas} className="p-1.5 text-[#A8ABB4] hover:text-white rounded-md hover:bg-white/10 transition-colors">
                <ArrowLeft size={20} />
            </button>
            <div>
                <h2 className="text-xl font-semibold text-[#E2E2E2]">{gem.name}</h2>
                <p className="text-xs text-[#A8ABB4] mt-1">Chatting as: {gem.studentName}</p>
            </div>
        </div>
        <button
            onClick={handleEndAndCreateCanvas}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#79B8FF]/10 hover:bg-[#79B8FF]/20 text-[#79B8FF] rounded-lg transition-colors text-sm"
            >
            <Sparkles size={14} />
            End & Create Canvas
        </button>
      </div>

      <div className="flex-grow p-4 overflow-y-auto chat-container bg-[#282828] flex flex-col">
        <div className="max-w-4xl mx-auto w-full flex-grow">
          {messages.map((msg) => (
            <MessageItem key={msg.id} message={msg} />
          ))}
          {messages.length === 0 && (
             <div className="flex flex-col items-center justify-center h-full text-center text-[#777777]">
                <h2 className="text-lg font-semibold text-[#A8ABB4]">Session Started</h2>
                <p className="max-w-xs mt-1 text-sm">Send a message to begin the conversation.</p>
             </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="p-4 border-t border-[rgba(255,255,255,0.05)] bg-[#1E1E1E] rounded-b-xl flex items-center gap-3">
        <textarea
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                }
            }}
            placeholder="Send a message..."
            rows={1}
            className="flex-grow py-2 px-3 border border-[rgba(255,255,255,0.1)] bg-[#2C2C2C] text-[#E2E2E2] rounded-md focus:ring-1 focus:ring-white/20 focus:border-white/20 text-sm resize-none"
            disabled={isGenerating}
        />
        <button 
            onClick={handleSendMessage}
            disabled={isGenerating || !userInput.trim()}
            className="w-10 h-10 flex items-center justify-center bg-[#79B8FF]/10 text-[#79B8FF] rounded-lg transition-colors hover:bg-[#79B8FF]/20 disabled:bg-gray-500/10 disabled:text-gray-500"
            aria-label="Send message"
        >
            {isGenerating ? <Loader size={18} className="animate-spin" /> : <Send size={18} />}
        </button>
      </div>
    </div>
  );
};

export default ChatInterface;