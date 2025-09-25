import React, { useState, useEffect ,useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search } from 'lucide-react';
import { OrdenKanban, KanbanColumnType , OrdenStageUI , FaseOrdenDB, EstatusOrdenDB , UI_TO_FASE, STAGE_UI } from "@/types/kanban";
import { Input } from "@/components/ui/input";
import { OrderModal } from '../modals/OrderModal';
import { OrderCard } from './OrderCard';
 

interface KanbanBoardProps {
  onOrderClick: (order: OrdenKanban ) => void ;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ onOrderClick }) => {
  const { profile } = useAuth();
  const [columns, setColumns] = useState<KanbanColumnType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<OrdenKanban | null>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);

  const EMPTY_COLUMNS = useMemo<KanbanColumnType[]>(
    () => 
      (Object.keys(STAGE_UI) as OrdenStageUI[]).map((key) => ({
        id: key,
        title: STAGE_UI[key].label,
        color: STAGE_UI[key].color,
        orders: [],
        description: "",
      })),
    []
  );

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data: ordersData, error } = await supabase
        .from('ordenpedido')
        .select(`
          *,
          cliente:cliente(nombre_cliente, nit),
          proyecto:proyecto(nombre_proyecto),
          claseorden:claseorden(tipo_orden),
          tipo_servicio:tipo_servicio(nombre_tipo_servicio, siglas_tipo_servicio),
          detalles:detalleorden(cantidad, valor_unitario)
        `)
        .order('fecha_modificacion', { ascending: false });

      if (error) {
        console.error('Error fetching orders:', error);
        return;
      }

      const transformed: OrdenKanban[] = (ordersData || []).map((order: any) => ({
        id_orden_pedido: order.id_orden_pedido,
        consecutivo_code: order.consecutivo_code ?? null,
        consecutivo: (order.consecutivo_code ?? (order.consecutivo != null ? String(order.consecutivo) : null)),
        nombre_cliente: order.cliente?.nombre_cliente || 'Cliente no especificado',
        tipo_orden: order.claseorden?.tipo_orden || 'Tipo no especificado',
        fase: order.fase as FaseOrdenDB,
        estatus: order.estatus as EstatusOrdenDB,
        fecha_creacion: order.fecha_creacion,
        fecha_modificacion: order.fecha_modificacion,
        observaciones_orden: order.observaciones_orden,
        proyecto_nombre: order.proyecto?.nombre_proyecto,
        nombre_tipo_servicio: order.tipo_servicio?.nombre_tipo_servicio,
        detalles: order.detalles,
        created_by: order.created_by,
      }));

      applyIntoColumns(transformed, searchTerm);
    } catch (e) {
      console.error("Error fetching orders:", e);
    } finally {
      setLoading(false);
    }
  };

  const applyIntoColumns = (allOrders: OrdenKanban[], term: string) => {
    // 1) Filtrado por búsqueda
    const filtered = term
      ? allOrders.filter((o) => {
          const t = term.toLowerCase();
          return (
            (o.consecutivo_code?.toLowerCase() ?? o.consecutivo?.toLowerCase() ?? "").includes(t) ||
            o.nombre_cliente.toLowerCase().includes(t) ||
            (o.proyecto_nombre?.toLowerCase() ?? "").includes(t)
          );
        })
      : allOrders;

    // 2) Reparto por columnas UI a partir del estado DB
    const nextCols = EMPTY_COLUMNS.map((col) => ({
      ...col,
      orders: filtered.filter((o) => o.fase === UI_TO_FASE[col.id]),
    }));

    setColumns(nextCols);
  };
  const handleOrderClick = (order: OrdenKanban) => {
    setSelectedOrder(order);
    setIsOrderModalOpen(true);
    onOrderClick(order);
  };

  const handleUpdateOrder = (orderId: number, updates: Partial<OrdenKanban>) => {
    setColumns((prev) => {
      const pool = prev.flatMap((col) => col.orders);
      const idx = pool.findIndex((o) => o.id_orden_pedido === orderId);
      if (idx >= 0) pool[idx] = { ...pool[idx], ...updates};
      
      const recalculated = EMPTY_COLUMNS.map((col) => ({
        ...col,
        orders: pool.filter((o) => o.fase === UI_TO_FASE[col.id]),
      }));
      return recalculated;
    });
  }

  // Re-fetch when search term changes
  useEffect(() => {
    if (loading) return;
    const flat = columns.flatMap((col) => col.orders);
    applyIntoColumns(flat, searchTerm);
  }, [searchTerm]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-pulse text-muted-foreground">Cargando órdenes...</div>
      </div>
    );
  }

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por consecutivo, cliente o proyecto..."
          value={searchTerm}
          onChange={handleSearch}
          className="pl-10"
        />
      </div>

      {/* Kanban Board */}
      <div className="overflow-x-auto pb-4">
        <div className="flex space-x-4 min-w-max">
          {columns.map((column) => (
            <div key={column.id} className="w-80 flex-shrink-0">
              <Card className="h-full flex flex-col">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${column.color}`}></div>
                        {column.title}
                      </div>
                    </CardTitle>
                    <Badge variant="secondary" className="text-xs">
                      {column.orders.length}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{column.orders.length} órdenes</p>
                </CardHeader>
                
                <ScrollArea className="flex-1">
              <div className="space-y-2 pr-2">
                {column.orders.map((order) => (
                  <div 
                    key={order.id_orden_pedido} 
                    onClick={() => handleOrderClick(order)}
                    className="cursor-pointer"
                  >
                    <OrderCard order={order} />
                  </div>
                ))}
                
                {column.orders.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <div className="text-xs">Sin órdenes</div>
                  </div>
                )}
              </div>
            </ScrollArea>
              </Card>
            </div>
          ))}
        </div>
      </div>
      <OrderModal
        order={selectedOrder}
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        onUpdateOrder={handleUpdateOrder}
        currentUserRole={profile?.role ?? "comercial"}
      />
    </div>
  );
};

export default KanbanBoard;