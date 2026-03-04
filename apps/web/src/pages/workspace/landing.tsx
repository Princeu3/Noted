import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useSession, useListOrganizations, organization } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { api } from "@/lib/api";

interface Workspace {
  id: number;
  publicId: string;
  name: string;
}

export function Component() {
  const navigate = useNavigate();
  const { data: session, isPending } = useSession();
  const { data: orgs, isPending: orgsPending } = useListOrganizations();
  const [orgName, setOrgName] = useState("");
  const [creating, setCreating] = useState(false);
  const [checked, setChecked] = useState(false);
  const [nameError, setNameError] = useState("");

  // Redirect if not authenticated
  useEffect(() => {
    if (!isPending && !session) {
      navigate("/sign-in");
    }
  }, [session, isPending, navigate]);

  // Check for existing orgs and workspaces, auto-redirect
  useEffect(() => {
    if (orgsPending || !orgs || checked) return;

    async function checkExisting() {
      if (orgs!.length > 0) {
        const org = orgs![0];
        // Set as active org
        await organization.setActive({ organizationId: org.id });
        // Check for workspaces in this org
        const workspaces = await api<Workspace[]>(`/api/workspaces?orgId=${org.id}`);
        if (workspaces.length > 0) {
          navigate(`/w/${workspaces[0].publicId}`, { replace: true });
          return;
        }
      }
      setChecked(true);
    }

    checkExisting();
  }, [orgs, orgsPending, checked, navigate]);

  const reservedNames = ["personal", "shared"];

  function handleNameChange(value: string) {
    setOrgName(value);
    if (reservedNames.includes(value.trim().toLowerCase())) {
      setNameError(`"${value.trim()}" is reserved. Please choose a different name.`);
    } else {
      setNameError("");
    }
  }

  async function handleCreateOrg() {
    if (!orgName.trim() || nameError) return;
    setCreating(true);

    const slug = orgName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const { data, error } = await organization.create({ name: orgName, slug });

    if (error || !data) {
      setCreating(false);
      return;
    }

    await organization.setActive({ organizationId: data.id });

    const [personal] = await Promise.all([
      api<{ publicId: string }>("/api/workspaces", {
        method: "POST",
        body: JSON.stringify({ name: "Personal", orgId: data.id, type: "personal" }),
      }),
      api<{ publicId: string }>("/api/workspaces", {
        method: "POST",
        body: JSON.stringify({ name: "Shared", orgId: data.id, type: "shared" }),
      }),
    ]);

    navigate(`/w/${personal.publicId}`);
  }

  if (isPending || orgsPending || !checked) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Welcome to Noted</CardTitle>
          <CardDescription>Create your team workspace to get started</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Team name (e.g. Acme Corp)"
            value={orgName}
            onChange={(e) => handleNameChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreateOrg()}
          />
          {nameError && <p className="text-sm text-destructive">{nameError}</p>}
          <Button onClick={handleCreateOrg} className="w-full" disabled={creating || !orgName.trim() || !!nameError}>
            {creating ? "Creating..." : "Create Workspace"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
