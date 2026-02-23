'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/header';
import Footer from '@/components/footer';
import ChatStorageBar from '@/components/chat-storage-bar';
import VerifiedBadge from '@/components/verified-badge';
import { Save, Bell, Lock, Palette, LogOut, Check, Shield, User, Trash2, KeyRound, AlertTriangle, Globe } from 'lucide-react';
import { useApp } from '@/lib/app-context';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';

export default function SettingsPage() {
  const { currentUser, isLoggedIn, updateProfile, logout, openAuthModal } = useApp();
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<'account' | 'profile' | 'privacy' | 'notifications' | 'appearance' | 'storage' | 'security'>('account');
  const [saved, setSaved] = useState(false);

  // Account fields
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [website, setWebsite] = useState('');

  // Expanded Profile fields
  const [gender, setGender] = useState('');
  const [dob, setDob] = useState('');
  const [country, setCountry] = useState('');

  // Privacy fields
  const [privateProfile, setPrivateProfile] = useState(false);
  const [showActivity, setShowActivity] = useState(true);
  const [allowMessages, setAllowMessages] = useState(true);

  // Notification fields
  const [allowNotifications, setAllowNotifications] = useState(true);
  const [emailOnNewFollower, setEmailOnNewFollower] = useState(true);
  const [emailOnPinInteraction, setEmailOnPinInteraction] = useState(true);

  // Security fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error' | 'warning'; text: string } | null>(null);
  const [changingPassword, setChangingPassword] = useState(false);

  // Deletion
  const [deleteReason, setDeleteReason] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletionSubmitted, setDeletionSubmitted] = useState(false);

  useEffect(() => {
    if (currentUser) {
      const s = currentUser.settings || {} as any;
      setEmail(currentUser.email || '');
      setDisplayName(currentUser.displayName || '');
      setBio(currentUser.bio || '');
      setWebsite(currentUser.website || '');
      setGender(currentUser.gender || '');
      setDob(currentUser.dob || '');
      setCountry(currentUser.country || '');
      setPrivateProfile(s.privateProfile ?? false);
      setShowActivity(s.showActivity ?? true);
      setAllowMessages(s.allowMessages ?? true);
      setAllowNotifications(s.allowNotifications ?? true);
      setEmailOnNewFollower(s.emailOnNewFollower ?? true);
      setEmailOnPinInteraction(s.emailOnPinInteraction ?? true);
    }
  }, [currentUser]);

  if (!isLoggedIn || !currentUser) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-3">Sign in to access settings</h1>
            <p className="text-foreground/60 mb-6">You need to be logged in to manage your account settings.</p>
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

  const handleSaveAccount = async () => {
    await updateProfile({ email, displayName, bio, website });
    showSaved();
  };

  const handleSaveProfile = async () => {
    await updateProfile({ gender: gender || undefined, dob: dob || undefined, country: country || undefined });
    showSaved();
  };

  const handleSavePrivacy = async () => {
    const s = currentUser.settings || {} as any;
    await updateProfile({ settings: { ...s, privateProfile, showActivity, allowMessages } });
    showSaved();
  };

  const handleSaveNotifications = async () => {
    const s = currentUser.settings || {} as any;
    await updateProfile({ settings: { ...s, allowNotifications, emailOnNewFollower, emailOnPinInteraction } });
    showSaved();
  };

  const showSaved = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const handleChangePassword = async () => {
    setPasswordMessage(null);

    if (!currentPassword || !newPassword) {
      setPasswordMessage({ type: 'error', text: 'Please fill in all password fields.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    if (newPassword.length < 8) {
      setPasswordMessage({ type: 'error', text: 'New password must be at least 8 characters.' });
      return;
    }

    setChangingPassword(true);
    try {
      const result = await api.changePassword(currentPassword, newPassword);
      if (result.ok) {
        setPasswordMessage({
          type: 'success',
          text: `${result.message}${result.attemptsRemaining !== undefined ? ` (${result.attemptsRemaining} changes remaining before lockout)` : ''}`,
        });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordMessage({
          type: result.lockedUntil ? 'warning' : 'error',
          text: result.message || result.error || 'Failed to change password.',
        });
      }
    } catch (err: any) {
      setPasswordMessage({ type: 'error', text: err.message || 'Failed to change password.' });
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const result = await api.requestAccountDeletion(deleteReason);
      if (result.ok) {
        setDeletionSubmitted(true);
        setShowDeleteConfirm(false);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to submit deletion request.');
    }
  };

  const sidebarItems = [
    { id: 'account', label: 'Account', icon: '👤' },
    { id: 'profile', label: 'Profile Details', icon: '📋' },
    { id: 'privacy', label: 'Privacy & Safety', icon: '🔒' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'storage', label: 'Chat Storage', icon: '💾' },
    { id: 'security', label: 'Security', icon: '🛡️' },
    { id: 'appearance', label: 'Appearance', icon: '🎨' },
  ];

  const COUNTRIES = [
    '', 'United States', 'United Kingdom', 'Canada', 'Australia', 'India', 'Germany',
    'France', 'Japan', 'Brazil', 'South Korea', 'Netherlands', 'Sweden', 'Italy',
    'Spain', 'Mexico', 'Singapore', 'UAE', 'Other',
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 w-full py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <h1 className="text-4xl font-bold">Settings & Preferences</h1>
              {currentUser.isVerified && currentUser.verificationType && (
                <VerifiedBadge size="lg" type={currentUser.verificationType} />
              )}
            </div>
            {saved && (
              <div className="flex items-center gap-2 text-green-400 animate-slideUp">
                <Check className="w-5 h-5" /> Saved!
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <aside className="lg:col-span-1">
              <div className="space-y-2 sticky top-20">
                {sidebarItems.map(item => (
                  <button key={item.id} onClick={() => setActiveSection(item.id as any)}
                    className={`w-full text-left px-4 py-3 rounded-lg font-medium smooth-transition ${activeSection === item.id ? 'bg-accent/20 text-accent border border-accent/50' : 'text-foreground/70 hover:bg-card/50 hover:text-foreground'}`}>
                    <span className="mr-2">{item.icon}</span>{item.label}
                  </button>
                ))}
              </div>
            </aside>

            <div className="lg:col-span-3">
              {/* ── ACCOUNT ── */}
              {activeSection === 'account' && (
                <div className="pin-card p-8 animate-slideUp">
                  <h2 className="text-2xl font-bold mb-6">Account Settings</h2>
                  <div className="space-y-6 mb-8">
                    <div>
                      <label htmlFor="settings-email" className="block text-sm font-semibold text-foreground mb-2">Email Address</label>
                      <input type="email" id="settings-email" value={email} onChange={e => setEmail(e.target.value)}
                        className="w-full bg-background/50 border border-border/30 rounded-lg px-4 py-2 text-foreground focus:outline-none focus:border-accent/50" />
                    </div>
                    <div>
                      <label htmlFor="settings-displayname" className="block text-sm font-semibold text-foreground mb-2">Display Name</label>
                      <input type="text" id="settings-displayname" value={displayName} onChange={e => setDisplayName(e.target.value)}
                        className="w-full bg-background/50 border border-border/30 rounded-lg px-4 py-2 text-foreground focus:outline-none focus:border-accent/50" />
                    </div>
                    <div>
                      <label htmlFor="settings-bio" className="block text-sm font-semibold text-foreground mb-2">Bio</label>
                      <textarea id="settings-bio" value={bio} onChange={e => setBio(e.target.value)} rows={3}
                        className="w-full bg-background/50 border border-border/30 rounded-lg px-4 py-2 text-foreground focus:outline-none focus:border-accent/50 resize-none" />
                    </div>
                    <div>
                      <label htmlFor="settings-website" className="block text-sm font-semibold text-foreground mb-2">Website URL</label>
                      <input type="url" id="settings-website" value={website} onChange={e => setWebsite(e.target.value)}
                        className="w-full bg-background/50 border border-border/30 rounded-lg px-4 py-2 text-foreground focus:outline-none focus:border-accent/50" />
                    </div>
                  </div>
                  <button onClick={handleSaveAccount} className="luxury-button flex items-center gap-2">
                    <Save className="w-5 h-5" /> Save Changes
                  </button>
                </div>
              )}

              {/* ── PROFILE DETAILS ── */}
              {activeSection === 'profile' && (
                <div className="pin-card p-8 animate-slideUp">
                  <h2 className="text-2xl font-bold mb-2">Profile Details</h2>
                  <p className="text-foreground/50 text-sm mb-6">
                    Optional information. {currentUser.settings?.privateProfile
                      ? 'Your profile is Private — these fields are hidden from others.'
                      : 'Your profile is Public — these fields are visible to everyone.'}
                  </p>
                  <div className="space-y-6 mb-8">
                    <div>
                      <label htmlFor="settings-gender" className="block text-sm font-semibold text-foreground mb-2">Gender</label>
                      <select id="settings-gender" value={gender} onChange={e => setGender(e.target.value)}
                        className="w-full bg-background/50 border border-border/30 rounded-lg px-4 py-2 text-foreground focus:outline-none focus:border-accent/50">
                        <option value="">Prefer not to say</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Non-binary">Non-binary</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="settings-dob" className="block text-sm font-semibold text-foreground mb-2">Date of Birth</label>
                      <input type="date" id="settings-dob" value={dob} onChange={e => setDob(e.target.value)}
                        className="w-full bg-background/50 border border-border/30 rounded-lg px-4 py-2 text-foreground focus:outline-none focus:border-accent/50" />
                    </div>
                    <div>
                      <label htmlFor="settings-country" className="block text-sm font-semibold text-foreground mb-2">Country</label>
                      <select id="settings-country" value={country} onChange={e => setCountry(e.target.value)}
                        className="w-full bg-background/50 border border-border/30 rounded-lg px-4 py-2 text-foreground focus:outline-none focus:border-accent/50">
                        {COUNTRIES.map(c => (
                          <option key={c} value={c}>{c || 'Select a country'}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <button onClick={handleSaveProfile} className="luxury-button flex items-center gap-2">
                    <Globe className="w-5 h-5" /> Save Profile Details
                  </button>
                </div>
              )}

              {/* ── PRIVACY ── */}
              {activeSection === 'privacy' && (
                <div className="pin-card p-8 animate-slideUp space-y-6">
                  <h2 className="text-2xl font-bold mb-6">Privacy & Safety</h2>
                  <div className="space-y-4">
                    {[
                      { label: 'Private Profile', desc: 'Only approved followers can see your pins. Email, Gender, DOB, and Country are hidden.', value: privateProfile, set: setPrivateProfile },
                      { label: 'Show Activity Status', desc: "Let others see when you're active", value: showActivity, set: setShowActivity },
                      { label: 'Allow Direct Messages', desc: 'Let other users send you messages', value: allowMessages, set: setAllowMessages },
                    ].map(item => (
                      <div key={item.label} className="flex items-center justify-between pb-4 border-b border-border/30">
                        <label className="flex items-center justify-between w-full cursor-pointer">
                          <div>
                            <p className="font-semibold text-foreground">{item.label}</p>
                            <p className="text-sm text-foreground/60">{item.desc}</p>
                          </div>
                          <input type="checkbox" checked={item.value} onChange={e => item.set(e.target.checked)} className="w-5 h-5 rounded accent cursor-pointer" />
                        </label>
                      </div>
                    ))}
                  </div>
                  <button onClick={handleSavePrivacy} className="luxury-button flex items-center gap-2 mt-6">
                    <Lock className="w-5 h-5" /> Save Privacy Settings
                  </button>
                </div>
              )}

              {/* ── NOTIFICATIONS ── */}
              {activeSection === 'notifications' && (
                <div className="pin-card p-8 animate-slideUp space-y-6">
                  <h2 className="text-2xl font-bold mb-6">Notification Preferences</h2>
                  <div className="space-y-4">
                    {[
                      { label: 'Enable Notifications', desc: 'Receive in-app notifications', value: allowNotifications, set: setAllowNotifications },
                      { label: 'New Follower Email', desc: 'Get notified when someone follows you', value: emailOnNewFollower, set: setEmailOnNewFollower },
                      { label: 'Pin Interaction Email', desc: 'Get notified on pin interactions', value: emailOnPinInteraction, set: setEmailOnPinInteraction },
                    ].map(item => (
                      <div key={item.label} className="flex items-center justify-between pb-4 border-b border-border/30">
                        <label className="flex items-center justify-between w-full cursor-pointer">
                          <div>
                            <p className="font-semibold text-foreground">{item.label}</p>
                            <p className="text-sm text-foreground/60">{item.desc}</p>
                          </div>
                          <input type="checkbox" checked={item.value} onChange={e => item.set(e.target.checked)} className="w-5 h-5 rounded accent cursor-pointer" />
                        </label>
                      </div>
                    ))}
                  </div>
                  <button onClick={handleSaveNotifications} className="luxury-button flex items-center gap-2 mt-6">
                    <Bell className="w-5 h-5" /> Save Preferences
                  </button>
                </div>
              )}

              {/* ── CHAT STORAGE ── */}
              {activeSection === 'storage' && (
                <div className="pin-card p-8 animate-slideUp">
                  <h2 className="text-2xl font-bold mb-2">Chat Storage</h2>
                  <p className="text-foreground/50 text-sm mb-6">
                    {currentUser.isVerified
                      ? 'As a Verified user, you have 10 MB of chat storage.'
                      : 'Standard accounts have 3 MB of chat storage. Upgrade for more.'}
                  </p>
                  <ChatStorageBar />
                </div>
              )}

              {/* ── SECURITY ── */}
              {activeSection === 'security' && (
                <div className="space-y-8 animate-slideUp">
                  {/* Password Change */}
                  <div className="pin-card p-8">
                    <div className="flex items-center gap-2 mb-6">
                      <KeyRound className="w-6 h-6 text-accent" />
                      <h2 className="text-2xl font-bold">Change Password</h2>
                    </div>
                    <p className="text-foreground/50 text-sm mb-6">
                      You can change your password up to 3 times. After that, it will be locked for 3 days.
                    </p>
                    <div className="space-y-4 mb-6">
                      <div>
                        <label htmlFor="current-password" className="block text-sm font-semibold text-foreground mb-2">Current Password</label>
                        <input type="password" id="current-password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)}
                          className="w-full bg-background/50 border border-border/30 rounded-lg px-4 py-2 text-foreground focus:outline-none focus:border-accent/50" />
                      </div>
                      <div>
                        <label htmlFor="new-password" className="block text-sm font-semibold text-foreground mb-2">New Password</label>
                        <input type="password" id="new-password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                          placeholder="Min. 8 characters"
                          className="w-full bg-background/50 border border-border/30 rounded-lg px-4 py-2 text-foreground focus:outline-none focus:border-accent/50" />
                      </div>
                      <div>
                        <label htmlFor="confirm-password" className="block text-sm font-semibold text-foreground mb-2">Confirm New Password</label>
                        <input type="password" id="confirm-password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                          className="w-full bg-background/50 border border-border/30 rounded-lg px-4 py-2 text-foreground focus:outline-none focus:border-accent/50" />
                      </div>
                    </div>

                    {passwordMessage && (
                      <div className={`flex items-start gap-2 p-3 rounded-lg mb-4 ${passwordMessage.type === 'success' ? 'bg-green-500/10 border border-green-500/20 text-green-300' :
                        passwordMessage.type === 'warning' ? 'bg-amber-500/10 border border-amber-500/20 text-amber-300' :
                          'bg-red-500/10 border border-red-500/20 text-red-300'
                        }`}>
                        {passwordMessage.type === 'warning' && <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />}
                        {passwordMessage.type === 'success' && <Check className="w-4 h-4 mt-0.5 shrink-0" />}
                        <p className="text-sm">{passwordMessage.text}</p>
                      </div>
                    )}

                    <button
                      onClick={handleChangePassword}
                      disabled={changingPassword}
                      className="luxury-button flex items-center gap-2 disabled:opacity-50"
                    >
                      <Shield className="w-5 h-5" /> {changingPassword ? 'Changing...' : 'Change Password'}
                    </button>
                  </div>

                  {/* Delete Account */}
                  <div className="pin-card p-8 border-red-500/20">
                    <div className="flex items-center gap-2 mb-4">
                      <Trash2 className="w-6 h-6 text-red-400" />
                      <h2 className="text-2xl font-bold text-red-400">Delete Account</h2>
                    </div>

                    {deletionSubmitted ? (
                      <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                        <p className="text-green-300 font-medium">✓ Your deletion request has been submitted.</p>
                        <p className="text-foreground/50 text-sm mt-1">Our Customer Care team will process it within 3–5 business days.</p>
                      </div>
                    ) : currentUser.accountStatus && currentUser.accountStatus === 'pending_deletion' ? (
                      <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                        <p className="text-amber-300 font-medium">⏳ Account deletion is pending</p>
                        <p className="text-foreground/50 text-sm mt-1">Your request is being processed by our Customer Care team.</p>
                      </div>
                    ) : (
                      <>
                        <p className="text-foreground/50 text-sm mb-4">
                          This will send a deletion request to our Customer Care team. Your account will not be immediately removed.
                        </p>

                        {!showDeleteConfirm ? (
                          <button
                            onClick={() => setShowDeleteConfirm(true)}
                            className="luxury-button-outline flex items-center gap-2 text-red-500 border-red-500/30 hover:bg-red-500/10"
                          >
                            <Trash2 className="w-5 h-5" /> Request Account Deletion
                          </button>
                        ) : (
                          <div className="space-y-4 p-4 rounded-lg bg-red-500/5 border border-red-500/20">
                            <p className="text-sm font-semibold text-red-300">Are you sure? This action cannot be undone easily.</p>
                            <div>
                              <label htmlFor="delete-reason" className="block text-sm font-semibold text-foreground mb-2">Reason (optional)</label>
                              <textarea id="delete-reason" value={deleteReason} onChange={e => setDeleteReason(e.target.value)} rows={2}
                                placeholder="Tell us why you're leaving..."
                                className="w-full bg-background/50 border border-border/30 rounded-lg px-4 py-2 text-foreground focus:outline-none focus:border-red-500/50 resize-none" />
                            </div>
                            <div className="flex gap-3">
                              <button onClick={handleDeleteAccount}
                                className="px-4 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors">
                                Confirm Deletion
                              </button>
                              <button onClick={() => setShowDeleteConfirm(false)}
                                className="luxury-button-outline px-4 py-2">
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* ── APPEARANCE ── */}
              {activeSection === 'appearance' && (
                <div className="pin-card p-8 animate-slideUp">
                  <h2 className="text-2xl font-bold mb-6">Appearance</h2>
                  <div className="mb-8">
                    <p className="font-semibold text-foreground mb-4">Theme</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-lg border-2 border-accent bg-accent/10">
                        <Palette className="w-6 h-6 mx-auto mb-2" />
                        <p className="text-sm font-semibold text-center">Dark (Active)</p>
                      </div>
                      <div className="p-4 rounded-lg border-2 border-border/30 opacity-50 cursor-not-allowed">
                        <Palette className="w-6 h-6 mx-auto mb-2" />
                        <p className="text-sm font-semibold text-center">Light (Coming Soon)</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-border/30">
            <button onClick={handleLogout} className="luxury-button-outline flex items-center gap-2 text-red-500 border-red-500/30 hover:bg-red-500/10">
              <LogOut className="w-5 h-5" /> Sign Out
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
