import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  ShoppingCart, 
  Package, 
  Truck, 
  FileText, 
  DollarSign,
  Settings,
  Plus,
  Database,
  LayoutDashboard,
  LogOut,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface MenuItem {
  title: string;
  icon: React.ReactNode;
  href?: string;
  roles: string[];
  badge?: string;
  subItems?: MenuItem[];
}

const capitalize = <T extends string>(str: T): Capitalize<T> => {
  return str.charAt(0).toUpperCase() + str.slice(1) as Capitalize<T>;
};

const menuItems: MenuItem[] = [
  {
    title: 'Dashboard',
    icon: <LayoutDashboard className="w-4 h-4" />,
    href: '/dashboard',
    roles: ['admin', 'comercial', 'inventarios', 'produccion', 'logistica', 'facturacion', 'financiera'],
  },
  {
    title: 'Órdenes',
    icon: <ShoppingCart className="w-4 h-4" />,
    roles: ['admin', 'comercial', 'inventarios', 'produccion', 'logistica', 'facturacion', 'financiera'],
    subItems: [
      {
        title: 'Todas las Órdenes',
        icon: <ShoppingCart className="w-4 h-4" />,
        href: '/ordenes',
        roles: ['admin', 'comercial', 'inventarios', 'produccion', 'logistica', 'facturacion', 'financiera'],
      },
      {
        title: 'Nueva Orden',
        icon: <Plus className="w-4 h-4" />,
        href: '/ordenes/nueva',
        roles: ['admin', 'comercial'],
      },
      {
        title: 'Inventarios',
        icon: <Package className="w-4 h-4" />,
        href: '/ordenes?filter=inventarios',
        roles: ['admin', 'inventarios'],
      },
      {
        title: 'Producción',
        icon: <FileText className="w-4 h-4" />,
        href: '/ordenes?filter=produccion',
        roles: ['admin', 'produccion'],
      },
      {
        title: 'Logística',
        icon: <Truck className="w-4 h-4" />,
        href: '/ordenes?filter=logistica',
        roles: ['admin', 'logistica'],
      },
      {
        title: 'Facturación',
        icon: <FileText className="w-4 h-4" />,
        href: '/ordenes?filter=facturacion',
        roles: ['admin', 'facturacion'],
      },
      {
        title: 'Financiera',
        icon: <DollarSign className="w-4 h-4" />,
        href: '/ordenes?filter=financiera',
        roles: ['admin', 'financiera'],
      },
    ],
  },
  {
    title: 'Catálogos',
    icon: <Database className="w-4 h-4" />,
    href: '/catalogos',
    roles: ['comercial', 'inventarios', 'produccion', 'logistica', 'facturacion', 'financiera'],
  },
  {
    title: 'Administración',
    icon: <Settings className="w-4 h-4" />,
    href: '/admin',
    badge: 'Solo Admin',
    roles: ['admin'],
  },
];

export function AppSidebar() {
  const { profile, signOut } = useAuth();
  const { state } = useSidebar();
  const location = useLocation();
  const [openGroups, setOpenGroups] = useState<string[]>(['Órdenes']);

  const currentPath = location.pathname;

  const getRoleBadgeColor = (role: string) => {
    const colors = {
      admin: 'bg-destructive text-destructive-foreground',
      comercial: 'bg-primary text-primary-foreground',
      inventarios: 'bg-warning text-warning-foreground',
      produccion: 'bg-accent text-accent-foreground',
      logistica: 'bg-success text-success-foreground',
      facturacion: 'bg-muted text-muted-foreground',
      financiera: 'bg-secondary text-secondary-foreground',
    };
    return colors[role as keyof typeof colors] || 'bg-muted text-muted-foreground';
  };

  const userMenuItems = menuItems.filter(item => 
    item.roles.includes(profile?.role || '')
  );

  const isActive = (path: string) => currentPath === path;
  const isGroupActive = (item: MenuItem) => {
    if (item.href && isActive(item.href)) return true;
    if (item.subItems) {
      return item.subItems.some(subItem => subItem.href && isActive(subItem.href));
    }
    return false;
  };

  const toggleGroup = (title: string) => {
    setOpenGroups(prev => 
      prev.includes(title) 
        ? prev.filter(group => group !== title)
        : [...prev, title]
    );
  };

  return (
    <Sidebar className="border-r bg-card">
      <SidebarHeader className="border-b p-6">
        <div className="flex items-center space-x-2">
          <ShoppingCart className="w-8 h-8 text-primary" />
          {state === "collapsed" ? null : (
            <div>
              <h1 className="text-xl font-bold text-foreground">ERP Órdenes</h1>
              <p className="text-sm text-muted-foreground">Sistema Integral</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-4 py-4">
        {state === "collapsed" ? null : profile && (
          <div className="mb-6 p-4 bg-muted/50 rounded-lg">
            <p className="text-sm font-medium text-foreground">{capitalize(profile.nombre)}</p>
            <Badge className={`text-xs ${getRoleBadgeColor(profile.role || '')}`}>
              {capitalize(profile.role || '')}
            </Badge>
          </div>
        )}

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {userMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  {item.subItems ? (
                    <Collapsible
                      open={openGroups.includes(item.title)}
                      onOpenChange={() => toggleGroup(item.title)}
                    >
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton
                          className={`w-full justify-between ${isGroupActive(item) ? 'bg-primary text-primary-foreground' : ''}`}
                        >
                          <div className="flex items-center space-x-2">
                            {item.icon}
                            {state === "collapsed" ? null : <span>{item.title}</span>}
                          </div>
                          {state === "collapsed" ? null : (
                            openGroups.includes(item.title) ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )
                          )}
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      {state === "collapsed" ? null : (
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {item.subItems
                              .filter(subItem => subItem.roles.includes(profile?.role || ''))
                              .map((subItem) => (
                                <SidebarMenuSubItem key={subItem.title}>
                                  <SidebarMenuSubButton asChild>
                                    <NavLink
                                      to={subItem.href || '#'}
                                      className={({ isActive }) =>
                                        isActive ? 'bg-muted text-primary font-medium' : 'hover:bg-muted/50'
                                      }
                                    >
                                      {subItem.icon}
                                      <span>{subItem.title}</span>
                                    </NavLink>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              ))}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      )}
                    </Collapsible>
                  ) : (
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.href || '#'}
                        className={({ isActive }) =>
                          isActive ? 'bg-primary text-primary-foreground font-medium' : 'hover:bg-muted/50'
                        }
                      >
                        <div className="flex items-center space-x-2">
                          {item.icon}
                          {state === "collapsed" ? null : <span>{item.title}</span>}
                        </div>
                        {state === "collapsed" ? null : item.badge && (
                          <Badge variant="secondary" className="text-xs ml-auto">
                            {item.badge}
                          </Badge>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        <Button
          variant="ghost"
          onClick={signOut}
          className="w-full justify-start text-muted-foreground hover:text-foreground"
        >
          <LogOut className="w-4 h-4 mr-2" />
          {state === "collapsed" ? null : 'Cerrar Sesión'}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}