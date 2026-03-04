import { useEffect, useRef } from "react";
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
  const setupDone = useRef(false);

  useEffect(() => {
    if (!isPending && !session) {
      navigate("/sign-in");
    }
  }, [session, isPending, navigate]);

  useEffect(() => {
    if (orgsPending || !orgs || !session || setupDone.current) return;
    setupDone.current = true;

    async function setup() {
      try {
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
          // Has orgs but no spaces
          const firstOrg = orgs![0];
          await organization.setActive({ organizationId: firstOrg.id });
          navigate(`/w/empty`, { replace: true });
          return;
        }

        // No orgs — re-fetch to confirm (avoid race with stale data)
        const { data: freshOrgs } = await organization.list();
        if (freshOrgs && freshOrgs.length > 0) {
          // Orgs exist now (created by concurrent run), redirect
          const org = freshOrgs[0];
          await organization.setActive({ organizationId: org.id });
          const spaces = await api<Workspace[]>(`/api/workspaces?orgId=${org.id}`);
          if (spaces.length > 0) {
            navigate(`/w/${spaces[0].publicId}`, { replace: true });
            return;
          }
          navigate(`/w/empty`, { replace: true });
          return;
        }

        // Truly no orgs — create personal org + space
        const userName = session!.user.name || "My";
        const slug = `personal-${Date.now()}`;
        const { data: newOrg, error } = await organization.create({
          name: `${userName}'s Notes`,
          slug,
          metadata: { type: "personal" },
        });

        if (error || !newOrg) return;

        await organization.setActive({ organizationId: newOrg.id });

        const space = await api<{ publicId: string }>("/api/workspaces", {
          method: "POST",
          body: JSON.stringify({ name: "Personal", orgId: newOrg.id }),
        });

        navigate(`/w/${space.publicId}`, { replace: true });
      } catch (e) {
        console.error("[Landing] Setup failed:", e);
      }
    }

    setup();
  }, [orgs, orgsPending, session, navigate]);

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-muted-foreground">Loading...</div>
    </div>
  );
}
