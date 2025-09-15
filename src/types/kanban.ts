export type OrdenEstado = 
  | 'borrador'
  | 'comercial'
  | 'inventarios_pendiente'
  | 'produccion_pendiente'
  | 'logistica_pendiente'
  | 'enviada'
  | 'facturacion_pendiente'
  | 'facturada'
  | 'financiera_pendiente';

export interface OrdenKanban {
  id_orden_pedido: number;
  consecutivo: string | null;
  nombre_cliente: string;
  tipo_orden?: string;
  estado: OrdenEstado;
  fecha_modificacion: string | null;
  fecha_creacion: string | null;
  observaciones_orden?: string | null;
  proyecto_nombre?: string;
  detalles?: Array<{
    cantidad: number;
    valor_unitario: number;
    descripcion?: string;
  }>;
  created_by?: string;
  comercial_encargado?: string;
}

export interface KanbanColumnType {
  id: OrdenEstado;
  title: string;
  description: string;
  color: string;
  orders: OrdenKanban[];
}

// Estado configuration to match the one in Ordenes.tsx
export const estadoConfig = {
  borrador: { label: 'Borrador', color: 'bg-muted text-muted-foreground' },
  comercial: { label: 'Comercial', color: 'bg-primary text-primary-foreground' },
  inventarios_pendiente: { label: 'Inventarios', color: 'bg-warning text-warning-foreground' },
  produccion_pendiente: { label: 'Producción', color: 'bg-accent text-accent-foreground' },
  logistica_pendiente: { label: 'Logística', color: 'bg-success text-success-foreground' },
  enviada: { label: 'Enviada', color: 'bg-success text-success-foreground' },
  facturacion_pendiente: { label: 'Facturación', color: 'bg-secondary text-secondary-foreground' },
  facturada: { label: 'Facturada', color: 'bg-primary text-primary-foreground' },
  financiera_pendiente: { label: 'Financiera', color: 'bg-accent text-accent-foreground' },
};

// Database types based on actual schema
export interface Profile {
  id: string;
  username: string;
  full_name: string | null;
  role: string;
  email: string | null;
  created_at: string;
  updated_at: string;
}

export interface Rol {
  id_rol: number;
  tipo_rol: string;
}

export interface Cliente {
  id_cliente: number;
  nombre_cliente: string;
  nit: string;
}

export interface Proyecto {
  id_proyecto: number;
  nombre_proyecto: string;
  descripcion_proyecto?: string;
  id_cliente: number;
}

export interface ClaseOrden {
  id_clase_orden: number;
  tipo_orden: string;
}

export interface OrdenPedido {
  id_orden_pedido: number;
  consecutivo: string | null;
  fecha_creacion: string | null;
  fecha_modificacion: string | null;
  id_cliente: number;
  id_proyecto: number | null;
  id_clase_orden: number | null;
  claseorden?: {
    id_clase_orden: number;
    tipo_orden: string;
  } | null;
  id_metodo_despacho: number | null;
  id_tipo_pago: number | null;
  observaciones_orden: string | null;
  estado: string | null;
}
