import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Building2, Save, Upload, X, Plus } from "lucide-react";
import { toast } from "sonner";

export function Profiles() {
  const [brandName, setBrandName] = useState("");
  const [brandDescription, setBrandDescription] = useState("");
  const [website, setWebsite] = useState("");
  const [industry, setIndustry] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [brandVoice, setBrandVoice] = useState("");
  const [keyValues, setKeyValues] = useState<string[]>([]);
  const [newValue, setNewValue] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#6366f1");
  const [secondaryColor, setSecondaryColor] = useState("#8b5cf6");
  const [socialLinks, setSocialLinks] = useState({
    twitter: "",
    linkedin: "",
    facebook: "",
    instagram: ""
  });

  const handleAddValue = () => {
    if (!newValue.trim()) {
      toast.error("Please enter a value");
      return;
    }
    if (keyValues.includes(newValue.trim())) {
      toast.error("Value already added");
      return;
    }
    setKeyValues([...keyValues, newValue.trim()]);
    setNewValue("");
  };

  const handleRemoveValue = (valueToRemove: string) => {
    setKeyValues(keyValues.filter(val => val !== valueToRemove));
  };

  const handleSave = () => {
    if (!brandName) {
      toast.error("Please enter a brand name");
      return;
    }

    // In a real app, this would save to the backend
    const brandProfile = {
      brandName,
      brandDescription,
      website,
      industry,
      targetAudience,
      brandVoice,
      keyValues,
      logoUrl,
      primaryColor,
      secondaryColor,
      socialLinks,
      updatedAt: new Date()
    };

    console.log("Saving brand profile:", brandProfile);
    toast.success("Brand profile saved successfully!");
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl flex items-center gap-3">
            <Building2 className="h-8 w-8" />
            Brand Profile
          </h1>
          <p className="text-muted-foreground mt-1">
            Configure your brand information for AI-generated content
          </p>
        </div>
        <Button onClick={handleSave} className="gradient-primary text-white border-0">
          <Save className="h-4 w-4 mr-2" />
          Save Profile
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
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
                <Label htmlFor="brandName">Brand Name *</Label>
                <Input
                  id="brandName"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="e.g., Intelligence Guild"
                  className="mt-2 bg-muted/50 text-foreground"
                />
              </div>

              <div>
                <Label htmlFor="brandDescription">Brand Description</Label>
                <Textarea
                  id="brandDescription"
                  value={brandDescription}
                  onChange={(e) => setBrandDescription(e.target.value)}
                  placeholder="Describe your brand, mission, and what makes you unique..."
                  className="mt-2 min-h-[120px] bg-muted/50 text-foreground"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://example.com"
                    className="mt-2 bg-muted/50 text-foreground"
                  />
                </div>

                <div>
                  <Label htmlFor="industry">Industry</Label>
                  <Input
                    id="industry"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
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
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  placeholder="e.g., Tech-savvy professionals, Crypto enthusiasts"
                  className="mt-2 bg-muted/50 text-foreground"
                />
              </div>

              <div>
                <Label htmlFor="brandVoice">Brand Voice</Label>
                <Textarea
                  id="brandVoice"
                  value={brandVoice}
                  onChange={(e) => setBrandVoice(e.target.value)}
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
                  />
                  <Button type="button" onClick={handleAddValue} size="icon">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Add values that represent your brand's core principles
                </p>
                {keyValues.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {keyValues.map((value, idx) => (
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
                    value={socialLinks.twitter}
                    onChange={(e) => setSocialLinks({ ...socialLinks, twitter: e.target.value })}
                    placeholder="https://x.com/username"
                    className="mt-2 bg-muted/50 text-foreground"
                  />
                </div>

                <div>
                  <Label htmlFor="linkedin">LinkedIn</Label>
                  <Input
                    id="linkedin"
                    value={socialLinks.linkedin}
                    onChange={(e) => setSocialLinks({ ...socialLinks, linkedin: e.target.value })}
                    placeholder="https://linkedin.com/company/username"
                    className="mt-2 bg-muted/50 text-foreground"
                  />
                </div>

                <div>
                  <Label htmlFor="facebook">Facebook</Label>
                  <Input
                    id="facebook"
                    value={socialLinks.facebook}
                    onChange={(e) => setSocialLinks({ ...socialLinks, facebook: e.target.value })}
                    placeholder="https://facebook.com/username"
                    className="mt-2 bg-muted/50 text-foreground"
                  />
                </div>

                <div>
                  <Label htmlFor="instagram">Instagram</Label>
                  <Input
                    id="instagram"
                    value={socialLinks.instagram}
                    onChange={(e) => setSocialLinks({ ...socialLinks, instagram: e.target.value })}
                    placeholder="https://instagram.com/username"
                    className="mt-2 bg-muted/50 text-foreground"
                  />
                </div>
              </div>
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
                {logoUrl ? (
                  <div className="space-y-3">
                    <img
                      src={logoUrl}
                      alt="Brand logo"
                      className="w-24 h-24 object-contain mx-auto rounded-lg"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setLogoUrl("")}
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
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
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
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-20 h-10 cursor-pointer"
                  />
                  <Input
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    placeholder="#6366f1"
                    className="flex-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="secondaryColor">Secondary Color</Label>
                <div className="flex gap-3 mt-2">
                  <Input
                    id="secondaryColor"
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="w-20 h-10 cursor-pointer"
                  />
                  <Input
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    placeholder="#8b5cf6"
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-3">Color Preview</p>
                <div className="flex gap-2">
                  <div
                    className="flex-1 h-16 rounded-lg border-2"
                    style={{ backgroundColor: primaryColor }}
                  />
                  <div
                    className="flex-1 h-16 rounded-lg border-2"
                    style={{ backgroundColor: secondaryColor }}
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
  );
}
