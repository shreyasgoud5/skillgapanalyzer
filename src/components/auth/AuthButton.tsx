"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { LogOut, LogIn, User } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AuthButton() {
  const supabase = createClient();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };
    fetchUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null);
        if (event === "SIGNED_OUT") router.refresh();
      }
    );

    return () => authListener.subscription.unsubscribe();
  }, [supabase.auth, router]);

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  if (user) {
    return (
      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-2 text-sm text-foreground/80">
  <img
    src={
      user.user_metadata?.picture ||
      user.identities?.[0]?.identity_data?.avatar_url ||
      "/default-avatar.png"
    }
  alt="Avatar"
  className="w-6 h-6 rounded-full"
  onError={(e) => {
    e.currentTarget.src = "/default-avatar.png";
  }}
/>

<span className="truncate max-w-[150px]">
  {user.user_metadata?.full_name || user.email}
</span>
        </div>
        <Button variant="outline" size="sm" onClick={handleLogout}>
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>
    );
  }

  return (
    <Button onClick={handleLogin} size="sm">
      <LogIn className="w-4 h-4 mr-2" />
      Sign in with Google
    </Button>
  );
}
