import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { organization, useSession, signOut } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";

interface InvitationInfo {
  email: string;
  status: string;
  orgId: string;
  organizationName: string;
  accountExists: boolean;
}

export function Component() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: session } = useSession();
  const [status, setStatus] = useState<"loading" | "ready" | "error" | "accepted">("loading");
  const [error, setError] = useState("");
  const [invitation, setInvitation] = useState<InvitationInfo | null>(null);

  const redirectPath = `/accept-invitation/${id}`;

  useEffect(() => {
    if (!id) return;
    api<InvitationInfo>(`/api/invitations/${id}`)
      .then(setInvitation)
      .catch(() => {
        setError("Invitation not found or has expired.");
        setStatus("error");
      });
  }, [id]);

  useEffect(() => {
    if (invitation && session) setStatus("ready");
  }, [session, invitation]);

  async function handleAccept() {
    if (!id) return;
    setStatus("loading");

    const { error: err } = await organization.acceptInvitation({ invitationId: id });

    if (err) {
      setError(err.message || "Failed to accept invitation");
      setStatus("error");
      return;
    }

    // Set the invited org as active and create a personal workspace
    if (invitation?.orgId) {
      await organization.setActive({ organizationId: invitation.orgId });

      try {
        await api("/api/workspaces", {
          method: "POST",
          body: JSON.stringify({ name: "Personal", orgId: invitation.orgId, type: "personal" }),
        });
      } catch {
        // Non-critical — they can still use the shared workspace
      }

      // Navigate to the invited org's workspace
      try {
        const workspaces = await api<{ publicId: string }[]>(
          `/api/workspaces?orgId=${invitation.orgId}`
        );
        if (workspaces.length > 0) {
          setStatus("accepted");
          setTimeout(() => navigate(`/w/${workspaces[0].publicId}`, { replace: true }), 1000);
          return;
        }
      } catch {
        // Fall through to landing page
      }
    }

    setStatus("accepted");
    setTimeout(() => navigate("/", { replace: true }), 1000);
  }

  const authQuery = new URLSearchParams({
    redirect: redirectPath,
    ...(invitation?.email ? { email: invitation.email } : {}),
  }).toString();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Team Invitation</CardTitle>
          <CardDescription>
            {invitation
              ? `You've been invited to join ${invitation.organizationName}`
              : "You've been invited to join a team workspace"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          {session && invitation && session.user.email !== invitation.email ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                This invitation is for <span className="font-medium text-foreground">{invitation.email}</span>, but you're signed in as <span className="font-medium text-foreground">{session.user.email}</span>.
              </p>
              <Button
                className="w-full"
                onClick={async () => {
                  await signOut();
                }}
              >
                Sign out and switch account
              </Button>
            </div>
          ) : !session && invitation ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Invitation for <span className="font-medium text-foreground">{invitation.email}</span>
              </p>
              {invitation.accountExists ? (
                <Button asChild className="w-full">
                  <Link to={`/sign-in?${authQuery}`}>
                    Sign in to accept
                  </Link>
                </Button>
              ) : (
                <Button asChild className="w-full">
                  <Link to={`/sign-up?${authQuery}`}>
                    Create account to accept
                  </Link>
                </Button>
              )}
            </div>
          ) : status === "accepted" ? (
            <p className="text-sm text-muted-foreground">Invitation accepted! Redirecting...</p>
          ) : status === "ready" ? (
            <Button onClick={handleAccept} className="w-full">
              Accept Invitation
            </Button>
          ) : status !== "error" ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
