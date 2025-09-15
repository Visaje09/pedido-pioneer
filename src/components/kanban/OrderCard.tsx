import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { OrdenKanban } from '@/types/kanban';

interface OrderCardProps {
  order: OrdenKanban;
}

const formatDate = (dateString: string | null): string => {
  if (!dateString) return 'Sin fecha';
  return new Date(dateString).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  });
};

export const OrderCard: React.FC<OrderCardProps> = ({ order }) => (
  <Card className="mb-2 cursor-pointer hover:shadow-md transition-shadow bg-kanban-card border-kanban-border">
    <CardContent className="p-3">
      <div className="font-mono text-xs leading-tight">
        <div className="flex items-center justify-between mb-1">
          <span className="font-semibold">#{order.consecutivo || order.id_orden_pedido}</span>
          <Badge variant="outline" className="text-xs">
            {order.tipo_orden || 'N/A'}
          </Badge>
        </div>
        <div className="text-muted-foreground">
          {order.nombre_cliente || 'Sin cliente'}
        </div>
        {order.proyecto_nombre && (
          <div className="text-xs text-muted-foreground">
            {order.proyecto_nombre}
          </div>
        )}
        <div className="flex justify-between items-center mt-2 text-xs">
          <span className={`px-2 py-1 rounded text-white ${
            order.estado === 'borrador' ? 'bg-gray-500' :
            order.estado === 'comercial' ? 'bg-blue-500' :
            order.estado === 'inventarios_pendiente' ? 'bg-yellow-500' :
            order.estado === 'produccion_pendiente' ? 'bg-purple-500' :
            order.estado === 'logistica_pendiente' ? 'bg-green-500' :
            order.estado === 'enviada' ? 'bg-indigo-500' :
            order.estado === 'facturacion_pendiente' ? 'bg-pink-500' : 'bg-gray-500'
          }`}>
            {order.estado || 'Sin estado'}
          </span>
          <span className="text-muted-foreground">
            {formatDate(order.fecha_modificacion)}
          </span>
        </div>
      </div>
    </CardContent>
  </Card>
);

export default OrderCard;
