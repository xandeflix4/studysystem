import React from 'react';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Wrapper to protect admin routes
 */
export const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  return user?.hasAdminPanelAccess ? (
    <>{children}</>
  ) : (
    <div className="p-8 flex items-center justify-center min-h-screen text-slate-500 font-bold">
      Acesso negado. Somente Instrutores podem acessar esta área.
    </div>
  );
};

/**
 * Wrapper to protect master-only routes
 */
export const MasterRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const isMaster = user?.role === 'MASTER' || user?.email === 'timbo.correa@gmail.com';
  return isMaster ? (
    <>{children}</>
  ) : (
    <div className="p-8 flex items-center justify-center min-h-screen text-slate-500 font-bold tracking-tight">
      🚫 Acesso restrito ao perfil Master (Proprietário).
    </div>
  );
};
