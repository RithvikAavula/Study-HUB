import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const CommunityMembers: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [community, setCommunity] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [profileMap, setProfileMap] = useState<Record<string, string>>({});
  const [isMember, setIsMember] = useState(false);

  useEffect(() => {
    if (!user) { navigate('/auth'); return; }
    if (!id) { navigate('/communities'); return; }
    (async () => {
      await fetchCommunity();
      await fetchMembership();
      await fetchMembers();
    })();
  }, [user, id]);

  const fetchCommunity = async () => {
    const { data } = await supabase.from('communities').select('*').eq('id', id!).single();
    setCommunity(data);
  };

  const fetchMembership = async () => {
    const { data } = await supabase
      .from('community_members')
      .select('role')
      .eq('community_id', id!)
      .eq('user_id', user!.id)
      .maybeSingle();
    setIsMember(!!data);
  };

  const fetchMembers = async () => {
    const { data } = await supabase
      .from('community_members')
      .select('user_id, role')
      .eq('community_id', id!);
    const list = data || [];
    setMembers(list);
    const ids = Array.from(new Set(list.map(m => m.user_id).filter(Boolean)));
    await fetchProfiles(ids);
  };

  const fetchProfiles = async (ids: string[]) => {
    const missing = ids.filter(id => !(id in profileMap));
    if (missing.length === 0) return;
    const { data } = await supabase.from('profiles').select('user_id, full_name').in('user_id', missing);
    const map = { ...profileMap } as Record<string, string>;
    (data || []).forEach(p => map[p.user_id] = p.full_name || 'Anonymous');
    setProfileMap(map);
  };

  if (!user || !id) return null;
  if (!isMember) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-6">
          <Card><CardContent className="p-6">You need to join this community to view members.</CardContent></Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-6 lg:py-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Members</h1>
            <p className="text-muted-foreground">{community?.name}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate(`/communities/${id}`)}>Overview</Button>
          </div>
        </div>
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              {members.map(m => (
                <div key={m.user_id} className="text-sm text-muted-foreground">
                  {profileMap[m.user_id] || m.user_id} — {m.role}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CommunityMembers;
