import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { OrdenKanban, Cliente, Proyecto } from "@/types/kanban";
import { Building2, FolderOpen, User, Save, Plus, ChevronDown, ChevronRight, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

interface ComercialTabProps {
  order: OrdenKanban;
  onUpdateOrder: (orderId: number, updates: Partial<OrdenKanban>) => void;
}

export function ComercialTab({ order, onUpdateOrder }: ComercialTabProps) {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);

  // comerciales mostrados en el select
  const [comerciales, setComerciales] = useState<Array<{ user_id: string; label: string }>>([]);
  // uuid del comercial seleccionado
  const [selectedComercial, setSelectedComercial] = useState<string>("");

  const [loading, setSaving] = useState(false);
  const [showLineasDetalle, setShowLineasDetalle] = useState(false);

  const [formData, setFormData] = useState({
    id_cliente: "",
    id_proyecto: "",
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    try {
      // Clientes
      const { data: clientesData, error: cliErr } = await supabase
        .from("cliente")
        .select("*")
        .order("nombre_cliente");
      if (cliErr) throw cliErr;
      setClientes(clientesData ?? []);

      // Comerciales (desde profiles)
      const { data: comercialesData, error: comErr } = await supabase
        .from("profiles")
        .select("user_id, nombre, username, role")
        .eq("role", "comercial" as AppRole)
        .order("nombre", { ascending: true, nullsFirst: false })
        .order("username", { ascending: true });
      if (comErr) throw comErr;

      setComerciales(
        (comercialesData ?? []).map((u: ProfileRow) => ({
          user_id: u.user_id,
          label: u.nombre ?? u.username ?? "(sin nombre)"
        }))
      );

      // Orden y proyecto
      const { data: orderData, error: ordErr } = await supabase
        .from("ordenpedido")
        .select(`
          *,
          cliente ( nombre_cliente ),
          proyecto ( id_proyecto, nombre_proyecto )
        `)
        .eq("id_orden_pedido", order.id_orden_pedido)
        .single();
      if (ordErr) throw ordErr;

      setFormData({
        id_cliente: orderData.id_cliente?.toString() ?? "",
        id_proyecto: orderData.id_proyecto?.toString() ?? "",
        observaciones_orden: orderData.observaciones_orden ?? "",
      });

      if (orderData.id_cliente) {
        await loadProyectos(orderData.id_cliente.toString());
      }

      // Comercial ya asignado (responsableorden)
      const { data: resp, error: respErr } = await supabase
        .from("responsableorden")
        .select(`
          user_id,
          role,
          profiles!inner ( nombre, username )
        `)
        .eq("id_orden_pedido", order.id_orden_pedido)
        .eq("role", "comercial" as AppRole)
        .maybeSingle();
      if (respErr && respErr.code !== "PGRST116") throw respErr; // ignore no rows

      if (resp) {
        setSelectedComercial(resp.user_id as string);
      }

    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("No se pudo cargar la información");
    }
  };

  const loadProyectos = async (clienteId: string) => {
    if (!clienteId) return;
    try {
      const { data: proyectosData, error } = await supabase
        .from("proyecto")
        .select("*")
        .eq("id_cliente", parseInt(clienteId))
        .order("nombre_proyecto");
      if (error) throw error;
      setProyectos(proyectosData ?? []);
    } catch (error) {
      console.error("Error loading projects:", error);
      toast.error("No se pudieron cargar los proyectos");
    }
  };

  const handleClienteChange = (clienteId: string) => {
    setFormData(prev => ({ ...prev, id_cliente: clienteId, id_proyecto: "" }));
    loadProyectos(clienteId);
  };

  // --- productos/servicios (igual que lo tenías) ---
  const addProductLine = () => {
    const newId = Math.max(...productLines.map(line => line.id)) + 1;
    setProductLines([...productLines, { id: newId, producto: "", cantidad: "", valorUnitario: "", claseCobro: "" }]);
  };
  const removeProductLine = (id: number) => {
    if (productLines.length > 1) setProductLines(productLines.filter(line => line.id !== id));
  };
  const updateProductLine = (id: number, field: string, value: string) => {
    setProductLines(productLines.map(line => (line.id === id ? { ...line, [field]: value } : line)));
  };
  const addServicioLine = () => {
    const newId = Math.max(...servicioLines.map(line => line.id)) + 1;
    setServicioLines([...servicioLines, { id: newId, operador: "", plan: "", valorMensual: "" }]);
  };
  const removeServicioLine = (id: number) => {
    if (servicioLines.length > 1) setServicioLines(servicioLines.filter(line => line.id !== id));
  };
  const updateServicioLine = (id: number, field: string, value: string) => {
    setServicioLines(servicioLines.map(line => (line.id === id ? { ...line, [field]: value } : line)));
  };

  // --- guardar ---
  const handleSave = async () => {
    setSaving(true);
    try {
      // 1) Persistir cabecera de la orden
      const { error: updErr } = await supabase
        .from("ordenpedido")
        .update({
          id_cliente: formData.id_cliente ? parseInt(formData.id_cliente) : null,
          id_proyecto: formData.id_proyecto ? parseInt(formData.id_proyecto) : null,
          observaciones_orden: formData.observaciones_orden,
          fecha_modificacion: new Date().toISOString(),
        })
        .eq("id_orden_pedido", order.id_orden_pedido);
      if (updErr) throw updErr;

      // 2) Asignar comercial en responsableorden (solo uno)
      if (selectedComercial) {
        // elimina cualquier otro comercial distinto al seleccionado
        await supabase
          .from("responsableorden")
          .delete()
          .eq("id_orden_pedido", order.id_orden_pedido)
          .eq("role", "comercial" as AppRole)
          .neq("user_id", selectedComercial);

        // upsert del seleccionado
        const { error: upsertErr } = await supabase
          .from("responsableorden")
          .upsert(
            { id_orden_pedido: order.id_orden_pedido, user_id: selectedComercial, role: "comercial" as AppRole },
            { onConflict: "id_orden_pedido,user_id,role" }
          );
        if (upsertErr) throw upsertErr;
      }

      // 3) Actualizar UI local (nombre del comercial para mostrar en tarjetas si usas ese campo)
      const label = comerciales.find(c => c.user_id === selectedComercial)?.label ?? "";
      onUpdateOrder(order.id_orden_pedido, {
        fecha_modificacion: new Date().toISOString(),
        // si tu tarjeta muestra 'comercial_encargado', lo refrescamos aquí:
        comercial_encargado: label,
      });

      toast.success("Datos comerciales guardados");
    } catch (error) {
      console.error("Error saving:", error);
      toast.error("Error guardando los datos");
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
                  {clientes.map((c) => (
                    <SelectItem key={c.id_cliente} value={c.id_cliente.toString()}>
                      {c.nombre_cliente} — {c.nit}
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
                  {proyectos.map((p) => (
                    <SelectItem key={p.id_proyecto} value={p.id_proyecto.toString()}>
                      {p.nombre_proyecto}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Comercial encargado</Label>
            <Select value={selectedComercial} onValueChange={(v) => setSelectedComercial(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar comercial" />
              </SelectTrigger>
              <SelectContent>
                {comerciales.map((u) => (
                  <SelectItem key={u.user_id} value={u.user_id}>
                    {u.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Productos y Servicios (sin cambios relevantes) */}
          <Card>
            <CardHeader><CardTitle className="text-base">Productos y Servicios</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {productLines.map((line) => (
                <div key={line.id} className="grid grid-cols-5 gap-3 items-end">
                  <div className="space-y-2">
                    <Label>Equipos</Label>
                    <Input placeholder="SKU o referencia" value={line.producto}
                      onChange={(e) => updateProductLine(line.id, "producto", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Cantidad</Label>
                    <Input type="number" placeholder="0" value={line.cantidad}
                      onChange={(e) => updateProductLine(line.id, "cantidad", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Valor Unitario</Label>
                    <Input type="number" placeholder="0.00" value={line.valorUnitario}
                      onChange={(e) => updateProductLine(line.id, "valorUnitario", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Clase de Cobro</Label>
                    <Select value={line.claseCobro} onValueChange={(value) => updateProductLine(line.id, "claseCobro", value)}>
                      <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
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
                    <Button variant="outline" size="sm" onClick={() => removeProductLine(line.id)} disabled={productLines.length === 1}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addProductLine}>
                <Plus className="w-4 h-4 mr-2" /> Agregar Línea
              </Button>
            </CardContent>
          </Card>

          {/* Servicios opcionales */}
          <Card>
            <CardHeader
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => setShowLineasDetalle(!showLineasDetalle)}
            >
              <CardTitle className="text-base flex items-center justify-between">
                <span>Líneas (Servicios) - Opcional</span>
                {showLineasDetalle ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </CardTitle>
            </CardHeader>
            {showLineasDetalle && (
              <CardContent className="space-y-4">
                {servicioLines.map((line) => (
                  <div key={line.id} className="grid grid-cols-4 gap-3 items-end">
                    <div className="space-y-2">
                      <Label>Operador</Label>
                      <Select value={line.operador} onValueChange={(v) => updateServicioLine(line.id, "operador", v)}>
                        <SelectTrigger><SelectValue placeholder="Seleccionar operador" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="claro">Claro</SelectItem>
                          <SelectItem value="movistar">Movistar</SelectItem>
                          <SelectItem value="tigo">Tigo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Plan</Label>
                      <Select value={line.plan} onValueChange={(v) => updateServicioLine(line.id, "plan", v)}>
                        <SelectTrigger><SelectValue placeholder="Seleccionar plan" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="basico">Plan Básico</SelectItem>
                          <SelectItem value="premium">Plan Premium</SelectItem>
                          <SelectItem value="empresarial">Plan Empresarial</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Valor Mensual</Label>
                      <Input type="number" placeholder="0.00" value={line.valorMensual}
                        onChange={(e) => updateServicioLine(line.id, "valorMensual", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label className="invisible">Acciones</Label>
                      <Button variant="outline" size="sm" onClick={() => removeServicioLine(line.id)} disabled={servicioLines.length === 1}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={addServicioLine}>
                  <Plus className="w-4 h-4 mr-2" /> Agregar Línea de Servicio
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

          <Button onClick={handleSave} disabled={loading} variant="default" className="w-full">
            <Save className="w-4 h-4 mr-2" />
            {loading ? "Guardando..." : "Guardar Información Comercial"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
