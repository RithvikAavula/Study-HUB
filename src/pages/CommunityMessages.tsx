import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Send, Trash2 } from 'lucide-react';

const CommunityMessages: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [community, setCommunity] = useState<any>(null);
  const [isMember, setIsMember] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [messageText, setMessageText] = useState('');
  const [profileMap, setProfileMap] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!user) { navigate('/auth'); return; }
    if (!id) { navigate('/communities'); return; }
    fetchInitial();
  }, [user, id]);

  const fetchInitial = async () => {
    await Promise.all([
      fetchCommunity(),
      fetchMembership(),
      fetchMessages(),
    ]);
  };

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
    setIsAdmin((data?.role || '') === 'admin');
  };

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from('community_messages')
      .select('*')
      .eq('community_id', id!)
      .order('created_at', { ascending: true });
    if (error) { return; }
    const list = data || [];
    setMessages(list);
    const ids = Array.from(new Set(list.map(m => m.user_id).filter(Boolean)));
    await fetchProfiles(ids);
  };

  const deleteMessage = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('community_messages')
        .delete()
        .eq('id', messageId);
      if (error) throw error;
      toast({ title: 'Message deleted', description: 'The message was removed.' });
      await fetchMessages();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to delete message', variant: 'destructive' });
    }
  };

  const fetchProfiles = async (ids: string[]) => {
    const missing = ids.filter(uid => !(uid in profileMap));
    if (missing.length === 0) return;
    const { data } = await supabase
      .from('profiles')
      .select('user_id, full_name')
      .in('user_id', missing);
    const map: Record<string, string> = { ...profileMap };
    (data || []).forEach(p => { map[p.user_id] = p.full_name || 'Anonymous'; });
    setProfileMap(map);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    try {
      const { error } = await supabase
        .from('community_messages')
        .insert({ community_id: id!, user_id: user!.id, content: messageText.trim() });
      if (error) throw error;
      setMessageText('');
      await fetchMessages();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to send message', variant: 'destructive' });
    }
  };

  if (!user || !id) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-6 lg:py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold">{community?.name || 'Community Messages'}</h1>
            <p className="text-muted-foreground">Department: {community?.department}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate(`/communities/${id}`)}>Overview</Button>
            <Button variant="outline" size="sm" onClick={() => navigate(`/communities/${id}/members`)}>Members</Button>
            {isAdmin && (
              <Button variant="outline" size="sm" onClick={() => navigate(`/communities/${id}/requests`)}>Requests</Button>
            )}
          </div>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="font-semibold mb-2">Community Chat</div>
            <div className="space-y-2 max-h-[450px] overflow-auto border rounded p-2 mb-3">
              {messages.map(msg => (
                <div key={msg.id} className="text-sm flex items-start justify-between gap-2">
                  <div>
                    <span className="text-muted-foreground">{profileMap[msg.user_id] || msg.user_id}:</span> {msg.content}
                  </div>
                  {(msg.user_id === user!.id || isAdmin) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-muted-foreground hover:text-destructive"
                      onClick={() => deleteMessage(msg.id)}
                      title="Delete message"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              {messages.length === 0 && (
                <div className="text-sm text-muted-foreground">No messages yet.</div>
              )}
            </div>
            {isMember ? (
              <form onSubmit={sendMessage} className="flex gap-2">
                <Input value={messageText} onChange={e => setMessageText(e.target.value)} placeholder="Type a message..." />
                <Button type="submit"><Send className="h-4 w-4 mr-1" />Send</Button>
              </form>
            ) : (
              <div className="text-sm text-muted-foreground">Join the community to post and view messages.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CommunityMessages;
