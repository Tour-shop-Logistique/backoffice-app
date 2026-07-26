import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { MessageSquare, Send, Paperclip, X, FileText, Loader2 } from 'lucide-react';
import { showNotification } from '../redux/slices/uiSlice';
import { fetchConversations, fetchConversation, sendMessage } from '../redux/slices/messageSlice';
import { fetchAgences } from '../redux/slices/agenceSlice';

const formatSize = (bytes) => {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
};

const Messages = () => {
  const dispatch = useDispatch();
  const { conversations, conversationsLoaded, isLoadingConversation, byAgence, isSending } = useSelector((state) => state.messages);
  const { agences, hasLoaded: agencesLoaded } = useSelector((state) => state.agences);

  const [selectedAgenceId, setSelectedAgenceId] = useState(null);
  const [body, setBody] = useState('');
  const [attachments, setAttachments] = useState([]);
  const fileInputRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!conversationsLoaded) dispatch(fetchConversations());
  }, [dispatch, conversationsLoaded]);

  useEffect(() => {
    if (!agencesLoaded) dispatch(fetchAgences());
  }, [dispatch, agencesLoaded]);

  useEffect(() => {
    if (selectedAgenceId) dispatch(fetchConversation(selectedAgenceId));
  }, [dispatch, selectedAgenceId]);

  const messages = byAgence[selectedAgenceId] || [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // Fusionne les agences actives (pour démarrer une nouvelle conversation) avec
  // les conversations déjà existantes, sans doublon.
  const agenceOptions = useMemo(() => {
    const known = new Map(conversations.map((c) => [c.agence?.id, c]));
    (agences || []).filter((a) => a.actif).forEach((a) => {
      if (!known.has(a.id)) {
        known.set(a.id, { agence: { id: a.id, nom_agence: a.nom_agence }, last_message: null, non_lu: false });
      }
    });
    return Array.from(known.values()).sort((a, b) => {
      const da = a.last_message?.created_at ? new Date(a.last_message.created_at).getTime() : 0;
      const db = b.last_message?.created_at ? new Date(b.last_message.created_at).getTime() : 0;
      return db - da;
    });
  }, [conversations, agences]);

  const selectedAgence = agenceOptions.find((c) => c.agence?.id === selectedAgenceId)?.agence;

  const handleFilesChange = (e) => {
    const files = Array.from(e.target.files || []);
    setAttachments((prev) => [...prev, ...files].slice(0, 5));
    e.target.value = '';
  };

  const removeAttachment = (index) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if (!selectedAgenceId || (!body.trim() && attachments.length === 0) || isSending) return;
    try {
      await dispatch(sendMessage({ agenceId: selectedAgenceId, body: body.trim(), attachments })).unwrap();
      setBody('');
      setAttachments([]);
    } catch (err) {
      dispatch(showNotification({ type: 'error', message: err || "Erreur lors de l'envoi du message" }));
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="pb-6 md:pb-12 font-sans">
      <header className="mb-4 md:mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">Messages</h1>
        <p className="text-sm md:text-base text-slate-500 mt-0.5 font-medium">
          Échanges directs avec les agences partenaires
        </p>
      </header>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex" style={{ height: 'calc(100vh - 220px)', minHeight: 480 }}>
        {/* Liste des conversations */}
        <div className="w-72 shrink-0 border-r border-slate-200 overflow-y-auto">
          {agenceOptions.length === 0 ? (
            <div className="p-6 text-center text-sm text-slate-500">Aucune agence disponible</div>
          ) : (
            agenceOptions.map((c) => (
              <button
                key={c.agence.id}
                onClick={() => setSelectedAgenceId(c.agence.id)}
                className={`w-full text-left px-4 py-3 border-b border-slate-100 transition-colors ${selectedAgenceId === c.agence.id ? 'bg-slate-100' : 'hover:bg-slate-50'}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-sm text-slate-900 truncate">{c.agence.nom_agence}</span>
                  {c.non_lu && <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />}
                </div>
                <p className="text-xs text-slate-500 mt-0.5 truncate">
                  {c.last_message?.body || (c.last_message ? 'Pièce jointe' : 'Aucun message')}
                </p>
              </button>
            ))
          )}
        </div>

        {/* Fil de discussion */}
        <div className="flex-1 flex flex-col min-w-0">
          {!selectedAgenceId ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
              <MessageSquare size={48} strokeWidth={1.5} className="mb-3" />
              <p className="text-sm font-medium">Sélectionnez une agence pour démarrer</p>
            </div>
          ) : (
            <>
              <div className="px-5 py-3 border-b border-slate-200">
                <p className="font-bold text-sm text-slate-900">{selectedAgence?.nom_agence}</p>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                {isLoadingConversation && messages.length === 0 ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="animate-spin text-slate-400" size={28} />
                  </div>
                ) : messages.length === 0 ? (
                  <p className="text-center text-sm text-slate-400 py-8">Aucun message pour l'instant</p>
                ) : (
                  messages.map((m) => {
                    const isMine = m.sender?.type !== 'agence';
                    return (
                      <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${isMine ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-900'}`}>
                          {m.body && <p className="text-sm whitespace-pre-wrap break-words">{m.body}</p>}
                          {m.attachments?.length > 0 && (
                            <div className="mt-1.5 space-y-1.5">
                              {m.attachments.map((a) => (
                                <a
                                  key={a.id}
                                  href={a.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`flex items-center gap-2 text-xs px-2.5 py-1.5 rounded-lg ${isMine ? 'bg-white/10 hover:bg-white/20' : 'bg-white hover:bg-slate-50'}`}
                                >
                                  <FileText size={14} />
                                  <span className="truncate">{a.original_name}</span>
                                </a>
                              ))}
                            </div>
                          )}
                          <p className={`text-[10px] mt-1 ${isMine ? 'text-slate-300' : 'text-slate-400'}`}>
                            {format(new Date(m.created_at), 'HH:mm', { locale: fr })}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={bottomRef} />
              </div>

              {attachments.length > 0 && (
                <div className="px-5 pt-2 flex flex-wrap gap-2">
                  {attachments.map((f, i) => (
                    <span key={i} className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 rounded-lg text-xs font-medium text-slate-700">
                      <FileText size={12} />
                      <span className="max-w-[140px] truncate">{f.name}</span>
                      <span className="text-slate-400">({formatSize(f.size)})</span>
                      <button onClick={() => removeAttachment(i)} className="text-slate-400 hover:text-red-600">
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <div className="px-5 py-3 border-t border-slate-200 flex items-end gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  accept=".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx,.xls,.xlsx"
                  onChange={handleFilesChange}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors shrink-0"
                  title="Joindre un fichier"
                >
                  <Paperclip size={18} />
                </button>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Écrire un message..."
                  rows={1}
                  className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 text-sm font-medium text-slate-900 transition-all resize-none max-h-32"
                />
                <button
                  onClick={handleSend}
                  disabled={isSending || (!body.trim() && attachments.length === 0)}
                  className="p-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                >
                  {isSending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;
