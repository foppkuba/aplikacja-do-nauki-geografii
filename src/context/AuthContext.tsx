import React, { createContext, useContext, useState, useEffect } from "react";

interface AuthContextType {
  user: string | null;
  xp: number;
  login: (username: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
  addXp: (amount: number) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<string | null>(null);
  const [xp, setXp] = useState<number>(0);

  const fetchProfile = async (username: string) => {
    try {
      const response = await fetch(`/api/users/profile?username=${encodeURIComponent(username)}`);
      if (response.ok) {
        const data = await response.json();
        setXp(data.xp || 0);
      }
    } catch (e) {
      console.error("Błąd pobierania profilu użytkownika", e);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user);
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("geo_user");
    if (storedUser) {
      setUser(storedUser);
      fetchProfile(storedUser);
    }
  }, []);

  const login = (username: string) => {
    localStorage.setItem("geo_user", username);
    setUser(username);
    fetchProfile(username);
  };

  const logout = () => {
    localStorage.removeItem("geo_user");
    setUser(null);
    setXp(0);
  };

  const addXp = async (amount: number) => {
    if (!user) return;
    
    // Optymistyczna aktualizacja lokalna
    setXp((prev) => prev + amount);

    try {
      const response = await fetch("/api/users/add-xp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: user,
          amount
        })
      });
      if (response.ok) {
        const data = await response.json();
        setXp(data.xp);
      }
    } catch (e) {
      console.error("Błąd podczas dodawania XP", e);
    }
  };

  return (
    <AuthContext.Provider value={{ user, xp, login, logout, isAuthenticated: !!user, addXp, refreshProfile }}>
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
