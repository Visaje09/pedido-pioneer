import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { ClienteSearchSelect } from '@/components/ui/cliente-search-select';
import SyncClientesButton from '@/components/catalogs/SyncClientesButton';
import { 
  Plus, 
  Save, 
  ArrowLeft,
  Building,
  FileText,
  CreditCard,
  Truck
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

interface Cliente {
  id_cliente: number;
  nombre_cliente: string;
  nit: string;
}

interface Proyecto {
  id_proyecto: number;
  nombre_proyecto: string;
  id_cliente: number;
}

interface ClaseOrden {
  id_clase_orden: number;
  tipo_orden: string;
}

interface TipoPago {
  id_tipo_pago: number;
  forma_pago: string;
}

interface MetodoDespacho {
  id_metodo_despacho: number;
  tipo_despacho: string;
}

interface OrdenForm {
  id_cliente: string;
  id_proyecto: string;
  id_clase_orden: string;
  id_tipo_pago: string;
  id_metodo_despacho: string;
  observaciones_orden: string;
}

export default function NuevaOrden() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [clasesOrden, setClasesOrden] = useState<ClaseOrden[]>([]);
  const [tiposPago, setTiposPago] = useState<TipoPago[]>([]);
  const [metodosDespacho, setMetodosDespacho] = useState<MetodoDespacho[]>([]);
  
  const [form, setForm] = useState<OrdenForm>({
    id_cliente: '',
    id_proyecto: '',
    id_clase_orden: '',
    id_tipo_pago: '',
    id_metodo_despacho: '',
    observaciones_orden: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  const canCreate = profile?.role === 'comercial' || profile?.role === 'admin';

  const fetchCatalogos = async () => {
    try {
      // Fetch all clientes in batches of 1000 to bypass PostgREST default limit
      const pageSize = 1000;
      let from = 0;
      let allClientes: Cliente[] = [];
      while (true) {
        const { data, error } = await supabase
          .from('cliente')
          .select('*')
          .order('nombre_cliente')
          .range(from, from + pageSize - 1);
        if (error) throw error;
        if (!data || data.length === 0) break;
        allClientes = allClientes.concat(data);
        if (data.length < pageSize) break;
        from += pageSize;
      }

      const [
        proyectosRes,
        clasesOrdenRes,
        tiposPagoRes,
        metodosDespachoRes
      ] = await Promise.all([
        supabase.from('proyecto').select('*').order('nombre_proyecto'),
        supabase.from('claseorden').select('*').order('tipo_orden'),
        supabase.from('tipopago').select('*').order('forma_pago'),
        supabase.from('metododespacho').select('*').order('tipo_despacho'),
      ]);

      if (proyectosRes.error) throw proyectosRes.error;
      if (clasesOrdenRes.error) throw clasesOrdenRes.error;
      if (tiposPagoRes.error) throw tiposPagoRes.error;
      if (metodosDespachoRes.error) throw metodosDespachoRes.error;

      setClientes(allClientes);
      setProyectos(proyectosRes.data || []);
      setClasesOrden(clasesOrdenRes.data || []);
      setTiposPago(tiposPagoRes.data || []);
      setMetodosDespacho(metodosDespachoRes.data || []);
    } catch (error) {
      console.error('Error fetching catalogs:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los catálogos",
        variant: "destructive",
      });
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchCatalogos();
  }, []);

  // Expose a simple refetch function for the sync button
  const refetchClientes = () => fetchCatalogos();

  const proyectosFiltrados = proyectos.filter(
    proyecto => !form.id_cliente || proyecto.id_cliente.toString() === form.id_cliente
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const ordenData = {
        id_cliente: parseInt(form.id_cliente),
        id_proyecto: form.id_proyecto ? parseInt(form.id_proyecto) : null,
        id_clase_orden: form.id_clase_orden ? parseInt(form.id_clase_orden) : null,
        id_tipo_pago: form.id_tipo_pago ? parseInt(form.id_tipo_pago) : null,
        id_metodo_despacho: form.id_metodo_despacho ? parseInt(form.id_metodo_despacho) : null,
        observaciones_orden: form.observaciones_orden || null,

        
      };

      const { data, error } = await supabase
        .from('ordenpedido')
        .insert(ordenData)
        .select('id_orden_pedido, consecutivo, consecutivo_code, fecha_creacion')
        .single();

      if (error) throw error;

      toast({
        title: "Orden creada",
        description: "La orden se ha creado correctamente en estado comercial",
      });

      navigate(`/ordenes`);
    } catch (error) {
      console.error('Error creating order:', error);
      toast({
        title: "Error",
        description: "No se pudo crear la orden",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!canCreate) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Acceso Denegado</CardTitle>
            <CardDescription>
              Solo el personal comercial y administradores pueden crear órdenes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link to="/dashboard">Volver al Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loadingData) {
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
            <div className="flex items-center space-x-4">
              <Plus className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">Nueva Orden de Pedido</h1>
                <p className="text-muted-foreground">Crear nueva orden en La fase comercial</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <SyncClientesButton onDone={() => refetchClientes()} />
              <Button variant="outline" asChild>
                <Link to="/ordenes" className="flex items-center space-x-2">
                  <ArrowLeft className="w-4 h-4" />
                  <span>Volver a Órdenes</span>
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Información del Cliente */}
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building className="w-5 h-5" />
                  <span>Información del Cliente</span>
                </CardTitle>
                <CardDescription>
                  Selecciona el cliente y proyecto para esta orden
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cliente">Cliente *</Label>
                  <ClienteSearchSelect 
                    clientes={clientes}
                    value={form.id_cliente}
                    onValueChange={(value) => setForm({ ...form, id_cliente: value, id_proyecto: '' })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="proyecto">Proyecto (Opcional)</Label>
                  <Select 
                    value={form.id_proyecto} 
                    onValueChange={(value) => setForm({ ...form, id_proyecto: value })}
                    disabled={!form.id_cliente}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar proyecto" />
                    </SelectTrigger>
                    <SelectContent>
                      {proyectosFiltrados.map((proyecto) => (
                        <SelectItem key={proyecto.id_proyecto} value={proyecto.id_proyecto.toString()}>
                          {proyecto.nombre_proyecto}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Configuración de la Orden */}
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="w-5 h-5" />
                  <span>Configuración de la Orden</span>
                </CardTitle>
                <CardDescription>
                  Define los parámetros de la orden de pedido
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="clase-orden">Clase de Orden</Label>
                  <Select 
                    value={form.id_clase_orden} 
                    onValueChange={(value) => setForm({ ...form, id_clase_orden: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar clase de orden" />
                    </SelectTrigger>
                    <SelectContent>
                      {clasesOrden.map((clase) => (
                        <SelectItem key={clase.id_clase_orden} value={clase.id_clase_orden.toString()}>
                          {clase.tipo_orden}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tipo-pago">Tipo de Pago</Label>
                  <Select 
                    value={form.id_tipo_pago} 
                    onValueChange={(value) => setForm({ ...form, id_tipo_pago: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo de pago" />
                    </SelectTrigger>
                    <SelectContent>
                      {tiposPago.map((tipo) => (
                        <SelectItem key={tipo.id_tipo_pago} value={tipo.id_tipo_pago.toString()}>
                          {tipo.forma_pago}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Método de Despacho */}
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Truck className="w-5 h-5" />
                  <span>Método de Despacho</span>
                </CardTitle>
                <CardDescription>
                  Configuración del envío y entrega
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="metodo-despacho">Método de Despacho</Label>
                  <Select 
                    value={form.id_metodo_despacho} 
                    onValueChange={(value) => setForm({ ...form, id_metodo_despacho: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar método de despacho" />
                    </SelectTrigger>
                    <SelectContent>
                      {metodosDespacho.map((metodo) => (
                        <SelectItem key={metodo.id_metodo_despacho} value={metodo.id_metodo_despacho.toString()}>
                          {metodo.tipo_despacho}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Observaciones */}
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle>Observaciones</CardTitle>
                <CardDescription>
                  Notas adicionales sobre la orden
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="observaciones">Observaciones</Label>
                  <Textarea
                    id="observaciones"
                    placeholder="Ingresa cualquier observación adicional sobre la orden..."
                    value={form.observaciones_orden}
                    onChange={(e) => setForm({ ...form, observaciones_orden: e.target.value })}
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Actions */}
          <div className="mt-8 flex justify-end space-x-4">
            <Button type="button" variant="outline" asChild>
              <Link to="/ordenes">Cancelar</Link>
            </Button>
            <Button type="submit" disabled={loading || !form.id_cliente}>
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Creando orden...' : 'Crear Orden'}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}