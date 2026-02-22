'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/app-context';
import { X, Plus } from 'lucide-react';

interface SaveToBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  pinId: string;
}

export default function SaveToBoardModal({ isOpen, onClose, pinId }: SaveToBoardModalProps) {
  const { currentUser, boards, savePinToBoard, createBoard } = useApp();
  const [creating, setCreating] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');
  const [saved, setSaved] = useState(false);

  if (!isOpen || !currentUser) return null;

  const userBoards = boards.filter(b => b.ownerId === currentUser.id);

  const handleSave = (boardId: string) => {
    savePinToBoard(pinId, boardId);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1000);
  };

  const handleCreateAndSave = async () => {
    if (!newBoardName.trim()) return;
    const board = await createBoard({
      name: newBoardName.trim(),
      description: '',
      coverImage: '',
      ownerId: currentUser.id,
      isPrivate: false,
      category: 'All',
    });
    handleSave(board.id);
    setNewBoardName('');
    setCreating(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-card border border-border/50 rounded-2xl p-6 w-full max-w-sm mx-4 animate-slideUp" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">{saved ? 'Saved!' : 'Save to Board'}</h3>
          <button onClick={onClose} aria-label="Close" className="text-foreground/60 hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        {saved ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">✓</div>
            <p className="text-accent font-semibold">Pin saved successfully!</p>
          </div>
        ) : (
          <>
            <div className="space-y-2 max-h-60 overflow-y-auto mb-4">
              {userBoards.map(board => (
                <button
                  key={board.id}
                  onClick={() => handleSave(board.id)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-background/50 smooth-transition text-left"
                >
                  <div className="w-10 h-10 rounded-lg bg-card/50 border border-border/30 overflow-hidden flex-shrink-0">
                    {board.coverImage && (
                      <img src={board.coverImage} alt="" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{board.name}</p>
                    <p className="text-xs text-foreground/60">{board.pins.length} pins</p>
                  </div>
                </button>
              ))}
            </div>

            {creating ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newBoardName}
                  onChange={e => setNewBoardName(e.target.value)}
                  placeholder="Board name"
                  autoFocus
                  onKeyDown={e => e.key === 'Enter' && handleCreateAndSave()}
                  className="flex-1 bg-background/50 border border-border/30 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-accent/50"
                />
                <button onClick={handleCreateAndSave} className="luxury-button text-sm px-4">
                  Save
                </button>
              </div>
            ) : (
              <button
                onClick={() => setCreating(true)}
                className="w-full flex items-center gap-2 p-3 rounded-lg border border-dashed border-border/50 hover:border-accent/50 text-foreground/60 hover:text-accent smooth-transition"
              >
                <Plus className="w-5 h-5" />
                <span className="text-sm font-medium">Create New Board</span>
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
