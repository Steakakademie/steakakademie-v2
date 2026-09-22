'use client';

import { useChat } from 'ai/react';
import type { Message } from 'ai';
import { useState, useRef, useEffect, useCallback } from 'react';
import { m as motion, AnimatePresence } from 'framer-motion';
import { X, Send, Paperclip } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import MarcoAvatar from './MarcoAvatar';
import { useAvatarStateMachine } from '@/hooks/useAvatarStateMachine';

const SUGGESTIONS = [
  'Welcher Cut ist am besten für Anfänger?',
  'Was ist Reverse Sear und wie funktioniert es?',
  'Wie erkenne ich ob mein Steak medium rare ist?',
  'Mein Steak ist grau geworden — was tun?',
];

const MARCO_PORTRAIT  = '/images/marco-portrait-128.webp';
const MARCO_BACK      = '/images/marco-back-128.webp';

export default function MarcoWidget() {
  const [open, setOpen] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ base64: string; mimeType: string; preview: string } | null>(null);

  // Login-Pflicht (22.09.2026, Uwe): Marco ist Mitgliedern vorbehalten — der Server
  // (/api/marco, guardRequest auth:'user-or-admin') verweigert Anonymen ohnehin mit
  // 401; hier zusätzlich die UI sperren, damit Anonyme gar nicht erst chatten können.
  const [authed, setAuthed] = useState<boolean | null>(null);
  const pathname = usePathname();
  const lastStatusRef = useRef<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevIsLoading = useRef(false);

  const { state: avatarState, send } = useAvatarStateMachine();

  const { messages, input, handleInputChange, handleSubmit, isLoading, setInput } = useChat({
    api: '/api/marco',
    // /api/marco streamt Klartext (Gemini), nicht das Data-Stream-Protokoll der AI-SDK.
    streamProtocol: 'text',
    onResponse: (res) => {
      lastStatusRef.current = res.status;
      if (!res.ok) throw new Error(res.status === 401 ? 'marco-auth-required' : 'marco-http-error');
    },
    onError: () => {
      if (lastStatusRef.current === 401) setAuthed(false);
    },
  });

  useEffect(() => {
    // Gleiche schnelle Cookie-Prüfung wie AccountLink — kein unnötiger
    // supabase-js-Import (~47 kB) für den ganz überwiegenden anonymen Fall.
    if (!/(^|;\s*)sb-[^=;]*-auth-token(\.\d+)?=/.test(document.cookie)) {
      setAuthed(false);
      return;
    }
    let active = true;
    import('@/lib/supabase/client').then(({ createClient }) => {
      if (!active) return;
      const supabase = createClient();
      supabase.auth.getUser().then(({ data }) => { if (active) setAuthed(!!data.user); }).catch(() => { if (active) setAuthed(false); });
    }).catch(() => { if (active) setAuthed(false); });
    return () => { active = false; };
  }, []);

  const handleToggle = useCallback(() => {
    if (!open) {
      setOpen(true);
      setHasOpened(true);
      send('OPEN');
    } else {
      send('CLOSE');
    }
  }, [open, send]);

  useEffect(() => {
    const auf = (e: Event) => {
      const frage = (e as CustomEvent<{ frage?: string }>).detail?.frage;
      if (typeof frage === 'string' && frage.trim()) setInput(frage.trim());
      if (!open) {
        setOpen(true);
        setHasOpened(true);
        send('OPEN');
      }
      window.setTimeout(() => document.getElementById('marco-input')?.focus(), 260);
    };
    window.addEventListener('sk:marco', auf as EventListener);
    return () => window.removeEventListener('sk:marco', auf as EventListener);
  }, [open, send, setInput]);

  const handleAvatarClosed = useCallback(() => {
    send('CLOSED');
    setOpen(false);
  }, [send]);

  const handleAvatarGreeted = useCallback(() => {
    send('GREETED');
  }, [send]);

  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleInputChange(e);
      if (e.target.value.trim()) {
        send('USER_TYPING');
      } else {
        send('IDLE');
      }
    },
    [handleInputChange, send]
  );

  // Bildauswahl verarbeiten
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      setSelectedImage({
        base64,
        mimeType: file.type,
        preview: result,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleFormSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (authed === false) return; // Login-Pflicht — UI ist ohnehin gesperrt, doppelt hält besser
      if (!input.trim() && !selectedImage) return;

      handleSubmit(e, {
        data: selectedImage ? { image: selectedImage.base64, mimeType: selectedImage.mimeType } : undefined,
      });

      setSelectedImage(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      send('SUBMIT');
    },
    [authed, handleSubmit, input, selectedImage, send]
  );

  useEffect(() => {
    if (isLoading && !prevIsLoading.current) send('STREAM_START');
    if (!isLoading && prevIsLoading.current)  send('STREAM_DONE');
    prevIsLoading.current = isLoading;
  }, [isLoading, send]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function handleSuggestion(text: string) {
    setInput(text);
    send('USER_TYPING');
  }

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        {!hasOpened && (
          <motion.button
            onClick={handleToggle}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-2xl border border-brand-gold/40 bg-text-primary px-4 py-2 text-xs text-brand-gold shadow-xl font-sans cursor-pointer hover:border-brand-gold/70 transition-colors"
          >
            Frag Marco — deinen KI-BBQ-Guide 🥩
          </motion.button>
        )}

        <button
          onClick={handleToggle}
          className="relative"
          aria-label="KI-Assistent Marco öffnen — Chatbot, keine echte Person"
          aria-expanded={open}
        >
          <AnimatePresence mode="wait">
            {open && (
              <motion.span
                key="close"
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.7 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 flex items-center justify-center rounded-full z-10 bg-[#0D0D0D]/80"
              >
                <X size={20} className="text-white" />
              </motion.span>
            )}
          </AnimatePresence>

          <span
            aria-hidden
            className="absolute -top-1 -right-1 z-20 rounded border border-brand-gold/50 bg-[#0D0D0D]/85 px-1 py-px text-[9px] font-sans font-bold tracking-wide text-brand-gold"
          >
            KI
          </span>
          <MarcoAvatar
            state={avatarState}
            onGreeted={handleAvatarGreeted}
            onClosed={handleAvatarClosed}
            size="md"
            portraitSrc={MARCO_PORTRAIT}
            backFaceSrc={MARCO_BACK}
          />
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 z-50 flex w-[340px] flex-col border border-white/10 bg-surface-elevated shadow-2xl shadow-black/60 sm:w-[380px]"
            style={{
              maxHeight: '560px',
              transformOrigin: 'calc(100% - 28px) calc(100% + 44px)',
            }}
          >
            <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
              <MarcoAvatar
                state={avatarState}
                size="sm"
                portraitSrc={MARCO_PORTRAIT}
                backFaceSrc={MARCO_BACK}
              />
              <div>
                <p className="text-sm font-bold text-white font-sans">Marco</p>
                <p className="text-xs font-sans" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  {avatarState === 'thinking'  ? 'Denkt nach…'
                 : avatarState === 'responding' ? 'Antwortet…'
                 : avatarState === 'listening'  ? 'Hört zu'
                 : 'Dein BBQ-Guide · Steakakademie'}
                </p>
              </div>
              <motion.div
                className="ml-auto h-2 w-2 rounded-full"
                animate={{
                  backgroundColor:
                    avatarState === 'thinking'  ? '#F5A623' :
                    avatarState === 'responding' ? '#B43C00' :
                    '#22c55e',
                  scale: isLoading ? [1, 1.4, 1] : 1,
                }}
                transition={{ scale: { duration: 0.8, repeat: Infinity } }}
              />
            </div>

            {authed === false ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-10 text-center" style={{ minHeight: '200px' }}>
                <p className="text-sm font-sans text-white/80">
                  Marco ist Mitgliedern vorbehalten — melde dich kostenlos an, dann steht dir dein
                  BBQ-Guide für Fragen und Foto-Analysen zur Verfügung.
                </p>
                <Link
                  href={`/auth/login?redirectTo=${encodeURIComponent(pathname || '/')}`}
                  className="rounded-lg bg-brand-fire px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-white transition-opacity hover:opacity-90"
                >
                  Jetzt kostenlos anmelden
                </Link>
              </div>
            ) : (
              <>
                            <div
              className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
              style={{ minHeight: '200px', maxHeight: '340px' }}
            >
              {messages.length === 0 && (
                <div className="space-y-3">
                  <p className="text-center text-xs font-sans" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    Marco beantwortet deine BBQ-Fragen & analysiert Fleisch-Fotos 📸
                  </p>
                  <div className="space-y-2">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => handleSuggestion(s)}
                        className="w-full border border-white/15 bg-white/8 px-3 py-2 text-left text-xs font-sans text-white/70 transition-colors hover:border-brand-gold/40 hover:bg-white/10 hover:text-white"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((m: Message) => (
                <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] px-3 py-2 text-sm leading-relaxed font-sans ${
                      m.role === 'user'
                        ? 'bg-brand-fire/70 text-white'
                        : 'bg-white/10 text-white/90'
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white/10 px-3 py-2">
                    <span className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <span
                          key={i}
                          className="h-1.5 w-1.5 rounded-full bg-brand-gold animate-bounce motion-reduce:animate-none"
                          style={{ animationDelay: `${i * 0.15}s` }}
                        />
                      ))}
                    </span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Bild-Vorschau vor dem Senden */}
            {selectedImage && (
              <div className="relative px-3 pt-2">
                <div className="relative inline-block border border-white/20 rounded overflow-hidden">
                  <img src={selectedImage.preview} alt="Upload-Vorschau" className="h-16 w-16 object-cover" />
                  <button
                    type="button"
                    onClick={() => setSelectedImage(null)}
                    className="absolute top-0.5 right-0.5 bg-black/70 text-white rounded-full p-0.5"
                  >
                    <X size={12} />
                  </button>
                </div>
              </div>
            )}

            {/* Formular mit Klammer-Icon */}
            <form
              onSubmit={handleFormSubmit}
              className="flex items-center gap-2 border-t border-white/10 px-3 py-3"
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className="flex h-9 w-9 shrink-0 items-center justify-center text-white/60 hover:text-white transition-colors disabled:opacity-40"
                aria-label="Bild anheften"
              >
                <Paperclip size={18} />
              </button>

              <label htmlFor="marco-input" className="sr-only">Frage an Marco</label>
              <input
                id="marco-input"
                value={input}
                onChange={handleInput}
                placeholder={selectedImage ? "Frage zum Bild stellen…" : "Deine BBQ-Frage…"}
                disabled={isLoading}
                autoComplete="off"
                className="flex-1 border border-white/10 bg-white/5 px-3 py-2 text-sm font-sans text-white placeholder-white/30 focus:border-brand-gold/50 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={isLoading || (!input.trim() && !selectedImage)}
                className="flex h-9 w-9 shrink-0 items-center justify-center bg-brand-fire text-white transition-colors hover:bg-brand-fire/80 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Senden"
              >
                <Send size={14} />
              </button>
            </form>
              </>
            )}

            <p className="px-4 pb-3 text-center text-[11px] font-sans" style={{ color: 'rgba(255,255,255,0.6)' }}>
              🤖 Marco ist ein KI-Assistent — keine Rechts-, Gesundheits- oder Steuerberatung.{' '}
              <Link href="/ki-disclaimer" className="underline hover:opacity-60 transition-opacity">
                KI-Hinweise
              </Link>
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}