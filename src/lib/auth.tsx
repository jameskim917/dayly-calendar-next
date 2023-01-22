import axios from "axios";
import {
  createContext,
  useContext,
  useMemo,
  useEffect,
  useState,
  useCallback,
} from "react";

export const axiosGoogle = axios.create();

interface AuthCtx {
  session: any;
  user: any;
  isGoogleSignedIn: boolean;
  signInWithGoogle: () => any;
  signOut: () => any;
}

export const AuthContext = createContext<AuthCtx>({
  session: null,
  user: null,
  isGoogleSignedIn: false,
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
      options: {
        scopes: "openid profile email https://www.googleapis.com/auth/calendar",
      },
    });
    if (error) {
      console.log(error);
    } else {
      setSession(data);
      setUser(data.session?.user);
      axiosGoogle.defaults.headers.common = {
        Authorization: `Bearer ${data.session?.provider_token}`,
      };
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
      isGoogleSignedIn:
        session?.session?.user?.app_metadata?.provider === "google",
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
        axiosGoogle.defaults.headers.common = {
          Authorization: `Bearer ${supabaseSession.session?.provider_token}`,
        };
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
