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

const departments = [
  'CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT', 'AI&DS', 'BIOTECH', 'CHEM', 'AEROSPACE'
];

const resourceTypes = ['Notes', 'Question Paper', 'Assignment', 'Lab Report', 'Project', 'PDF', 'Image'];

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

    // File size validation
    const maxSize = file.type.startsWith('image/') ? 5 * 1024 * 1024 : 10 * 1024 * 1024; // 5MB for images, 10MB for others
    
    if (file.size > maxSize) {
      toast({
        title: "File Too Large",
        description: `File size should be less than ${file.type.startsWith('image/') ? '5MB' : '10MB'}`,
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
      // TODO: Implement actual file upload to Supabase Storage
      // For now, just show success message
      toast({
        title: "Resource Uploaded Successfully!",
        description: "Your resource is now available for other students.",
      });
      
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
      toast({
        title: "Upload Failed",
        description: "Something went wrong. Please try again.",
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
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Upload Resource</h1>
          <p className="text-muted-foreground">
            Share your study materials with fellow students and help build our academic community.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Upload Form */}
          <div className="md:col-span-2">
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

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="department">Department *</Label>
                      <Select value={formData.department} onValueChange={(value) => handleInputChange('department', value)} required>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Department" />
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
                          <SelectValue placeholder="Select Year" />
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

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="section">Section</Label>
                      <Select value={formData.section} onValueChange={(value) => handleInputChange('section', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Section" />
                        </SelectTrigger>
                        <SelectContent>
                          {['A', 'B', 'C', 'D', 'E'].map((sec) => (
                            <SelectItem key={sec} value={sec}>Section {sec}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="resourceType">Resource Type *</Label>
                      <Select value={formData.resourceType} onValueChange={(value) => handleInputChange('resourceType', value)} required>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Type" />
                        </SelectTrigger>
                        <SelectContent>
                          {resourceTypes.map((type) => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
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
                    <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                      {!selectedFile ? (
                        <div>
                          <UploadIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">
                              Drag and drop your file here, or click to browse
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Supports: PDF, DOC, TXT, JPG, PNG (Max: 10MB for docs, 5MB for images)
                            </p>
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
                          <div className="flex items-center gap-3">
                            {getFileIcon(selectedFile)}
                            <div className="text-left">
                              <p className="text-sm font-medium">{selectedFile.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedFile(null)}
                          >
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
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Upload Guidelines</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-sm mb-2">File Requirements:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• PDFs, Documents: Max 10MB</li>
                    <li>• Images: Max 5MB</li>
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