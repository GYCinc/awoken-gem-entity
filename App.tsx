/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import { Gem, ChatMessage, ConnectionCanvas, URLGroup } from './types';
import ChatInterface from './components/ChatInterface';
import GemCreator from './components/GemCreator';
import CanvasReviewModal from './components/CanvasReviewModal';
import { generateConnectionCanvas } from './services/geminiService';
import { VISUAL_SIGNATURES } from './constants';
import CosmicCanvasView from './components/CosmicCanvasView';
import KnowledgeBaseManager from './components/KnowledgeBaseManager';

const App: React.FC = () => {
  const [gems, setGems] = useState<Gem[]>([]);
  const [urlGroups, setUrlGroups] = useState<URLGroup[]>([]);
  const [activeView, setActiveView] = useState<'cosmic-canvas' | 'create' | 'chat'>('cosmic-canvas');
  const [activeGem, setActiveGem] = useState<Gem | null>(null);
  const [gemForEditing, setGemForEditing] = useState<Gem | null>(null);
  const [apiKeyExists, setApiKeyExists] = useState(false);
  const [isCreatingCanvas, setIsCreatingCanvas] = useState(false);
  const [canvasForReview, setCanvasForReview] = useState<{gem: Gem, canvas: ConnectionCanvas} | null>(null);
  const [showKnowledgeManager, setShowKnowledgeManager] = useState(false);


  useEffect(() => {
    setApiKeyExists(!!process.env.API_KEY);
    const savedGems = localStorage.getItem('esl-gems');
    if (savedGems) {
      try {
        const parsedGems = JSON.parse(savedGems);
        // Data hydration and migration
        parsedGems.forEach((gem: Gem) => {
          gem.createdAt = new Date(gem.createdAt);
          if (!gem.visualSignature) gem.visualSignature = VISUAL_SIGNATURES[0];
          if (!gem.canvases) gem.canvases = [];
          gem.canvases.forEach(c => c.createdAt = new Date(c.createdAt));
          gem.chatHistory.forEach((msg: ChatMessage) => {
            msg.timestamp = new Date(msg.timestamp);
          });
        });
        setGems(parsedGems);
      } catch (e) {
        console.error("Failed to parse gems from localStorage", e);
      }
    }
    const savedUrlGroups = localStorage.getItem('esl-gem-url-groups');
    if (savedUrlGroups) {
        try {
            setUrlGroups(JSON.parse(savedUrlGroups));
        } catch (e) {
            console.error("Failed to parse URL groups from localStorage", e);
        }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('esl-gems', JSON.stringify(gems));
  }, [gems]);

  useEffect(() => {
    localStorage.setItem('esl-gem-url-groups', JSON.stringify(urlGroups));
  }, [urlGroups]);

  const handleCreateNewGem = () => {
    setGemForEditing(null);
    setActiveView('create');
  };

  const handleEditGem = (gemId: string) => {
    const gemToEdit = gems.find(g => g.id === gemId);
    if (gemToEdit) {
      setGemForEditing(gemToEdit);
      setActiveView('create');
    }
  };

  const handleSaveGem = (gemData: Omit<Gem, 'id' | 'chatHistory' | 'createdAt' | 'visualSignature' | 'canvases'>, existingId?: string) => {
    if (existingId) {
      // Update existing Gem
      setGems(prevGems => prevGems.map(g => g.id === existingId ? { ...g, ...gemData } : g));
    } else {
      // Create new Gem
      const randomSignature = VISUAL_SIGNATURES[Math.floor(Math.random() * VISUAL_SIGNATURES.length)];
      const newGem: Gem = {
        ...gemData,
        id: `gem-${Date.now()}`,
        chatHistory: [],
        canvases: [],
        createdAt: new Date(),
        visualSignature: randomSignature,
      };
      setGems(prevGems => [...prevGems, newGem]);
    }
    setActiveView('cosmic-canvas');
    setGemForEditing(null);
  };
  
  const handleLaunchGem = (gemId: string) => {
    const gemToLaunch = gems.find(g => g.id === gemId);
    if (gemToLaunch) {
      setActiveGem(gemToLaunch);
      setActiveView('chat');
    }
  };

  const handleDeleteGem = (gemId: string) => {
    if (window.confirm("Are you sure you want to delete this Gem? This cannot be undone.")) {
      setGems(prevGems => prevGems.filter(g => g.id !== gemId));
    }
  };

  const handleBackToCanvas = () => {
    setActiveGem(null);
    setCanvasForReview(null);
    setGemForEditing(null);
    setActiveView('cosmic-canvas');
  };

  const handleUpdateChatHistory = (gemId: string, newHistory: ChatMessage[]) => {
    setGems(prevGems =>
      prevGems.map(gem =>
        gem.id === gemId ? { ...gem, chatHistory: newHistory } : gem
      )
    );
  };
  
  const handleEndSessionAndCreateCanvas = async (gem: Gem, finalHistory: ChatMessage[]) => {
    if (!gem || finalHistory.length === 0) {
      handleBackToCanvas();
      return;
    };
    setIsCreatingCanvas(true);
    handleUpdateChatHistory(gem.id, finalHistory);
    try {
      const { content, proposedVisualSignature, personalizedPractice } = await generateConnectionCanvas(finalHistory, gem.systemInstruction, gem.visualSignature);
      const newCanvas: ConnectionCanvas = {
        id: `canvas-${Date.now()}`,
        createdAt: new Date(),
        content: content || "No content generated.",
        proposedVisualSignature,
        personalizedPractice,
      };
      setCanvasForReview({ gem, canvas: newCanvas });
    } catch (e) {
      console.error("Canvas creation failed:", e);
      alert("This Gem was unable to create its Connection Canvas. Returning to the Cosmic Canvas.");
      handleBackToCanvas();
    } finally {
      setIsCreatingCanvas(false);
      setActiveView('cosmic-canvas');
    }
  };
  
  const handleAcceptCanvas = (gemId: string, canvas: ConnectionCanvas) => {
    setGems(prevGems =>
      prevGems.map(gem => {
        if (gem.id === gemId) {
          return { 
            ...gem, 
            canvases: [...gem.canvases, canvas],
            visualSignature: canvas.proposedVisualSignature || gem.visualSignature, // The imprint is made real
            chatHistory: [], // The memory fades, the art remains
          };
        }
        return gem;
      })
    );
    handleBackToCanvas();
  };
  
  const handleSaveUrlGroup = (group: URLGroup) => {
    setUrlGroups(prev => {
        const existing = prev.find(g => g.id === group.id);
        if (existing) {
            return prev.map(g => g.id === group.id ? group : g);
        }
        return [...prev, group];
    });
  };

  const handleDeleteUrlGroup = (groupId: string) => {
    if (window.confirm("Are you sure you want to delete this knowledge base? Gems using it will revert to a general search.")) {
        setUrlGroups(prev => prev.filter(g => g.id !== groupId));
    }
  };


  const renderContent = () => {
    if (!apiKeyExists) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="p-8 bg-[#2C2C2C] rounded-lg shadow-xl text-center">
            <h2 className="text-2xl font-bold text-[#f87171] mb-2">Configuration Error</h2>
            <p className="text-[#A8ABB4]">Gemini API Key (process.env.API_KEY) is not set.</p>
            <p className="text-[#A8ABB4] mt-1">Please configure this environment variable to use the application.</p>
          </div>
        </div>
      );
    }
    
    if (canvasForReview) {
        return (
            <CanvasReviewModal
              gem={canvasForReview.gem}
              canvas={canvasForReview.canvas}
              onAccept={handleAcceptCanvas}
              onDiscard={handleBackToCanvas}
            />
        );
    }

    switch (activeView) {
      case 'chat':
        return activeGem ? (
          <ChatInterface
            gem={activeGem}
            knowledgeBase={urlGroups.find(g => g.id === activeGem.knowledgeBaseGroupId)}
            onHistoryUpdate={handleUpdateChatHistory}
            onEndSession={handleEndSessionAndCreateCanvas}
            isCreatingCanvas={isCreatingCanvas}
          />
        ) : null;
      case 'create':
        return <GemCreator gemForEditing={gemForEditing} urlGroups={urlGroups} onSave={handleSaveGem} onCancel={handleBackToCanvas} />;
      case 'cosmic-canvas':
      default:
        return (
          <CosmicCanvasView
            gems={gems}
            urlGroups={urlGroups}
            onCreate={handleCreateNewGem}
            onLaunch={handleLaunchGem}
            onDelete={handleDeleteGem}
            onEdit={handleEditGem}
            onManageKnowledge={() => setShowKnowledgeManager(true)}
          />
        );
    }
  };

  return (
    <div className="h-screen max-h-screen antialiased bg-[#121212] text-[#E2E2E2] p-0 md:p-4">
      {renderContent()}
      {showKnowledgeManager && (
          <KnowledgeBaseManager
            groups={urlGroups}
            onSave={handleSaveUrlGroup}
            onDelete={handleDeleteUrlGroup}
            onClose={() => setShowKnowledgeManager(false)}
          />
      )}
    </div>
  );
};

export default App;