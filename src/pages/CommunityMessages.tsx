import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  ArrowLeft, Send, Trash2, Users, Shield, MoreVertical,
  MessageCircle, Smile, Paperclip, Search, Mic, CheckCheck,
} from 'lucide-react';

/* ── Helpers ── */
const NAME_COLORS = [
  '#25d366','#00bcd4','#9c27b0','#ff9800',
  '#e91e63','#2196f3','#ff5722','#4caf50',
];
const nameColor  = (uid: string) => NAME_COLORS[uid.charCodeAt(0) % NAME_COLORS.length];
const getInitials = (name: string) =>
  (name || 'A').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
function fmtDate(iso: string) {
  const d = new Date(iso), now = new Date();
  const yest = new Date(now); yest.setDate(now.getDate() - 1);
  if (d.toDateString() === now.toDateString())  return 'Today';
  if (d.toDateString() === yest.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
}
const sameDay = (a: string, b: string) =>
  new Date(a).toDateString() === new Date(b).toDateString();

/* ── Subtle dot wallpaper ── */
const WA_BG = `radial-gradient(circle, #ffffff08 1px, transparent 1px)`;

export default function CommunityMessages() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user }  = useAuth();
  const { toast } = useToast();

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  const [community,   setCommunity]   = useState<any>(null);
  const [isMember,    setIsMember]    = useState(false);
  const [isAdmin,     setIsAdmin]     = useState(false);
  const [messages,    setMessages]    = useState<any[]>([]);
  const [profiles,    setProfiles]    = useState<Record<string, string>>({});
  const [memberCount, setMemberCount] = useState(0);
  const [text,        setText]        = useState('');
  const [sending,     setSending]     = useState(false);
  const [deletingId,  setDeletingId]  = useState<string | null>(null);
  const [hoverId,     setHoverId]     = useState<string | null>(null);

  // Keep a ref to profiles so the realtime handler always has the latest map
  const profilesRef = useRef<Record<string, string>>({});
  const userRef     = useRef(user);

  useEffect(() => { profilesRef.current = profiles; }, [profiles]);
  useEffect(() => { userRef.current = user; }, [user]);

  useEffect(() => {
    if (!user) { navigate('/auth'); return; }
    if (!id)   { navigate('/communities'); return; }
    init();

    const ch = supabase.channel(`msg:${id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'community_messages',
        filter: `community_id=eq.${id}`,
      }, async (payload) => {
        const newMsg = payload.new as any;
        // Fetch sender name if not already known
        if (newMsg.user_id && !profilesRef.current[newMsg.user_id]) {
          const { data } = await supabase
            .from('profiles').select('user_id, full_name')
            .eq('user_id', newMsg.user_id).single();
          if (data) {
            const updated = { ...profilesRef.current, [data.user_id]: data.full_name || 'Anonymous' };
            profilesRef.current = updated;
            setProfiles(updated);
          }
        }
        // Append only if not already in list (avoid duplicate from optimistic update)
        setMessages(prev => {
          if (prev.find(m => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
      })
      .on('postgres_changes', {
        event: 'DELETE', schema: 'public', table: 'community_messages',
        filter: `community_id=eq.${id}`,
      }, (payload) => {
        setMessages(prev => prev.filter(m => m.id !== (payload.old as any).id));
      })
      .subscribe();

    return () => { supabase.removeChannel(ch); };
  }, [user, id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  async function init() {
    const [commRes, myRowRes, countRes] = await Promise.all([
      supabase.from('communities').select('*').eq('id', id!).single(),
      supabase.from('community_members').select('role')
        .eq('community_id', id!).eq('user_id', user!.id).maybeSingle(),
      supabase.from('community_members')
        .select('*', { count: 'exact', head: true }).eq('community_id', id!),
    ]);
    setCommunity(commRes.data);
    setIsMember(!!myRowRes.data);
    setIsAdmin(myRowRes.data?.role === 'admin');
    setMemberCount(countRes.count || 0);
    await loadMessages();
  }

  async function loadMessages() {
    const { data, error } = await supabase
      .from('community_messages').select('*')
      .eq('community_id', id!).order('created_at', { ascending: true });

    if (error) { console.error('messages error:', error); return; }

    const list = data || [];
    setMessages(list);

    const ids = [...new Set(list.map((m: any) => m.user_id).filter(Boolean))] as string[];
    if (ids.length) {
      const { data: pRows } = await supabase
        .from('profiles').select('user_id, full_name').in('user_id', ids);
      const map: Record<string, string> = {};
      (pRows || []).forEach((p: any) => { map[p.user_id] = p.full_name || 'Anonymous'; });
      setProfiles(map);
    }
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    const content = text.trim();
    if (!content || sending) return;
    setSending(true);
    setText('');
    inputRef.current?.focus();

    // Optimistic: add a temp message immediately
    const tempId = `temp-${Date.now()}`;
    const tempMsg = {
      id: tempId,
      community_id: id!,
      user_id: user!.id,
      content,
      created_at: new Date().toISOString(),
      _pending: true,
    };
    setMessages(prev => [...prev, tempMsg]);

    try {
      const { data, error } = await supabase.from('community_messages')
        .insert({ community_id: id!, user_id: user!.id, content })
        .select().single();
      if (error) throw error;
      // Replace temp with real message
      setMessages(prev => prev.map(m => m.id === tempId ? data : m));
    } catch (err: any) {
      // Remove temp on failure
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setText(content);
      toast({ title: 'Send failed', description: err.message, variant: 'destructive' });
    } finally {
      setSending(false);
    }
  }

  async function deleteMessage(msgId: string) {
    setDeletingId(msgId);
    try {
      const { error } = await supabase.from('community_messages').delete().eq('id', msgId);
      if (error) throw error;
      setMessages(prev => prev.filter(m => m.id !== msgId));
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setDeletingId(null);
    }
  }

  if (!user || !id) return null;

  const getName = (uid: string) => profiles[uid] || 'Anonymous';

  return (
    <div className="flex flex-col h-[100dvh] overflow-hidden pb-14 md:pb-0" style={{ background: '#111b21' }}>

      {/* ── Top bar ── */}
      <div className="flex-shrink-0 flex items-center gap-2 px-2 py-2 z-20"
        style={{ background: '#202c33', borderBottom: '1px solid #2a3942' }}>

        <button onClick={() => navigate(`/communities/${id}`)}
          className="p-2 rounded-full text-[#aebac1] hover:text-white hover:bg-white/10 transition-colors flex-shrink-0">
          <ArrowLeft className="h-5 w-5" />
        </button>

        {/* Avatar — clickable to group info */}
        <button onClick={() => navigate(`/communities/${id}/members`)}
          className="relative flex-shrink-0">
          <div className="h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #00a884 0%, #025144 100%)' }}>
            {community?.name?.[0]?.toUpperCase() || '?'}
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-[#00a884] border-2 border-[#202c33]" />
        </button>

        {/* Group name + member count */}
        <button className="flex-1 min-w-0 text-left px-1"
          onClick={() => navigate(`/communities/${id}/members`)}>
          <p className="font-semibold text-white text-[14px] leading-tight truncate">
            {community?.name || '…'}
          </p>
          <p className="text-[11px] truncate" style={{ color: '#8696a0' }}>
            {memberCount} member{memberCount !== 1 ? 's' : ''}
            {community?.department ? ` · ${community.department}` : ''}
          </p>
        </button>

        {/* Action icons */}
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <button className="p-2 rounded-full text-[#aebac1] hover:text-white hover:bg-white/10 transition-colors">
            <Search className="h-[18px] w-[18px]" />
          </button>
          <button onClick={() => navigate(`/communities/${id}/members`)}
            className="p-2 rounded-full text-[#aebac1] hover:text-white hover:bg-white/10 transition-colors">
            <Users className="h-[18px] w-[18px]" />
          </button>
          {isAdmin && (
            <button onClick={() => navigate(`/communities/${id}/requests`)}
              className="p-2 rounded-full text-[#aebac1] hover:text-white hover:bg-white/10 transition-colors">
              <Shield className="h-[18px] w-[18px]" />
            </button>
          )}
          <button className="p-2 rounded-full text-[#aebac1] hover:text-white hover:bg-white/10 transition-colors">
            <MoreVertical className="h-[18px] w-[18px]" />
          </button>
        </div>
      </div>

      {/* ── Chat area ── */}
      <div className="flex-1 overflow-y-auto px-3 py-3"
        style={{
          backgroundImage: WA_BG,
          backgroundSize: '20px 20px',
          backgroundColor: '#0b141a',
        }}>

        {messages.length === 0 && !sending ? (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <div className="h-20 w-20 rounded-full flex items-center justify-center shadow-xl"
              style={{ background: 'linear-gradient(135deg, #00a884 0%, #025144 100%)' }}>
              <MessageCircle className="h-10 w-10 text-white" />
            </div>
            <div className="text-center px-6 py-4 rounded-2xl" style={{ background: '#182229' }}>
              <p className="font-semibold text-white text-sm">No messages yet</p>
              <p className="text-xs mt-1" style={{ color: '#8696a0' }}>
                {isMember ? 'Be the first to say something 👋' : 'Join to participate in the chat'}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-0.5">
            {messages.map((msg, i) => {
              const isOwn = msg.user_id === user.id;
              const name  = getName(msg.user_id);
              const showDivider = i === 0 || !sameDay(messages[i - 1].created_at, msg.created_at);
              const showName    = !isOwn && (i === 0 || messages[i - 1].user_id !== msg.user_id || showDivider);
              const isLastInGroup = i === messages.length - 1 || messages[i + 1].user_id !== msg.user_id;
              const color = nameColor(msg.user_id);

              return (
                <React.Fragment key={msg.id}>
                  {showDivider && (
                    <div className="flex justify-center my-4">
                      <span className="text-xs px-3 py-1 rounded-lg font-medium select-none"
                        style={{ background: '#182229', color: '#8696a0' }}>
                        {fmtDate(msg.created_at)}
                      </span>
                    </div>
                  )}

                  <div
                    className={`flex items-end gap-1.5 ${isOwn ? 'flex-row-reverse' : 'flex-row'} ${isLastInGroup ? 'mb-2' : 'mb-0.5'}`}
                    onMouseEnter={() => setHoverId(msg.id)}
                    onMouseLeave={() => setHoverId(null)}
                  >
                    {/* Avatar placeholder for spacing */}
                    {!isOwn && (
                      <div className="w-8 flex-shrink-0 flex items-end">
                        {isLastInGroup ? (
                          <div className="h-8 w-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0"
                            style={{ background: `${color}33`, border: `1.5px solid ${color}55` }}>
                            <span style={{ color }}>{getInitials(name)}</span>
                          </div>
                        ) : null}
                      </div>
                    )}

                    {/* Bubble + delete */}
                    <div className={`flex flex-col max-w-[72%] ${isOwn ? 'items-end' : 'items-start'}`}>
                      {showName && (
                        <span className="text-xs font-semibold mb-1 px-1" style={{ color }}>
                          {name}
                        </span>
                      )}

                      <div className={`flex items-end gap-1 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                        {/* Delete button */}
                        {(isOwn || isAdmin) && hoverId === msg.id && (
                          <button
                            onClick={() => deleteMessage(msg.id)}
                            disabled={deletingId === msg.id}
                            className="flex-shrink-0 p-1 rounded-full mb-1 transition-all"
                            style={{ background: '#182229', color: '#ef4444' }}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}

                        {/* Message bubble */}
                        <div className="relative"
                          style={{
                            background: isOwn ? '#005c4b' : '#202c33',
                            color: '#e9edef',
                            opacity: (msg as any)._pending ? 0.6 : 1,
                            borderRadius: isOwn
                              ? (isLastInGroup ? '12px 12px 2px 12px' : '12px')
                              : (isLastInGroup ? '12px 12px 12px 2px' : '12px'),
                            padding: '7px 12px 22px 12px',
                            minWidth: '72px',
                            maxWidth: '100%',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
                          }}>

                          {/* Tail */}
                          {isLastInGroup && (
                            <svg className="absolute bottom-0" width="8" height="13" viewBox="0 0 8 13"
                              style={isOwn ? { right: -7 } : { left: -7 }}>
                              {isOwn
                                ? <path d="M0 13 L8 0 L8 13 Z" fill="#005c4b" />
                                : <path d="M8 13 L0 0 L0 13 Z" fill="#202c33" />}
                            </svg>
                          )}

                          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                            {msg.content}
                          </p>

                          {/* Time + ticks */}
                          <div className="absolute bottom-1.5 right-2.5 flex items-center gap-1">
                            <span className="text-[10px]" style={{ color: '#8696a0' }}>
                              {(msg as any)._pending ? '' : fmtTime(msg.created_at)}
                            </span>
                            {isOwn && (
                              (msg as any)._pending
                                ? <span className="text-[10px]" style={{ color: '#8696a0' }}>🕐</span>
                                : <CheckCheck className="h-3 w-3 flex-shrink-0" style={{ color: '#53bdeb' }} />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* ── Input bar ── */}
      {isMember ? (
        <div className="flex-shrink-0 flex items-center gap-2 px-2 py-2"
          style={{ background: '#202c33', borderTop: '1px solid #2a3942' }}>

          <button className="p-2 rounded-full flex-shrink-0 transition-colors text-[#aebac1] hover:text-white hover:bg-white/10">
            <Smile className="h-[22px] w-[22px]" />
          </button>
          <button className="p-2 rounded-full flex-shrink-0 transition-colors text-[#aebac1] hover:text-white hover:bg-white/10">
            <Paperclip className="h-[22px] w-[22px]" />
          </button>

          <form onSubmit={sendMessage} className="flex-1 flex items-center gap-2">
            <input
              ref={inputRef}
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Type a message"
              className="flex-1 rounded-full px-4 h-10 text-sm outline-none"
              style={{
                background: '#2a3942',
                color: '#e9edef',
                caretColor: '#00a884',
                border: 'none',
              }}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(e as any); }
              }}
            />
            <button
              type={text.trim() ? 'submit' : 'button'}
              disabled={sending}
              className="flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center transition-all duration-150 active:scale-90"
              style={{ background: '#00a884' }}>
              {text.trim()
                ? <Send className="h-4 w-4 text-white" style={{ marginLeft: 2 }} />
                : <Mic className="h-4 w-4 text-white" />}
            </button>
          </form>
        </div>
      ) : (
        <div className="flex-shrink-0 px-4 py-4 text-center"
          style={{ background: '#202c33', borderTop: '1px solid #2a3942' }}>
          <p className="text-sm" style={{ color: '#8696a0' }}>
            Join this community to send messages
          </p>
        </div>
      )}
    </div>
  );
}
