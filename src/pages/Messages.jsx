import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { MessageSquare, Send, Paperclip, X, FileText, Loader2, Search, MoreVertical, Pencil, Trash2, Check, CheckCheck } from 'lucide-react';
import { showNotification } from '../redux/slices/uiSlice';
import {
  fetchConversations,
  fetchConversation,
  sendMessage,
  searchMessages,
  updateMessage,
  deleteMessage,
  clearSearch,
} from '../redux/slices/messageSlice';
import { fetchAgences } from '../redux/slices/agenceSlice';

const formatSize = (bytes) => {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
};

const isImage = (mimeType) => mimeType?.startsWith('image/');

const Messages = () => {
  const dispatch = useDispatch();
  const { conversations, conversationsLoaded, isLoadingConversation, byAgence, isSending, searchResults, isSearching } = useSelector((state) => state.messages);
  const { agences, hasLoaded: agencesLoaded } = useSelector((state) => state.agences);

  const [selectedAgenceId, setSelectedAgenceId] = useState(null);
  const [body, setBody] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editBody, setEditBody] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
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
    setSearchOpen(false);
    setSearchQuery('');
    dispatch(clearSearch());
  }, [dispatch, selectedAgenceId]);

  const messages = byAgence[selectedAgenceId] || [];
  const displayedMessages = searchOpen && searchResults ? searchResults : messages;

  useEffect(() => {
    if (!searchOpen) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, searchOpen]);

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

  const startEdit = (m) => {
    setEditingId(m.id);
    setEditBody(m.body || '');
    setOpenMenuId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditBody('');
  };

  const saveEdit = async (messageId) => {
    if (!editBody.trim()) return;
    try {
      await dispatch(updateMessage({ agenceId: selectedAgenceId, messageId, body: editBody.trim() })).unwrap();
      cancelEdit();
    } catch (err) {
      dispatch(showNotification({ type: 'error', message: err || 'Erreur lors de la modification' }));
    }
  };

  const handleDelete = async (messageId) => {
    setOpenMenuId(null);
    try {
      await dispatch(deleteMessage({ agenceId: selectedAgenceId, messageId })).unwrap();
    } catch (err) {
      dispatch(showNotification({ type: 'error', message: err || 'Erreur lors de la suppression' }));
    }
  };

  const handleSearch = () => {
    if (!searchQuery.trim() || !selectedAgenceId) return;
    dispatch(searchMessages({ agenceId: selectedAgenceId, q: searchQuery.trim() }));
  };

  const toggleSearch = () => {
    setSearchOpen((prev) => !prev);
    setSearchQuery('');
    dispatch(clearSearch());
  };

  return (
    <div className="pb-6 md:pb-12 font-sans">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex" style={{ height: 'calc(100vh - 220px)', minHeight: 480 }}>
        {/* Liste des conversations */}
        <div className="w-72 shrink-0 bg-slate-50 border-r border-slate-200 overflow-y-auto">
          {agenceOptions.length === 0 ? (
            <div className="p-6 text-center text-sm text-slate-500">Aucune agence disponible</div>
          ) : (
            agenceOptions.map((c) => {
              const active = selectedAgenceId === c.agence.id;
              return (
                <button
                  key={c.agence.id}
                  onClick={() => setSelectedAgenceId(c.agence.id)}
                  className={`w-full text-left px-4 py-3 border-b border-slate-200/70 transition-colors flex items-center gap-3 ${active ? 'bg-white border-l-4 border-l-slate-900 shadow-sm' : 'border-l-4 border-l-transparent hover:bg-white/70'}`}
                >
                  <div className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-xs font-bold text-white ${active ? 'bg-slate-900' : 'bg-slate-400'}`}>
                    {c.agence.nom_agence?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-sm truncate ${active ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'}`}>{c.agence.nom_agence}</span>
                      {c.non_lu && <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">
                      {c.last_message?.body || (c.last_message ? 'Pièce jointe' : 'Aucun message')}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Fil de discussion */}
        <div className="flex-1 flex flex-col min-w-0 bg-slate-50/40">
          {!selectedAgenceId ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
              <MessageSquare size={48} strokeWidth={1.5} className="mb-3" />
              <p className="text-sm font-medium">Sélectionnez une agence pour démarrer</p>
            </div>
          ) : (
            <>
              <div className="px-5 py-3 border-b border-slate-200 bg-white flex items-center gap-3">
                <div className="w-8 h-8 shrink-0 rounded-full bg-slate-900 flex items-center justify-center text-xs font-bold text-white">
                  {selectedAgence?.nom_agence?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <p className="font-bold text-sm text-slate-900 flex-1">{selectedAgence?.nom_agence}</p>
                <button
                  onClick={toggleSearch}
                  className={`p-2 rounded-lg transition-colors ${searchOpen ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}
                  title="Rechercher dans la conversation"
                >
                  <Search size={16} />
                </button>
              </div>

              {searchOpen && (
                <div className="px-5 py-2.5 border-b border-slate-200 bg-white flex items-center gap-2">
                  <input
                    autoFocus
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Rechercher un mot..."
                    className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900"
                  />
                  <button
                    onClick={handleSearch}
                    disabled={!searchQuery.trim() || isSearching}
                    className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold disabled:opacity-40"
                  >
                    {isSearching ? <Loader2 size={14} className="animate-spin" /> : 'Chercher'}
                  </button>
                </div>
              )}

              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                {isLoadingConversation && messages.length === 0 ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="animate-spin text-slate-400" size={28} />
                  </div>
                ) : displayedMessages.length === 0 ? (
                  <p className="text-center text-sm text-slate-400 py-8">
                    {searchOpen && searchResults ? 'Aucun résultat' : "Aucun message pour l'instant"}
                  </p>
                ) : (
                  displayedMessages.map((m) => {
                    const isMine = m.sender?.type !== 'agence';
                    const isEditing = editingId === m.id;
                    const initial = isMine ? 'B' : (selectedAgence?.nom_agence?.charAt(0)?.toUpperCase() || 'A');
                    return (
                      <div key={m.id} className={`group flex items-end gap-2 ${isMine ? 'flex-row-reverse' : ''}`}>
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0 ${
                            isMine ? 'bg-gradient-to-br from-indigo-600 to-indigo-500' : 'bg-slate-400'
                          }`}
                        >
                          {initial}
                        </div>

                        <div className={`relative max-w-[70%] rounded-2xl px-4 py-2.5 shadow-sm ${
                          isMine
                            ? 'bg-gradient-to-br from-indigo-600 to-indigo-500 text-white rounded-br-md'
                            : 'bg-white text-slate-900 border border-slate-200 rounded-bl-md'
                        }`}>
                          {isMine && !isEditing && (
                            <div className="absolute -top-2 -left-2">
                              <button
                                onClick={() => setOpenMenuId(openMenuId === m.id ? null : m.id)}
                                className="opacity-0 group-hover:opacity-100 p-1 bg-white border border-slate-200 rounded-full shadow-sm text-slate-500 hover:text-slate-900 transition-opacity"
                              >
                                <MoreVertical size={12} />
                              </button>
                              {openMenuId === m.id && (
                                <div className="absolute top-6 left-0 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-10 w-32">
                                  {m.body && (
                                    <button
                                      onClick={() => startEdit(m)}
                                      className="w-full text-left px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                    >
                                      <Pencil size={12} /> Modifier
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleDelete(m.id)}
                                    className="w-full text-left px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 flex items-center gap-2"
                                  >
                                    <Trash2 size={12} /> Supprimer
                                  </button>
                                </div>
                              )}
                            </div>
                          )}

                          {isEditing ? (
                            <div className="space-y-2">
                              <textarea
                                autoFocus
                                value={editBody}
                                onChange={(e) => setEditBody(e.target.value)}
                                rows={2}
                                className="w-full px-2 py-1.5 rounded-lg text-sm bg-white/10 text-white placeholder-slate-300 border border-white/20 focus:outline-none resize-none"
                              />
                              <div className="flex gap-2 justify-end">
                                <button onClick={cancelEdit} className="text-xs font-bold text-slate-300 hover:text-white">Annuler</button>
                                <button onClick={() => saveEdit(m.id)} className="text-xs font-bold text-white bg-white/20 px-2 py-0.5 rounded">Enregistrer</button>
                              </div>
                            </div>
                          ) : (
                            <>
                              {m.body && <p className="text-sm whitespace-pre-wrap break-words">{m.body}</p>}
                              {m.attachments?.length > 0 && (
                                <div className="mt-1.5 space-y-1.5">
                                  {m.attachments.map((a) => isImage(a.mime_type) ? (
                                    <a key={a.id} href={a.url} target="_blank" rel="noopener noreferrer" className="block">
                                      <img src={a.url} alt={a.original_name} className="max-w-full max-h-48 rounded-lg object-cover" />
                                    </a>
                                  ) : (
                                    <a
                                      key={a.id}
                                      href={a.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className={`flex items-center gap-2 text-xs px-2.5 py-1.5 rounded-lg ${isMine ? 'bg-white/10 hover:bg-white/20' : 'bg-slate-100 hover:bg-slate-200'}`}
                                    >
                                      <FileText size={14} />
                                      <span className="truncate">{a.original_name}</span>
                                    </a>
                                  ))}
                                </div>
                              )}
                              <div className={`flex items-center gap-1 mt-1 ${isMine ? 'justify-end' : ''}`}>
                                {m.edited_at && (
                                  <span className={`text-[10px] italic ${isMine ? 'text-indigo-100' : 'text-slate-400'}`}>modifié</span>
                                )}
                                <p className={`text-[10px] ${isMine ? 'text-indigo-100' : 'text-slate-400'}`}>
                                  {format(new Date(m.created_at), 'HH:mm', { locale: fr })}
                                </p>
                                {isMine && (
                                  m.read_at
                                    ? <CheckCheck size={13} className="text-sky-300" />
                                    : <Check size={13} className="text-indigo-200" />
                                )}
                              </div>
                            </>
                          )}
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

              <div className="px-5 py-3 border-t border-slate-200 bg-white flex items-end gap-2">
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
