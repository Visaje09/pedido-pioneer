import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { OrdenKanban, estatusBadge } from '@/types/kanban';

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

export const OrderCard: React.FC<OrderCardProps> = ({ order }) => {
  const statusConfig = estatusBadge[order.estatus];
  
  return (
    <Card className="mb-2">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-medium">{order.consecutivo || 'Sin consecutivo'}</h3>
          <Badge variant="outline" style={{ backgroundColor: statusConfig?.color || '#6b7280' }}>
            {statusConfig?.label || order.estatus || 'Sin estado'}
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
          <span 
            className="px-2 py-1 rounded text-white"
            style={{ backgroundColor: statusConfig?.color || '#6b7280' }}
          >
            {statusConfig?.label || order.estatus || 'Sin estado'}
          </span>
          <span className="text-muted-foreground">
            {formatDate(order.fecha_modificacion)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderCard;
