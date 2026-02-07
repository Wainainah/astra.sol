"use client";

import { useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AvatarUpload } from "@/components/ui/avatar-upload";
import { UsernameInput } from "@/components/ui/username-input";
import { toast } from "sonner";

export function ProfileSetupModal() {
  const {
    user,
    showProfileSetup,
    setShowProfileSetup,
    updateProfile,
    isLoading,
  } = useAuth();

  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [twitter, setTwitter] = useState("");
  const [usernameAvailable, setUsernameAvailable] = useState(false);

  const handleSubmit = async () => {
    try {
      await updateProfile({
        username: username || undefined,
        displayName: displayName || undefined,
        bio: bio || undefined,
        avatarUrl: avatarUrl || undefined,
        twitter: twitter || undefined,
      });

      toast.success("Profile created successfully!");
      setShowProfileSetup(false);
    } catch (error) {
      toast.error("Failed to create profile", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  const handleSkip = () => {
    setShowProfileSetup(false);
    toast.info("You can complete your profile later in settings");
  };

  if (!showProfileSetup || !user) return null;

  return (
    <Dialog open={showProfileSetup} onOpenChange={setShowProfileSetup}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Complete Your Profile</DialogTitle>
          <DialogDescription>
            Set up your profile to personalize your experience. All fields are
            optional.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center space-y-2">
            <Label>Profile Picture</Label>
            <AvatarUpload
              currentAvatar={avatarUrl}
              walletAddress={user.address}
              onUpload={setAvatarUrl}
            />
          </div>

          {/* Username */}
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <UsernameInput
              value={username}
              onChange={setUsername}
              onAvailabilityChange={setUsernameAvailable}
            />
            <p className="text-xs text-muted-foreground">
              Your unique handle (e.g., @username)
            </p>
          </div>

          {/* Display Name */}
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
              maxLength={50}
            />
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself..."
              maxLength={280}
              rows={3}
            />
            <p className="text-xs text-muted-foreground text-right">
              {bio.length}/280
            </p>
          </div>

          {/* Twitter */}
          <div className="space-y-2">
            <Label htmlFor="twitter">Twitter Handle</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                @
              </span>
              <Input
                id="twitter"
                value={twitter}
                onChange={(e) => setTwitter(e.target.value.replace(/^@/, ""))}
                placeholder="username"
                className="pl-8"
                maxLength={50}
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={handleSkip} className="flex-1">
            Skip for Now
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || (username && !usernameAvailable)}
            className="flex-1"
          >
            {isLoading ? "Saving..." : "Complete Profile"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
