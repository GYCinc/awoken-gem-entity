/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import { URLGroup } from '../types';
import { X, Plus, Save, Trash2, Library } from 'lucide-react';

interface KnowledgeBaseManagerProps {
    groups: URLGroup[];
    onSave: (group: URLGroup) => void;
    onDelete: (groupId: string) => void;
    onClose: () => void;
}

const KnowledgeBaseManager: React.FC<KnowledgeBaseManagerProps> = ({ groups, onSave, onDelete, onClose }) => {
    const [selectedGroup, setSelectedGroup] = useState<URLGroup | null>(null);
    const [groupName, setGroupName] = useState('');
    const [urls, setUrls] = useState('');

    useEffect(() => {
        if (selectedGroup) {
            setGroupName(selectedGroup.name);
            setUrls(selectedGroup.urls.join('\n'));
        } else {
            setGroupName('');
            setUrls('');
        }
    }, [selectedGroup]);

    const handleSelectGroup = (group: URLGroup) => {
        setSelectedGroup(group);
    };
    
    const handleNewGroup = () => {
        setSelectedGroup(null);
        setGroupName('');
        setUrls('');
    };

    const handleSave = () => {
        if (!groupName.trim()) {
            alert('Knowledge base name cannot be empty.');
            return;
        }
        const urlArray = urls.split('\n').map(u => u.trim()).filter(u => u);
        const groupToSave: URLGroup = {
            id: selectedGroup ? selectedGroup.id : `group-${Date.now()}`,
            name: groupName,
            urls: urlArray,
        };
        onSave(groupToSave);
        if (!selectedGroup) {
            setSelectedGroup(groupToSave);
        }
    };

    const handleDelete = () => {
        if (selectedGroup) {
            onDelete(selectedGroup.id);
            setSelectedGroup(null);
            setGroupName('');
            setUrls('');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
            <div className="bg-[#1E1E1E] rounded-xl shadow-2xl border border-[rgba(255,255,255,0.1)] w-full max-w-4xl h-[80vh] flex">
                {/* Sidebar */}
                <div className="w-1/3 flex-shrink-0 border-r border-[rgba(255,255,255,0.05)] flex flex-col">
                    <div className="p-4 flex items-center justify-between border-b border-[rgba(255,255,255,0.05)]">
                         <h2 className="text-lg font-bold text-white flex items-center gap-2"><Library size={20}/> Knowledge Bases</h2>
                         <button onClick={onClose} className="p-1.5 text-[#A8ABB4] hover:text-white rounded-md hover:bg-white/10 transition-colors">
                             <X size={20} />
                         </button>
                    </div>
                    <div className="p-4">
                        <button onClick={handleNewGroup} className="w-full flex items-center justify-center gap-2 px-3 py-1.5 bg-white/[.12] hover:bg-white/20 text-white rounded-lg transition-colors text-sm">
                             <Plus size={16} /> New Knowledge Base
                        </button>
                    </div>
                    <div className="flex-grow p-4 pt-0 overflow-y-auto chat-container space-y-2">
                        {groups.map(group => (
                            <button 
                                key={group.id} 
                                onClick={() => handleSelectGroup(group)}
                                className={`w-full text-left p-2 rounded-md transition-colors text-sm ${selectedGroup?.id === group.id ? 'bg-[#79B8FF]/10 text-[#79B8FF]' : 'hover:bg-white/5'}`}
                            >
                                {group.name}
                                <span className="block text-xs opacity-60">{group.urls.length} URLs</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-grow flex flex-col p-6">
                    <h3 className="text-xl font-semibold text-white mb-4">{selectedGroup ? `Editing "${selectedGroup.name}"` : 'Creating New Knowledge Base'}</h3>
                    <div className="space-y-4 flex-grow flex flex-col">
                        <div>
                            <label htmlFor="group-name" className="block text-sm font-medium text-[#A8ABB4] mb-1">Name</label>
                            <input
                                id="group-name"
                                type="text"
                                value={groupName}
                                onChange={(e) => setGroupName(e.target.value)}
                                placeholder="e.g., React Docs, Project Files"
                                className="w-full py-2 px-3 border border-[rgba(255,255,255,0.1)] bg-[#2C2C2C] text-[#E2E2E2] rounded-md focus:ring-1 focus:ring-white/20 focus:border-white/20 text-sm"
                            />
                        </div>
                        <div className="flex-grow flex flex-col">
                            <label htmlFor="group-urls" className="block text-sm font-medium text-[#A8ABB4] mb-1">URLs (one per line)</label>
                            <textarea
                                id="group-urls"
                                value={urls}
                                onChange={(e) => setUrls(e.target.value)}
                                placeholder="https://example.com/doc1\nhttps://example.com/doc2"
                                className="w-full flex-grow py-2 px-3 border border-[rgba(255,255,255,0.1)] bg-[#2C2C2C] text-[#E2E2E2] rounded-md focus:ring-1 focus:ring-white/20 focus:border-white/20 text-sm font-mono resize-none"
                            />
                        </div>
                    </div>
                     <div className="mt-6 flex justify-end gap-3 border-t border-[rgba(255,255,255,0.05)] pt-4">
                        {selectedGroup && (
                            <button onClick={handleDelete} className="px-4 py-2 bg-red-800/50 hover:bg-red-800/70 text-red-300 rounded-lg transition-colors text-sm font-semibold flex items-center gap-2 mr-auto">
                                <Trash2 size={14}/> Delete
                            </button>
                        )}
                        <button onClick={onClose} className="px-4 py-2 bg-[#4A4A4A] hover:bg-[#5A5A5A] text-white rounded-lg transition-colors text-sm font-semibold">
                            Close
                        </button>
                        <button onClick={handleSave} className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm font-semibold flex items-center gap-2">
                            <Save size={14}/> Save Changes
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default KnowledgeBaseManager;
