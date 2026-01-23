import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ResourceEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  resource: any | null;
  onSubmit: (updates: any) => Promise<void> | void;
}

const departments = [
  "CSE", "ECE", "EEE", "MECH", "CIVIL", "IT", "AI&DS", "BIOTECH", "CHEM", "AEROSPACE"
];

const resourceTypeOptions = [
  { value: "Notes", label: "Notes" },
  { value: "Previous Papers", label: "Previous Papers" },
  { value: "Assignments", label: "Assignments" },
  { value: "PDFs", label: "PDFs" },
  { value: "Images", label: "Images" },
  { value: "Others", label: "Others" },
];

export const ResourceEditDialog: React.FC<ResourceEditDialogProps> = ({ isOpen, onClose, resource, onSubmit }) => {
  const [form, setForm] = useState({
    title: "",
    description: "",
    department: "",
    year: "",
    section: "",
    subject: "",
    resource_type: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (resource) {
      setForm({
        title: resource.title || "",
        description: resource.description || "",
        department: resource.department || "",
        year: (resource.year || "").toString(),
        section: resource.section || "",
        subject: resource.subject || "",
        resource_type: resource.type || resource.resource_type || "",
      });
    }
  }, [resource]);

  const handleChange = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const updates = {
        title: form.title,
        description: form.description,
        department: form.department,
        year: parseInt(form.year || "0", 10) || null,
        section: form.section || null,
        subject: form.subject,
        resource_type: form.resource_type || "Others",
      };
      await onSubmit(updates);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit Resource</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={form.title} onChange={e => handleChange("title", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" rows={3} value={form.description} onChange={e => handleChange("description", e.target.value)} />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Department</Label>
              <Select value={form.department} onValueChange={v => handleChange("department", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Year</Label>
              <Select value={form.year} onValueChange={v => handleChange("year", v)}>
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
              <Label>Section</Label>
              <Select value={form.section} onValueChange={v => handleChange("section", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Section" />
                </SelectTrigger>
                <SelectContent>
                  {["A","B","C","D","E"].map(s => <SelectItem key={s} value={s}>Section {s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Resource Type</Label>
              <Select value={form.resource_type} onValueChange={v => handleChange("resource_type", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Type" />
                </SelectTrigger>
                <SelectContent>
                  {resourceTypeOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input id="subject" value={form.subject} onChange={e => handleChange("subject", e.target.value)} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
