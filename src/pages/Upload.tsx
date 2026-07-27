import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Upload as UploadIcon, FileText, Image, FileX } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { aiApi } from '@/lib/aiApi';

const departments = [
  'CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT', 'AI&DS', 'BIOTECH', 'CHEM', 'AEROSPACE'
];

// Align with DB CHECK constraint values in public.resources.resource_type
const resourceTypeOptions = [
  { value: 'Notes', label: 'Notes' },
  { value: 'Previous Papers', label: 'Previous Papers' },
  { value: 'Assignments', label: 'Assignments' },
  { value: 'PDFs', label: 'PDFs' },
  { value: 'Images', label: 'Images' },
  { value: 'Others', label: 'Others' },
];

const Upload = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    department: '',
    year: '',
    section: '',
    subject: '',
    resourceType: '',
  });
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  React.useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // File size validation (up to 20MB for all supported types)
    const maxSize = 20 * 1024 * 1024;

    if (file.size > maxSize) {
      toast({
        title: "File Too Large",
        description: "File size should be less than 20MB.",
        variant: "destructive",
      });
      return;
    }

    // File type validation
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/jpg',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload PDF, DOC, TXT, or image files only.",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!selectedFile) {
      toast({
        title: "No File Selected",
        description: "Please select a file to upload.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      // Upload file to Supabase Storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user!.id}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('academic-resources')
        .upload(fileName, selectedFile, {
          contentType: selectedFile.type,
          cacheControl: '3600',
          upsert: false,
        });
      
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('academic-resources')
        .getPublicUrl(fileName);
      
      // Save resource metadata to database
      const yearNumber = parseInt(formData.year);
      const resourceTypeValue = resourceTypeOptions.find(o => o.value === formData.resourceType)?.value || 'Others';

      const { error: dbError } = await supabase
        .from('resources')
        .insert({
          title: formData.title,
          description: formData.description,
          department: formData.department,
          year: yearNumber,
          subject: formData.subject,
          resource_type: resourceTypeValue,
          section: formData.section,
          file_url: publicUrl,
          file_type: selectedFile.type,
          uploaded_by: user!.id
        });
      
      if (dbError) {
        // Roll back uploaded file to avoid orphaned objects
        await supabase.storage.from('academic-resources').remove([fileName]);
        throw dbError;
      }
      
      toast({
        title: "Resource Uploaded Successfully!",
        description: "Your resource is now available for other students.",
      });

      // Trigger AI indexing for PDFs in the background
      if (selectedFile.type === 'application/pdf') {
        // Fetch the newly inserted resource id
        const { data: newResource } = await supabase
          .from('resources')
          .select('id')
          .eq('file_url', publicUrl)
          .single();
        if (newResource) {
          aiApi.uploadDocument({
            resource_id: newResource.id,
            file_url: publicUrl,
            file_name: selectedFile.name,
            department: formData.department,
            year: parseInt(formData.year),
            subject: formData.subject,
            title: formData.title,
            uploaded_by: user!.id,
          }).catch(() => {}); // background — don't block UX
        }
      }
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        department: '',
        year: '',
        section: '',
        subject: '',
        resourceType: '',
      });
      setSelectedFile(null);
      
      // Redirect to resources page
      navigate('/resources');
    } catch (error) {
      console.error('Upload error:', error);
      const message = (error as any)?.message || 'Something went wrong. Please try again.';
      toast({
        title: "Upload Failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <Image className="h-6 w-6 text-blue-500" />;
    }
    return <FileText className="h-6 w-6 text-red-500" />;
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-6 max-w-4xl pb-24 md:pb-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-1">Upload Resource</h1>
          <p className="text-muted-foreground text-sm">
            Share your study materials with fellow students.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Upload Form */}
          <div className="md:col-span-2 order-2 md:order-1">
            <Card>
              <CardHeader>
                <CardTitle>Resource Details</CardTitle>
                <CardDescription>
                  Fill in the information about your resource to help others find it easily.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      placeholder="e.g., Data Structures Complete Notes"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Brief description of the resource content..."
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="department">Department *</Label>
                      <Select value={formData.department} onValueChange={(value) => handleInputChange('department', value)} required>
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {departments.map((dept) => (
                            <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="year">Year *</Label>
                      <Select value={formData.year} onValueChange={(value) => handleInputChange('year', value)} required>
                        <SelectTrigger>
                          <SelectValue placeholder="Year" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1st Year</SelectItem>
                          <SelectItem value="2">2nd Year</SelectItem>
                          <SelectItem value="3">3rd Year</SelectItem>
                          <SelectItem value="4">4th Year</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="section">Section</Label>
                      <Select value={formData.section} onValueChange={(value) => handleInputChange('section', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Section" />
                        </SelectTrigger>
                        <SelectContent>
                          {['A', 'B', 'C', 'D', 'E'].map((sec) => (
                            <SelectItem key={sec} value={sec}>Section {sec}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="resourceType">Type *</Label>
                      <Select value={formData.resourceType} onValueChange={(value) => handleInputChange('resourceType', value)} required>
                        <SelectTrigger>
                          <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                          {resourceTypeOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject *</Label>
                    <Input
                      id="subject"
                      placeholder="e.g., Data Structures and Algorithms"
                      value={formData.subject}
                      onChange={(e) => handleInputChange('subject', e.target.value)}
                      required
                    />
                  </div>

                  {/* File Upload */}
                  <div className="space-y-2">
                    <Label htmlFor="file">File *</Label>
                    <div className="border-2 border-dashed border-border rounded-lg p-4 sm:p-6 text-center">
                      {!selectedFile ? (
                        <div>
                          <UploadIcon className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-3" />
                          <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Tap to browse or drag & drop</p>
                            <p className="text-xs text-muted-foreground">PDF, DOC, TXT, JPG, PNG (Max: 20MB)</p>
                          </div>
                          <Input
                            type="file"
                            onChange={handleFileSelect}
                            className="mt-4 cursor-pointer"
                            accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                            required
                          />
                        </div>
                      ) : (
                        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <div className="flex items-center gap-3 min-w-0">
                            {getFileIcon(selectedFile)}
                            <div className="text-left min-w-0">
                              <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                          <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedFile(null)} className="flex-shrink-0">
                            <FileX className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Uploading...' : 'Upload Resource'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Guidelines */}
          <div className="order-1 md:order-2">
            <Card>
              <CardHeader>
                <CardTitle>Upload Guidelines</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-sm mb-2">File Requirements:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• PDFs, Documents, Images: Max 20MB</li>
                    <li>• Clear, readable content</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-sm mb-2">Content Guidelines:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Original or properly cited content</li>
                    <li>• Relevant to academic subjects</li>
                    <li>• No copyrighted materials</li>
                    <li>• Descriptive titles and descriptions</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-sm mb-2">Benefits:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Help fellow students learn</li>
                    <li>• Build your reputation</li>
                    <li>• Earn likes and ratings</li>
                    <li>• Contribute to the community</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Upload;