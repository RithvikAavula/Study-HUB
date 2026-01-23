import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const CommunityRequests: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [community, setCommunity] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [requests, setRequests] = useState<any[]>([]);
  const [profileMap, setProfileMap] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!user) { navigate('/auth'); return; }
    if (!id) { navigate('/communities'); return; }
    (async () => {
      await fetchCommunity();
      await fetchAdmin();
      await fetchRequests();
    })();
  }, [user, id]);

  const fetchCommunity = async () => {
    const { data } = await supabase.from('communities').select('*').eq('id', id!).single();
    setCommunity(data);
  };

  const fetchAdmin = async () => {
    const { data } = await supabase
      .from('community_members')
      .select('role')
      .eq('community_id', id!)
      .eq('user_id', user!.id)
      .maybeSingle();
    setIsAdmin((data?.role || '') === 'admin');
  };

  const fetchRequests = async () => {
    const { data } = await supabase
      .from('membership_requests')
      .select('*')
      .eq('community_id', id!)
      .eq('status', 'pending');
    const list = data || [];
    setRequests(list);
    const ids = Array.from(new Set(list.map(r => r.user_id).filter(Boolean)));
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

  const approveRequest = async (req: any) => {
    try {
      const { error } = await supabase
        .from('membership_requests')
        .update({ status: 'approved' })
        .eq('id', req.id);
      if (error) throw error;
      toast({ title: 'Approved', description: 'Member added to community.' });
      await fetchRequests();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Could not approve request', variant: 'destructive' });
    }
  };

  const rejectRequest = async (req: any) => {
    try {
      const { error } = await supabase
        .from('membership_requests')
        .update({ status: 'rejected' })
        .eq('id', req.id);
      if (error) throw error;
      toast({ title: 'Rejected', description: 'Request rejected.' });
      await fetchRequests();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Could not reject request', variant: 'destructive' });
    }
  };

  if (!user || !id) return null;
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-6">
          <Card><CardContent className="p-6">Only admins can view requests.</CardContent></Card>
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
            <h1 className="text-2xl font-bold">Pending Requests</h1>
            <p className="text-muted-foreground">{community?.name}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate(`/communities/${id}`)}>Overview</Button>
            <Button variant="outline" size="sm" onClick={() => navigate(`/communities/${id}/members`)}>Members</Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-4">
            {requests.length === 0 ? (
              <div className="text-sm text-muted-foreground">No pending requests.</div>
            ) : (
              <div className="space-y-3">
                {requests.map(r => (
                  <div key={r.id} className="flex items-center justify-between">
                    <div className="text-sm">{profileMap[r.user_id] || r.user_id}</div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="default" onClick={() => approveRequest(r)}>Approve</Button>
                      <Button size="sm" variant="outline" onClick={() => rejectRequest(r)}>Reject</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CommunityRequests;
