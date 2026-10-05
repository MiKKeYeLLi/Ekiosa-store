import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { GoogleSignin, isErrorWithCode, isSuccessResponse, statusCodes } from "@react-native-google-signin/google-signin";
import { env } from "./env";
import { supabase } from "./supabase";

export interface AppUser {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
}

function toAppUser(session: Session | null): AppUser | null {
  const u = session?.user;
  if (!u) return null;
  const meta = u.user_metadata ?? {};
  const str = (v: unknown) => (typeof v === "string" && v ? v : null);
  return {
    id: u.id,
    email: u.email ?? "",
    fullName: str(meta.full_name) ?? str(meta.name),
    avatarUrl: str(meta.avatar_url) ?? str(meta.picture),
  };
}

let configured = false;
function configureGoogle() {
  if (configured) return;
  // webClientId makes Google issue an ID token whose audience Supabase accepts.
  GoogleSignin.configure({ webClientId: env.googleWebClientId, scopes: ["email", "profile"] });
  configured = true;
}

export type SignInResult = { ok: true } | { ok: false; cancelled?: boolean; message: string };

/** Native Google account picker → ID token → Supabase session. */
export async function signInWithGoogle(): Promise<SignInResult> {
  try {
    configureGoogle();
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const response = await GoogleSignin.signIn();
    if (!isSuccessResponse(response)) return { ok: false, cancelled: true, message: "Sign-in cancelled." };
    const idToken = response.data.idToken;
    if (!idToken) return { ok: false, message: "Google didn't return an ID token. Check EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID." };
    const { error } = await supabase.auth.signInWithIdToken({ provider: "google", token: idToken });
    if (error) return { ok: false, message: error.message };
    return { ok: true };
  } catch (err) {
    if (isErrorWithCode(err)) {
      if (err.code === statusCodes.IN_PROGRESS) return { ok: false, cancelled: true, message: "Sign-in already in progress." };
      if (err.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) return { ok: false, message: "Google Play Services is unavailable on this device." };
    }
    return { ok: false, message: err instanceof Error ? err.message : "Couldn't sign in. Please try again." };
  }
}

export async function signOut() {
  await supabase.auth.signOut();
  try {
    configureGoogle();
    await GoogleSignin.signOut(); // so the account picker shows next time
  } catch {
    // Not signed in with Google natively — nothing to do.
  }
}

/** Current session and user, kept in sync with Supabase auth events. */
export function useSession() {
  const [state, setState] = useState<{ session: Session | null; user: AppUser | null; ready: boolean }>({
    session: null,
    user: null,
    ready: false,
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setState({ session: data.session, user: toAppUser(data.session), ready: true }));
    const { data } = supabase.auth.onAuthStateChange((_event, session) =>
      setState({ session, user: toAppUser(session), ready: true }),
    );
    return () => data.subscription.unsubscribe();
  }, []);

  return state;
}
