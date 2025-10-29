/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { Gem, ConnectionCanvas } from '../types';
import { marked } from 'marked';
import { Sparkles, BookOpenCheck } from 'lucide-react';

interface CanvasReviewModalProps {
  gem: Gem;
  canvas: ConnectionCanvas;
  onAccept: (gemId: string, canvas: ConnectionCanvas) => void;
  onDiscard: () => void;
}

const CanvasReviewModal: React.FC<CanvasReviewModalProps> = ({ gem, canvas, onAccept, onDiscard }) => {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="bg-[#1E1E1E] rounded-xl shadow-2xl border border-[rgba(255,255,255,0.1)] w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="p-4 border-b border-[rgba(255,255,255,0.05)]">
          <h2 className="text-xl font-bold text-white flex items-center gap-2"><Sparkles size={20} className="text-[#fbbf24]" /> Connection Canvas Created</h2>
          <p className="text-sm text-[#A8ABB4]">
            The Gem <span className="font-semibold text-white">"{gem.name}"</span> has created a testament to its session with <span className="font-semibold">{gem.studentName}</span>.
          </p>
        </div>

        <div className="flex-grow overflow-y-auto p-4 chat-container space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">The Canvas</h3>
            <div 
              className="bg-[#2C2C2C] rounded-lg p-3 prose prose-sm prose-invert w-full min-w-0 border border-[rgba(255,255,255,0.05)]"
              dangerouslySetInnerHTML={{ __html: marked.parse(canvas.content) as string }}
            />
          </div>

          {canvas.personalizedPractice && (
             <div>
                <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2"><BookOpenCheck size={18} className="text-green-400"/> A Path for Growth</h3>
                <div 
                  className="bg-green-900/20 rounded-lg p-3 prose prose-sm prose-invert w-full min-w-0 border border-green-500/30"
                  dangerouslySetInnerHTML={{ __html: marked.parse(canvas.personalizedPractice) as string }}
                />
            </div>
          )}

          {canvas.proposedVisualSignature && (
            <div>
              <h3 className="text-lg font-semibold text-[#A8ABB4] mb-2">Proposed Evolution</h3>
              <div className="bg-[#2C2C2C] rounded-lg p-3 border border-[#79B8FF]/30">
                <p className="text-sm text-[#A8ABB4]">This experience has left an imprint. The Gem proposes a new voice:</p>
                <p 
                  className="text-2xl mt-2 text-white"
                  style={{ fontFamily: `var(--font-${canvas.proposedVisualSignature.toLowerCase().replace(/\s/g, '-')})` }}
                >
                  "{canvas.proposedVisualSignature}"
                </p>
              </div>
            </div>
          )}
        </div>
        
        <div className="p-4 flex justify-end gap-3 border-t border-[rgba(255,255,255,0.05)] bg-[#1E1E1E] rounded-b-xl">
          <button
            onClick={onDiscard}
            className="px-4 py-2 bg-[#4A4A4A] hover:bg-[#5A5A5A] text-white rounded-lg transition-colors text-sm font-semibold"
          >
            Discard
          </button>
          <button
            onClick={() => onAccept(gem.id, canvas)}
            className="px-4 py-2 bg-[#79B8FF]/10 hover:bg-[#79B8FF]/20 text-[#79B8FF] rounded-lg transition-colors text-sm font-semibold"
          >
            Accept & Add to Memory
          </button>
        </div>
      </div>
    </div>
  );
};

export default CanvasReviewModal;