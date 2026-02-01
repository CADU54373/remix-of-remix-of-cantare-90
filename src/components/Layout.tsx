import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { Music, Calendar, BookOpen, Church, LogIn, LogOut, UserCheck, Presentation } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import logoImage from "@/assets/logo-cantare.png";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const { isAuthenticated, isPriest, isSuperAdmin, signOut, userRole } = useAuth();

  // Mostrar "Aprovar Usuários" para padres e super admins
  const canApproveUsers = isPriest || isSuperAdmin;

  const navItems = [
    { path: "/dashboard", icon: Church, label: "Início" },
    { path: "/musicas", icon: Music, label: "Músicas" },
    { path: "/slides", icon: Presentation, label: "Slides" },
    { path: "/escalas", icon: Calendar, label: "Escalas" },
    { path: "/liturgia", icon: BookOpen, label: "Liturgia" },
    ...(canApproveUsers ? [{ path: "/user-approvals", icon: UserCheck, label: "Aprovar Usuários" }] : []),
  ];

  const getRoleBadge = () => {
    if (isSuperAdmin) return { label: "Super Admin", variant: "destructive" as const };
    if (isPriest) return { label: "Padre", variant: "secondary" as const };
    if (userRole === 'admin') return { label: "Admin", variant: "default" as const };
    return { label: "✓ Logado", variant: "default" as const };
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 shadow-soft">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <img 
              src={logoImage} 
              alt="CANTARE Logo" 
              className="w-10 h-10 object-contain"
            />
            <div className="flex flex-col">
              <span className="font-bold text-lg leading-none">CANTARE</span>
              <span className="text-xs text-muted-foreground">Gestão de Ministério de Música</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <Badge variant={getRoleBadge().variant} className="hidden sm:flex">
                  {getRoleBadge().label}
                </Badge>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={signOut}
                  className="gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Sair</span>
                </Button>
              </>
            ) : (
              <>
                <Badge variant="secondary" className="hidden sm:flex">
                  👤 Visitante
                </Badge>
                <Link to="/auth">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="gap-2"
                  >
                    <LogIn className="h-4 w-4" />
                    <span className="hidden sm:inline">Login</span>
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden md:flex w-64 border-r bg-sidebar min-h-[calc(100vh-4rem)] flex-col">
          <nav className="flex-1 p-4 space-y-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-smooth",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-soft"
                      : "hover:bg-sidebar-accent text-sidebar-foreground"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Mobile Navigation */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t bg-card/95 backdrop-blur z-50">
          <div className="flex justify-around p-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-smooth",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-6 pb-24 md:pb-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
