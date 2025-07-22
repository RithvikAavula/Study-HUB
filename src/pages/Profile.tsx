import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { User, Upload, FileText, Heart, Download, Star, Camera, Phone, Mail, GraduationCap } from 'lucide-react';

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

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<Partial<ProfileData>>({});

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    loadProfileData();
  }, [user, navigate]);

  const loadProfileData = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error loading profile:', error);
        return;
      }

      setProfileData(data);
      setEditedData(data);
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditedData(profileData || {});
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedData(profileData || {});
  };

  const handleSave = async () => {
    if (!user || !profileData) return;
    
    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update(editedData)
        .eq('user_id', user.id);

      if (error) {
        toast({
          title: "Update Failed",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      setProfileData({ ...profileData, ...editedData } as ProfileData);
      setIsEditing(false);
      
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof ProfileData, value: string | number) => {
    setEditedData(prev => ({ ...prev, [field]: value }));
  };

  // Mock stats data
  const userStats = {
    resourcesUploaded: 12,
    totalLikes: 245,
    totalDownloads: 1836,
    averageRating: 4.6,
  };

  if (!user || !profileData) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="text-center">
                <div className="relative mx-auto mb-4">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={profileData.avatar_url} />
                    <AvatarFallback className="text-lg">
                      {profileData.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {isEditing && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <CardTitle className="text-xl">{profileData.full_name}</CardTitle>
                <CardDescription className="space-y-2">
                  <div className="flex items-center justify-center gap-2">
                    <GraduationCap className="h-4 w-4" />
                    <span>{profileData.department} • {profileData.year}{getOrdinalSuffix(profileData.year)} Year</span>
                  </div>
                  <Badge variant="secondary">Section {profileData.section}</Badge>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground mb-2">
                    <Mail className="h-4 w-4" />
                    <span className="text-sm">{profileData.email}</span>
                  </div>
                  {profileData.phone && (
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <span className="text-sm">{profileData.phone}</span>
                    </div>
                  )}
                </div>

                {profileData.bio && (
                  <div>
                    <h4 className="font-medium text-sm mb-2">About</h4>
                    <p className="text-sm text-muted-foreground">{profileData.bio}</p>
                  </div>
                )}

                {/* Stats */}
                <div className="pt-4 border-t">
                  <h4 className="font-medium text-sm mb-3">Statistics</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <FileText className="h-5 w-5 text-primary mx-auto mb-1" />
                      <div className="text-lg font-bold">{userStats.resourcesUploaded}</div>
                      <div className="text-xs text-muted-foreground">Uploads</div>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <Heart className="h-5 w-5 text-red-500 mx-auto mb-1" />
                      <div className="text-lg font-bold">{userStats.totalLikes}</div>
                      <div className="text-xs text-muted-foreground">Likes</div>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <Download className="h-5 w-5 text-blue-500 mx-auto mb-1" />
                      <div className="text-lg font-bold">{userStats.totalDownloads}</div>
                      <div className="text-xs text-muted-foreground">Downloads</div>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <Star className="h-5 w-5 text-yellow-500 mx-auto mb-1" />
                      <div className="text-lg font-bold">{userStats.averageRating}</div>
                      <div className="text-xs text-muted-foreground">Rating</div>
                    </div>
                  </div>
                </div>

                {!isEditing ? (
                  <Button onClick={handleEdit} className="w-full">
                    <User className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <Button onClick={handleSave} className="w-full" disabled={isLoading}>
                      {isLoading ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button onClick={handleCancel} variant="outline" className="w-full">
                      Cancel
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="details">Profile Details</TabsTrigger>
                <TabsTrigger value="activity">My Activity</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>
                      {isEditing ? 'Update your personal information' : 'Your current profile information'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="fullName">Full Name</Label>
                        {isEditing ? (
                          <Input
                            id="fullName"
                            value={editedData.full_name || ''}
                            onChange={(e) => handleInputChange('full_name', e.target.value)}
                          />
                        ) : (
                          <div className="text-sm font-medium p-2 bg-muted/50 rounded">{profileData.full_name}</div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <div className="text-sm font-medium p-2 bg-muted/50 rounded text-muted-foreground">
                          {profileData.email} (Cannot be changed)
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      {isEditing ? (
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="Enter phone number"
                          value={editedData.phone || ''}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                        />
                      ) : (
                        <div className="text-sm font-medium p-2 bg-muted/50 rounded">
                          {profileData.phone || 'Not provided'}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      {isEditing ? (
                        <Textarea
                          id="bio"
                          placeholder="Tell us about yourself..."
                          value={editedData.bio || ''}
                          onChange={(e) => handleInputChange('bio', e.target.value)}
                          rows={3}
                        />
                      ) : (
                        <div className="text-sm font-medium p-2 bg-muted/50 rounded min-h-[80px]">
                          {profileData.bio || 'No bio provided'}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Academic Information</CardTitle>
                    <CardDescription>
                      Your academic details (Note: These can only be changed once or through admin request)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Department</Label>
                        <div className="text-sm font-medium p-2 bg-muted/50 rounded text-muted-foreground">
                          {profileData.department}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Year</Label>
                        <div className="text-sm font-medium p-2 bg-muted/50 rounded text-muted-foreground">
                          {profileData.year}{getOrdinalSuffix(profileData.year)} Year
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Section</Label>
                        <div className="text-sm font-medium p-2 bg-muted/50 rounded text-muted-foreground">
                          Section {profileData.section}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="activity">
                <Card>
                  <CardHeader>
                    <CardTitle>My Activity</CardTitle>
                    <CardDescription>
                      Your contributions and activity on StudyHub
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-medium mb-2">Activity Feed Coming Soon</h3>
                      <p>Your uploads, likes, and downloads will be displayed here.</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

function getOrdinalSuffix(num: number): string {
  const j = num % 10;
  const k = num % 100;
  if (j === 1 && k !== 11) return 'st';
  if (j === 2 && k !== 12) return 'nd';
  if (j === 3 && k !== 13) return 'rd';
  return 'th';
}

export default Profile;