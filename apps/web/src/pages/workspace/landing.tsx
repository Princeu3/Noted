import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useSession, useListOrganizations, organization } from "@/lib/auth-client";
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
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!isPending && !session) {
      navigate("/sign-in");
    }
  }, [session, isPending, navigate]);

  useEffect(() => {
    if (orgsPending || !orgs || !session || checked) return;

    async function setup() {
      // If user has orgs, find first one with spaces and redirect
      if (orgs!.length > 0) {
        for (const org of orgs!) {
          await organization.setActive({ organizationId: org.id });
          const spaces = await api<Workspace[]>(`/api/workspaces?orgId=${org.id}`);
          if (spaces.length > 0) {
            navigate(`/w/${spaces[0].publicId}`, { replace: true });
            return;
          }
        }
        // Has orgs but no spaces — redirect to first org's context, will show empty state
        const firstOrg = orgs![0];
        await organization.setActive({ organizationId: firstOrg.id });
        setChecked(true);
        return;
      }

      // No orgs — auto-create personal org + personal space
      const userName = session!.user.name || "My";
      const slug = `personal-${Date.now()}`;
      const { data: newOrg, error } = await organization.create({
        name: `${userName}'s Notes`,
        slug,
        metadata: { type: "personal" },
      });

      if (error || !newOrg) {
        setChecked(true);
        return;
      }

      await organization.setActive({ organizationId: newOrg.id });

      const space = await api<{ publicId: string }>("/api/workspaces", {
        method: "POST",
        body: JSON.stringify({ name: "Personal", orgId: newOrg.id }),
      });

      navigate(`/w/${space.publicId}`, { replace: true });
    }

    setup();
  }, [orgs, orgsPending, session, checked, navigate]);

  if (isPending || orgsPending || !checked) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // User has orgs but no spaces — show empty state (will be handled by layout)
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-muted-foreground">Loading...</div>
    </div>
  );
}
