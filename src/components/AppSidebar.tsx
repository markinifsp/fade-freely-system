import {
  LayoutDashboard,
  Calendar,
  CalendarDays,
  Scissors,
  Users,
  UserCircle,
  DollarSign,
  Settings,
  Menu,
  LogOut,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";

const allMenuItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard, roles: ["admin", "barbeiro"] },
  { title: "Agendamentos", url: "/agendamentos", icon: Calendar, roles: ["admin", "barbeiro"] },
  { title: "Calendário", url: "/calendario", icon: CalendarDays, roles: ["admin", "barbeiro"] },
  { title: "Barbeiros", url: "/barbeiros", icon: Scissors, roles: ["admin"] },
  { title: "Serviços", url: "/servicos", icon: Menu, roles: ["admin"] },
  { title: "Clientes", url: "/clientes", icon: Users, roles: ["admin", "barbeiro"] },
  { title: "Financeiro", url: "/financeiro", icon: DollarSign, roles: ["admin", "barbeiro"] },
  { title: "Configurações", url: "/configuracoes", icon: Settings, roles: ["admin"] },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { role, profile, signOut } = useAuth();

  const menuItems = allMenuItems.filter(item =>
    !role || item.roles.includes(role)
  );

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-gold flex items-center justify-center flex-shrink-0">
            <Scissors className="w-5 h-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="animate-slide-in">
              <h1 className="font-display text-lg font-bold text-foreground leading-tight">
                BarberPro
              </h1>
              <p className="text-xs text-muted-foreground">Gestão Premium</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      className={
                        isActive
                          ? "bg-primary/10 text-primary border border-primary/20"
                          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      }
                    >
                      <NavLink
                        to={item.url}
                        end={item.url === "/"}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all"
                        activeClassName=""
                      >
                        <item.icon className="w-5 h-5 flex-shrink-0" />
                        {!collapsed && <span className="text-sm font-medium">{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-border space-y-2">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
            <UserCircle className="w-5 h-5 text-muted-foreground" />
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{profile?.nome || "Usuário"}</p>
              <p className="text-xs text-muted-foreground capitalize">{role || "..."}</p>
            </div>
          )}
        </div>
        {!collapsed && (
          <>
            <div className="flex justify-center">
              <ThemeSwitcher />
            </div>
            <Button variant="outline" size="sm" className="w-full text-xs" onClick={signOut}>
              <LogOut className="w-3 h-3 mr-1.5" /> Sair
            </Button>
          </>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
