import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Building2, Save, Upload, X, Plus, Trash2, FolderOpen, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { BrandProfile } from "../lib/types";
import { profilesApi } from "../lib/supabase";

export function Profiles() {
  const [profiles, setProfiles] = useState<BrandProfile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string>("");
  const [newValue, setNewValue] = useState("");
  const [newMetaContent, setNewMetaContent] = useState("");
  const [newDriveFolder, setNewDriveFolder] = useState("");
  const [loading, setLoading] = useState(true);

  // Load profiles from database
  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    setLoading(true);
    try {
      const loadedProfiles = await profilesApi.getProfiles();

      // If no profiles exist, create a default one
      if (loadedProfiles.length === 0) {
        const defaultProfile = await profilesApi.createProfile({
          name: "Intelligence Guild",
          brandDescription: "",
          website: "",
          industry: "",
          targetAudience: "",
          brandVoice: "",
          keyValues: [],
          logoUrl: "",
          primaryColor: "#6366f1",
          secondaryColor: "#8b5cf6",
          socialLinks: { twitter: "", linkedin: "", facebook: "", instagram: "" },
          metaContent: [],
          googleDriveFolderIds: [],
        });

        if (defaultProfile) {
          setProfiles([defaultProfile]);
          setSelectedProfileId(defaultProfile.id);
        }
      } else {
        setProfiles(loadedProfiles);
        setSelectedProfileId(loadedProfiles[0].id);
      }
    } catch (error) {
      console.error("Error loading profiles:", error);
      toast.error("Failed to load profiles");
    } finally {
      setLoading(false);
    }
  };

  const selectedProfile = profiles.find(p => p.id === selectedProfileId) || profiles[0];

  const updateProfile = (updates: Partial<BrandProfile>) => {
    setProfiles(profiles.map(p =>
      p.id === selectedProfileId ? { ...p, ...updates } : p
    ));
  };

  const handleAddValue = () => {
    if (!newValue.trim()) {
      toast.error("Please enter a value");
      return;
    }
    if (selectedProfile.keyValues.includes(newValue.trim())) {
      toast.error("Value already added");
      return;
    }
    updateProfile({ keyValues: [...selectedProfile.keyValues, newValue.trim()] });
    setNewValue("");
  };

  const handleRemoveValue = (valueToRemove: string) => {
    updateProfile({ keyValues: selectedProfile.keyValues.filter(val => val !== valueToRemove) });
  };

  const handleAddMetaContent = () => {
    if (!newMetaContent.trim()) {
      toast.error("Please enter content guideline");
      return;
    }
    updateProfile({ metaContent: [...selectedProfile.metaContent, newMetaContent.trim()] });
    setNewMetaContent("");
  };

  const handleRemoveMetaContent = (index: number) => {
    updateProfile({ metaContent: selectedProfile.metaContent.filter((_, i) => i !== index) });
  };

  const handleAddDriveFolder = () => {
    if (!newDriveFolder.trim()) {
      toast.error("Please enter a Google Drive folder ID");
      return;
    }
    // Note: For now, we're storing IDs as strings. Later this will reference a separate table.
    updateProfile({ googleDriveFolderIds: [...selectedProfile.googleDriveFolderIds, newDriveFolder.trim()] });
    setNewDriveFolder("");
  };

  const handleRemoveDriveFolder = (index: number) => {
    updateProfile({ googleDriveFolderIds: selectedProfile.googleDriveFolderIds.filter((_, i) => i !== index) });
  };

  const handleCreateProfile = async () => {
    try {
      const newProfile = await profilesApi.createProfile({
        name: `New Profile ${profiles.length + 1}`,
        brandDescription: "",
        website: "",
        industry: "",
        targetAudience: "",
        brandVoice: "",
        keyValues: [],
        logoUrl: "",
        primaryColor: "#6366f1",
        secondaryColor: "#8b5cf6",
        socialLinks: { twitter: "", linkedin: "", facebook: "", instagram: "" },
        metaContent: [],
        googleDriveFolderIds: [],
      });

      if (newProfile) {
        setProfiles([...profiles, newProfile]);
        setSelectedProfileId(newProfile.id);
        toast.success("New profile created!");
      } else {
        toast.error("Failed to create profile");
      }
    } catch (error) {
      console.error("Error creating profile:", error);
      toast.error("Failed to create profile");
    }
  };

  const handleDeleteProfile = async (profileId: string) => {
    if (profiles.length === 1) {
      toast.error("Cannot delete the last profile");
      return;
    }

    try {
      const success = await profilesApi.deleteProfile(profileId);

      if (success) {
        setProfiles(profiles.filter(p => p.id !== profileId));
        if (selectedProfileId === profileId) {
          setSelectedProfileId(profiles[0].id);
        }
        toast.success("Profile deleted");
      } else {
        toast.error("Failed to delete profile");
      }
    } catch (error) {
      console.error("Error deleting profile:", error);
      toast.error("Failed to delete profile");
    }
  };

  const handleSave = async () => {
    if (!selectedProfile.name) {
      toast.error("Please enter a profile name");
      return;
    }

    try {
      const updatedProfile = await profilesApi.updateProfile(selectedProfile.id, selectedProfile);

      if (updatedProfile) {
        // Update local state with the saved profile
        setProfiles(profiles.map(p => p.id === updatedProfile.id ? updatedProfile : p));
        toast.success("Brand profile saved successfully!");
      } else {
        toast.error("Failed to save profile");
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("Failed to save profile");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading profiles...</p>
        </div>
      </div>
    );
  }

  if (!selectedProfile) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No profiles found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl flex items-center gap-3">
            <Building2 className="h-8 w-8" />
            Brand Profiles
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage multiple brand profiles for AI-generated content
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleCreateProfile} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            New Profile
          </Button>
          <Button onClick={handleSave} className="gradient-primary text-white border-0">
            <Save className="h-4 w-4 mr-2" />
            Save Profile
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Profile Selector Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Profiles</CardTitle>
              <CardDescription className="text-xs">
                Select a profile to edit
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {profiles.map((profile) => (
                <div
                  key={profile.id}
                  className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedProfileId === profile.id
                      ? "bg-[#A192F8] text-white"
                      : "bg-muted/50 hover:bg-muted"
                  }`}
                  onClick={() => setSelectedProfileId(profile.id)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate text-sm">{profile.name}</p>
                  </div>
                  {profiles.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-6 w-6 ${
                        selectedProfileId === profile.id
                          ? "hover:bg-white/20 text-white"
                          : "hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteProfile(profile.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Name */}
            <Card>
              <CardHeader>
                <CardTitle>Profile Name</CardTitle>
                <CardDescription>
                  Give this profile a unique name
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div>
                  <Label htmlFor="profileName">Profile Name *</Label>
                  <Input
                    id="profileName"
                    value={selectedProfile.name}
                    onChange={(e) => updateProfile({ name: e.target.value })}
                    placeholder="e.g., Intelligence Guild, Tech Startup, Finance Brand"
                    className="mt-2 bg-muted/50 text-foreground"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Essential details about your brand
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="brandDescription">Brand Description</Label>
                  <Textarea
                    id="brandDescription"
                    value={selectedProfile.brandDescription}
                    onChange={(e) => updateProfile({ brandDescription: e.target.value })}
                    placeholder="Describe your brand, mission, and what makes you unique..."
                    className="mt-2 min-h-[120px] bg-muted/50 text-foreground"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      value={selectedProfile.website}
                      onChange={(e) => updateProfile({ website: e.target.value })}
                      placeholder="https://example.com"
                      className="mt-2 bg-muted/50 text-foreground"
                    />
                  </div>

                  <div>
                    <Label htmlFor="industry">Industry</Label>
                    <Input
                      id="industry"
                      value={selectedProfile.industry}
                      onChange={(e) => updateProfile({ industry: e.target.value })}
                      placeholder="e.g., Technology, Finance, Healthcare"
                      className="mt-2 bg-muted/50 text-foreground"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Brand Voice & Values */}
            <Card>
              <CardHeader>
                <CardTitle>Brand Voice & Values</CardTitle>
                <CardDescription>
                  Define your brand's personality and core values
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="targetAudience">Target Audience</Label>
                  <Input
                    id="targetAudience"
                    value={selectedProfile.targetAudience}
                    onChange={(e) => updateProfile({ targetAudience: e.target.value })}
                    placeholder="e.g., Tech-savvy professionals, Crypto enthusiasts"
                    className="mt-2 bg-muted/50 text-foreground"
                  />
                </div>

                <div>
                  <Label htmlFor="brandVoice">Brand Voice</Label>
                  <Textarea
                    id="brandVoice"
                    value={selectedProfile.brandVoice}
                    onChange={(e) => updateProfile({ brandVoice: e.target.value })}
                    placeholder="Describe your brand's tone and communication style (e.g., professional yet approachable, innovative and bold)"
                    className="mt-2 min-h-[100px] bg-muted/50 text-foreground"
                  />
                </div>

                <div>
                  <Label>Key Values</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      value={newValue}
                      onChange={(e) => setNewValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddValue();
                        }
                      }}
                      placeholder="e.g., Innovation, Transparency, Community"
                      className="bg-muted/50 text-foreground"
                    />
                    <Button type="button" onClick={handleAddValue} size="icon">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Add values that represent your brand's core principles
                  </p>
                  {selectedProfile.keyValues.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {selectedProfile.keyValues.map((value, idx) => (
                        <Badge key={idx} variant="secondary" className="gap-1">
                          {value}
                          <button
                            type="button"
                            onClick={() => handleRemoveValue(value)}
                            className="ml-1 hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Social Media */}
            <Card>
              <CardHeader>
                <CardTitle>Social Media</CardTitle>
                <CardDescription>
                  Connect your social media profiles
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="twitter">Twitter / X</Label>
                    <Input
                      id="twitter"
                      value={selectedProfile.socialLinks.twitter}
                      onChange={(e) => updateProfile({ socialLinks: { ...selectedProfile.socialLinks, twitter: e.target.value } })}
                      placeholder="https://x.com/username"
                      className="mt-2 bg-muted/50 text-foreground"
                    />
                  </div>

                  <div>
                    <Label htmlFor="linkedin">LinkedIn</Label>
                    <Input
                      id="linkedin"
                      value={selectedProfile.socialLinks.linkedin}
                      onChange={(e) => updateProfile({ socialLinks: { ...selectedProfile.socialLinks, linkedin: e.target.value } })}
                      placeholder="https://linkedin.com/company/username"
                      className="mt-2 bg-muted/50 text-foreground"
                    />
                  </div>

                  <div>
                    <Label htmlFor="facebook">Facebook</Label>
                    <Input
                      id="facebook"
                      value={selectedProfile.socialLinks.facebook}
                      onChange={(e) => updateProfile({ socialLinks: { ...selectedProfile.socialLinks, facebook: e.target.value } })}
                      placeholder="https://facebook.com/username"
                      className="mt-2 bg-muted/50 text-foreground"
                    />
                  </div>

                  <div>
                    <Label htmlFor="instagram">Instagram</Label>
                    <Input
                      id="instagram"
                      value={selectedProfile.socialLinks.instagram}
                      onChange={(e) => updateProfile({ socialLinks: { ...selectedProfile.socialLinks, instagram: e.target.value } })}
                      placeholder="https://instagram.com/username"
                      className="mt-2 bg-muted/50 text-foreground"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Content Guidelines */}
            <Card>
              <CardHeader>
                <CardTitle>Content Guidelines</CardTitle>
                <CardDescription>
                  Add custom instructions and meta content for AI generation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Textarea
                    value={newMetaContent}
                    onChange={(e) => setNewMetaContent(e.target.value)}
                    placeholder="e.g., Never use masculine language, Avoid technical jargon, Always mention sustainability"
                    className="min-h-[80px] bg-muted/50 text-foreground"
                  />
                  <Button type="button" onClick={handleAddMetaContent} size="icon" className="flex-shrink-0">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Add specific instructions about tone, language, topics to avoid, etc.
                </p>
                {selectedProfile.metaContent.length > 0 && (
                  <div className="space-y-2 mt-3">
                    {selectedProfile.metaContent.map((content, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2 p-3 bg-muted/30 rounded-lg border"
                      >
                        <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <p className="text-sm flex-1">{content}</p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => handleRemoveMetaContent(idx)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Google Drive Folders */}
            <Card>
              <CardHeader>
                <CardTitle>Google Drive Folders</CardTitle>
                <CardDescription>
                  Link to Google Drive folders with brand assets and resources
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={newDriveFolder}
                    onChange={(e) => setNewDriveFolder(e.target.value)}
                    placeholder="Enter Google Drive folder ID (e.g., 1a2b3c4d5e6f)"
                    className="bg-muted/50 text-foreground"
                  />
                  <Button type="button" onClick={handleAddDriveFolder} size="icon">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Add Google Drive folder IDs for brand assets, guidelines, or reference materials
                </p>
                {selectedProfile.googleDriveFolderIds.length > 0 && (
                  <div className="space-y-2 mt-3">
                    {selectedProfile.googleDriveFolderIds.map((folderId, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg border"
                      >
                        <FolderOpen className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm flex-1 truncate font-mono text-muted-foreground">
                          {folderId}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => handleRemoveDriveFolder(idx)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Branding */}
          <div className="space-y-6">
            {/* Logo Upload */}
            <Card>
              <CardHeader>
                <CardTitle>Brand Logo</CardTitle>
                <CardDescription>
                  Upload your brand logo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
                  {selectedProfile.logoUrl ? (
                    <div className="space-y-3">
                      <img
                        src={selectedProfile.logoUrl}
                        alt="Brand logo"
                        className="w-24 h-24 object-contain mx-auto rounded-lg"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateProfile({ logoUrl: "" })}
                        className="w-full"
                      >
                        Remove Logo
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground mb-2">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-muted-foreground">
                        PNG, JPG, SVG up to 5MB
                      </p>
                    </>
                  )}
                </div>
                <div>
                  <Label htmlFor="logoUrl">Logo URL</Label>
                  <Input
                    id="logoUrl"
                    value={selectedProfile.logoUrl}
                    onChange={(e) => updateProfile({ logoUrl: e.target.value })}
                    placeholder="https://example.com/logo.png"
                    className="mt-2 bg-muted/50 text-foreground"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Brand Colors */}
            <Card>
              <CardHeader>
                <CardTitle>Brand Colors</CardTitle>
                <CardDescription>
                  Define your brand color palette
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <div className="flex gap-3 mt-2">
                    <Input
                      id="primaryColor"
                      type="color"
                      value={selectedProfile.primaryColor}
                      onChange={(e) => updateProfile({ primaryColor: e.target.value })}
                      className="w-20 h-10 cursor-pointer"
                    />
                    <Input
                      value={selectedProfile.primaryColor}
                      onChange={(e) => updateProfile({ primaryColor: e.target.value })}
                      placeholder="#6366f1"
                      className="flex-1 bg-muted/50 text-foreground"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="secondaryColor">Secondary Color</Label>
                  <div className="flex gap-3 mt-2">
                    <Input
                      id="secondaryColor"
                      type="color"
                      value={selectedProfile.secondaryColor}
                      onChange={(e) => updateProfile({ secondaryColor: e.target.value })}
                      className="w-20 h-10 cursor-pointer"
                    />
                    <Input
                      value={selectedProfile.secondaryColor}
                      onChange={(e) => updateProfile({ secondaryColor: e.target.value })}
                      placeholder="#8b5cf6"
                      className="flex-1 bg-muted/50 text-foreground"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-3">Color Preview</p>
                  <div className="flex gap-2">
                    <div
                      className="flex-1 h-16 rounded-lg border-2"
                      style={{ backgroundColor: selectedProfile.primaryColor }}
                    />
                    <div
                      className="flex-1 h-16 rounded-lg border-2"
                      style={{ backgroundColor: selectedProfile.secondaryColor }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI Usage Info */}
            <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Building2 className="h-5 w-5 text-indigo-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-indigo-900 mb-1">
                      AI Integration
                    </h4>
                    <p className="text-sm text-indigo-700">
                      Your brand profile will be used by AI agents to generate content that aligns with your brand voice and values.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
