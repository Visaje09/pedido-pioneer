import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { OrdenKanban, OrdenEstado } from "@/types/kanban";
import { 
  Building2, 
  User, 
  Package, 
  Truck, 
  Receipt, 
  CreditCard,
  ArrowRight,
  Calendar
} from "lucide-react";
import { ComercialTab } from "./tabs/ComercialTab";
import { InventariosTab } from "./tabs/InventariosTab";
import { ProduccionTab } from "./tabs/ProduccionTab";
import { LogisticaTab } from "./tabs/LogisticaTab";
import { FacturacionTab } from "./tabs/FacturacionTab";
import { FinancieraTab } from "./tabs/FinancieraTab";

const STAGE_CONFIG = {
  comercial: {
    label: "Comercial",
    icon: User,
    color: "bg-accent",
    nextStage: "inventarios_suscripciones" as OrdenEstado,
  },
  inventarios_suscripciones: {
    label: "Inventarios/Suscripciones", 
    icon: Package,
    color: "bg-info",
    nextStage: "produccion" as OrdenEstado,
  },
  produccion: {
    label: "Producción",
    icon: Building2,
    color: "bg-warning",
    nextStage: "logistica" as OrdenEstado,
  },
  logistica: {
    label: "Logística",
    icon: Truck,
    color: "bg-secondary",
    nextStage: "facturacion" as OrdenEstado,
  },
  facturacion: {
    label: "Facturación",
    icon: Receipt,
    color: "bg-primary",
    nextStage: "financiera" as OrdenEstado,
  },
  financiera: {
    label: "Financiera",
    icon: CreditCard,
    color: "bg-success",
    nextStage: null,
  },
};

interface OrderModalProps {
  order: OrdenKanban | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateOrder: (orderId: number, updates: Partial<OrdenKanban>) => void;
  currentUserRole?: string;
}

export function OrderModal({ 
  order, 
  isOpen, 
  onClose, 
  onUpdateOrder,
  currentUserRole = "admin" 
}: OrderModalProps) {
  const [activeTab, setActiveTab] = useState<OrdenEstado>("comercial");

  useEffect(() => {
    if (order?.estado) {
      setActiveTab(order.estado);
    }
  }, [order]);

  if (!order) return null;

  // Ensure order.estado is a valid key of STAGE_CONFIG
  const isValidState = (state: string): state is keyof typeof STAGE_CONFIG => {
    return state in STAGE_CONFIG;
  };

  // If the state is invalid, default to the first state
  const currentState = isValidState(order.estado) ? order.estado : 'comercial';
  const currentStage = STAGE_CONFIG[currentState];
  const canAdvance = currentStage.nextStage !== null;

  const handleAdvanceStage = () => {
    if (canAdvance && currentStage.nextStage) {
      onUpdateOrder(order.id_orden_pedido, {
        estado: currentStage.nextStage,
        fecha_modificacion: new Date().toISOString(),
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DialogTitle className="text-xl font-semibold">
                Orden #{order.consecutivo || order.id_orden_pedido}
              </DialogTitle>
              <Badge className={`text-white ${currentStage.color}`}>
                {currentStage.label}
              </Badge>
            </div>
            
            {canAdvance && (
            <Button 
              onClick={handleAdvanceStage}
              variant="default"
            >
                Avanzar a {STAGE_CONFIG[currentStage.nextStage!].label}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Building2 className="w-4 h-4" />
              <span>{order.nombre_cliente}</span>
            </div>
            {order.proyecto_nombre && (
              <div>
                Proyecto: {order.proyecto_nombre}
              </div>
            )}
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>
                Actualizado: {order.fecha_modificacion ? 
                  new Date(order.fecha_modificacion).toLocaleDateString('es-ES') : 
                  'Sin fecha'
                }
              </span>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as OrdenEstado)}>
            <TabsList className="grid w-full grid-cols-6 mb-4">
              {Object.entries(STAGE_CONFIG).map(([key, config]) => {
                const Icon = config.icon;
                return (
                  <TabsTrigger 
                    key={key} 
                    value={key}
                    className="flex items-center gap-2 text-xs px-2"
                  >
                    <Icon className="w-3 h-3" />
                    <span className="hidden sm:inline">{config.label}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            <div className="overflow-y-auto max-h-[60vh] pr-2">
              <TabsContent value="comercial" className="mt-0">
                <ComercialTab order={order} onUpdateOrder={onUpdateOrder} />
              </TabsContent>
              
              <TabsContent value="inventarios_suscripciones" className="mt-0">
                <InventariosTab order={order} onUpdateOrder={onUpdateOrder} />
              </TabsContent>
              
              <TabsContent value="produccion" className="mt-0">
                <ProduccionTab order={order} onUpdateOrder={onUpdateOrder} />
              </TabsContent>
              
              <TabsContent value="logistica" className="mt-0">
                <LogisticaTab order={order} onUpdateOrder={onUpdateOrder} />
              </TabsContent>
              
              <TabsContent value="facturacion" className="mt-0">
                <FacturacionTab order={order} onUpdateOrder={onUpdateOrder} />
              </TabsContent>
              
              <TabsContent value="financiera" className="mt-0">
                <FinancieraTab order={order} onUpdateOrder={onUpdateOrder} />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}