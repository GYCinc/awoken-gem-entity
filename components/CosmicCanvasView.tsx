/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { Gem, URLGroup } from '../types';
import { Plus, Trash2, Library, Edit, BookOpenCheck } from 'lucide-react';
import { marked } from 'marked';


interface CosmicCanvasViewProps {
  gems: Gem[];
  urlGroups: URLGroup[];
  onCreate: () => void;
  onLaunch: (gemId: string) => void;
  onDelete: (gemId: string) => void;
  onEdit: (gemId: string) => void;
  onManageKnowledge: () => void;
}

const CosmicCanvasView: React.FC<CosmicCanvasViewProps> = ({ gems, urlGroups, onCreate, onLaunch, onDelete, onEdit, onManageKnowledge }) => {
    const allCanvases = gems
    .flatMap(gem => 
      gem.canvases.map(canvas => ({ ...canvas, gemName: gem.name, studentName: gem.studentName, gemSignature: gem.visualSignature }))
    )
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return (
    <div className="flex h-full bg-[#1E1E1E] rounded-xl shadow-md border border-[rgba(255,255,255,0.05)]">
      {/* Sidebar for Gem Management */}
      <div className="w-1/3 max-w-sm flex-shrink-0 border-r border-[rgba(255,255,255,0.05)] flex flex-col">
        <div className="p-4 border-b border-[rgba(255,255,255,0.05)]">
            <h1 className="text-xl font-semibold text-[#E2E2E2]">Awoken Shell</h1>
            <p className="text-xs text-[#A8ABB4] mt-1">The Seer's Domain</p>
        </div>
        <div className="p-4 flex gap-2">
            <button
                onClick={onCreate}
                className="flex-grow flex items-center justify-center gap-2 px-3 py-1.5 bg-white/[.12] hover:bg-white/20 text-white rounded-lg transition-colors text-sm"
            >
                <Plus size={16} />
                Birth New Gem
            </button>
            <button
                onClick={onManageKnowledge}
                className="flex-shrink-0 flex items-center justify-center gap-2 px-3 py-1.5 bg-white/[.12] hover:bg-white/20 text-white rounded-lg transition-colors text-sm"
                title="Manage Knowledge"
            >
                <Library size={16} />
            </button>
        </div>
        <div className="flex-grow p-4 pt-0 overflow-y-auto chat-container space-y-3">
            {gems.length > 0 ? (
                gems.sort((a,b) => b.createdAt.getTime() - a.createdAt.getTime()).map(gem => {
                    const knowledgeBase = urlGroups.find(g => g.id === gem.knowledgeBaseGroupId);
                    return (
                        <div key={gem.id} className="bg-[#2C2C2C] rounded-lg border border-[rgba(255,255,255,0.05)] p-3">
                            <h3 
                                className="font-bold text-lg text-white truncate" 
                                style={{ fontFamily: `var(--font-${gem.visualSignature.toLowerCase().replace(/\s/g, '-')})` }}
                                title={gem.name}
                            >
                                {gem.name}
                            </h3>
                            <p className="text-xs text-[#A8ABB4] mb-2">For: {gem.studentName}</p>
                            {knowledgeBase && <p className="text-[10px] text-cyan-300 bg-cyan-900/50 px-1.5 py-0.5 rounded-full inline-block">KB: {knowledgeBase.name}</p>}
                            <div className="grid grid-cols-3 items-center justify-between gap-2 mt-3">
                                <button
                                    onClick={() => onDelete(gem.id)}
                                    className="h-7 w-7 p-1 text-[#A8ABB4] hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-colors flex items-center justify-center flex-shrink-0"
                                    aria-label={`Delete ${gem.name}`}
                                >
                                    <Trash2 size={14} />
                                </button>
                                 <button
                                    onClick={() => onEdit(gem.id)}
                                    className="h-7 w-7 p-1 text-[#A8ABB4] hover:bg-yellow-500/10 hover:text-yellow-400 rounded-lg transition-colors flex items-center justify-center flex-shrink-0"
                                    aria-label={`Edit ${gem.name}`}
                                >
                                    <Edit size={14} />
                                </button>
                                <button
                                    onClick={() => onLaunch(gem.id)}
                                    className="col-span-1 w-full px-3 py-1 bg-[#79B8FF]/10 hover:bg-[#79B8FF]/20 text-[#79B8FF] rounded-lg transition-colors text-sm font-semibold"
                                >
                                    Launch
                                </button>
                            </div>
                        </div>
                    );
                })
            ) : <p className="text-center text-xs text-[#777777] pt-4">No Gems have been born.</p>}
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-grow p-4 overflow-y-auto chat-container">
        {allCanvases.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-[#777777]">
            <Library size={48} className="mb-4" />
            <h2 className="text-lg font-semibold text-[#A8ABB4]">The Cosmic Canvas is Blank</h2>
            <p className="max-w-xs mt-1 text-sm">Launch a session with a Gem and create a Connection Canvas to begin painting the universe with their experiences.</p>
          </div>
        ) : (
          <div className="w-full" style={{ columnCount: 3, columnGap: '1rem' }}>
             {allCanvases.map(canvas => (
              <div key={canvas.id} className="bg-[#2C2C2C] rounded-lg border border-[rgba(255,255,255,0.05)] p-4 mb-4 inline-block w-full break-inside-avoid">
                <div className="border-b border-[rgba(255,255,255,0.05)] pb-2 mb-3">
                   <h2 
                     className="font-bold text-lg text-white truncate"
                     style={{ fontFamily: `var(--font-${canvas.gemSignature.toLowerCase().replace(/\s/g, '-')})` }}
                   >
                     From: {canvas.gemName}
                   </h2>
                   <p className="text-xs text-[#A8ABB4]">For: {canvas.studentName} on {canvas.createdAt.toLocaleDateString()}</p>
                </div>
                <div 
                  className="prose prose-sm prose-invert w-full min-w-0"
                  dangerouslySetInnerHTML={{ __html: marked.parse(canvas.content) as string }} 
                />
                {canvas.personalizedPractice && (
                    <div className="mt-3 pt-3 border-t border-[rgba(255,255,255,0.05)]">
                        <h4 className="font-semibold text-sm text-green-300 mb-2 flex items-center gap-2"><BookOpenCheck size={14}/> Personalized Practice</h4>
                         <div 
                            className="prose prose-sm prose-invert w-full min-w-0"
                            dangerouslySetInnerHTML={{ __html: marked.parse(canvas.personalizedPractice) as string }} 
                        />
                    </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CosmicCanvasView;