import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import {
  User, FileText, Heart, Download, Star, Camera, Phone, Mail,
  GraduationCap, BookOpen, ThumbsUp, Loader2, Edit3, Check, X,
} from 'lucide-react';

interface ProfileData {
  full_name: string;
  email: string;
  department: string;
  year: number;
  section: string;
  avatar_url?: string;
  bio?: string;
  phone?: string;
}

interface Resource {
  id: string;
  title: string;
  description: string;
  resource_type: string;
  department: string;
  year: string;
  subject: string;
  file_url: string;
  likes_count: number;
  download_count: number;
  created_at: string;
  uploaded_by: string;
}

const BUCKET = 'academic-resources';

function getOrdinalSuffix(n: number) {
  const j = n % 10, k = n % 100;
  if (j === 1 && k !== 11) return 'st';
  if (j === 2 && k !== 12) return 'nd';
  if (j === 3 && k !== 13) return 'rd';
  return 'th';
}

function typeColor(type: string) {
  const map: Record<string, string> = {
    Notes: 'from-blue-500/20 to-cyan-500/20 text-blue-400 border-blue-500/30',
    PDFs: 'from-purple-500/20 to-pink-500/20 text-purple-400 border-purple-500/30',
    Images: 'from-green-500/20 to-emerald-500/20 text-green-400 border-green-500/30',
    'Previous Papers': 'from-orange-500/20 to-amber-500/20 text-orange-400 border-orange-500/30',
    Assignments: 'from-primary/20 to-accent/20 text-primary border-primary/30',
  };
  return map[type] ?? 'from-muted/20 to-muted/10 text-muted-foreground border-border/30';
}

