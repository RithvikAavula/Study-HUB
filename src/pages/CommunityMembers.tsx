import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft, Search, Crown, Users, MessageCircle,
  Shield, GraduationCap, X, UserMinus, Info,
} from 'lucide-react';

const PALETTE = [
  ['#00a884','#025144'], ['#9c27b0','#4a148c'], ['#2196f3','#0d47a1'],
  ['#ff9800','#e65100'], ['#e91e63','#880e4f'], ['#00bcd4','#006064'],
  ['#4caf50','#1b5e20'], ['#f44336','#b71c1c'],
];
const getColors = (uid: string) => PALETTE[uid.charCodeAt(0) % PALETTE.length];
const getInitials = (name: string) =>
  (name || 'A').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

export default function CommunityMembers() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [community, setCommunity]   = useState<any>(null);
  const [members, setMembers]       = useState<any[]>([]);
  const [profiles, setProfiles]     = useState<Record<string, any>>({});
  const [isAdmin, setIsAdmin]       = useState(false);
  const [isMember, setIsMember]     = useState(false);
  const [search, setSearch]         = useState('');
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    if (!user) { navigate('/auth'); return; }
    if (!id)   { navigate('/communities'); return; }
    load();
  }, [user, id]);

  async function load() {
    setLoading(true);
    try {
      // 1. Community info (public select)
      const { data: comm } = await supabase
        .from('communities').select('*').eq('id', id!).single();
      setCommunity(comm);

      // 2. Own membership row (always readable via self-select policy)
      const { data: myRow } = await supabase
        .from('community_members').select('role')
        .eq('community_id', id!).eq('user_id', user!.id).maybeSingle();

      const amMember = !!myRow;
      const amAdmin  = myRow?.role === 'admin';
      setIsMember(amMember);
      setIsAdmin(amAdmin);

      if (!amMember) { setLoading(false); return; }

      // 3. All members — readable because the new RLS policy allows members to see all rows
      const { data: rows, error: rowsErr } = await supabase
        .from('community_members').select('user_id, role, created_at')
        .eq('community_id', id!);

      if (rowsErr) {
        console.error('members fetch error:', rowsErr);
        toast({ title: 'Could not load members', description: rowsErr.message, variant: 'destructive' });
        setLoading(false);
        return;
      }

      const list = rows || [];
      setMembers(list);

      // 4. Profiles for all member user_ids
      const ids = [...new Set(list.map((m: any) => m.user_id).filter(Boolean))];
      if (ids.length) {
        const { data: profileRows } = await supabase
          .from('profiles').select('user_id, full_name, department, year, section')
          .in('user_id', ids);
        const map: Record<string, any> = {};
        (profileRows || []).forEach((p: any) => { map[p.user_id] = p; });
        setProfiles(map);
      }
    } finally {
      setLoading(false);
    }
  }

  async function removeMember(uid: string) {
    if (!isAdmin || uid === user!.id) return;
    try {
      const { error } = await supabase.from('community_members')
        .delete().eq('community_id', id!).eq('user_id', uid);
      if (error) throw error;
      setMembers(prev => prev.filter(m => m.user_id !== uid));
      toast({ title: 'Member removed' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  }

  const filtered = (list: any[]) => {
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(m => {
      const p = profiles[m.user_id];
      return (p?.full_name || '').toLowerCase().includes(q)
          || (p?.department || '').toLowerCase().includes(q);
    });
  };

  const admins  = filtered(members.filter(m => m.role === 'admin'));
  const regular = filtered(members.filter(m => m.role !== 'admin'));
  const total   = admins.length + regular.length;

  /* ── Not a member ── */
  if (!loading && !isMember) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: '#111b21' }}>
        <div className="flex items-center gap-3 px-4 py-3" style={{ background: '#202c33' }}>
          <button onClick={() => navigate(`/communities/${id}`)}
            className="p-1.5 rounded-full text-[#aebac1] hover:text-white hover:bg-white/10 transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <span className="font-semibold text-white text-[15px]">Members</span>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center p-10 rounded-2xl" style={{ background: '#202c33' }}>
            <Users className="h-14 w-14 mx-auto mb-4" style={{ color: '#8696a0' }} />
            <p className="font-semibold text-white mb-1">Members only</p>
            <p className="text-sm" style={{ color: '#8696a0' }}>Join this community to view its members</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#111b21' }}>

      {/* ── Header bar ── */}
      <div className="sticky top-0 z-20 flex items-center gap-3 px-3 py-2.5"
        style={{ background: '#202c33', borderBottom: '1px solid #2a3942' }}>
        <button onClick={() => navigate(`/communities/${id}`)}
          className="p-1.5 rounded-full text-[#aebac1] hover:text-white hover:bg-white/10 transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-white text-[15px] leading-tight">Group info</p>
          <p className="text-xs" style={{ color: '#8696a0' }}>
            {loading ? 'Loading…' : `${members.length} participant${members.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <button onClick={() => navigate(`/communities/${id}/messages`)}
          className="p-2 rounded-full text-[#aebac1] hover:text-white hover:bg-white/10 transition-colors"
          title="Messages">
          <MessageCircle className="h-[18px] w-[18px]" />
        </button>
        {isAdmin && (
          <button onClick={() => navigate(`/communities/${id}/requests`)}
            className="p-2 rounded-full text-[#aebac1] hover:text-white hover:bg-white/10 transition-colors"
            title="Join requests">
            <Shield className="h-[18px] w-[18px]" />
          </button>
        )}
      </div>

      {/* ── Group banner ── */}
      <div className="flex flex-col items-center pt-8 pb-6 px-4"
        style={{ background: '#202c33', borderBottom: '2px solid #111b21' }}>
        <div className="h-24 w-24 rounded-full flex items-center justify-center text-3xl font-bold text-white shadow-xl mb-4 ring-4 ring-[#00a884]/30"
          style={{ background: 'linear-gradient(135deg, #00a884 0%, #025144 100%)' }}>
          {community?.name?.[0]?.toUpperCase() || '?'}
        </div>
        <h2 className="text-[18px] font-bold text-white text-center leading-tight">
          {community?.name || '…'}
        </h2>
        <p className="text-sm mt-1" style={{ color: '#8696a0' }}>
          {community?.department}{community?.is_private ? ' · 🔒 Private' : ''}
        </p>
        {community?.description && (
          <p className="text-xs text-center mt-2 max-w-xs leading-relaxed" style={{ color: '#8696a0' }}>
            {community.description}
          </p>
        )}

        {/* Stats pills */}
        <div className="flex items-center gap-3 mt-5">
          <div className="flex flex-col items-center px-5 py-2.5 rounded-2xl"
            style={{ background: '#2a3942' }}>
            <span className="text-lg font-bold text-white">{members.length}</span>
            <span className="text-[11px]" style={{ color: '#8696a0' }}>Members</span>
          </div>
          <div className="flex flex-col items-center px-5 py-2.5 rounded-2xl"
            style={{ background: '#2a3942' }}>
            <span className="text-lg font-bold" style={{ color: '#ffd700' }}>
              {members.filter(m => m.role === 'admin').length}
            </span>
            <span className="text-[11px]" style={{ color: '#8696a0' }}>Admins</span>
          </div>
          <div className="flex flex-col items-center px-5 py-2.5 rounded-2xl"
            style={{ background: '#2a3942' }}>
            <span className="text-lg font-bold" style={{ color: '#00a884' }}>
              {community?.department?.slice(0, 4) || '—'}
            </span>
            <span className="text-[11px]" style={{ color: '#8696a0' }}>Dept</span>
          </div>
        </div>
      </div>

      {/* ── Search ── */}
      <div className="px-4 py-3" style={{ background: '#202c33' }}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: '#8696a0' }} />
          <Input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search members…"
            className="pl-9 h-9 rounded-xl text-sm border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            style={{ background: '#2a3942', color: '#e9edef', caretColor: '#00a884' }} />
          {search && (
            <button onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#8696a0' }}>
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ── List ── */}
      <div className="flex-1 overflow-y-auto" style={{ background: '#111b21' }}>
        {loading ? (
          <div style={{ background: '#202c33' }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3 animate-pulse"
                style={{ borderBottom: '1px solid #2a3942' }}>
                <div className="h-12 w-12 rounded-full flex-shrink-0" style={{ background: '#2a3942' }} />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-36 rounded" style={{ background: '#2a3942' }} />
                  <div className="h-3 w-24 rounded" style={{ background: '#2a3942' }} />
                </div>
              </div>
            ))}
          </div>
        ) : total === 0 ? (
          <div className="flex flex-col items-center justify-center py-20"
            style={{ background: '#202c33' }}>
            <Users className="h-12 w-12 mb-3" style={{ color: '#2a3942' }} />
            <p className="text-sm" style={{ color: '#8696a0' }}>
              {search ? 'No members match your search' : 'No members yet'}
            </p>
          </div>
        ) : (
          <>
            {/* Participants count */}
            <div className="px-4 py-2.5 flex items-center gap-2"
              style={{ background: '#202c33', borderBottom: '1px solid #2a3942' }}>
              <Info className="h-3.5 w-3.5 flex-shrink-0" style={{ color: '#00a884' }} />
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#00a884' }}>
                {total} participant{total !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Admins */}
            {admins.length > 0 && (
              <div style={{ background: '#202c33' }}>
                <div className="px-4 pt-3 pb-1 flex items-center gap-1.5">
                  <Crown className="h-3 w-3" style={{ color: '#ffd700' }} />
                  <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#ffd700' }}>
                    Admins
                  </span>
                </div>
                {admins.map(m => (
                  <MemberRow key={m.user_id} m={m} profile={profiles[m.user_id]}
                    isMe={m.user_id === user!.id} canRemove={false}
                    onRemove={removeMember} colors={getColors(m.user_id)} />
                ))}
              </div>
            )}

            {/* Divider */}
            {admins.length > 0 && regular.length > 0 && (
              <div className="h-2" style={{ background: '#111b21' }} />
            )}

            {/* Members */}
            {regular.length > 0 && (
              <div style={{ background: '#202c33' }}>
                <div className="px-4 pt-3 pb-1 flex items-center gap-1.5">
                  <Users className="h-3 w-3" style={{ color: '#8696a0' }} />
                  <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#8696a0' }}>
                    Members
                  </span>
                </div>
                {regular.map(m => (
                  <MemberRow key={m.user_id} m={m} profile={profiles[m.user_id]}
                    isMe={m.user_id === user!.id}
                    canRemove={isAdmin && m.user_id !== user!.id}
                    onRemove={removeMember} colors={getColors(m.user_id)} />
                ))}
              </div>
            )}

            <div className="h-8" />
          </>
        )}
      </div>
    </div>
  );
}

function MemberRow({ m, profile, isMe, canRemove, onRemove, colors }: any) {
  const [hovered, setHovered] = useState(false);
  const name = profile?.full_name || 'Anonymous';
  const isAdminRole = m.role === 'admin';
  const [from, to] = colors;

  return (
    <div className="flex items-center gap-3 px-4 py-3 transition-colors"
      style={{ borderBottom: '1px solid #2a3942', background: hovered ? '#2a3942' : 'transparent', cursor: 'default' }}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>

      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <div className="h-12 w-12 rounded-full flex items-center justify-center text-sm font-bold text-white"
          style={{ background: `linear-gradient(135deg, ${from} 0%, ${to} 100%)` }}>
          {getInitials(name)}
        </div>
        {isAdminRole && (
          <div className="absolute -bottom-0.5 -right-0.5 h-5 w-5 rounded-full flex items-center justify-center"
            style={{ background: hovered ? '#2a3942' : '#202c33', border: '1.5px solid #111b21' }}>
            <Crown className="h-3 w-3" style={{ color: '#ffd700' }} />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm" style={{ color: '#e9edef' }}>{name}</span>
          {isMe && (
            <span className="text-[11px] px-1.5 py-0.5 rounded-full font-semibold"
              style={{ background: '#00a88422', color: '#00a884' }}>You</span>
          )}
        </div>
        {profile?.department && (
          <span className="flex items-center gap-1 text-xs mt-0.5 truncate" style={{ color: '#8696a0' }}>
            <GraduationCap className="h-3 w-3 flex-shrink-0" />
            {profile.department}
            {profile.year ? ` · Year ${profile.year}` : ''}
            {profile.section ? ` · Sec ${profile.section}` : ''}
          </span>
        )}
      </div>

      {/* Right badges */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {isAdminRole && (
          <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
            style={{ background: '#ffd70018', color: '#ffd700', border: '1px solid #ffd70030' }}>
            Admin
          </span>
        )}
        {canRemove && hovered && (
          <button onClick={e => { e.stopPropagation(); onRemove(m.user_id); }}
            className="p-1.5 rounded-full transition-colors"
            style={{ background: '#ef444420', color: '#ef4444' }} title="Remove">
            <UserMinus className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
