import { Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { 
  Home, 
  Ban, 
  List, 
  IdCard, 
  Building, 
  Users, 
  MessageCircle, 
  Settings, 
  Puzzle, 
  HelpCircle,
  Shield,
  Key
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  const { t } = useTranslation();
  const [location] = useLocation();
  const { user } = useAuth();

  const navigationItems = [
    {
      name: t("dashboard"),
      href: "/",
      icon: Home,
      roles: ["super_admin", "admin", "club_manager", "security_teamleader", "security_personnel", "club_employee"]
    },
    {
      name: t("banned_guests"),
      href: "/banned-guests",
      icon: Ban,
      roles: ["super_admin", "admin", "club_manager", "security_teamleader", "security_personnel"]
    },
    {
      name: t("guestlists"),
      href: "/guestlists",
      icon: List,
      roles: ["super_admin", "admin", "club_manager", "security_teamleader"]
    },
    {
      name: t("id_scanning"),
      href: "/id-scanning",
      icon: IdCard,
      roles: ["super_admin", "admin", "club_manager", "security_teamleader", "security_personnel"]
    },
    {
      name: t("clubs"),
      href: "/clubs",
      icon: Building,
      roles: ["super_admin", "admin"]
    },
    {
      name: t("users"),
      href: "/users",
      icon: Users,
      roles: ["super_admin", "admin"]
    },
    {
      name: t("chat"),
      href: "/chat",
      icon: MessageCircle,
      roles: ["super_admin", "admin", "club_manager", "security_teamleader"],
      badge: 3
    }
  ];

  const settingsItems = [
    {
      name: "Platform Settings",
      href: "/platform-settings",
      icon: Settings,
      roles: ["super_admin"]
    },
    {
      name: "Licenses",
      href: "/licenses",
      icon: Key,
      roles: ["super_admin"]
    },
    {
      name: "User Settings",
      href: "/user-settings",
      icon: Settings,
      roles: ["super_admin", "admin", "club_manager", "security_teamleader", "security_personnel", "club_employee"]
    },
    {
      name: t("help"),
      href: "/help",
      icon: HelpCircle,
      roles: ["super_admin", "admin", "club_manager", "security_teamleader", "security_personnel", "club_employee"]
    }
  ];

  const hasAccess = (roles: string[]) => {
    return user && roles.includes(user.role);
  };

  return (
    <aside className={cn(
      "fixed inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border transform transition-transform duration-200 ease-in-out",
      isOpen ? "translate-x-0" : "-translate-x-full",
      "lg:translate-x-0"
    )}>
      <div className="flex flex-col h-full">
        {/* Logo Section */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-sidebar-border">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Shield className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-primary">XESS</span>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden p-2 rounded-md hover:bg-sidebar-accent"
            >
              <span className="sr-only">Close sidebar</span>
              ×
            </button>
          )}
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          <div className="space-y-1">
            {navigationItems.map((item) => {
              if (!hasAccess(item.roles)) return null;
              
              const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
              const Icon = item.icon;
              
              return (
                <Link key={item.name} href={item.href}>
                  <a className={cn(
                    "nav-item w-full",
                    isActive ? "nav-item-active" : "nav-item-inactive"
                  )}>
                    <Icon className="w-5 h-5 mr-3" />
                    <span>{item.name}</span>
                    {item.badge && (
                      <Badge variant="destructive" className="ml-auto">
                        {item.badge}
                      </Badge>
                    )}
                  </a>
                </Link>
              );
            })}
          </div>

          <div className="pt-6 mt-6 border-t border-sidebar-border">
            <div className="space-y-1">
              {settingsItems.map((item) => {
                if (!hasAccess(item.roles)) return null;
                
                const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
                const Icon = item.icon;
                
                return (
                  <Link key={item.name} href={item.href}>
                    <a className={cn(
                      "nav-item w-full",
                      isActive ? "nav-item-active" : "nav-item-inactive"
                    )}>
                      <Icon className="w-5 h-5 mr-3" />
                      <span>{item.name}</span>
                    </a>
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>
      </div>
    </aside>
  );
}
