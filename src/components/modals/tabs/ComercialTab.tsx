import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { OrdenKanban, Cliente, Proyecto, ComercialUser } from "@/types/database";
import { Building2, FolderOpen, User, Save, Plus, ChevronDown, ChevronRight, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ComercialTabProps {
  order: OrdenKanban;
  onUpdateOrder: (orderId: number, updates: Partial<OrdenKanban>) => void;
}

export function ComercialTab({ order, onUpdateOrder }: ComercialTabProps) {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [comerciales, setComerciales] = useState<ComercialUser[]>([]);
  const [loading, setSaving] = useState(false);
  const [showLineasDetalle, setShowLineasDetalle] = useState(false);
  
  const [formData, setFormData] = useState({
    id_cliente: "",
    id_proyecto: "",
    comercial_encargado: order.comercial_encargado || "",
    observaciones_orden: "",
  });

  const [productLines, setProductLines] = useState([
    { id: 1, producto: "", cantidad: "", valorUnitario: "", claseCobro: "" }
  ]);

  const [servicioLines, setServicioLines] = useState([
    { id: 1, operador: "", plan: "", valorMensual: "" }
  ]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load clients
      const { data: clientesData } = await supabase
        .from('cliente')
        .select('*')
        .order('nombre_cliente');
      
      // Load commercial users
      const { data: usuariosData } = await supabase
        .from('usuario')
        .select(`
          id_usuario,
          nombre_usuario,
          rol!usuario_id_rol_fkey(tipo_rol)
        `)
        .eq('rol.tipo_rol', 'comercial');

      if (clientesData) setClientes(clientesData);
      if (usuariosData) {
        setComerciales(usuariosData.map(u => ({
          id_usuario: u.id_usuario,
          nombre_usuario: u.nombre_usuario
        })));
      }

      // Load order details
      const { data: orderData } = await supabase
        .from('ordenpedido')
        .select(`
          *,
          cliente(nombre_cliente),
          proyecto(nombre_proyecto, id_proyecto)
        `)
        .eq('id_orden_pedido', order.id_orden_pedido)
        .single();

      if (orderData) {
        setFormData({
          id_cliente: orderData.id_cliente.toString(),
          id_proyecto: orderData.id_proyecto?.toString() || "",
          comercial_encargado: order.comercial_encargado || "",
          observaciones_orden: orderData.observaciones_orden || "",
        });
        
        if (orderData.id_cliente) {
          loadProyectos(orderData.id_cliente.toString());
        }
      }

    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const loadProyectos = async (clienteId: string) => {
    if (!clienteId) return;
    
    try {
      const { data: proyectosData } = await supabase
        .from('proyecto')
        .select('*')
        .eq('id_cliente', parseInt(clienteId))
        .order('nombre_proyecto');

      if (proyectosData) setProyectos(proyectosData);
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

  const handleClienteChange = (clienteId: string) => {
    setFormData(prev => ({ ...prev, id_cliente: clienteId, id_proyecto: "" }));
    loadProyectos(clienteId);
  };

  const addProductLine = () => {
    const newId = Math.max(...productLines.map(line => line.id)) + 1;
    setProductLines([...productLines, { 
      id: newId, 
      producto: "", 
      cantidad: "", 
      valorUnitario: "", 
      claseCobro: "" 
    }]);
  };

  const removeProductLine = (id: number) => {
    if (productLines.length > 1) {
      setProductLines(productLines.filter(line => line.id !== id));
    }
  };

  const updateProductLine = (id: number, field: string, value: string) => {
    setProductLines(productLines.map(line => 
      line.id === id ? { ...line, [field]: value } : line
    ));
  };

  const addServicioLine = () => {
    const newId = Math.max(...servicioLines.map(line => line.id)) + 1;
    setServicioLines([...servicioLines, { 
      id: newId, 
      operador: "", 
      plan: "", 
      valorMensual: "" 
    }]);
  };

  const removeServicioLine = (id: number) => {
    if (servicioLines.length > 1) {
      setServicioLines(servicioLines.filter(line => line.id !== id));
    }
  };

  const updateServicioLine = (id: number, field: string, value: string) => {
    setServicioLines(servicioLines.map(line => 
      line.id === id ? { ...line, [field]: value } : line
    ));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('ordenpedido')
        .update({
          id_cliente: parseInt(formData.id_cliente),
          id_proyecto: formData.id_proyecto ? parseInt(formData.id_proyecto) : null,
          observaciones_orden: formData.observaciones_orden,
          fecha_modificacion: new Date().toISOString(),
        })
        .eq('id_orden_pedido', order.id_orden_pedido);

      if (error) throw error;

      onUpdateOrder(order.id_orden_pedido, {
        comercial_encargado: formData.comercial_encargado,
        fecha_modificacion: new Date().toISOString(),
      });

      toast.success('Datos comerciales guardados');
    } catch (error) {
      console.error('Error saving:', error);
      toast.error('Error guardando los datos');
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="w-5 h-5" />
            Información Comercial
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Cliente
              </Label>
              <Select value={formData.id_cliente} onValueChange={handleClienteChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clientes.map((cliente) => (
                    <SelectItem key={cliente.id_cliente} value={cliente.id_cliente.toString()}>
                      {cliente.nombre_cliente} - {cliente.nit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <FolderOpen className="w-4 h-4" />
                Proyecto
              </Label>
              <Select 
                value={formData.id_proyecto} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, id_proyecto: value }))}
                disabled={!formData.id_cliente}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar proyecto" />
                </SelectTrigger>
                <SelectContent>
                  {proyectos.map((proyecto) => (
                    <SelectItem key={proyecto.id_proyecto} value={proyecto.id_proyecto.toString()}>
                      {proyecto.nombre_proyecto}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Comercial Encargado</Label>
            <Select 
              value={formData.comercial_encargado} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, comercial_encargado: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar comercial" />
              </SelectTrigger>
              <SelectContent>
                {comerciales.map((comercial) => (
                  <SelectItem key={comercial.id_usuario} value={comercial.nombre_usuario}>
                    {comercial.nombre_usuario}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Productos y Servicios Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Productos y Servicios</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {productLines.map((line, index) => (
                <div key={line.id} className="grid grid-cols-5 gap-3 items-end">
                  <div className="space-y-2">
                    <Label>Producto/Referencia</Label>
                    <Input 
                      placeholder="SKU o referencia" 
                      value={line.producto}
                      onChange={(e) => updateProductLine(line.id, 'producto', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cantidad</Label>
                    <Input 
                      type="number" 
                      placeholder="0" 
                      value={line.cantidad}
                      onChange={(e) => updateProductLine(line.id, 'cantidad', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Valor Unitario</Label>
                    <Input 
                      type="number" 
                      placeholder="0.00" 
                      value={line.valorUnitario}
                      onChange={(e) => updateProductLine(line.id, 'valorUnitario', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Clase de Cobro</Label>
                    <Select value={line.claseCobro} onValueChange={(value) => updateProductLine(line.id, 'claseCobro', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="equipo">Equipo</SelectItem>
                        <SelectItem value="servicio">Servicio</SelectItem>
                        <SelectItem value="instalacion">Instalación</SelectItem>
                        <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="invisible">Acciones</Label>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => removeProductLine(line.id)}
                      disabled={productLines.length === 1}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
              
              <Button variant="outline" size="sm" onClick={addProductLine}>
                <Plus className="w-4 h-4 mr-2" />
                Agregar Línea
              </Button>
            </CardContent>
          </Card>

          {/* Líneas Detalle Section - Desplegable Opcional */}
          <Card>
            <CardHeader 
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => setShowLineasDetalle(!showLineasDetalle)}
            >
              <CardTitle className="text-base flex items-center justify-between">
                <span>Líneas Detalle (Servicios) - Opcional</span>
                {showLineasDetalle ? 
                  <ChevronDown className="w-4 h-4" /> : 
                  <ChevronRight className="w-4 h-4" />
                }
              </CardTitle>
            </CardHeader>
            {showLineasDetalle && (
              <CardContent className="space-y-4">
                {servicioLines.map((line) => (
                  <div key={line.id} className="grid grid-cols-4 gap-3 items-end">
                    <div className="space-y-2">
                      <Label>Operador</Label>
                      <Select value={line.operador} onValueChange={(value) => updateServicioLine(line.id, 'operador', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar operador" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="claro">Claro</SelectItem>
                          <SelectItem value="movistar">Movistar</SelectItem>
                          <SelectItem value="tigo">Tigo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Plan</Label>
                      <Select value={line.plan} onValueChange={(value) => updateServicioLine(line.id, 'plan', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar plan" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="basico">Plan Básico</SelectItem>
                          <SelectItem value="premium">Plan Premium</SelectItem>
                          <SelectItem value="empresarial">Plan Empresarial</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Valor Mensual</Label>
                      <Input 
                        type="number" 
                        placeholder="0.00" 
                        value={line.valorMensual}
                        onChange={(e) => updateServicioLine(line.id, 'valorMensual', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="invisible">Acciones</Label>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => removeServicioLine(line.id)}
                        disabled={servicioLines.length === 1}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                
                <Button variant="outline" size="sm" onClick={addServicioLine}>
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Línea de Servicio
                </Button>
              </CardContent>
            )}
          </Card>

          <div className="space-y-2">
            <Label>Observaciones Comerciales</Label>
            <Textarea
              value={formData.observaciones_orden}
              onChange={(e) => setFormData(prev => ({ ...prev, observaciones_orden: e.target.value }))}
              placeholder="Observaciones comerciales, condiciones especiales, acuerdos..."
              rows={4}
            />
          </div>

          <Button 
            onClick={handleSave} 
            disabled={loading}
            variant="gradient"
            className="w-full"
          >
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Guardando...' : 'Guardar Información Comercial'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}