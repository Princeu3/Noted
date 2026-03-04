import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { HocuspocusProvider } from "@hocuspocus/provider";
import * as Y from "yjs";

export interface PresenceUser {
  id: string;
  name: string;
  image?: string | null;
  color: string;
}

export interface PresenceLocation {
  workspacePublicId: string;
  pagePublicId?: string;
  pageTitle?: string;
}

export interface PresenceState {
  user: PresenceUser;
  location: PresenceLocation | null;
}

export interface OnlineUser extends PresenceUser {
  location: PresenceLocation | null;
}

interface PresenceContextValue {
  onlineUsers: OnlineUser[];
  usersOnPage: (pagePublicId: string) => OnlineUser[];
  usersInWorkspace: (workspacePublicId: string) => OnlineUser[];
  setLocation: (location: PresenceLocation | null) => void;
  connected: boolean;
}

const PresenceContext = createContext<PresenceContextValue | null>(null);

const USER_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4",
  "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6", "#f59e0b",
];

function pickColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = ((hash << 5) - hash + userId.charCodeAt(i)) | 0;
  }
  return USER_COLORS[Math.abs(hash) % USER_COLORS.length];
}

function getWsUrl(): string {
  const apiUrl = import.meta.env.VITE_API_URL || "";
  if (import.meta.env.VITE_HOCUSPOCUS_URL) {
    return import.meta.env.VITE_HOCUSPOCUS_URL;
  }
  if (apiUrl) {
    return apiUrl.replace(/^http/, "ws") + "/collaboration";
  }
  const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${wsProtocol}//${window.location.host}/collaboration`;
}

interface PresenceProviderProps {
  orgId: string | undefined;
  user: { id: string; name: string; image?: string | null } | undefined;
  children: ReactNode;
}

export function PresenceProvider({ orgId, user, children }: PresenceProviderProps) {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [connected, setConnected] = useState(false);
  const providerRef = useRef<HocuspocusProvider | null>(null);
  const locationRef = useRef<PresenceLocation | null>(null);

  const setLocation = useCallback((location: PresenceLocation | null) => {
    locationRef.current = location;
    const provider = providerRef.current;
    if (!provider?.awareness) return;
    const current = provider.awareness.getLocalState() as PresenceState | null;
    if (current) {
      provider.awareness.setLocalState({ ...current, location });
    }
  }, []);

  useEffect(() => {
    if (!orgId || !user) return;

    const doc = new Y.Doc();
    const provider = new HocuspocusProvider({
      url: getWsUrl(),
      name: `presence:${orgId}`,
      document: doc,
      token: "cookie-auth",
      onConnect: () => setConnected(true),
      onDisconnect: () => setConnected(false),
    });

    providerRef.current = provider;

    // Set local awareness state
    const localState: PresenceState = {
      user: {
        id: user.id,
        name: user.name,
        image: user.image,
        color: pickColor(user.id),
      },
      location: locationRef.current,
    };
    provider.awareness?.setLocalState(localState);

    // Listen for awareness changes
    function onAwarenessChange() {
      if (!provider.awareness) return;
      const states = provider.awareness.getStates() as Map<number, PresenceState>;
      const seen = new Map<string, OnlineUser>();

      states.forEach((state, clientId) => {
        if (!state?.user?.id) return;
        // Skip self
        if (state.user.id === user!.id) return;
        // Deduplicate by user id (multi-tab) — keep latest
        seen.set(state.user.id, {
          ...state.user,
          location: state.location,
        });
      });

      setOnlineUsers(Array.from(seen.values()));
    }

    provider.awareness?.on("change", onAwarenessChange);
    // Initial read
    onAwarenessChange();

    return () => {
      provider.awareness?.off("change", onAwarenessChange);
      provider.destroy();
      providerRef.current = null;
      setConnected(false);
      setOnlineUsers([]);
    };
  }, [orgId, user?.id]);

  const usersOnPage = useCallback(
    (pagePublicId: string) =>
      onlineUsers.filter((u) => u.location?.pagePublicId === pagePublicId),
    [onlineUsers],
  );

  const usersInWorkspace = useCallback(
    (workspacePublicId: string) =>
      onlineUsers.filter((u) => u.location?.workspacePublicId === workspacePublicId),
    [onlineUsers],
  );

  return (
    <PresenceContext.Provider
      value={{ onlineUsers, usersOnPage, usersInWorkspace, setLocation, connected }}
    >
      {children}
    </PresenceContext.Provider>
  );
}

export function usePresence() {
  const ctx = useContext(PresenceContext);
  if (!ctx) {
    throw new Error("usePresence must be used within a PresenceProvider");
  }
  return ctx;
}
