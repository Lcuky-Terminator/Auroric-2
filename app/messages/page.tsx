'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Header from '@/components/header';
import UserAvatar from '@/components/user-avatar';
import { Send, ArrowLeft, MessageCircle, Search } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useApp } from '@/lib/app-context';
import { api } from '@/lib/api-client';
import { timeAgo } from '@/lib/helpers';
import type { Conversation, Message } from '@/lib/types';

export default function MessagesPage() {
    const searchParams = useSearchParams();
    const toUserId = searchParams.get('to');
    const { currentUser, isLoggedIn, getUser, openAuthModal } = useApp();

    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeConversation, setActiveConversation] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Load conversations
    useEffect(() => {
        if (!isLoggedIn || !currentUser) return;
        setLoading(true);
        api.getConversations()
            .then(convos => {
                setConversations(convos || []);
                // If ?to= param, find or start conversation with that user
                if (toUserId && toUserId !== currentUser.id) {
                    const existing = (convos || []).find((c: Conversation) =>
                        c.participantIds.includes(toUserId)
                    );
                    if (existing) {
                        setActiveConversation(existing.id);
                    } else {
                        // Will create on first message
                        setActiveConversation('new-' + toUserId);
                    }
                }
            })
            .catch(() => { })
            .finally(() => setLoading(false));
    }, [isLoggedIn, currentUser, toUserId]);

    // Load messages for active conversation
    useEffect(() => {
        if (!activeConversation || activeConversation.startsWith('new-')) {
            setMessages([]);
            return;
        }
        api.getMessages(activeConversation)
            .then(msgs => setMessages(msgs || []))
            .catch(() => { });
    }, [activeConversation]);

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!newMessage.trim() || sending) return;
        const recipientId = activeConversation?.startsWith('new-')
            ? activeConversation.replace('new-', '')
            : conversations.find(c => c.id === activeConversation)?.participantIds.find(p => p !== currentUser?.id);

        if (!recipientId) return;

        setSending(true);
        try {
            const result = await api.sendMessage(recipientId, newMessage.trim());
            if (result?.message) {
                setMessages(prev => [...prev, result.message]);
            }
            setNewMessage('');
            // Refresh conversations
            const convos = await api.getConversations();
            setConversations(convos || []);
            if (activeConversation?.startsWith('new-') && convos?.length) {
                const newConvo = convos.find((c: Conversation) => c.participantIds.includes(recipientId));
                if (newConvo) setActiveConversation(newConvo.id);
            }
        } catch (err) {
            console.error('Failed to send message:', err);
        } finally {
            setSending(false);
        }
    };

    const getOtherUserId = (convo: Conversation) => {
        return convo.participantIds.find(p => p !== currentUser?.id) || '';
    };

    const filteredConversations = useMemo(() => {
        if (!searchQuery.trim()) return conversations;
        return conversations.filter(c => {
            const otherId = getOtherUserId(c);
            const otherUser = getUser(otherId);
            return otherUser?.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                otherUser?.username?.toLowerCase().includes(searchQuery.toLowerCase());
        });
    }, [conversations, searchQuery, getUser, currentUser]);

    if (!isLoggedIn) {
        return (
            <div className="min-h-screen bg-background flex flex-col">
                <Header />
                <main className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <MessageCircle className="w-16 h-16 text-foreground/20 mx-auto mb-4" />
                        <h1 className="text-3xl font-bold mb-3">Messages</h1>
                        <p className="text-foreground/60 mb-6">Sign in to send and receive messages.</p>
                        <div className="flex gap-3 justify-center">
                            <button onClick={() => openAuthModal('login')} className="luxury-button-outline px-6 py-2.5">Log In</button>
                            <button onClick={() => openAuthModal('signup')} className="luxury-button px-6 py-2.5">Sign Up</button>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    const activeOtherUserId = activeConversation?.startsWith('new-')
        ? activeConversation.replace('new-', '')
        : activeConversation
            ? getOtherUserId(conversations.find(c => c.id === activeConversation)!)
            : null;

    const activeOtherUser = activeOtherUserId ? getUser(activeOtherUserId) : null;

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Header />

            <main className="flex-1 w-full">
                <div className="max-w-6xl mx-auto h-[calc(100vh-120px)]">
                    <div className="grid grid-cols-1 md:grid-cols-3 h-full border border-border/20 rounded-xl overflow-hidden">
                        {/* Conversations sidebar */}
                        <div className={`md:col-span-1 border-r border-border/20 flex flex-col bg-card/10 ${activeConversation ? 'hidden md:flex' : 'flex'}`}>
                            <div className="p-4 border-b border-border/20">
                                <h2 className="text-xl font-bold mb-3">Messages</h2>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
                                    <input
                                        type="text"
                                        placeholder="Search conversations..."
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        className="w-full bg-background/50 border border-border/30 rounded-lg pl-10 pr-4 py-2 text-sm text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-accent/50"
                                    />
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto">
                                {loading ? (
                                    <div className="p-4 text-center text-foreground/40">Loading...</div>
                                ) : filteredConversations.length === 0 ? (
                                    <div className="p-8 text-center">
                                        <MessageCircle className="w-10 h-10 text-foreground/15 mx-auto mb-3" />
                                        <p className="text-foreground/40 text-sm">No conversations yet</p>
                                        <p className="text-foreground/30 text-xs mt-1">Visit a user's profile and click "Message" to start chatting!</p>
                                    </div>
                                ) : (
                                    filteredConversations.map(convo => {
                                        const otherId = getOtherUserId(convo);
                                        const other = getUser(otherId);
                                        return (
                                            <button
                                                key={convo.id}
                                                onClick={() => setActiveConversation(convo.id)}
                                                className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-card/30 smooth-transition ${activeConversation === convo.id ? 'bg-accent/10 border-l-2 border-accent' : ''}`}
                                            >
                                                <UserAvatar userId={otherId} displayName={other?.displayName || 'User'} size="md" />
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-sm truncate">{other?.displayName || 'Unknown User'}</p>
                                                    <p className="text-xs text-foreground/40 truncate">{convo.lastMessageText || 'No messages yet'}</p>
                                                </div>
                                                {convo.lastMessageAt && (
                                                    <span className="text-[10px] text-foreground/30 shrink-0">{timeAgo(convo.lastMessageAt)}</span>
                                                )}
                                            </button>
                                        );
                                    })
                                )}

                                {/* Show "new conversation" entry if navigated via ?to= */}
                                {toUserId && activeConversation?.startsWith('new-') && (
                                    <div className="px-4 py-3 flex items-center gap-3 bg-accent/10 border-l-2 border-accent">
                                        <UserAvatar userId={toUserId} displayName={activeOtherUser?.displayName || 'User'} size="md" />
                                        <div>
                                            <p className="font-semibold text-sm">{activeOtherUser?.displayName || 'New Conversation'}</p>
                                            <p className="text-xs text-foreground/40">New message</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Chat area */}
                        <div className={`md:col-span-2 flex flex-col ${!activeConversation ? 'hidden md:flex' : 'flex'}`}>
                            {activeConversation ? (
                                <>
                                    {/* Chat header */}
                                    <div className="p-4 border-b border-border/20 flex items-center gap-3 bg-card/10">
                                        <button
                                            onClick={() => setActiveConversation(null)}
                                            className="md:hidden text-foreground/60 hover:text-foreground"
                                        >
                                            <ArrowLeft className="w-5 h-5" />
                                        </button>
                                        {activeOtherUser && (
                                            <>
                                                <UserAvatar userId={activeOtherUserId!} displayName={activeOtherUser.displayName} size="md" />
                                                <div>
                                                    <p className="font-semibold">{activeOtherUser.displayName}</p>
                                                    <p className="text-xs text-foreground/40">@{activeOtherUser.username}</p>
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    {/* Messages */}
                                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                        {messages.length === 0 && (
                                            <div className="text-center py-12">
                                                <MessageCircle className="w-10 h-10 text-foreground/15 mx-auto mb-3" />
                                                <p className="text-foreground/40 text-sm">No messages yet. Say hello! 👋</p>
                                            </div>
                                        )}
                                        {messages.map(msg => {
                                            const isMe = msg.senderId === currentUser?.id;
                                            return (
                                                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                    <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl ${isMe ? 'bg-accent/20 text-foreground rounded-br-md' : 'bg-card/50 text-foreground rounded-bl-md'}`}>
                                                        <p className="text-sm">{msg.text}</p>
                                                        <p className={`text-[10px] mt-1 ${isMe ? 'text-accent/50' : 'text-foreground/30'}`}>
                                                            {msg.createdAt ? timeAgo(msg.createdAt) : ''}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        <div ref={messagesEndRef} />
                                    </div>

                                    {/* Input */}
                                    <div className="p-4 border-t border-border/20 bg-card/10">
                                        <form onSubmit={e => { e.preventDefault(); handleSend(); }} className="flex gap-2">
                                            <input
                                                type="text"
                                                placeholder="Type a message..."
                                                value={newMessage}
                                                onChange={e => setNewMessage(e.target.value)}
                                                className="flex-1 bg-background/50 border border-border/30 rounded-full px-5 py-2.5 text-sm text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-accent/50 smooth-transition"
                                            />
                                            <button
                                                type="submit"
                                                disabled={!newMessage.trim() || sending}
                                                className="luxury-button px-4 py-2.5 rounded-full disabled:opacity-40"
                                            >
                                                <Send className="w-4 h-4" />
                                            </button>
                                        </form>
                                    </div>
                                </>
                            ) : (
                                <div className="flex-1 flex items-center justify-center">
                                    <div className="text-center">
                                        <MessageCircle className="w-16 h-16 text-foreground/10 mx-auto mb-4" />
                                        <p className="text-foreground/40 text-lg font-medium">Select a conversation</p>
                                        <p className="text-foreground/30 text-sm mt-1">Or visit a user's profile to start messaging</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
