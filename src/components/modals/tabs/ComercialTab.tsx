import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { OrdenKanban, Cliente, Proyecto } from "@/types/kanban";
import { Building2, FolderOpen, User, Save, Plus, ChevronDown, ChevronRight, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";
import EquipoSelector, { type EquipoOption } from "@/components/catalogs/EquipoSelector";

type AppRole = Database["public"]["Enums"]["app_role"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type ClaseCobro = Database["public"]["Enums"]["clase_cobro"];
type ServicioLine = {
  id_linea_detalle: number;
  operadorId: string;
  planId: string;
  apnId: string;
  permanencia: string;
  claseCobro: ClaseCobro | "";
  valorMensual: string;
};

interface ComercialTabProps {
  order: OrdenKanban;
  onUpdateOrder: (orderId: number, updates: Partial<OrdenKanban>) => void;
}

export function ComercialTab({ order, onUpdateOrder }: ComercialTabProps) {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);

  // Usuarios asignables (excluye admin y comercial)
  const [asignables, setAsignables] = useState<Array<{ user_id: string; label: string; role: AppRole }>>([]);
  // uuid del ingeniero asignado
  const [selectedComercial, setSelectedComercial] = useState<string>("");

  const [loading, setSaving] = useState(false);
  const [showLineasDetalle, setShowLineasDetalle] = useState(false);
  const [operadores, setOperadores] = useState<Array<Database["public"]["Tables"]["operador"]["Row"]>>([]);
  const [planes, setPlanes] = useState<Array<Database["public"]["Tables"]["plan"]["Row"]>>([]);
  const [apns, setApns] = useState<Array<Database["public"]["Tables"]["apn"]["Row"]>>([]);

  const [formData, setFormData] = useState({
    id_cliente: "",
    id_proyecto: "",
    observaciones_orden: "",
    orden_compra: "",
  });

  const [productLines, setProductLines] = useState([
    { id_linea_detalle: 1, selectedEquipo: null as EquipoOption | null, cantidad: "", valorUnitario: "", claseCobro: "", plantilla: false, plantillaText: "" }
  ]);

  const [servicioLines, setServicioLines] = useState([
    { id_linea_detalle: 1, 
      operadorId: "", 
      planId: "", 
      apnId: "", 
      permanencia: "", 
      claseCobro: "", 
      valorMensual: ""  }
  ]);

  // Metodo de despacho (vinculado a ordenpedido.id_metodo_despacho)
  const [metodoDespachoId, setMetodoDespachoId] = useState<number | null>(null);
  const [metodoDespachoForm, setMetodoDespachoForm] = useState({
    direccion_despacho: "",
    contacto_telefono: "",
    contacto_email_guia: "",
  });

  // Money helpers (COP formatting)
  const formatterCOP = new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  const formatCOP = (raw: string) => {
    if (!raw) return "";
    const num = Number(raw);
    if (Number.isNaN(num)) return "";
    return formatterCOP.format(num);
  };

  const loadDetalleOrden = async (opId: number) => {
    try {
      // 1) Fetch detalleorden with producto details
      const { data: det, error: detErr } = await supabase
        .from("detalleorden")
        .select(`
          id_orden_detalle,
          id_producto,
          cantidad,
          valor_unitario,
          producto:producto (
            id_producto,
            tipo,
            nombre_producto,
            id_equipo,
            id_linea_detalle
          )
        `)
        .eq("id_orden_pedido", opId)
        .order("id_orden_detalle", { ascending: true });
      if (detErr) throw detErr;

      const detalles = det ?? [];

      // Separate into equipment and service lines
      const equipoDetalles = detalles.filter((d) => d.producto?.id_equipo);
      const servicioDetalles = detalles.filter((d) => d.producto?.id_linea_detalle);

      // 2) Fetch equipos for product lines
      const equipoIds = equipoDetalles
        .map((d) => d.producto?.id_equipo)
        .filter((v): v is number => typeof v === "number");
      const uniqueEquipoIds = Array.from(new Set(equipoIds));
      let equiposById = new Map<number, { id_equipo: number; codigo: string | null; nombre_equipo: string | null; plantilla: string | null }>();
      if (uniqueEquipoIds.length > 0) {
        const { data: equipos, error: eqErr } = await supabase
          .from("equipo")
          .select("id_equipo, codigo, nombre_equipo, plantilla")
          .in("id_equipo", uniqueEquipoIds);
        if (eqErr) throw eqErr;
        (equipos ?? []).forEach((e: any) => equiposById.set(e.id_equipo, e));
      }

      // 3) Fetch lineaservicio for service lines
      const lineaServicioIds = servicioDetalles
        .map((d) => d.producto?.id_linea_detalle)
        .filter((v): v is number => typeof v === "number");
      const uniqueLineaIds = Array.from(new Set(lineaServicioIds));
      let lineasServicioById = new Map<number, any>();
      if (uniqueLineaIds.length > 0) {
        const { data: lineasServicio, error: lsErr } = await supabase
          .from("lineaservicio")
          .select(`
            id_linea_detalle,
            id_operador,
            id_plan,
            id_apn,
            clase_cobro,
            permanencia,
            operador:operador ( id_operador, nombre_operador ),
            plan:plan ( id_plan, nombre_plan ),
            apn:apn ( id_apn, apn )
          `)
          .in("id_linea_detalle", uniqueLineaIds);
        if (lsErr) throw lsErr;
        (lineasServicio ?? []).forEach((ls: any) => {
          if (ls.id_linea_detalle) {
            lineasServicioById.set(ls.id_linea_detalle, ls);
          }
        });
      }

      // 4) Map product lines (equipos)
      if (equipoDetalles.length > 0) {
        const productLinesMapped = equipoDetalles.map((d, idx) => {
          const eq = d.producto?.id_equipo ? equiposById.get(d.producto.id_equipo) : undefined;
          const selectedEquipo = eq
            ? ({ id_equipo: eq.id_equipo, codigo: eq.codigo, nombre_equipo: eq.nombre_equipo } as EquipoOption)
            : null;
          const hasPlantilla = Boolean(eq?.plantilla);
          return {
            id_linea_detalle: idx + 1,
            selectedEquipo,
            cantidad: d.cantidad != null ? String(d.cantidad) : "",
            valorUnitario: d.valor_unitario != null ? String(d.valor_unitario) : "",
            claseCobro: "",
            plantilla: hasPlantilla,
            plantillaText: eq?.plantilla ?? "",
          };
        });
        setProductLines(productLinesMapped.length > 0
          ? productLinesMapped
          : [{ id_linea_detalle: 1, selectedEquipo: null, cantidad: "", valorUnitario: "", claseCobro: "", plantilla: false, plantillaText: "" }]);
      } else {
        setProductLines([{ id_linea_detalle: 1, selectedEquipo: null, cantidad: "", valorUnitario: "", claseCobro: "", plantilla: false, plantillaText: "" }]);
      }

      // 5) Map service lines
      if (servicioDetalles.length > 0) {
        const servicioLinesMapped = servicioDetalles.map((d, idx) => {
          const ls = d.producto?.id_linea_detalle ? lineasServicioById.get(d.producto.id_linea_detalle) : undefined;
          return {
            id_linea_detalle: d.producto?.id_linea_detalle ?? idx + 1, // Use actual database ID if available
            operadorId: ls?.id_operador != null ? String(ls.id_operador) : "",
            planId: ls?.id_plan != null ? String(ls.id_plan) : "",
            apnId: ls?.id_apn != null ? String(ls.id_apn) : "",
            permanencia: ls?.permanencia != null ? String(ls.permanencia) : "",
            claseCobro: ls?.clase_cobro ?? "",
            valorMensual: d.valor_unitario != null ? String(d.valor_unitario) : "",
          } satisfies ServicioLine;
        });
        setServicioLines(servicioLinesMapped.length > 0
          ? servicioLinesMapped
          : [{ id_linea_detalle: 1, operadorId: "", planId: "", apnId: "", permanencia: "", claseCobro: "", valorMensual: "" }]);
        setShowLineasDetalle(true);
      } else {
        setServicioLines([{ id_linea_detalle: 1, operadorId: "", planId: "", apnId: "", permanencia: "", claseCobro: "", valorMensual: "" }]);
      }
    } catch (e) {
      console.error("Error loading detalleorden:", e);
      // keep current lines on error
    }
  };
  const digitsOnly = (s: string) => s.replace(/[^0-9]/g, "");

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

      // Usuarios asignables (desde profiles) excluyendo admin y comercial
      const { data: comercialesData, error: comErr } = await supabase
        .from("profiles")
        .select("user_id, nombre, username, role")
        .neq("role", "comercial" as AppRole)
        .neq("role", "admin" as AppRole)
        .order("nombre", { ascending: true, nullsFirst: false })
        .order("username", { ascending: true });
      if (comErr) throw comErr;

      setAsignables(
        (comercialesData ?? []).map((u: ProfileRow) => ({
          user_id: u.user_id,
          label: u.nombre ?? u.username ?? "(sin nombre)",
          role: u.role as AppRole,
        }))
      );

      //Lineas
      const { data: operadoresData, error: opErr } = await supabase
        .from("operador")
        .select("*")
        .order("nombre_operador");
      if (opErr) throw opErr;
      setOperadores(operadoresData ?? []);

      const { data: planesData, error: planErr } = await supabase
        .from("plan")
        .select("*")
        .order("nombre_plan");
      if (planErr) throw planErr;
      setPlanes(planesData ?? []);

      const { data: apnsData, error: apnErr } = await supabase
        .from("apn")
        .select("*")
        .order("apn");
      if (apnErr) throw apnErr;
      setApns(apnsData ?? []);


      // Orden y proyecto
      const { data: orderData, error: ordErr } = await supabase
        .from("ordenpedido")
        .select(`
          *,
          cliente ( nombre_cliente ),
          proyecto ( id_proyecto, nombre_proyecto ),
          metododespacho:metododespacho ( id_metodo_despacho, direccion_despacho, contacto_telefono, contacto_email_guia )
        `)
        .eq("id_orden_pedido", order.id_orden_pedido)
        .single();
      if (ordErr) throw ordErr;

      setFormData({
        id_cliente: orderData.id_cliente?.toString() ?? "",
        id_proyecto: orderData.id_proyecto?.toString() ?? "",
        observaciones_orden: orderData.observaciones_orden ?? "",
        orden_compra: orderData.orden_compra ?? "",
      });

      // Cargar metodo de despacho existente
      const md = (orderData as any).metododespacho;
      if (md) {
        setMetodoDespachoId(md.id_metodo_despacho as number);
        setMetodoDespachoForm({
          direccion_despacho: md.direccion_despacho ?? "",
          contacto_telefono: md.contacto_telefono ?? "",
          contacto_email_guia: md.contacto_email_guia ?? "",
        });
      } else {
        setMetodoDespachoId(null);
        setMetodoDespachoForm({ direccion_despacho: "", contacto_telefono: "", contacto_email_guia: "" });
      }

      if (orderData.id_cliente) {
        await loadProyectos(orderData.id_cliente.toString());
      }

      // Cargar detalle existente y reflejarlo en el formulario
      await loadDetalleOrden(order.id_orden_pedido);

      // Ingeniero asignado (responsable_orden con rol distinto a admin/comercial)
      const { data: resp, error: respErr } = await supabase
        .from("responsable_orden")
        .select(`
          user_id,
          role,
          profiles!inner ( nombre, username )
        `)
        .eq("id_orden_pedido", order.id_orden_pedido)
        .neq("role", "comercial" as AppRole)
        .neq("role", "admin" as AppRole)
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
    const newId = Math.max(...productLines.map(line => line.id_linea_detalle)) + 1;
    setProductLines([...productLines, { id_linea_detalle: newId, selectedEquipo: null, cantidad: "", valorUnitario: "", claseCobro: "", plantilla: false, plantillaText: "" }]);
  };
  const removeProductLine = (id: number) => {
    if (productLines.length > 1) setProductLines(productLines.filter(line => line.id_linea_detalle !== id));
  };
  const updateProductLine = (id: number, field: string, value: any) => {
    setProductLines(productLines.map(line => (line.id_linea_detalle === id ? { ...line, [field]: value } : line)));
  };
  const addServicioLine = () => {
    const newId = servicioLines.length > 0 ? Math.max(...servicioLines.map(l => l.id_linea_detalle)) + 1 : 1;
    setServicioLines([...servicioLines, { 
      id_linea_detalle: newId, 
      operadorId: "", 
      planId: "", 
      apnId: "", 
      permanencia: "", 
      claseCobro: "", 
      valorMensual: "",
    }]);
    setShowLineasDetalle(true);
  };
  const removeServicioLine = (id: number) => {
    if (servicioLines.length > 1) {
      setServicioLines(servicioLines.filter(line => line.id_linea_detalle !== id));
    }
  };
  const updateServicioLine = (id: number, field: string, value: string) => {
    setServicioLines(servicioLines.map(line => (line.id_linea_detalle === id ? { ...line, [field]: value } : line)));
  };

  const handlePermanenciaChange = (id: number, raw: string) => {
    const digits = digitsOnly(raw);
    if (!digits) {
      updateServicioLine(id, "permanencia", "");
      return;
    }
    let valueNum = Number(digits);
    if (Number.isNaN(valueNum)) {
      updateServicioLine(id, "permanencia", "");
      return;
    }
    valueNum = Math.min(Math.max(valueNum, 1), 36);
    updateServicioLine(id, "permanencia", String(valueNum));
  };

  // --- guardar ---
  const handleSave = async () => {
    setSaving(true);
    try {
      // 0) Upsert de metodo de despacho y vinculación a la orden
      let newMetodoDespachoId = metodoDespachoId;
      const hasMDValues = Boolean(
        metodoDespachoForm.direccion_despacho || metodoDespachoForm.contacto_telefono || metodoDespachoForm.contacto_email_guia
      );
      if (hasMDValues) {
        if (metodoDespachoId) {
          const { error: mdUpdErr } = await supabase
            .from("metododespacho")
            .update({
              direccion_despacho: metodoDespachoForm.direccion_despacho || null,
              contacto_telefono: metodoDespachoForm.contacto_telefono || null,
              contacto_email_guia: metodoDespachoForm.contacto_email_guia || null,
            })
            .eq("id_metodo_despacho", metodoDespachoId);
          if (mdUpdErr) throw mdUpdErr;
        } else {
          const { data: mdIns, error: mdInsErr } = await supabase
            .from("metododespacho")
            .insert({
              direccion_despacho: metodoDespachoForm.direccion_despacho || null,
              contacto_telefono: metodoDespachoForm.contacto_telefono || null,
              contacto_email_guia: metodoDespachoForm.contacto_email_guia || null,
            })
            .select("id_metodo_despacho")
            .single();
          if (mdInsErr) throw mdInsErr;
          newMetodoDespachoId = mdIns?.id_metodo_despacho ?? null;
          setMetodoDespachoId(newMetodoDespachoId);
        }
      } else {
        // Si limpian todos los campos, desvincula de la orden pero no borres del catálogo
        newMetodoDespachoId = null;
      }

      // 1) Persistir cabecera de la orden
      const { error: updErr } = await supabase
        .from("ordenpedido")
        .update({
          id_cliente: formData.id_cliente ? parseInt(formData.id_cliente) : null,
          id_proyecto: formData.id_proyecto ? parseInt(formData.id_proyecto) : null,
          observaciones_orden: formData.observaciones_orden,
          orden_compra: formData.orden_compra || null,
          id_metodo_despacho: newMetodoDespachoId,
          fecha_modificacion: new Date().toISOString(),
        })
        .eq("id_orden_pedido", order.id_orden_pedido);
      if (updErr) throw updErr;
  
      // 2) Asignar ingeniero en responsable_orden (solo uno, excluye admin/comercial)
      if (selectedComercial) {
        // elimina cualquier otro asignado que no sea admin/comercial, excepto el seleccionado
        await supabase
          .from("responsable_orden")
          .delete()
          .eq("id_orden_pedido", order.id_orden_pedido)
          .neq("role", "comercial" as AppRole)
          .neq("role", "admin" as AppRole)
          .neq("user_id", selectedComercial);

        const selectedUser = asignables.find(u => u.user_id === selectedComercial);
        const selectedRole = selectedUser?.role ?? ("inventarios" as AppRole);

        // upsert del seleccionado con su rol real
        const { error: upsertErr } = await supabase
          .from("responsable_orden")
          .upsert(
            { id_orden_pedido: order.id_orden_pedido, user_id: selectedComercial, role: selectedRole },
            { onConflict: "id_orden_pedido,user_id,role" }
          );
        if (upsertErr) throw upsertErr;
      }
  
      // 3) Persistir detalle de la orden (equipos y servicios)
      // Limpia detalle actual y vuelve a insertar según las líneas actuales
      const { data: detallePrevios, error: detallePreviosErr } = await supabase
        .from("detalleorden")
        .select("id_orden_detalle")
        .eq("id_orden_pedido", order.id_orden_pedido);
      if (detallePreviosErr) throw detallePreviosErr;

      if (detallePrevios && detallePrevios.length > 0) {
        const idsPrevios = detallePrevios.map((d) => d.id_orden_detalle);
        await supabase.from("detalleorden").delete().in("id_orden_detalle", idsPrevios);
      }

      // 3a) Persistir productos para equipos
      const selectedEquipos = productLines
        .filter((l) => l.selectedEquipo)
        .map((l) => l.selectedEquipo as EquipoOption);

      if (selectedEquipos.length > 0) {
        // Upsert productos con id_equipo
        const productosEquipo = selectedEquipos.map((eq) => ({
          id_equipo: eq.id_equipo,
          id_linea_detalle: null,
          tipo: "equipo" as Database["public"]["Enums"]["tipo_producto_enum"],
          nombre_producto: eq.nombre_equipo ?? null,
        } as Database["public"]["Tables"]["producto"]["Insert"]));

        // Try to insert products (ignore conflicts for now)
        let productosEquipoResult: any[] = [];
        const { data: equipmentInsertResult, error: prodEqErr } = await supabase
          .from("producto")
          .insert(productosEquipo)
          .select("id_producto");

        // If there's a conflict, try to update existing products instead
        if (prodEqErr && prodEqErr.code === '23505') { // Unique constraint violation
          // Get existing products and update them
          const equipoIds = selectedEquipos.map(eq => eq.id_equipo);
          const { data: existingProducts, error: fetchErr } = await supabase
            .from("producto")
            .select("id_producto, id_equipo")
            .in("id_equipo", equipoIds)
            .eq("tipo", "equipo");

          if (fetchErr) throw fetchErr;

          // Update existing products
          const updatePromises = productosEquipo.map(async (product) => {
            const existing = existingProducts?.find(p => p.id_equipo === product.id_equipo);
            if (existing) {
              return supabase
                .from("producto")
                .update({
                  nombre_producto: product.nombre_producto,
                  tipo: product.tipo
                })
                .eq("id_producto", existing.id_producto);
            }
          });

          await Promise.all(updatePromises);

          // Get the updated products
          const { data: updatedProducts, error: fetchUpdatedErr } = await supabase
            .from("producto")
            .select("id_producto, id_equipo")
            .in("id_equipo", equipoIds)
            .eq("tipo", "equipo");

          if (fetchUpdatedErr) throw fetchUpdatedErr;
          productosEquipoResult = updatedProducts ?? [];
        } else if (prodEqErr) {
          throw prodEqErr;
        } else {
          productosEquipoResult = equipmentInsertResult ?? [];
        }

        // Crear detalleorden para equipos
        const detalleEquipoRows = selectedEquipos.map((eq, idx) => ({
          id_orden_pedido: order.id_orden_pedido,
          id_producto: productosEquipoResult?.[idx]?.id_producto,
          cantidad: productLines.find(l => l.selectedEquipo?.id_equipo === eq.id_equipo)?.cantidad ? Number(productLines.find(l => l.selectedEquipo?.id_equipo === eq.id_equipo)?.cantidad) : null,
          valor_unitario: productLines.find(l => l.selectedEquipo?.id_equipo === eq.id_equipo)?.valorUnitario ? Number(productLines.find(l => l.selectedEquipo?.id_equipo === eq.id_equipo)?.valorUnitario) : null,
          observaciones_detalle: null,
        } satisfies Database["public"]["Tables"]["detalleorden"]["Insert"]));

        if (detalleEquipoRows.length > 0) {
          const { error: detEqErr } = await supabase.from("detalleorden").insert(detalleEquipoRows);
          if (detEqErr) throw detEqErr;
        }

        // Update plantilla information in equipo table
        for (const eq of selectedEquipos) {
          const productLine = productLines.find(l => l.selectedEquipo?.id_equipo === eq.id_equipo);
          if (productLine && productLine.plantilla && productLine.plantillaText) {
            const { error: plantillaErr } = await supabase
              .from("equipo")
              .update({ plantilla: productLine.plantillaText })
              .eq("id_equipo", eq.id_equipo);
            if (plantillaErr) {
              console.error("Error updating plantilla:", plantillaErr);
              // Don't throw here, just log the error
            }
          }
        }
      }

      // 4) Persistir productos y lineaservicio para servicios
      const validServicios = servicioLines.filter(sl => 
        sl.operadorId && sl.planId && sl.apnId && sl.claseCobro && sl.valorMensual && sl.permanencia && Number(sl.permanencia) >= 1 && Number(sl.permanencia) <= 36
      );

      if (validServicios.length > 0) {
        // Crear lineaservicio primero
        const lineasServicioRows = validServicios.map((sl) => ({
          id_linea_detalle: sl.id_linea_detalle, // Use existing ID from UI state
          id_operador: Number(sl.operadorId),
          id_plan: Number(sl.planId),
          id_apn: Number(sl.apnId),
          clase_cobro: sl.claseCobro as ClaseCobro,
          permanencia: String(sl.permanencia),
        } satisfies Database["public"]["Tables"]["lineaservicio"]["Insert"]));

        // Try to insert lineaservicio (handle potential conflicts)
        let lineasServicioResult: any[] = [];
        const { data: insertResult, error: lsErr } = await supabase
          .from("lineaservicio")
          .insert(lineasServicioRows)
          .select("id_linea_detalle");

        // If there's a conflict, try to update existing records instead
        if (lsErr && lsErr.code === '23505') { // Unique constraint violation
          // Update existing lineaservicio records
          const updatePromises = lineasServicioRows.map(async (linea) => {
            return supabase
              .from("lineaservicio")
              .update({
                id_operador: linea.id_operador,
                id_plan: linea.id_plan,
                id_apn: linea.id_apn,
                clase_cobro: linea.clase_cobro,
                permanencia: linea.permanencia
              })
              .eq("id_linea_detalle", linea.id_linea_detalle);
          });

          await Promise.all(updatePromises);

          // Get the updated lineaservicio records
          const lineaIds = lineasServicioRows.map(l => l.id_linea_detalle);
          const { data: updatedLineas, error: fetchUpdatedErr } = await supabase
            .from("lineaservicio")
            .select("id_linea_detalle")
            .in("id_linea_detalle", lineaIds);

          if (fetchUpdatedErr) throw fetchUpdatedErr;
          lineasServicioResult = updatedLineas ?? [];
        } else if (lsErr) {
          throw lsErr;
        } else {
          lineasServicioResult = insertResult ?? [];
        }

        // Upsert productos con id_linea_detalle
        const productosServicio = validServicios.map((sl, idx) => {
          const matchedPlan = planes.find((plan) => plan.id_plan.toString() === sl.planId);
          const descripcion = matchedPlan?.nombre_plan ? `Línea de servicio - ${matchedPlan.nombre_plan}` : "Línea de servicio";
          return {
            id_equipo: null,
            id_linea_detalle: sl.id_linea_detalle, // Use existing ID directly
            tipo: "linea_servicio" as Database["public"]["Enums"]["tipo_producto_enum"],
            nombre_producto: descripcion ,
          } as Database["public"]["Tables"]["producto"]["Insert"];
        });

        // Try to insert service products (handle potential conflicts)
        let productosServicioResult: any[] = [];
        const { data: serviceInsertResult, error: prodServErr } = await supabase
          .from("producto")
          .insert(productosServicio)
          .select("id_producto");

        // If there's a conflict, try to update existing products instead
        if (prodServErr && prodServErr.code === '23505') { // Unique constraint violation
          // Get existing products and update them
          const lineaIds = validServicios.map(s => s.id_linea_detalle);
          const { data: existingProducts, error: fetchErr } = await supabase
            .from("producto")
            .select("id_producto, id_linea_detalle")
            .in("id_linea_detalle", lineaIds)
            .eq("tipo", "linea_servicio");

          if (fetchErr) throw fetchErr;

          // Update existing products
          const updatePromises = productosServicio.map(async (product) => {
            const existing = existingProducts?.find(p => p.id_linea_detalle === product.id_linea_detalle);
            if (existing) {
              return supabase
                .from("producto")
                .update({
                  nombre_producto: product.nombre_producto,
                  tipo: product.tipo
                })
                .eq("id_producto", existing.id_producto);
            }
          });

          await Promise.all(updatePromises);

          // Get the updated products
          const { data: updatedProducts, error: fetchUpdatedErr } = await supabase
            .from("producto")
            .select("id_producto, id_linea_detalle")
            .in("id_linea_detalle", lineaIds)
            .eq("tipo", "linea_servicio");

          if (fetchUpdatedErr) throw fetchUpdatedErr;
          productosServicioResult = updatedProducts ?? [];
        } else if (prodServErr) {
          throw prodServErr;
        } else {
          productosServicioResult = serviceInsertResult ?? [];
        }

        // Crear detalleorden para servicios
        const detalleServicioRows = validServicios.map((sl, idx) => ({
          id_orden_pedido: order.id_orden_pedido,
          id_producto: productosServicioResult?.[idx]?.id_producto,
          cantidad: 1,
          valor_unitario: Number(sl.valorMensual),
          observaciones_detalle: null,
        } satisfies Database["public"]["Tables"]["detalleorden"]["Insert"]));

        const { error: detServErr } = await supabase.from("detalleorden").insert(detalleServicioRows);
        if (detServErr) throw detServErr;
      }
  
      // Actualizar UI local
      onUpdateOrder(order.id_orden_pedido, {
        fecha_modificacion: new Date().toISOString(),
      });
  
      await loadDetalleOrden(order.id_orden_pedido);

      toast.success("Datos guardados correctamente");
    } catch (error) {
      console.error("Error al guardar:", error);
      toast.error("Error al guardar los datos");
    } finally {
      setSaving(false);
    }
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
            <Label>Ingeniero asignado</Label>
            <Select value={selectedComercial} onValueChange={(v) => setSelectedComercial(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar usuario" />
              </SelectTrigger>
              <SelectContent>
                {asignables.map((u) => (
                  <SelectItem key={u.user_id} value={u.user_id}>
                    {u.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Código OC</Label>
            <Input
              type="text"
              placeholder="Código de Orden de Compra"
              value={formData.orden_compra}
              onChange={(e) => setFormData(prev => ({ ...prev, orden_compra: e.target.value }))}
            />
          </div>

          {/* Productos y Servicios (sin cambios relevantes) */}
          <Card>
            <CardHeader><CardTitle className="text-base">Productos y Servicios</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              {productLines.map((line) => (
                <div key={line.id_linea_detalle} className="grid grid-cols-12 gap-4 items-start">
                  <div className="col-span-12 md:col-span-1 flex md:justify-start justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => removeProductLine(line.id_linea_detalle)}
                      disabled={productLines.length === 1}
                      aria-label="Eliminar línea"
                      title="Eliminar línea"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-2 col-span-12 md:col-span-5">
                    <Label>Equipos</Label>
                    <EquipoSelector
                      value={line.selectedEquipo}
                      onChange={(val) => updateProductLine(line.id_linea_detalle, "selectedEquipo", val)}
                      placeholder="Buscar por código o nombre..."
                    />
                  </div>
                  <div className="space-y-2 col-span-6 md:col-span-2">
                    <Label>Cantidad</Label>
                    <Input type="number" placeholder="0" value={line.cantidad}
                      onChange={(e) => updateProductLine(line.id_linea_detalle, "cantidad", e.target.value)} />
                  </div>
                  <div className="space-y-2 col-span-6 md:col-span-2">
                    <Label>Valor Unitario</Label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      placeholder="$0"
                      value={formatCOP(line.valorUnitario)}
                      onChange={(e) => {
                        const digits = digitsOnly(e.target.value);
                        updateProductLine(line.id_linea_detalle, "valorUnitario", digits);
                      }}
                    />
                  </div>
                  
                  {/* Plantilla section */}
                  <div className="col-span-12 space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`plantilla-${line.id_linea_detalle}`}
                        checked={line.plantilla}
                        onCheckedChange={(checked) => updateProductLine(line.id_linea_detalle, "plantilla", checked)}
                      />
                      <Label htmlFor={`plantilla-${line.id_linea_detalle}`}>Plantilla</Label>
                    </div>
                    {line.plantilla && (
                      <Input
                        type="text"
                        placeholder="Información de plantilla..."
                        value={line.plantillaText}
                        onChange={(e) => updateProductLine(line.id_linea_detalle, "plantillaText", e.target.value)}
                      />
                    )}
                  </div>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addProductLine}>
                <Plus className="w-4 h-4 mr-2" /> Agregar Línea
              </Button>
            </CardContent>
            <CardHeader 
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => setShowLineasDetalle(!showLineasDetalle)}
            >
              <CardTitle className="text-base flex items-center justify-between">
                <span>Líneas de Servicio</span>
                {showLineasDetalle ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </CardTitle>
            </CardHeader>
            {showLineasDetalle && (
              <CardContent className="space-y-4">
                {servicioLines.map((line) => (
                  <div key={line.id_linea_detalle} className="grid grid-cols-12 gap-4 items-start">
                    <div className="col-span-1 flex justify-end pt-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => removeServicioLine(line.id_linea_detalle)}
                        disabled={servicioLines.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="col-span-11 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Operador */}
                        <div className="space-y-2">
                          <Label>Operador</Label>
                          <Select
                            value={line.operadorId}
                            onValueChange={(value) => updateServicioLine(line.id_linea_detalle, "operadorId", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar operador" />
                            </SelectTrigger>
                            <SelectContent>
                              {operadores.map((op) => (
                                <SelectItem key={op.id_operador} value={op.id_operador.toString()}>
                                  {op.nombre_operador}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Plan */}
                        <div className="space-y-2">
                          <Label>Plan</Label>
                          <Select
                            value={line.planId}
                            onValueChange={(value) => updateServicioLine(line.id_linea_detalle, "planId", value)}
                            disabled={!line.operadorId}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar plan" />
                            </SelectTrigger>
                            <SelectContent>
                              {planes
                                .filter(p => p.id_operador.toString() === line.operadorId)
                                .map((plan) => (
                                  <SelectItem key={plan.id_plan} value={plan.id_plan.toString()}>
                                    {plan.nombre_plan}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* APN */}
                        <div className="space-y-2">
                          <Label>APN</Label>
                          <Select
                            value={line.apnId}
                            onValueChange={(value) => updateServicioLine(line.id_linea_detalle, "apnId", value)}
                            disabled={!line.operadorId}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar APN" />
                            </SelectTrigger>
                            <SelectContent>
                              {apns
                                .filter(apn => apn.id_operador.toString() === line.operadorId)
                                .map((apn) => (
                                  <SelectItem key={apn.id_apn} value={apn.id_apn.toString()}>
                                    {apn.apn}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Clase de Cobro */}
                        <div className="space-y-2">
                          <Label>Clase de Cobro</Label>
                          <Select
                            value={line.claseCobro}
                            onValueChange={(value) => updateServicioLine(line.id_linea_detalle, "claseCobro", value as ClaseCobro)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="mensual">Mensual</SelectItem>
                              <SelectItem value="anual">Anual</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Valor Mensual */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-2 md:col-span-1">
                          <Label>Valor Mensual</Label>
                          <Input
                            type="text"
                            inputMode="numeric"
                            placeholder="$0"
                            value={formatCOP(line.valorMensual)}
                            onChange={(e) => {
                              const digits = e.target.value.replace(/[^0-9]/g, "");
                              updateServicioLine(line.id_linea_detalle, "valorMensual", digits);
                            }}
                          />
                        </div>
                        <div className="space-y-2 md:col-span-1">
                          <Label>Permanencia (meses)</Label>
                          <Input
                            type="number"
                            min={1}
                            max={36}
                            placeholder="0"
                            value={line.permanencia}
                            onChange={(e) => handlePermanenciaChange(line.id_linea_detalle, e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addServicioLine}
                  className="mt-2"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Línea de Servicio
                </Button>
              </CardContent>
            )}
          </Card>

          {/* Servicios opcionales */}
{/* Service Lines Section */}
          <Card>
            {/* Metodo de Despacho */}
            <CardHeader>
              <CardTitle className="text-base">Método de Despacho</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2 md:col-span-1">
                  <Label>Dirección de Despacho</Label>
                  <Input
                    type="text"
                    placeholder="Dirección completa"
                    value={metodoDespachoForm.direccion_despacho}
                    onChange={(e) => setMetodoDespachoForm(prev => ({ ...prev, direccion_despacho: e.target.value }))}
                  />
                </div>
                <div className="space-y-2 md:col-span-1">
                  <Label>Contacto Teléfono</Label>
                  <Input
                    type="text"
                    placeholder="Teléfono de contacto"
                    value={metodoDespachoForm.contacto_telefono}
                    onChange={(e) => setMetodoDespachoForm(prev => ({ ...prev, contacto_telefono: e.target.value }))}
                  />
                </div>
                <div className="space-y-2 md:col-span-1">
                  <Label>Email para Guía</Label>
                  <Input
                    type="email"
                    placeholder="correo@ejemplo.com"
                    value={metodoDespachoForm.contacto_email_guia}
                    onChange={(e) => setMetodoDespachoForm(prev => ({ ...prev, contacto_email_guia: e.target.value }))}
                  />
                </div>
              </div>
            </CardContent>
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
