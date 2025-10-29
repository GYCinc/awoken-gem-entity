/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useRef } from 'react';
import { marked } from 'marked';
import hljs from 'highlight.js';
import { ChatMessage, MessageSender } from '../types';
import { decode, decodeAudioData } from '../utils/audio';
import { Volume2 } from 'lucide-react';

marked.setOptions({
  highlight: function(code, lang) {
    const language = hljs.getLanguage(lang) ? lang : 'plaintext';
    return hljs.highlight(code, { language }).value;
  },
  langPrefix: 'hljs language-',
} as any);

interface MessageItemProps {
  message: ChatMessage;
}

const SenderAvatar: React.FC<{ sender: MessageSender }> = ({ sender }) => {
  let avatarChar = '';
  let bgColorClass = '';

  if (sender === MessageSender.USER) {
    avatarChar = 'U';
    bgColorClass = 'bg-white/[.12]';
  } else if (sender === MessageSender.MODEL) {
    avatarChar = 'AI';
    bgColorClass = 'bg-[#777777]';
  } else { // SYSTEM
    avatarChar = 'S';
    bgColorClass = 'bg-[#4A4A4A]';
  }

  return (
    <div className={`w-8 h-8 rounded-full ${bgColorClass} text-white flex items-center justify-center text-sm font-semibold flex-shrink-0`}>
      {avatarChar}
    </div>
  );
};

const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
  const isUser = message.sender === MessageSender.USER;
  const isModel = message.sender === MessageSender.MODEL;
  const audioContextRef = useRef<AudioContext | null>(null);

  const handlePlayAudio = async () => {
    if (!message.audioBase64) return;
    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    const audioData = decode(message.audioBase64);
    const audioBuffer = await decodeAudioData(audioData, audioContextRef.current, 24000, 1);
    const source = audioContextRef.current.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContextRef.current.destination);
    source.start();
  };


  const renderMessageContent = () => {
    if (isModel && !message.isLoading) {
      const proseClasses = "prose prose-sm prose-invert w-full min-w-0";
      const rawMarkup = marked.parse(message.text || "") as string;
      return <div className={proseClasses} dangerouslySetInnerHTML={{ __html: rawMarkup }} />;
    }
    
    const textColorClass = isUser ? 'text-white' : 'text-[#A8ABB4]';
    return <div className={`whitespace-pre-wrap text-sm ${textColorClass}`}>{message.text}</div>;
  };
  
  let bubbleClasses = "p-3 rounded-lg shadow w-full";

  if (isUser) {
    bubbleClasses += " bg-white/[.12] text-white";
  } else if (isModel) {
    bubbleClasses += ` bg-[rgba(119,119,119,0.10)] border-t border-[rgba(255,255,255,0.04)]`;
  } else { // System message
    bubbleClasses += " bg-[#2C2C2C] text-[#A8ABB4]";
  }

  return (
    <div className={`flex mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex items-start gap-2 max-w-[85%]`}>
        {!isUser && <SenderAvatar sender={message.sender} />}
        <div className={bubbleClasses}>
          {message.isLoading ? (
            <div className="flex items-center space-x-1.5">
              <div className={`w-1.5 h-1.5 bg-[#A8ABB4] rounded-full animate-bounce [animation-delay:-0.3s]`}></div>
              <div className={`w-1.5 h-1.5 bg-[#A8ABB4] rounded-full animate-bounce [animation-delay:-0.15s]`}></div>
              <div className={`w-1.5 h-1.5 bg-[#A8ABB4] rounded-full animate-bounce`}></div>
            </div>
          ) : (
            renderMessageContent()
          )}
           {isModel && message.audioBase64 && !message.isLoading && (
            <div className="mt-2 pt-2 border-t border-[rgba(255,255,255,0.05)]">
                <button onClick={handlePlayAudio} className="flex items-center gap-1.5 text-xs text-[#A8ABB4] hover:text-white transition-colors">
                    <Volume2 size={14} />
                    Play Audio
                </button>
            </div>
           )}
        </div>
        {isUser && <SenderAvatar sender={message.sender} />}
      </div>
    </div>
  );
};

export default MessageItem;