import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import { api } from "../api/axios";
import { AuthContext} from "./AuthContext";
import type { AuthUser } from "./AuthContext";


export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);


  
  useEffect(() => {
    let isMounted = true;

    const run = async () => {
      try {
        const res = await api.get("/auth/profile");
        if (isMounted) setUser(res.data.data.user);
      } catch {
        if (isMounted) setUser(null);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    run();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post("/auth/login", { email, password });
    setUser(res.data.data.user);
  };


  const logout = async () => {
    await api.post("/auth/logout");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};