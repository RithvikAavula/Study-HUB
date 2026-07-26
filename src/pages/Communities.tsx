import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Plus, Users, Search, X, ChevronRight, Loader2,
  BookOpen, Cpu, Zap, Wrench, Building2, Globe, Brain, FlaskConical, Flame, Rocket,
  Lock, Unlock, Calendar,
} from 'lucide-react';

const departments = [
  'CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT', 'AI&DS', 'BIOTECH', 'CHEM', 'AEROSPACE'
];

const deptConfig: Record<string, { icon: any; gradient: string; badge: string; glow: string }> = {
  CSE:      { icon: Cpu,         gradient: 'from-blue-500/20 to-cyan-500/20',     badge: 'bg-blue-500/15 text-blue-400 border-blue-500/25',     glow: 'group-hover:shadow-blue-500/15' },
  ECE:      { icon: Zap,         gradient: 'from-yellow-500/20 to-amber-500/20',  badge: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/25', glow: 'group-hover:shadow-yellow-500/15' },
  EEE:      { icon: Flame,       gradient: 'from-orange-500/20 to-red-500/20',    badge: 'bg-orange-500/15 text-orange-400 border-orange-500/25', glow: 'group-hover:shadow-orange-500/15' },
  MECH:     { icon: Wrench,      gradient: 'from-slate-500/20 to-zinc-500/20',    badge: 'bg-slate-500/15 text-slate-400 border-slate-500/25',   glow: 'group-hover:shadow-slate-500/15' },
  CIVIL:    { icon: Building2,   gradient: 'from-stone-500/20 to-amber-600/20',   badge: 'bg-stone-500/15 text-stone-400 border-stone-500/25',   glow: 'group-hover:shadow-stone-500/15' },
  IT:       { icon: Globe,       gradient: 'from-teal-500/20 to-emerald-500/20',  badge: 'bg-teal-500/15 text-teal-400 border-teal-500/25',      glow: 'group-hover:shadow-teal-500/15' },
  'AI&DS':  { icon: Brain,       gradient: 'from-purple-500/20 to-violet-500/20', badge: 'bg-purple-500/15 text-purple-400 border-purple-500/25', glow: 'group-hover:shadow-purple-500/15' },
  BIOTECH:  { icon: FlaskConical,gradient: 'from-green-500/20 to-lime-500/20',    badge: 'bg-green-500/15 text-green-400 border-green-500/25',   glow: 'group-hover:shadow-green-500/15' },
  CHEM:     { icon: FlaskConical,gradient: 'from-pink-500/20 to-rose-500/20',     badge: 'bg-pink-500/15 text-pink-400 border-pink-500/25',      glow: 'group-hover:shadow-pink-500/15' },
  AEROSPACE:{ icon: Rocket,      gradient: 'from-indigo-500/20 to-blue-600/20',   badge: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/25', glow: 'group-hover:shadow-indigo-500/15' },
};
const fallbackConfig = { icon: BookOpen, gradient: 'from-primary/20 to-accent/20', badge: 'bg-primary/15 text-primary border-primary/25', glow: 'group-hover:shadow-primary/15' };

const Communities: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [list, setList] = useState<any[]>([]);
  const [memberCounts, setMemberCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('all');

  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);

  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) { navigate('/auth'); return; }
    fetchCommunities();
  }, [user]);

  const fetchCommunities = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('communities')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      const communities = data || [];
      setList(communities);

      // Fetch member counts in parallel
      if (communities.length) {
        const counts: Record<string, number> = {};
        await Promise.all(
          communities.map(async (c: any) => {
            const { count } = await supabase
              .from('community_members')
              .select('*', { count: 'exact', head: true })
              .eq('community_id', c.id);
            counts[c.id] = count || 0;
          })
        );
        setMemberCounts(counts);
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to load communities', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !department) {
      toast({ title: 'Missing info', description: 'Name and Department are required', variant: 'destructive' });
      return;
    }
    setCreating(true);
    try {
      const { data, error } = await supabase
        .from('communities')
        .insert({ name, department, description, created_by: user!.id, is_private: isPrivate })
        .select('*')
        .single();
      if (error) throw error;
      toast({ title: '🎉 Community created!', description: 'You are the admin of this community.' });
      setName(''); setDepartment(''); setDescription(''); setIsPrivate(false);
      setShowForm(false);
      await fetchCommunities();
      navigate(`/communities/${data.id}`);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to create community', variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  const filtered = list.filter(c => {
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.description?.toLowerCase().includes(search.toLowerCase());
    const matchDept = filterDept === 'all' || c.department === filterDept;
    return matchSearch && matchDept;
  });

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/5 to-background pointer-events-none" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative container mx-auto px-4 py-10 lg:py-14">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div className="animate-fade-in-up">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-1 w-8 rounded-full bg-gradient-to-r from-primary to-accent" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Study Together</span>
              </div>
              <h1 className="text-3xl lg:text-4xl font-bold mb-2">
                <span className="gradient-text">Communities</span>
              </h1>
              <p className="text-muted-foreground max-w-md">
                Join department-wise study groups, share resources, and collaborate with peers.
              </p>
              <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-primary" />
                  <strong className="text-foreground">{list.length}</strong> communities
                </span>
                <span className="flex items-center gap-1.5">
                  <BookOpen className="h-4 w-4 text-accent" />
                  <strong className="text-foreground">{Object.values(memberCounts).reduce((a, b) => a + b, 0)}</strong> members
                </span>
              </div>
            </div>

            <Button
              onClick={() => { setShowForm(v => !v); setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50); }}
              className="self-start sm:self-auto bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white shadow-lg shadow-primary/25 transition-all duration-200 animate-fade-in-up"
            >
              {showForm ? <X className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              {showForm ? 'Cancel' : 'New Community'}
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-12 space-y-6">

        {/* Create Form — slide in */}
        <div
          ref={formRef}
          className={`overflow-hidden transition-all duration-500 ease-in-out ${showForm ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}
        >
          <div className="glass rounded-2xl border border-primary/20 p-6 animate-scale-in">
            <div className="flex items-center gap-2 mb-5">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                <Plus className="h-4 w-4 text-primary" />
              </div>
              <h2 className="font-semibold text-foreground">Create a New Community</h2>
            </div>
            <form onSubmit={handleCreate} className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Community Name *</Label>
                <Input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g., CSE Study Group"
                  className="bg-white/5 border-border/50 focus:border-primary/50"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Department *</Label>
                <Select value={department} onValueChange={setDepartment}>
                  <SelectTrigger className="bg-white/5 border-border/50 focus:border-primary/50">
                    <SelectValue placeholder="Select Department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label className="text-xs text-muted-foreground">Description</Label>
                <Input
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="What is this community about?"
                  className="bg-white/5 border-border/50 focus:border-primary/50"
                />
              </div>
              <div className="md:col-span-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIsPrivate(v => !v)}
                  className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg border transition-all duration-200 ${
                    isPrivate
                      ? 'bg-primary/10 border-primary/30 text-primary'
                      : 'bg-white/5 border-border/40 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {isPrivate ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
                  {isPrivate ? 'Private' : 'Public'}
                </button>
                <Button
                  type="submit"
                  disabled={creating}
                  className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white shadow-md shadow-primary/20"
                >
                  {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                  {creating ? 'Creating...' : 'Create Community'}
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* Search + Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search communities..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 bg-white/5 border-border/50 focus:border-primary/50"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <Select value={filterDept} onValueChange={setFilterDept}>
            <SelectTrigger className="w-full sm:w-48 bg-white/5 border-border/50">
              <SelectValue placeholder="All Departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
          {(search || filterDept !== 'all') && (
            <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setFilterDept('all'); }} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4 mr-1" /> Clear
            </Button>
          )}
        </div>

        {/* Results count */}
        {!loading && (
          <p className="text-xs text-muted-foreground">
            Showing <strong className="text-foreground">{filtered.length}</strong> of {list.length} communities
          </p>
        )}

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="glass rounded-2xl border border-border/40 p-5 h-44 animate-pulse">
                <div className="flex gap-3 mb-4">
                  <div className="h-10 w-10 rounded-xl bg-white/5 shimmer" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 rounded bg-white/5 shimmer" />
                    <div className="h-3 w-1/2 rounded bg-white/5 shimmer" />
                  </div>
                </div>
                <div className="h-3 w-full rounded bg-white/5 shimmer mb-2" />
                <div className="h-3 w-2/3 rounded bg-white/5 shimmer" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass rounded-2xl border border-border/40 py-20 text-center animate-fade-in-up">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-muted-foreground font-medium">No communities found</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              {search || filterDept ? 'Try adjusting your filters' : 'Be the first to create one!'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((comm, i) => {
              const cfg = deptConfig[comm.department] ?? fallbackConfig;
              const Icon = cfg.icon;
              const count = memberCounts[comm.id] ?? 0;
              return (
                <div
                  key={comm.id}
                  onClick={() => navigate(`/communities/${comm.id}`)}
                  className={`group glass rounded-2xl border border-border/40 hover:border-primary/30 cursor-pointer transition-all duration-300 hover:-translate-y-1.5 overflow-hidden animate-fade-in-up shadow-lg ${cfg.glow} hover:shadow-xl`}
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  {/* Top gradient strip */}
                  <div className={`h-1 w-full bg-gradient-to-r ${cfg.gradient} opacity-70 group-hover:opacity-100 transition-opacity duration-300`} />

                  <div className="p-5">
                    {/* Header row */}
                    <div className="flex items-start gap-3 mb-3">
                      <div className={`p-2.5 rounded-xl bg-gradient-to-br ${cfg.gradient} flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className="h-5 w-5 text-foreground/80" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors duration-200 line-clamp-1">
                            {comm.name}
                          </h3>
                          {comm.is_private && (
                            <Lock className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                          )}
                        </div>
                        <Badge variant="outline" className={`mt-1 text-xs px-2 py-0 ${cfg.badge}`}>
                          {comm.department}
                        </Badge>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4 min-h-[40px]">
                      {comm.description || 'No description provided.'}
                    </p>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-3 border-t border-border/30">
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5" />
                          <span>{count} member{count !== 1 ? 's' : ''}</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>{new Date(comm.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-primary opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-2 group-hover:translate-x-0">
                        <span>Open</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Communities;
