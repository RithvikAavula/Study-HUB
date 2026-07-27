import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ResourceCard } from '@/components/ResourceCard';
import { ResourcePreview } from '@/components/ResourcePreview';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageCircle, Users, Shield, ArrowRight, Lock } from 'lucide-react';

const CommunityPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [community, setCommunity] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [isMember, setIsMember] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const [messages, setMessages] = useState<any[]>([]);
  const [messageText, setMessageText] = useState('');
  const [profileMap, setProfileMap] = useState<Record<string, string>>({});

  const [shareOpen, setShareOpen] = useState(false);
  const [myResources, setMyResources] = useState<any[]>([]);
  const [shareResourceId, setShareResourceId] = useState('');
  const [communityResources, setCommunityResources] = useState<any[]>([]);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [privateResources, setPrivateResources] = useState<any[]>([]);
  const [previewResource, setPreviewResource] = useState<any>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  useEffect(() => {
    if (!user) { navigate('/auth'); return; }
    if (!id) { navigate('/communities'); return; }
    fetchAll();
  }, [user, id]);

  const fetchAll = async () => {
    await Promise.all([
      fetchCommunity(),
      fetchMembership(),
      fetchMembers(),
      fetchMessages(),
      fetchCommunityResources(),
      fetchPrivateResources(),
      fetchMyResources(),
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

  const fetchMembers = async () => {
    const { data } = await supabase
      .from('community_members')
      .select('user_id, role')
      .eq('community_id', id!);
    const list = data || [];
    setMembers(list);
    // Load member names
    const ids = Array.from(new Set(list.map(m => m.user_id).filter(Boolean)));
    await fetchProfiles(ids);
  };

  // Requests moved to dedicated page

  const fetchMessages = async () => {
    const { data } = await supabase
      .from('community_messages')
      .select('*')
      .eq('community_id', id!)
      .order('created_at', { ascending: true });
    const list = data || [];
    setMessages(list);
    const ids = Array.from(new Set(list.map(m => m.user_id).filter(Boolean)));
    await fetchProfiles(ids);
  };

  const fetchProfiles = async (ids: string[]) => {
    // Merge into existing map; avoid empty IN queries
    const missing = ids.filter(id => !(id in profileMap));
    if (missing.length === 0) return;
    const { data } = await supabase
      .from('profiles')
      .select('user_id, full_name')
      .in('user_id', missing);
    const map: Record<string, string> = { ...profileMap };
    (data || []).forEach(p => { map[p.user_id] = p.full_name || 'Anonymous'; });
    setProfileMap(map);
  };

  const fetchMyResources = async () => {
    const { data } = await supabase
      .from('resources')
      .select('*')
      .eq('uploaded_by', user!.id)
      .order('created_at', { ascending: false });
    setMyResources(data || []);
  };

  const fetchCommunityResources = async () => {
    const { data, error } = await supabase
      .from('community_resources')
      .select('resource_id')
      .eq('community_id', id!);
    if (error) return;
    const resourceIds = (data || []).map(r => r.resource_id);
    if (resourceIds.length === 0) { setCommunityResources([]); return; }
    const { data: res } = await supabase
      .from('resources')
      .select('*')
      .in('id', resourceIds);
    setCommunityResources(res || []);
  };

  const fetchPrivateResources = async () => {
    const { data } = await supabase
      .from('community_custom_resources')
      .select('*')
      .eq('community_id', id!);
    const list = data || [];
    // Prepare signed URLs for each file
    const withUrls: any[] = [];
    for (const r of list) {
      const { data: urlData } = await supabase.storage
        .from('community-resources')
        .createSignedUrl(r.file_path, 3600);
      withUrls.push({ ...r, file_url: urlData?.signedUrl || null });
    }
    setPrivateResources(withUrls);
  };

  const requestJoin = async () => {
    try {
      const { error } = await supabase
        .from('membership_requests')
        .insert({ community_id: id!, user_id: user!.id, status: 'pending' });
      if (error) throw error;
      toast({ title: 'Request sent', description: 'Admin will review your request.' });
      // requests page handles its own refresh
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Could not send request', variant: 'destructive' });
    }
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

  const openShareResource = () => setShareOpen(true);
  const shareResource = async () => {
    if (!shareResourceId) return;
    try {
      const { error } = await supabase
        .from('community_resources')
        .insert({ community_id: id!, resource_id: shareResourceId, created_by: user!.id });
      if (error) throw error;
      setShareResourceId('');
      setShareOpen(false);
      await fetchCommunityResources();
      toast({ title: 'Resource shared', description: 'Resource is now available to community members.' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to share resource', variant: 'destructive' });
    }
  };

  const handlePreview = (resource: any) => {
    setPreviewResource(resource);
    setIsPreviewOpen(true);
  };

  const handleDownload = async (resource: any) => {
    try {
      if (resource.file_url) {
        const link = document.createElement('a');
        link.href = resource.file_url;
        link.download = resource.title || 'download';
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast({ title: 'Download started', description: `Downloading ${resource.title}` });
      }
    } catch (error: any) {
      const message = error?.message || 'There was an error downloading the file. Please try again.';
      toast({ title: 'Download failed', description: message, variant: 'destructive' });
    }
  };

  const handlePrivateUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile || !uploadTitle) return;
    setUploading(true);
    try {
      const ext = uploadFile.name.split('.').pop();
      const path = `community/${id}/${user!.id}-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('community-resources')
        .upload(path, uploadFile, { contentType: uploadFile.type, upsert: false });
      if (upErr) throw upErr;
      const { error: dbErr } = await supabase
        .from('community_custom_resources')
        .insert({
          community_id: id!,
          uploaded_by: user!.id,
          title: uploadTitle,
          description: uploadDescription,
          file_path: path,
          file_type: uploadFile.type,
          file_size: uploadFile.size,
        });
      if (dbErr) throw dbErr;
      toast({ title: 'Uploaded', description: 'Private resource uploaded to the community.' });
      setUploadOpen(false);
      setUploadFile(null);
      setUploadTitle('');
      setUploadDescription('');
      await fetchPrivateResources();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Upload failed', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  if (!user || !id) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-6 lg:py-10 max-w-4xl pb-24 md:pb-10">

        {/* ── Community Header ── */}
        <div className="flex items-start justify-between mb-6 gap-4">
          <div className="flex items-center gap-4">
            <div
              className="h-16 w-16 rounded-full flex items-center justify-center text-2xl font-bold text-white flex-shrink-0 shadow-lg"
              style={{ background: 'linear-gradient(135deg, #00a884 0%, #025144 100%)' }}
            >
              {community?.name?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{community?.name || 'Community'}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-muted-foreground">{community?.department}</span>
                {community?.is_private && (
                  <span className="flex items-center gap-1 text-xs text-amber-400">
                    <Lock className="h-3 w-3" /> Private
                  </span>
                )}
                <span className="text-xs text-muted-foreground">· {members.length} members</span>
              </div>
            </div>
          </div>
          {!isMember && community?.created_by !== user.id && (
            <Button onClick={requestJoin} className="flex-shrink-0">Request to Join</Button>
          )}
        </div>

        {/* ── Navigation Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
          <button
            onClick={() => navigate(`/communities/${id}/messages`)}
            className="group flex items-center gap-3 p-4 rounded-2xl border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg text-left"
            style={{ background: '#005c4b22', borderColor: '#00a88433' }}
          >
            <div className="h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#005c4b' }}>
              <MessageCircle className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-foreground">Messages</p>
              <p className="text-xs text-muted-foreground truncate">
                {messages.length > 0
                  ? `${profileMap[messages[messages.length - 1]?.user_id] || 'Someone'}: ${messages[messages.length - 1]?.content?.slice(0, 28)}…`
                  : 'No messages yet'}
              </p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
          </button>

          <button
            onClick={() => navigate(`/communities/${id}/members`)}
            className="group flex items-center gap-3 p-4 rounded-2xl border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg text-left"
            style={{ background: '#1d283a', borderColor: '#2a3942' }}
          >
            <div className="h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 bg-primary/20">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm text-foreground">Members</p>
              <p className="text-xs text-muted-foreground">{members.length} participant{members.length !== 1 ? 's' : ''}</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
          </button>

          {isAdmin && (
            <button
              onClick={() => navigate(`/communities/${id}/requests`)}
              className="group flex items-center gap-3 p-4 rounded-2xl border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg text-left"
              style={{ background: '#2a1a0a', borderColor: '#ff980033' }}
            >
              <div className="h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#ff980033' }}>
                <Shield className="h-5 w-5" style={{ color: '#ff9800' }} />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm text-foreground">Requests</p>
                <p className="text-xs text-muted-foreground">Manage join requests</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
            </button>
          )}
        </div>

        {/* Resources in community */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
          <div className="font-semibold">Shared Resources</div>
          {isMember && (
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => setUploadOpen(true)} className="flex-1 sm:flex-none text-xs sm:text-sm">Upload Private</Button>
              <Button size="sm" onClick={openShareResource} className="flex-1 sm:flex-none text-xs sm:text-sm">Share Existing</Button>
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
          {[...privateResources, ...communityResources].map((resource, index) => (
            <div key={resource.id} className="animate-fade-in" style={{ animationDelay: `${index * 0.05}s` }}>
              <ResourceCard
                {...{
                  title: resource.title,
                  description: resource.description,
                  type: (
                    resource.resource_type === 'PDFs' ? 'PDFs'
                    : resource.resource_type === 'Images' ? 'Images'
                    : resource.resource_type === 'Previous Papers' ? 'Previous Papers'
                    : resource.resource_type === 'Assignments' ? 'Assignments'
                    : resource.resource_type === 'Notes' ? 'Notes'
                    : (resource.file_type?.startsWith('image/') ? 'Images' : (resource.file_type === 'application/pdf' ? 'PDFs' : 'Others'))),
                  department: resource.department || community?.department || '',
                  year: `${resource.year || ''}`,
                  subject: resource.subject || '',
                  author: '',
                  likes: resource.likes_count || 0,
                  rating: 0,
                  downloads: resource.download_count || 0,
                  uploadDate: new Date(resource.created_at).toLocaleDateString(),
                  id: resource.id,
                  file_url: resource.file_url,
                }}
                onPreview={handlePreview}
                onDownload={handleDownload}
              />
            </div>
          ))}
        </div>

        {/* Share dialog */}
        <Dialog open={shareOpen} onOpenChange={setShareOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Share a Resource</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Label>Select from your uploads</Label>
              <Select value={shareResourceId} onValueChange={setShareResourceId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a resource" />
                </SelectTrigger>
                <SelectContent>
                  {myResources.map(r => (
                    <SelectItem key={r.id} value={r.id}>{r.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShareOpen(false)}>Cancel</Button>
                <Button onClick={shareResource} disabled={!shareResourceId}>Share</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Private upload dialog */}
        <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Upload Private Resource</DialogTitle>
            </DialogHeader>
            <form onSubmit={handlePrivateUpload} className="space-y-3">
              <Label htmlFor="pr_title">Title *</Label>
              <Input id="pr_title" value={uploadTitle} onChange={e => setUploadTitle(e.target.value)} required />
              <Label htmlFor="pr_desc">Description</Label>
              <Input id="pr_desc" value={uploadDescription} onChange={e => setUploadDescription(e.target.value)} />
              <Label htmlFor="pr_file">File *</Label>
              <Input id="pr_file" type="file" onChange={e => setUploadFile(e.target.files?.[0] || null)} required />
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setUploadOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={uploading}>{uploading ? 'Uploading...' : 'Upload'}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Preview dialog */}
        <ResourcePreview
          resource={previewResource}
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          onDownload={handleDownload}
        />
      </div>
    </div>
  );
};

export default CommunityPage;
