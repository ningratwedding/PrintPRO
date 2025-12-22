import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { UserBranchRole, Branch, Role } from '../types/database';

interface AuthContextType {
  user: User | null;
  userBranches: UserBranchRole[];
  currentBranch: Branch | null;
  currentRole: Role | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  setCurrentBranch: (branchId: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userBranches, setUserBranches] = useState<UserBranchRole[]>([]);
  const [currentBranch, setCurrentBranchState] = useState<Branch | null>(null);
  const [currentRole, setCurrentRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadUserBranches(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        setUser(session?.user ?? null);
        if (session?.user) {
          await loadUserBranches(session.user.id);
        } else {
          setUserBranches([]);
          setCurrentBranchState(null);
          setCurrentRole(null);
          setLoading(false);
        }
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserBranches = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_branch_roles')
        .select(`
          *,
          branch:branches(*),
          role:roles(*)
        `)
        .eq('user_id', userId);

      if (error) throw error;

      setUserBranches(data || []);

      const savedBranchId = localStorage.getItem('currentBranchId');
      if (savedBranchId && data?.some(ubr => ubr.branch_id === savedBranchId)) {
        const ubr = data.find(u => u.branch_id === savedBranchId);
        if (ubr?.branch && ubr?.role) {
          setCurrentBranchState(ubr.branch as Branch);
          setCurrentRole(ubr.role as Role);
        }
      } else if (data && data.length > 0) {
        const firstUbr = data[0];
        if (firstUbr.branch && firstUbr.role) {
          setCurrentBranchState(firstUbr.branch as Branch);
          setCurrentRole(firstUbr.role as Role);
          localStorage.setItem('currentBranchId', firstUbr.branch_id);
        }
      }
    } catch (error) {
      console.error('Error loading user branches:', error);
    } finally {
      setLoading(false);
    }
  };

  const setCurrentBranch = (branchId: string) => {
    const ubr = userBranches.find(u => u.branch_id === branchId);
    if (ubr?.branch && ubr?.role) {
      setCurrentBranchState(ubr.branch as Branch);
      setCurrentRole(ubr.role as Role);
      localStorage.setItem('currentBranchId', branchId);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    localStorage.removeItem('currentBranchId');
  };

  return (
    <AuthContext.Provider value={{
      user,
      userBranches,
      currentBranch,
      currentRole,
      loading,
      signIn,
      signUp,
      signOut,
      setCurrentBranch
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
