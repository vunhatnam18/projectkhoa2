// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../services/supabaseClient";

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Lấy session hiện tại
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else setLoading(false);
    });

    // Lắng nghe thay đổi auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) await fetchProfile(session.user.id);
        else { setProfile(null); setLoading(false); }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId) {
    const { data } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();
    setProfile(data ?? null);
    setLoading(false);
  }

  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }

  async function signUp(email, password, name, phone) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;

    // Tạo profile trong bảng users
    if (data.user) {
      await supabase.from("users").insert([{
        id: data.user.id,
        email,
        name,
        phone: phone || null,
        role: "buyer",
      }]);
    }
    return data;
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  }

  const isAdmin = profile?.role === "admin";
  const isSeller = profile?.role === "seller" || isAdmin;

  return (
    <AuthContext.Provider value={{
      user, profile, loading,
      isAdmin, isSeller,
      signIn, signUp, signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth phải dùng trong <AuthProvider>");
  return ctx;
}
