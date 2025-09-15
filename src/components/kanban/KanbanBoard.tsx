import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Search } from 'lucide-react';
import { OrdenKanban, KanbanColumnType, estadoConfig, OrdenEstado, OrdenPedido } from "@/types/kanban";
import { Input } from "@/components/ui/input";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { OrderModal } from '../modals/OrderModal';
import { OrderCard } from './OrderCard';
 
// Define the Kanban columns based on the estadoConfig
const KANBAN_COLUMNS: KanbanColumnType[] = [
  {
    id: 'borrador',
    title: 'Borrador',
    description: 'Órdenes en borrador',
    color: 'bg-muted',
    orders: [],
  },
  {
    id: 'comercial',
    title: 'Comercial',
    description: 'En revisión por el equipo comercial',
    color: 'bg-primary',
    orders: [],
  },
  {
    id: 'inventarios_pendiente',
    title: 'Inventarios',
    description: 'En gestión de inventario',
    color: 'bg-warning',
    orders: [],
  },
  {
    id: 'produccion_pendiente',
    title: 'Producción',
    description: 'En proceso de producción',
    color: 'bg-accent',
    orders: [],
  },
  {
    id: 'logistica_pendiente',
    title: 'Logística',
    description: 'En preparación de envío',
    color: 'bg-success',
    orders: [],
  },
  {
    id: 'enviada',
    title: 'Enviada',
    description: 'Órdenes enviadas',
    color: 'bg-success',
    orders: [],
  },
  {
    id: 'facturacion_pendiente',
    title: 'Facturación',
    description: 'En proceso de facturación',
    color: 'bg-secondary',
    orders: [],
  },
  {
    id: 'facturada',
    title: 'Facturada',
    description: 'Órdenes facturadas',
    color: 'bg-primary',
    orders: [],
  },
  {
    id: 'financiera_pendiente',
    title: 'Financiera',
    description: 'En gestión financiera',
    color: 'bg-accent',
    orders: [],
  },
];


interface KanbanBoardProps {
  onOrderClick: (order: OrdenKanban ) => void ;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ onOrderClick }) => {
  const { profile } = useAuth();
  const [columns, setColumns] = useState<KanbanColumnType[]>([...KANBAN_COLUMNS]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<OrdenKanban | null>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);

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
          detalles:detalleorden(cantidad, valor_unitario)
        `)
        .order('fecha_modificacion', { ascending: false });

      if (error) {
        console.error('Error fetching orders:', error);
        return;
      }

      const transformedOrders: OrdenKanban[] = (ordersData || []).map((order: any) => ({
        id_orden_pedido: order.id_orden_pedido,
        consecutivo: order.consecutivo,
        nombre_cliente: order.cliente?.nombre_cliente || 'Cliente no especificado',
        tipo_orden: order.claseorden?.tipo_orden || 'Tipo no especificado',
        estado: order.estado || 'borrador',
        fecha_creacion: order.fecha_creacion,
        fecha_modificacion: order.fecha_modificacion,
        observaciones_orden: order.observaciones_orden,
        proyecto_nombre: order.proyecto?.nombre_proyecto,
        detalles: order.detalles,
        created_by: order.created_by,
      }));

      // Filter orders by search term if any
      const filteredOrders = searchTerm
        ? transformedOrders.filter(order => 
            (order.consecutivo?.toLowerCase().includes(searchTerm.toLowerCase())) ||
            order.nombre_cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (order.proyecto_nombre?.toLowerCase().includes(searchTerm.toLowerCase()))
          )
        : transformedOrders;

      // Organize orders by state
      const updatedColumns = KANBAN_COLUMNS.map(column => ({
        ...column,
        orders: filteredOrders.filter(order => order.estado === column.id),
      }));

      setColumns(updatedColumns);
    } catch (error) {
      console.error('Error in fetchOrders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOrderClick = (order: OrdenKanban) => {
    setSelectedOrder(order);
    setIsOrderModalOpen(true);
  };

  const handleUpdateOrder = (orderId: number, updates: Partial<OrdenKanban>) => {
    setColumns(prevColumns => 
      prevColumns.map(column => ({
        ...column,
        orders: column.orders.map(order => 
          order.id_orden_pedido === orderId ? { ...order, ...updates } : order
        ).filter(order => order.estado === column.id)
      }))
    );

    // If estado changed, move order to new column
    if (updates.estado) {
      setColumns(prevColumns => 
        prevColumns.map(column => {
          // Remove from current column
          const filteredOrders = column.orders.filter(order => order.id_orden_pedido !== orderId);
          
          // Add to new column if it matches
          if (column.id === updates.estado) {
            const updatedOrder = columns
              .flatMap(col => col.orders)
              .find(order => order.id_orden_pedido === orderId);
            
            if (updatedOrder) {
              return {
                ...column,
                orders: [...filteredOrders, { ...updatedOrder, ...updates }]
              };
            }
          }
          
          return { ...column, orders: filteredOrders };
        })
      );
    }
  };

  // Re-fetch when search term changes
  useEffect(() => {
    if (!loading) {
      fetchOrders();
    }
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
                        <div className={`w-3 h-3 rounded-full ${estadoConfig[column.id]?.color}`}></div>
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
      />
    </div>
  );
};

export default KanbanBoard;