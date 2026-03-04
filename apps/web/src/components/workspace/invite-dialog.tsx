import { useState, useEffect, useCallback } from "react";
import { organization, useActiveOrganization, useSession } from "@/lib/auth-client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Check, Copy, Loader2, X } from "lucide-react";

interface InviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InviteDialog({ open, onOpenChange }: InviteDialogProps) {
  const { data: org, refetch } = useActiveOrganization();
  const { data: session } = useSession();
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [invitations, setInvitations] = useState<
    { id: string; email: string; status: string }[]
  >([]);

  const members = org?.members ?? [];
  const currentUserId = session?.user?.id;

  const fetchInvitations = useCallback(async () => {
    const { data } = await organization.listInvitations();
    setInvitations(
      (data ?? []).filter((inv: { status: string }) => inv.status === "pending")
    );
  }, []);

  useEffect(() => {
    if (open) fetchInvitations();
  }, [open, fetchInvitations]);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setSending(true);
    setError(null);
    setSuccess(null);

    try {
      await organization.inviteMember({ email: email.trim(), role: "member" });
      setSuccess(`Invitation sent to ${email.trim()}`);
      setEmail("");
      fetchInvitations();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send invitation");
    } finally {
      setSending(false);
    }
  }

  async function handleCancelInvitation(invitationId: string) {
    try {
      await organization.cancelInvitation({ invitationId });
      fetchInvitations();
    } catch {
      setError("Failed to cancel invitation");
    }
  }

  async function handleRemoveMember(memberIdOrEmail: string) {
    try {
      await organization.removeMember({ memberIdOrEmail });
      refetch();
    } catch {
      setError("Failed to remove member");
    }
  }

  function copyInviteLink(invitationId: string) {
    const link = `${window.location.origin}/accept-invitation/${invitationId}`;
    navigator.clipboard.writeText(link);
    setCopiedId(invitationId);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function getInitials(name?: string | null) {
    return (
      name
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase() || "?"
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite Members</DialogTitle>
          <DialogDescription>
            Invite people to collaborate in this organization.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleInvite} className="flex flex-col gap-3">
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="flex-1"
            />
            <Button type="submit" size="sm" disabled={sending}>
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Invite"}
            </Button>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          {success && <p className="text-sm text-green-600 dark:text-green-400">{success}</p>}
        </form>

        {invitations.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Pending Invitations</h4>
            {invitations.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between gap-2 text-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs">
                      {inv.email?.[0]?.toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate">{inv.email}</span>
                </div>
                <div className="flex shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => copyInviteLink(inv.id)}
                  >
                    {copiedId === inv.id ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => handleCancelInvitation(inv.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {members.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Members</h4>
            {members.map((member) => (
              <div key={member.id} className="flex items-center justify-between gap-2 text-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs">
                      {getInitials(member.user?.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate">
                    {member.user?.name || member.user?.email || member.userId}
                  </span>
                  {member.userId === currentUserId && (
                    <span className="text-[10px] text-muted-foreground">(you)</span>
                  )}
                </div>
                {member.userId !== currentUserId && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0"
                    onClick={() => handleRemoveMember(member.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