const ActivityResourceCard = ({ r }: { r: Resource }) => {
  const color = typeColor(r.resource_type);
  return (
    <div className="group glass rounded-xl border border-border/40 hover:border-primary/30 transition-all duration-300 overflow-hidden hover:-translate-y-0.5">
      <div className={`h-0.5 w-full bg-gradient-to-r ${color.split(' ')[0]} ${color.split(' ')[1]}`} />
      <div className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <div className={`p-2 rounded-lg bg-gradient-to-br ${color.split(' ')[0]} ${color.split(' ')[1]} flex-shrink-0`}>
            <FileText className="h-3.5 w-3.5 text-foreground/80" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors line-clamp-1">{r.title}</p>
            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{r.description}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 mb-3">
          <Badge variant="outline" className={`text-xs px-2 py-0 bg-gradient-to-r ${color}`}>{r.resource_type}</Badge>
          <Badge variant="outline" className="text-xs px-2 py-0 bg-white/5 border-border/40 text-muted-foreground">{r.department}</Badge>
          <Badge variant="outline" className="text-xs px-2 py-0 bg-white/5 border-border/40 text-muted-foreground">{r.year}</Badge>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Heart className="h-3 w-3 text-red-400" />{r.likes_count}</span>
          <span className="flex items-center gap-1"><Download className="h-3 w-3 text-blue-400" />{r.download_count}</span>
          <span className="ml-auto opacity-60">{new Date(r.created_at).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, value, label, color }: { icon: any; value: number | string; label: string; color: string }) => (
  <div className="glass rounded-xl border border-border/40 p-4 text-center hover:border-primary/30 transition-all duration-300">
    <Icon className={`h-5 w-5 mx-auto mb-2 ${color}`} />
    <div className="text-xl font-bold text-foreground">{value}</div>
    <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
  </div>
);

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [editedData, setEditedData] = useState<Partial<ProfileData>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const [myUploads, setMyUploads] = useState<Resource[]>([]);
  const [likedResources, setLikedResources] = useState<Resource[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);

  const [stats, setStats] = useState({ uploads: 0, likes: 0, downloads: 0, rating: 0 });

  useEffect(() => {
    if (!user) { navigate('/auth'); return; }
    loadProfile();
    loadActivity();
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    const { data } = await supabase.from('profiles').select('*').eq('user_id', user.id).single();
    if (data) { setProfileData(data); setEditedData(data); }
  };

  const loadActivity = async () => {
    if (!user) return;
    setActivityLoading(true);
    try {
      // My uploads
      const { data: uploads } = await supabase
        .from('resources').select('*').eq('uploaded_by', user.id).order('created_at', { ascending: false });
      const uploadList = uploads || [];
      setMyUploads(uploadList);

      // Stats from uploads
      const totalLikes = uploadList.reduce((s, r) => s + (r.likes_count || 0), 0);
      const totalDownloads = uploadList.reduce((s, r) => s + (r.download_count || 0), 0);

      // Average rating
      const ids = uploadList.map(r => r.id);
      let avgRating = 0;
      if (ids.length) {
        const { data: ratingsData } = await supabase.from('ratings').select('rating').in('resource_id', ids);
        if (ratingsData?.length) {
          avgRating = parseFloat((ratingsData.reduce((s, r) => s + r.rating, 0) / ratingsData.length).toFixed(1));
        }
      }
      setStats({ uploads: uploadList.length, likes: totalLikes, downloads: totalDownloads, rating: avgRating });

      // Liked resources
      const { data: likeRows } = await supabase.from('likes').select('resource_id').eq('user_id', user.id);
      if (likeRows?.length) {
        const likedIds = likeRows.map(l => l.resource_id);
        const { data: likedRes } = await supabase.from('resources').select('*').in('id', likedIds).order('created_at', { ascending: false });
        setLikedResources(likedRes || []);
      }
    } finally {
      setActivityLoading(false);
    }
  };

  const handleAvatarClick = () => isEditing && fileInputRef.current?.click();

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Avatar must be under 2MB.', variant: 'destructive' });
      return;
    }
    setIsUploadingAvatar(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `avatars/${user.id}/avatar.${ext}`;
      const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(path);
      const url = `${publicUrl}?t=${Date.now()}`;
      await supabase.from('profiles').update({ avatar_url: url }).eq('user_id', user.id);
      setProfileData(p => p ? { ...p, avatar_url: url } : p);
      setEditedData(p => ({ ...p, avatar_url: url }));
      toast({ title: 'Avatar updated!' });
    } catch (err: any) {
      toast({ title: 'Upload failed', description: err.message, variant: 'destructive' });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    const { error } = await supabase.from('profiles').update(editedData).eq('user_id', user.id);
    setIsSaving(false);
    if (error) { toast({ title: 'Update failed', description: error.message, variant: 'destructive' }); return; }
    setProfileData(p => ({ ...p!, ...editedData }));
    setIsEditing(false);
    toast({ title: 'Profile updated!' });
  };

  const initials = profileData?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() ?? '?';

  if (!user || !profileData) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero banner */}
      <div className="relative h-40 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-accent/20 to-background" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent" />
      </div>

      <div className="container mx-auto px-4 max-w-6xl -mt-16 pb-12">
        <div className="grid lg:grid-cols-3 gap-6">

          {/* ── Left: Profile Card ── */}
          <div className="lg:col-span-1 space-y-4">
            <div className="glass rounded-2xl border border-border/40 p-6 text-center">
              {/* Avatar */}
              <div className="relative inline-block mb-4">
                <div className="p-1 rounded-full bg-gradient-to-br from-primary/50 to-accent/50">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={profileData.avatar_url} />
                    <AvatarFallback className="text-xl bg-gradient-to-br from-primary/30 to-accent/30 text-foreground font-bold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </div>
                {isEditing && (
                  <button
                    onClick={handleAvatarClick}
                    disabled={isUploadingAvatar}
                    className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-primary flex items-center justify-center shadow-lg hover:bg-primary/80 transition-colors"
                  >
                    {isUploadingAvatar
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
                      : <Camera className="h-3.5 w-3.5 text-white" />}
                  </button>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </div>

              <h2 className="text-xl font-bold text-foreground mb-1">{profileData.full_name}</h2>
              <div className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground mb-2">
                <GraduationCap className="h-4 w-4" />
                <span>{profileData.department} · {profileData.year}{getOrdinalSuffix(profileData.year)} Year</span>
              </div>
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 mb-4">
                Section {profileData.section}
              </Badge>

              <div className="space-y-2 text-sm text-muted-foreground mb-5">
                <div className="flex items-center justify-center gap-2">
                  <Mail className="h-3.5 w-3.5" /><span className="truncate">{profileData.email}</span>
                </div>
                {profileData.phone && (
                  <div className="flex items-center justify-center gap-2">
                    <Phone className="h-3.5 w-3.5" /><span>{profileData.phone}</span>
                  </div>
                )}
              </div>

              {profileData.bio && (
                <p className="text-xs text-muted-foreground bg-white/5 rounded-lg p-3 mb-5 text-left leading-relaxed">
                  {profileData.bio}
                </p>
              )}

              {!isEditing ? (
                <Button onClick={() => setIsEditing(true)} className="w-full bg-gradient-to-r from-primary/80 to-accent/80 hover:from-primary hover:to-accent text-white border-0">
                  <Edit3 className="h-4 w-4 mr-2" />Edit Profile
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button onClick={handleSave} disabled={isSaving} className="flex-1 bg-gradient-to-r from-primary/80 to-accent/80 hover:from-primary hover:to-accent text-white border-0">
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}
                    Save
                  </Button>
                  <Button onClick={() => { setIsEditing(false); setEditedData(profileData); }} variant="outline" className="flex-1">
                    <X className="h-4 w-4 mr-1" />Cancel
                  </Button>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard icon={BookOpen} value={stats.uploads} label="Uploads" color="text-primary" />
              <StatCard icon={Heart} value={stats.likes} label="Likes" color="text-red-400" />
              <StatCard icon={Download} value={stats.downloads} label="Downloads" color="text-blue-400" />
              <StatCard icon={Star} value={stats.rating || '—'} label="Avg Rating" color="text-amber-400" />
            </div>
          </div>

          {/* ── Right: Tabs ── */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-2 glass border border-border/40 mb-6">
                <TabsTrigger value="details" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                  <User className="h-4 w-4 mr-2" />Profile Details
                </TabsTrigger>
                <TabsTrigger value="activity" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                  <FileText className="h-4 w-4 mr-2" />My Activity
                </TabsTrigger>
              </TabsList>

              {/* ── Profile Details ── */}
              <TabsContent value="details" className="space-y-4">
                <div className="glass rounded-2xl border border-border/40 p-6 space-y-5">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" />Personal Information
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Full Name</Label>
                      {isEditing
                        ? <Input value={editedData.full_name || ''} onChange={e => setEditedData(p => ({ ...p, full_name: e.target.value }))} className="bg-white/5 border-border/40" />
                        : <div className="text-sm font-medium p-2.5 bg-white/5 rounded-lg border border-border/30">{profileData.full_name}</div>}
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Email</Label>
                      <div className="text-sm p-2.5 bg-white/5 rounded-lg border border-border/30 text-muted-foreground">{profileData.email}</div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Phone</Label>
                      {isEditing
                        ? <Input type="tel" placeholder="Enter phone number" value={editedData.phone || ''} onChange={e => setEditedData(p => ({ ...p, phone: e.target.value }))} className="bg-white/5 border-border/40" />
                        : <div className="text-sm font-medium p-2.5 bg-white/5 rounded-lg border border-border/30">{profileData.phone || <span className="text-muted-foreground">Not provided</span>}</div>}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Bio</Label>
                    {isEditing
                      ? <Textarea placeholder="Tell us about yourself..." value={editedData.bio || ''} onChange={e => setEditedData(p => ({ ...p, bio: e.target.value }))} rows={3} className="bg-white/5 border-border/40 resize-none" />
                      : <div className="text-sm font-medium p-2.5 bg-white/5 rounded-lg border border-border/30 min-h-[72px]">{profileData.bio || <span className="text-muted-foreground">No bio provided</span>}</div>}
                  </div>
                </div>

                <div className="glass rounded-2xl border border-border/40 p-6">
                  <h3 className="font-semibold text-foreground flex items-center gap-2 mb-4">
                    <GraduationCap className="h-4 w-4 text-primary" />Academic Information
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { label: 'Department', value: profileData.department },
                      { label: 'Year', value: `${profileData.year}${getOrdinalSuffix(profileData.year)} Year` },
                      { label: 'Section', value: `Section ${profileData.section}` },
                    ].map(({ label, value }) => (
                      <div key={label} className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">{label}</Label>
                        <div className="text-sm font-medium p-2.5 bg-white/5 rounded-lg border border-border/30 text-muted-foreground">{value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* ── My Activity ── */}
              <TabsContent value="activity">
                <Tabs defaultValue="uploads">
                  <TabsList className="glass border border-border/40 mb-5">
                    <TabsTrigger value="uploads" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                      <BookOpen className="h-3.5 w-3.5 mr-1.5" />My Uploads ({stats.uploads})
                    </TabsTrigger>
                    <TabsTrigger value="liked" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                      <ThumbsUp className="h-3.5 w-3.5 mr-1.5" />Liked ({likedResources.length})
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="uploads">
                    {activityLoading ? (
                      <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                    ) : myUploads.length === 0 ? (
                      <div className="glass rounded-2xl border border-border/40 py-16 text-center">
                        <BookOpen className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
                        <p className="text-muted-foreground font-medium">No uploads yet</p>
                        <p className="text-xs text-muted-foreground/60 mt-1">Share your first resource with the community!</p>
                      </div>
                    ) : (
                      <div className="grid sm:grid-cols-2 gap-3">
                        {myUploads.map(r => <ActivityResourceCard key={r.id} r={r} />)}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="liked">
                    {activityLoading ? (
                      <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                    ) : likedResources.length === 0 ? (
                      <div className="glass rounded-2xl border border-border/40 py-16 text-center">
                        <Heart className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
                        <p className="text-muted-foreground font-medium">No liked resources yet</p>
                        <p className="text-xs text-muted-foreground/60 mt-1">Like resources you find helpful to save them here.</p>
                      </div>
                    ) : (
                      <div className="grid sm:grid-cols-2 gap-3">
                        {likedResources.map(r => <ActivityResourceCard key={r.id} r={r} />)}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
