import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Camera, Loader2, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import { ProtectedRoute } from "../components/layout/ProtectedRoute";
import { useAuth } from "../hooks/use-auth";
import { useCallerProfile, useSaveProfile } from "../hooks/use-backend";

function ProfileContent() {
  const { setSessionUser } = useAuth();
  const { data: profile } = useCallerProfile();
  const saveProfile = useSaveProfile();

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [location, setLocation] = useState("");
  const [bio, setBio] = useState("");
  const [profilePic, setProfilePic] = useState<File | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.name || "");
    setUsername(profile.username || "");
    setPreview(profile.profilePic || null);
  }, [profile]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);
    try {
      const updatedUser = await saveProfile.mutateAsync({
        name: fullName,
        username,
        location,
        bio,
        profilePic,
      });
      if (updatedUser) {
        setSessionUser({
          id: updatedUser._id || updatedUser.id,
          _id: updatedUser._id || updatedUser.id,
          username: updatedUser.username,
          fullName: updatedUser.fullName || updatedUser.username,
          email: updatedUser.email,
          role: updatedUser.role,
          profilePic: updatedUser.profilePic,
          avatar: updatedUser.profilePic,
          location: (updatedUser as any).location,
          bio: (updatedUser as any).bio,
          createdAt: updatedUser.createdAt,
        });
      }
      setStatus("Profile updated successfully.");
      setProfilePic(null);
    } catch (err: any) {
      setStatus(err?.response?.data?.message || "Failed to update profile.");
    }
  };

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProfilePic(file);
    setPreview(URL.createObjectURL(file));
  };

  return (
    <div className="max-w-3xl" data-ocid="profile.page">
      <p className="text-xs font-mono text-primary uppercase tracking-widest mb-1">Profile</p>
      <h1 className="text-2xl font-display font-bold text-foreground mb-6">Update Profile</h1>

      <form onSubmit={handleSaveProfile} className="space-y-6 bg-card border border-border rounded-2xl p-6">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-muted overflow-hidden flex items-center justify-center">
            {preview ? (
              <img src={preview} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <Camera className="text-muted-foreground" />
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="profilePic">Profile Photo</Label>
            <Input id="profilePic" type="file" accept="image/*" onChange={onSelectFile} />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="fullName">Full Name</Label>
            <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="username">Username</Label>
            <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="location">Location</Label>
          <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="bio">Bio</Label>
          <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={4} />
        </div>

        {status && (
          <div className="px-3 py-2 rounded-lg text-sm bg-muted/50 border border-border">{status}</div>
        )}

        <Button type="submit" disabled={saveProfile.isPending}>
          {saveProfile.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Profile
            </>
          )}
        </Button>
      </form>
    </div>
  );
}

export default function Profile() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <ProfileContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
