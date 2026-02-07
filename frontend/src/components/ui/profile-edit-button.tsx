"use client";

import { useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AvatarUpload } from "@/components/ui/avatar-upload";
import { UsernameInput } from "@/components/ui/username-input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Edit2, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function ProfileEditButton() {
  const { user, updateProfile, isLoading } = useAuth();
  const [open, setOpen] = useState(false);

  const [username, setUsername] = useState(user?.username || "");
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || "");
  const [twitter, setTwitter] = useState(user?.twitter || "");
  const [usernameAvailable, setUsernameAvailable] = useState(true);

  if (!user) return null;

  const handleSubmit = async () => {
    try {
      await updateProfile({
        username: username || undefined,
        displayName: displayName || undefined,
        bio: bio || undefined,
        avatarUrl: avatarUrl || undefined,
        twitter: twitter || undefined,
      });

      toast.success("Profile updated successfully!");
      setOpen(false);
    } catch (error) {
      toast.error("Failed to update profile", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      // Reset form when opening
      setUsername(user.username || "");
      setDisplayName(user.displayName || "");
      setBio(user.bio || "");
      setAvatarUrl(user.avatarUrl || "");
      setTwitter(user.twitter || "");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Edit2 className="h-4 w-4" />
          Edit Profile
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Edit Profile</DialogTitle>
          <DialogDescription>
            Update your profile information. All fields are optional.
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
            <Label htmlFor="edit-username">Username</Label>
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
            <Label htmlFor="edit-displayName">Display Name</Label>
            <Input
              id="edit-displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
              maxLength={50}
            />
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="edit-bio">Bio</Label>
            <Textarea
              id="edit-bio"
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
            <Label htmlFor="edit-twitter">Twitter Handle</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                @
              </span>
              <Input
                id="edit-twitter"
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
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || (username && !usernameAvailable)}
            className="flex-1"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
