import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Users } from 'lucide-react';

const departments = [
  'CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT', 'AI&DS', 'BIOTECH', 'CHEM', 'AEROSPACE'
];

const Communities: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
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
      setList(data || []);
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
        .insert({ name, department, description, created_by: user!.id })
        .select('*')
        .single();
      if (error) throw error;
      toast({ title: 'Community created', description: 'You are the admin of this community.' });
      setName(''); setDepartment(''); setDescription('');
      await fetchCommunities();
      navigate(`/communities/${data.id}`);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to create community', variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-6 lg:py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold">Communities</h1>
            <p className="text-muted-foreground">Create and join department-wise communities.</p>
          </div>
          <Button onClick={() => document.getElementById('create-form')?.scrollIntoView({ behavior: 'smooth' })}>
            <Plus className="h-4 w-4 mr-2" />
            New Community
          </Button>
        </div>

        {/* Create */}
        <Card id="create-form" className="mb-6">
          <CardContent className="p-4">
            <form onSubmit={handleCreate} className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g., CSE Study Group" />
              </div>
              <div className="space-y-2">
                <Label>Department *</Label>
                <Select value={department} onValueChange={setDepartment}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-3">
                <Label>Description</Label>
                <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief about the community" />
              </div>
              <div className="md:col-span-3 flex justify-end">
                <Button type="submit" disabled={creating}>{creating ? 'Creating...' : 'Create Community'}</Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}><CardContent className="p-4 h-32 animate-pulse" /></Card>
            ))
          ) : list.length === 0 ? (
            <Card><CardContent className="p-6 text-center text-muted-foreground">No communities yet.</CardContent></Card>
          ) : (
            list.map(comm => (
              <Card key={comm.id} className="hover:shadow-card transition" onClick={() => navigate(`/communities/${comm.id}`)}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{comm.name}</h3>
                      <p className="text-xs text-muted-foreground">Department: {comm.department}</p>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      {/* Optionally fetch members count later */}
                    </div>
                  </div>
                  {comm.description && (
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{comm.description}</p>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Communities;
