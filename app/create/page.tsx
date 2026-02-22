'use client';

import React, { useState, useRef } from 'react';
import Header from '@/components/header';
import Footer from '@/components/footer';
import { Upload, Image as ImageIcon, Link as LinkIcon, X, CheckCircle } from 'lucide-react';
import { useApp } from '@/lib/app-context';
import { useRouter } from 'next/navigation';
import { CATEGORIES } from '@/lib/types';

export default function CreatePinPage() {
  const { currentUser, isLoggedIn, boards, createPin, createBoard, openAuthModal } = useApp();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<'source' | 'details' | 'success'>('source');
  const [sourceType, setSourceType] = useState<'upload' | 'url' | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [createdPinId, setCreatedPinId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    imageUrl: '',
    board: '',
    newBoardName: '',
    tags: '',
    category: 'All' as string,
    isPrivate: false,
  });

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-6">
              <Upload className="w-8 h-8 text-accent" />
            </div>
            <h1 className="text-3xl font-bold mb-3">Sign in to Create</h1>
            <p className="text-foreground/60 mb-8 max-w-md mx-auto">Create an account or log in to start uploading your pins and sharing your inspiration.</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => openAuthModal('login')} className="luxury-button-outline px-6 py-2.5">Log In</button>
              <button onClick={() => openAuthModal('signup')} className="luxury-button px-6 py-2.5">Sign Up</button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const userBoards = boards.filter(b => b.ownerId === currentUser!.id);

  const handleSourceSelect = (type: 'upload' | 'url') => {
    setSourceType(type);
    if (type === 'upload') {
      fileInputRef.current?.click();
    } else {
      setStep('details');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setFormData(prev => ({ ...prev, imageUrl: '__file__' }));
    setStep('details');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || (!formData.imageUrl && !imageFile)) return;
    setSubmitting(true);

    try {
      // Upload file if needed
      let imageUrl = formData.imageUrl;
      if (imageFile) {
        const { api } = await import('@/lib/api-client');
        const { url } = await api.uploadFile(imageFile);
        imageUrl = url;
      }

      let boardId = formData.board;
      if (formData.newBoardName && !boardId) {
        const newBoard = await createBoard({
          name: formData.newBoardName,
          description: '',
          coverImage: imageUrl,
          ownerId: currentUser!.id,
          isPrivate: formData.isPrivate,
          category: formData.category,
        });
        boardId = newBoard.id;
      }

      const tags = formData.tags.split(',').map(t => t.trim()).filter(Boolean);
      const newPin = await createPin({
        title: formData.title,
        description: formData.description,
        imageUrl,
        authorId: currentUser!.id,
        boardId: boardId || undefined,
        tags,
        category: formData.category,
        isPrivate: formData.isPrivate,
      });

      setCreatedPinId(newPin.id);
      setStep('success');
    } catch (err) {
      console.error('Failed to create pin:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleFileChange}
        aria-label="Upload image"
      />

      <main className="flex-1 w-full py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          {step === 'source' && (
            <div className="animate-slideUp">
              <h1 className="text-4xl font-bold mb-8 text-center">Create a New Pin</h1>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div
                  onClick={() => handleSourceSelect('upload')}
                  className="pin-card p-8 cursor-pointer group flex flex-col items-center justify-center min-h-80 hover:border-accent/50"
                >
                  <div className="mb-4 p-4 rounded-full bg-accent/10 group-hover:bg-accent/20 smooth-transition">
                    <Upload className="w-8 h-8 text-accent" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Upload Image</h3>
                  <p className="text-foreground/60 text-center text-sm">Upload from your device</p>
                </div>

                <div
                  onClick={() => handleSourceSelect('url')}
                  className="pin-card p-8 cursor-pointer group flex flex-col items-center justify-center min-h-80 hover:border-accent/50"
                >
                  <div className="mb-4 p-4 rounded-full bg-accent/10 group-hover:bg-accent/20 smooth-transition">
                    <LinkIcon className="w-8 h-8 text-accent" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Use URL</h3>
                  <p className="text-foreground/60 text-center text-sm">Provide an image link</p>
                </div>
              </div>
            </div>
          )}

          {step === 'details' && (
            <form onSubmit={handleSubmit} className="animate-slideUp">
              <div className="flex items-center gap-4 mb-8">
                <button type="button" onClick={() => { setStep('source'); setPreviewUrl(''); }} className="text-foreground/60 hover:text-foreground smooth-transition">← Back</button>
                <h1 className="text-3xl font-bold">Pin Details</h1>
              </div>

              {(previewUrl || formData.imageUrl) && (
                <div className="mb-8 rounded-2xl overflow-hidden bg-card/30 border border-border/30">
                  <img src={previewUrl || formData.imageUrl} alt="Preview" className="w-full max-h-80 object-cover" />
                </div>
              )}

              {sourceType === 'upload' && !previewUrl && (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="mb-8 border-2 border-dashed border-border/50 rounded-2xl p-8 text-center hover:border-accent/50 smooth-transition cursor-pointer bg-card/20"
                >
                  <ImageIcon className="w-12 h-12 text-foreground/40 mx-auto mb-4" />
                  <p className="text-foreground/60 mb-2">Click to select a file</p>
                </div>
              )}

              {sourceType === 'url' && (
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-foreground mb-2">Image URL</label>
                  <input
                    type="url"
                    name="imageUrl"
                    placeholder="https://example.com/image.jpg"
                    value={formData.imageUrl}
                    onChange={(e) => {
                      handleInputChange(e);
                      setPreviewUrl(e.target.value);
                    }}
                    className="w-full bg-card/50 border border-border/30 rounded-lg px-4 py-2 text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 smooth-transition"
                  />
                </div>
              )}

              <div className="mb-6">
                <label className="block text-sm font-semibold text-foreground mb-2">Pin Title *</label>
                <input type="text" name="title" placeholder="Give your pin a title" value={formData.title} onChange={handleInputChange} required
                  className="w-full bg-card/50 border border-border/30 rounded-lg px-4 py-2 text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 smooth-transition" />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-foreground mb-2">Description</label>
                <textarea name="description" placeholder="Tell everyone what your pin is about..." value={formData.description} onChange={handleInputChange} rows={3}
                  className="w-full bg-card/50 border border-border/30 rounded-lg px-4 py-2 text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 smooth-transition resize-none" />
              </div>

              <div className="mb-6">
                <label htmlFor="create-category" className="block text-sm font-semibold text-foreground mb-2">Category</label>
                <select id="create-category" name="category" value={formData.category} onChange={handleInputChange}
                  className="w-full bg-card/50 border border-border/30 rounded-lg px-4 py-2 text-foreground focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 smooth-transition">
                  {CATEGORIES.filter(c => c !== 'All').map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="mb-6">
                <label htmlFor="create-board" className="block text-sm font-semibold text-foreground mb-2">Save to Board</label>
                <select id="create-board" name="board" value={formData.board} onChange={handleInputChange}
                  className="w-full bg-card/50 border border-border/30 rounded-lg px-4 py-2 text-foreground focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 smooth-transition">
                  <option value="">None</option>
                  {userBoards.map(board => (
                    <option key={board.id} value={board.id}>{board.name}</option>
                  ))}
                </select>
                {!formData.board && (
                  <input type="text" name="newBoardName" placeholder="Or create a new board..." value={formData.newBoardName} onChange={handleInputChange}
                    className="w-full mt-2 bg-card/50 border border-border/30 rounded-lg px-4 py-2 text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 smooth-transition" />
                )}
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-foreground mb-2">Tags</label>
                <input type="text" name="tags" placeholder="design, inspiration, luxury (comma-separated)" value={formData.tags} onChange={handleInputChange}
                  className="w-full bg-card/50 border border-border/30 rounded-lg px-4 py-2 text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 smooth-transition" />
              </div>

              <div className="mb-8 flex items-center gap-3">
                <input type="checkbox" name="isPrivate" id="private" checked={formData.isPrivate} onChange={handleInputChange} className="w-4 h-4 rounded accent cursor-pointer" />
                <label htmlFor="private" className="text-sm text-foreground/70 cursor-pointer">Keep this pin private</label>
              </div>

              <button type="submit" className="luxury-button w-full" disabled={submitting || !formData.title || (!previewUrl && !formData.imageUrl)}>
                {submitting ? 'Publishing...' : 'Publish Pin'}
              </button>
            </form>
          )}

          {step === 'success' && (
            <div className="animate-slideUp flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-6 p-4 rounded-full bg-accent/20">
                <CheckCircle className="w-16 h-16 text-accent" />
              </div>
              <h1 className="text-4xl font-bold mb-3">Pin Created!</h1>
              <p className="text-xl text-foreground/70 mb-8 max-w-md">Your pin is now live on Auroric.</p>
              <div className="flex gap-4">
                <button onClick={() => router.push(`/pin/${createdPinId}`)} className="luxury-button">View Pin</button>
                <button onClick={() => { setStep('source'); setSourceType(null); setPreviewUrl(''); setImageFile(null); setFormData({ title: '', description: '', imageUrl: '', board: '', newBoardName: '', tags: '', category: 'All', isPrivate: false }); }}
                  className="luxury-button-outline flex items-center gap-2"><Upload className="w-5 h-5" /> Create Another</button>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
