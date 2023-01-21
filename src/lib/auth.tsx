import {
  createContext,
  useContext,
  useMemo,
  useEffect,
  useState,
  useCallback,
} from "react";

interface AuthCtx {
  session: any;
  user: any;
  signInWithGoogle: () => any;
  signOut: () => any;
}

export const AuthContext = createContext<AuthCtx>({
  session: null,
  user: null,
  signInWithGoogle: () => null,
  signOut: () => null,
});

export const AuthProvider = ({
  supabase,
  children,
  ...props
}: {
  supabase: any;
  children: any;
}) => {
  const [session, setSession] = useState<any | null>(null);
  const [user, setUser] = useState<any | null>(null);

  const signInWithGoogle = useCallback(async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
    });
    if (error) {
      console.log(error);
    } else {
      setSession(data);
      setUser(data.session?.user);
    }
  }, [supabase.auth]);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.log(error);
    } else {
      setSession(null);
      setUser(null);
    }
  }, [supabase.auth]);

  const authContextValue = useMemo(() => {
    return {
      session,
      user,
      signInWithGoogle,
      signOut,
    };
  }, [session, user, signInWithGoogle, signOut]);

  useEffect(() => {
    async function getSession() {
      const { data: supabaseSession, error } = await supabase.auth.getSession();
      if (!error) {
        setSession(supabaseSession);
        setUser(supabaseSession.session?.user);
        console.log(supabaseSession);
      }
    }

    getSession();
  }, [supabase.auth]);

  return (
    <AuthContext.Provider value={authContextValue} {...props}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};
