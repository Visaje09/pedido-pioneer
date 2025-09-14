import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { 
  Search, 
  Plus, 
  Eye, 
  ArrowRight,
  Calendar,
  User,
  Building,
  DollarSign
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';

interface Orden {
  id_orden_pedido: number;
  consecutivo: string | null;
  estado: string;
  fecha_creacion: string | null;
  created_by: string;
  observaciones_orden: string | null;
  cliente?: {
    nombre_cliente: string;
    nit: string;
  };
  proyecto?: {
    nombre_proyecto: string;
  };
  detalles?: Array<{
    cantidad: number;
    valor_unitario: number;
  }>;
}

const estadoConfig = {
  borrador: { label: 'Borrador', color: 'bg-muted text-muted-foreground' },
  validacion_comercial: { label: 'Validación Comercial', color: 'bg-primary text-primary-foreground' },
  inventarios_pendiente: { label: 'Inventarios', color: 'bg-warning text-warning-foreground' },
  produccion_pendiente: { label: 'Producción', color: 'bg-accent text-accent-foreground' },
  logistica_pendiente: { label: 'Logística', color: 'bg-success text-success-foreground' },
  enviada: { label: 'Enviada', color: 'bg-success text-success-foreground' },
  facturacion_pendiente: { label: 'Facturación', color: 'bg-secondary text-secondary-foreground' },
  facturada: { label: 'Facturada', color: 'bg-primary text-primary-foreground' },
  financiera_pendiente: { label: 'Financiera', color: 'bg-accent text-accent-foreground' },
  cerrada: { label: 'Cerrada', color: 'bg-muted text-muted-foreground' },
  anulada: { label: 'Anulada', color: 'bg-destructive text-destructive-foreground' },
};

export default function Ordenes() {
  const { profile } = useAuth();
  const [searchParams] = useSearchParams();
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const filter = searchParams.get('filter');

  const fetchOrdenes = async () => {
    try {
      let query = supabase
        .from('ordenpedido')
        .select(`
          id_orden_pedido,
          consecutivo,
          estado,
          fecha_creacion,
          created_by,
          observaciones_orden,
          cliente:id_cliente(
            nombre_cliente,
            nit
          ),
          proyecto:id_proyecto(
            nombre_proyecto
          ),
          detalles:detalleorden(
            cantidad,
            valor_unitario
          )
        `)
        .order('fecha_creacion', { ascending: false });

      // Apply role-based filters
      if (filter === 'inventarios' && profile?.role === 'inventarios') {
        query = query.eq('estado', 'inventarios_pendiente');
      } else if (filter === 'produccion' && profile?.role === 'produccion') {
        query = query.eq('estado', 'produccion_pendiente');
      } else if (filter === 'logistica' && profile?.role === 'logistica') {
        query = query.in('estado', ['logistica_pendiente', 'enviada']);
      } else if (filter === 'facturacion' && profile?.role === 'facturacion') {
        query = query.in('estado', ['facturacion_pendiente', 'facturada']);
      } else if (filter === 'financiera' && profile?.role === 'financiera') {
        query = query.in('estado', ['financiera_pendiente', 'cerrada']);
      }

      const { data, error } = await query;

      if (error) {
        toast({
          title: "Error",
          description: "No se pudieron cargar las órdenes",
          variant: "destructive",
        });
        return;
      }

      setOrdenes(data || []);
    } catch (error) {
      console.error('Error fetching órdenes:', error);
      toast({
        title: "Error",
        description: "Error al cargar las órdenes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrdenes();
  }, [filter, profile?.role]);

  const filteredOrdenes = ordenes.filter(orden => 
    orden.consecutivo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    orden.cliente?.nombre_cliente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    orden.proyecto?.nombre_proyecto?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTotal = (orden: Orden) => {
    if (!orden.detalles || orden.detalles.length === 0) return 0;
    return orden.detalles.reduce((sum, detalle) => 
      sum + ((detalle.cantidad || 0) * (detalle.valor_unitario || 0)), 0
    );
  };

  const canCreateOrder = profile?.role === 'comercial' || profile?.role === 'admin';

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Gestión de Órdenes
                {filter && (
                  <span className="text-primary"> - {estadoConfig[filter as keyof typeof estadoConfig]?.label}</span>
                )}
              </h1>
              <p className="text-muted-foreground">
                {filteredOrdenes.length} órdenes encontradas
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" asChild>
                <Link to="/dashboard">Volver al Dashboard</Link>
              </Button>
              {canCreateOrder && (
                <Button asChild>
                  <Link to="/ordenes/nueva">
                    <Plus className="w-4 h-4 mr-2" />
                    Nueva Orden
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por consecutivo, cliente o proyecto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Órdenes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOrdenes.map((orden) => (
            <Card key={orden.id_orden_pedido} className="hover:shadow-lg transition-all duration-200 border-0 shadow-md">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CardTitle className="text-lg">
                      {orden.consecutivo || `#${orden.id_orden_pedido}`}
                    </CardTitle>
                  </div>
                  <Badge className={estadoConfig[orden.estado as keyof typeof estadoConfig]?.color}>
                    {estadoConfig[orden.estado as keyof typeof estadoConfig]?.label}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Building className="w-4 h-4" />
                    <span>{orden.cliente?.nombre_cliente || 'Cliente no asignado'}</span>
                  </div>
                  
                  {orden.proyecto && (
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <User className="w-4 h-4" />
                      <span>{orden.proyecto.nombre_proyecto}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {orden.fecha_creacion ? 
                        new Date(orden.fecha_creacion).toLocaleDateString('es-ES') : 
                        'Fecha no disponible'
                      }
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <DollarSign className="w-4 h-4" />
                    <span className="font-medium">
                      ${getTotal(orden).toLocaleString('es-ES')}
                    </span>
                  </div>
                </div>

                {orden.observaciones_orden && (
                  <CardDescription className="text-sm">
                    {orden.observaciones_orden.substring(0, 100)}
                    {orden.observaciones_orden.length > 100 && '...'}
                  </CardDescription>
                )}
                
                <Button asChild className="w-full" variant="outline">
                  <Link to={`/ordenes/${orden.id_orden_pedido}`} className="flex items-center space-x-2">
                    <Eye className="w-4 h-4" />
                    <span>Ver Detalle</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredOrdenes.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-muted-foreground mb-4">
              No se encontraron órdenes con los criterios de búsqueda
            </div>
            {canCreateOrder && (
              <Button asChild>
                <Link to="/ordenes/nueva">
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Primera Orden
                </Link>
              </Button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}