// auth.js - login, sessione e protezione delle pagine
import { supabase } from "./config.js";

export async function login(email, password) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "Email o password non corretti" };
  return { error: null };
}

export async function logout() {
  await supabase.auth.signOut();
  location.href = "login.html";
}

export async function loadProfile() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, email, role, active, must_change_password")
    .eq("id", session.user.id)
    .single();
  if (error || !data) return null;
  return data;
}

/**
 * Guard delle pagine.
 * - nessuna sessione o profilo non leggibile -> login
 * - account disattivato -> logout e login con avviso
 * - password provvisoria ancora da cambiare -> pagina cambio password
 * - pagina admin e utente non admin -> home
 * La sicurezza vera e' nelle regole RLS del database: questo guard serve solo alla navigazione.
 */
export async function requireAuth({ admin = false, allowMustChange = false } = {}) {
  const profile = await loadProfile();
  if (!profile) {
    location.replace("login.html");
    return null;
  }
  if (!profile.active) {
    await supabase.auth.signOut();
    location.replace("login.html?msg=disattivato");
    return null;
  }
  if (profile.must_change_password && !allowMustChange) {
    location.replace("cambia-password.html");
    return null;
  }
  if (admin && profile.role !== "admin") {
    location.replace("index.html");
    return null;
  }
  return profile;
}

export function showMsg(el, text, kind = "err") {
  el.textContent = text;
  el.className = "msg " + kind;
  el.hidden = false;
}
