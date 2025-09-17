import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  ShoppingCart, 
  Package, 
  Truck, 
  FileText, 
  DollarSign,
  Settings,
  Plus,
  Eye,
  Database
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface RoleModule {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  badge?: string;
  roles: string[];
}

  const capitalize = <T extends string>(str: T): Capitalize<T> => {
    return str.charAt(0).toUpperCase() + str.slice(1) as Capitalize<T>;
  }

const modules: RoleModule[] = [
  {
    title: 'Órdenes de Pedido',
    description: 'Gestiona el flujo completo de órdenes',
    icon: <ShoppingCart className="w-6 h-6" />,
    href: '/ordenes',
    roles: ['admin', 'comercial', 'inventarios', 'produccion', 'logistica', 'facturacion', 'financiera'],
  },
  {
    title: 'Nueva Orden',
    description: 'Crear nueva orden de pedido',
    icon: <Plus className="w-6 h-6" />,
    href: '/ordenes/nueva',
    roles: ['admin', 'comercial'],
  },
  {
    title: 'Administración',
    description: 'Gestión de usuarios y catálogos',
    icon: <Settings className="w-6 h-6" />,
    href: '/admin',
    badge: 'Solo Admin',
    roles: ['admin'],
  },
  {
    title: 'Catálogos',
    description: 'Gestión de catálogos del área',
    icon: <Database className="w-6 h-6" />,
    href: '/catalogos',
    roles: ['comercial', 'inventarios', 'produccion', 'logistica', 'facturacion', 'financiera'],
  },
  {
    title: 'Inventarios',
    description: 'Validación y gestión de inventarios',
    icon: <Package className="w-6 h-6" />,
    href: '/ordenes?filter=inventarios',
    roles: ['admin', 'inventarios'],
  },
  {
    title: 'Producción',
    description: 'Órdenes de producción y seguimiento',
    icon: <FileText className="w-6 h-6" />,
    href: '/ordenes?filter=produccion',
    roles: ['admin', 'produccion'],
  },
  {
    title: 'Logística',
    description: 'Remisiones y envíos',
    icon: <Truck className="w-6 h-6" />,
    href: '/ordenes?filter=logistica',
    roles: ['admin', 'logistica'],
  },
  {
    title: 'Facturación',
    description: 'Gestión de facturación',
    icon: <FileText className="w-6 h-6" />,
    href: '/ordenes?filter=facturacion',
    roles: ['admin', 'facturacion'],
  },
  {
    title: 'Financiera',
    description: 'Seguimiento financiero y cierre',
    icon: <DollarSign className="w-6 h-6" />,
    href: '/ordenes?filter=financiera',
    roles: ['admin', 'financiera'],
  },
];

export default function Dashboard() {
  const { profile, signOut } = useAuth();

  const userModules = modules.filter(module => 
    module.roles.includes(profile?.role || '')
  );

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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <ShoppingCart className="w-8 h-8 text-primary" />
                <h1 className="text-2xl font-bold text-foreground">ERP Órdenes</h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-foreground">{capitalize(profile?.nombre)}</p>
                <Badge className={getRoleBadgeColor(profile?.role || '')}>
                  {capitalize(profile?.role || '')}
                </Badge>
              </div>
              <Button variant="outline" onClick={signOut}>
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Bienvenido, {profile?.nombre}
          </h2>
          <p className="text-muted-foreground">
            Accede a los módulos disponibles para tu rol: {capitalize(profile?.role || '')}
          </p>
        </div>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {userModules.map((module, index) => (
            <Card key={index} className="hover:shadow-lg transition-all duration-200 border-0 shadow-md hover:scale-105">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                      {module.icon}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{module.title}</CardTitle>
                    </div>
                  </div>
                  {module.badge && (
                    <Badge variant="secondary" className="text-xs">
                      {module.badge}
                    </Badge>
                  )}
                </div>
                <CardDescription className="text-muted-foreground">
                  {module.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="pt-0">
                <Button asChild className="w-full">
                  <Link to={module.href} className="flex items-center space-x-2">
                    <Eye className="w-4 h-4" />
                    <span>Acceder</span>
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-0 shadow-md bg-gradient-to-r from-primary/5 to-primary/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Órdenes Activas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">24</div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-gradient-to-r from-success/5 to-success/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Completadas Hoy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">8</div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-gradient-to-r from-warning/5 to-warning/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pendientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">16</div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-gradient-to-r from-accent/5 to-accent/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Mes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">142</div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}