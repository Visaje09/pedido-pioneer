export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      apn: {
        Row: {
          apn: string
          id_apn: number
          id_operador: number
        }
        Insert: {
          apn: string
          id_apn?: number
          id_operador: number
        }
        Update: {
          apn?: string
          id_apn?: number
          id_operador?: number
        }
        Relationships: [
          {
            foreignKeyName: "apn_id_operador_fkey"
            columns: ["id_operador"]
            isOneToOne: false
            referencedRelation: "operador"
            referencedColumns: ["id_operador"]
          },
        ]
      }
      claseorden: {
        Row: {
          id_clase_orden: number
          tipo_orden: string
        }
        Insert: {
          id_clase_orden?: number
          tipo_orden: string
        }
        Update: {
          id_clase_orden?: number
          tipo_orden?: string
        }
        Relationships: []
      }
      cliente: {
        Row: {
          id_cliente: number
          nit: string
          nombre_cliente: string
        }
        Insert: {
          id_cliente?: number
          nit: string
          nombre_cliente: string
        }
        Update: {
          id_cliente?: number
          nit?: string
          nombre_cliente?: string
        }
        Relationships: []
      }
      detalleorden: {
        Row: {
          cantidad: number | null
          id_orden_detalle: number
          id_orden_pedido: number
          id_producto: number
          observaciones_detalle: string | null
          plantilla: string | null
          valor_unitario: number | null
        }
        Insert: {
          cantidad?: number | null
          id_orden_detalle?: number
          id_orden_pedido: number
          id_producto: number
          observaciones_detalle?: string | null
          plantilla?: string | null
          valor_unitario?: number | null
        }
        Update: {
          cantidad?: number | null
          id_orden_detalle?: number
          id_orden_pedido?: number
          id_producto?: number
          observaciones_detalle?: string | null
          plantilla?: string | null
          valor_unitario?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "detalleorden_id_orden_pedido_fkey"
            columns: ["id_orden_pedido"]
            isOneToOne: false
            referencedRelation: "ordenpedido"
            referencedColumns: ["id_orden_pedido"]
          },
          {
            foreignKeyName: "detalleorden_id_producto_fkey"
            columns: ["id_producto"]
            isOneToOne: false
            referencedRelation: "producto"
            referencedColumns: ["id_producto"]
          },
        ]
      }
      equipo: {
        Row: {
          categoria: string | null
          codigo: string | null
          id_producto: number
        }
        Insert: {
          categoria?: string | null
          codigo?: string | null
          id_producto: number
        }
        Update: {
          categoria?: string | null
          codigo?: string | null
          id_producto?: number
        }
        Relationships: [
          {
            foreignKeyName: "equipo_id_producto_fkey"
            columns: ["id_producto"]
            isOneToOne: true
            referencedRelation: "producto"
            referencedColumns: ["id_producto"]
          },
        ]
      }
      factura: {
        Row: {
          estado_factura: string | null
          fecha_factura: string | null
          id_factura: number
          id_orden_pedido: number
          id_tipo_pago: number | null
          numero_factura: string | null
        }
        Insert: {
          estado_factura?: string | null
          fecha_factura?: string | null
          id_factura?: number
          id_orden_pedido: number
          id_tipo_pago?: number | null
          numero_factura?: string | null
        }
        Update: {
          estado_factura?: string | null
          fecha_factura?: string | null
          id_factura?: number
          id_orden_pedido?: number
          id_tipo_pago?: number | null
          numero_factura?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "factura_id_orden_pedido_fkey"
            columns: ["id_orden_pedido"]
            isOneToOne: false
            referencedRelation: "ordenpedido"
            referencedColumns: ["id_orden_pedido"]
          },
          {
            foreignKeyName: "factura_id_tipo_pago_fkey"
            columns: ["id_tipo_pago"]
            isOneToOne: false
            referencedRelation: "tipopago"
            referencedColumns: ["id_tipo_pago"]
          },
        ]
      }
      lineaservicio: {
        Row: {
          id_apn: number
          id_operador: number
          id_plan: number
          id_producto: number
          permanencia: string | null
        }
        Insert: {
          id_apn: number
          id_operador: number
          id_plan: number
          id_producto: number
          permanencia?: string | null
        }
        Update: {
          id_apn?: number
          id_operador?: number
          id_plan?: number
          id_producto?: number
          permanencia?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lineaservicio_id_apn_fkey"
            columns: ["id_apn"]
            isOneToOne: false
            referencedRelation: "apn"
            referencedColumns: ["id_apn"]
          },
          {
            foreignKeyName: "lineaservicio_id_operador_fkey"
            columns: ["id_operador"]
            isOneToOne: false
            referencedRelation: "operador"
            referencedColumns: ["id_operador"]
          },
          {
            foreignKeyName: "lineaservicio_id_plan_fkey"
            columns: ["id_plan"]
            isOneToOne: false
            referencedRelation: "plan"
            referencedColumns: ["id_plan"]
          },
          {
            foreignKeyName: "lineaservicio_id_producto_fkey"
            columns: ["id_producto"]
            isOneToOne: true
            referencedRelation: "producto"
            referencedColumns: ["id_producto"]
          },
        ]
      }
      metododespacho: {
        Row: {
          contacto_despacho: string | null
          contacto_email_guia: string | null
          contacto_telefono: string | null
          direccion_despacho: string | null
          id_metodo_despacho: number
          id_transportadora: number | null
          tipo_despacho: string | null
        }
        Insert: {
          contacto_despacho?: string | null
          contacto_email_guia?: string | null
          contacto_telefono?: string | null
          direccion_despacho?: string | null
          id_metodo_despacho?: number
          id_transportadora?: number | null
          tipo_despacho?: string | null
        }
        Update: {
          contacto_despacho?: string | null
          contacto_email_guia?: string | null
          contacto_telefono?: string | null
          direccion_despacho?: string | null
          id_metodo_despacho?: number
          id_transportadora?: number | null
          tipo_despacho?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "metododespacho_id_transportadora_fkey"
            columns: ["id_transportadora"]
            isOneToOne: false
            referencedRelation: "transportadora"
            referencedColumns: ["id_transportadora"]
          },
        ]
      }
      operador: {
        Row: {
          id_operador: number
          nombre_operador: string
        }
        Insert: {
          id_operador?: number
          nombre_operador: string
        }
        Update: {
          id_operador?: number
          nombre_operador?: string
        }
        Relationships: []
      }
      ordenpedido: {
        Row: {
          consecutivo: string | null
          created_by: string
          estado: Database["public"]["Enums"]["estado_orden_enum"] | null
          fecha_creacion: string | null
          fecha_modificacion: string | null
          id_clase_orden: number | null
          id_cliente: number
          id_metodo_despacho: number | null
          id_orden_pedido: number
          id_proyecto: number | null
          id_tipo_pago: number | null
          observaciones_orden: string | null
        }
        Insert: {
          consecutivo?: string | null
          created_by?: string
          estado?: Database["public"]["Enums"]["estado_orden_enum"] | null
          fecha_creacion?: string | null
          fecha_modificacion?: string | null
          id_clase_orden?: number | null
          id_cliente: number
          id_metodo_despacho?: number | null
          id_orden_pedido?: number
          id_proyecto?: number | null
          id_tipo_pago?: number | null
          observaciones_orden?: string | null
        }
        Update: {
          consecutivo?: string | null
          created_by?: string
          estado?: Database["public"]["Enums"]["estado_orden_enum"] | null
          fecha_creacion?: string | null
          fecha_modificacion?: string | null
          id_clase_orden?: number | null
          id_cliente?: number
          id_metodo_despacho?: number | null
          id_orden_pedido?: number
          id_proyecto?: number | null
          id_tipo_pago?: number | null
          observaciones_orden?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ordenpedido_id_clase_orden_fkey"
            columns: ["id_clase_orden"]
            isOneToOne: false
            referencedRelation: "claseorden"
            referencedColumns: ["id_clase_orden"]
          },
          {
            foreignKeyName: "ordenpedido_id_cliente_fkey"
            columns: ["id_cliente"]
            isOneToOne: false
            referencedRelation: "cliente"
            referencedColumns: ["id_cliente"]
          },
          {
            foreignKeyName: "ordenpedido_id_metodo_despacho_fkey"
            columns: ["id_metodo_despacho"]
            isOneToOne: false
            referencedRelation: "metododespacho"
            referencedColumns: ["id_metodo_despacho"]
          },
          {
            foreignKeyName: "ordenpedido_id_proyecto_fkey"
            columns: ["id_proyecto"]
            isOneToOne: false
            referencedRelation: "proyecto"
            referencedColumns: ["id_proyecto"]
          },
          {
            foreignKeyName: "ordenpedido_id_tipo_pago_fkey"
            columns: ["id_tipo_pago"]
            isOneToOne: false
            referencedRelation: "tipopago"
            referencedColumns: ["id_tipo_pago"]
          },
        ]
      }
      ordenproduccion: {
        Row: {
          estado_orden_produccion: string | null
          fecha_produccion: string | null
          id_orden_pedido: number
          id_orden_produccion: number
          numero_produccion: string | null
          observaciones_produccion: string | null
        }
        Insert: {
          estado_orden_produccion?: string | null
          fecha_produccion?: string | null
          id_orden_pedido: number
          id_orden_produccion?: number
          numero_produccion?: string | null
          observaciones_produccion?: string | null
        }
        Update: {
          estado_orden_produccion?: string | null
          fecha_produccion?: string | null
          id_orden_pedido?: number
          id_orden_produccion?: number
          numero_produccion?: string | null
          observaciones_produccion?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ordenproduccion_id_orden_pedido_fkey"
            columns: ["id_orden_pedido"]
            isOneToOne: false
            referencedRelation: "ordenpedido"
            referencedColumns: ["id_orden_pedido"]
          },
        ]
      }
      plan: {
        Row: {
          id_operador: number
          id_plan: number
          nombre_plan: string
        }
        Insert: {
          id_operador: number
          id_plan?: number
          nombre_plan: string
        }
        Update: {
          id_operador?: number
          id_plan?: number
          nombre_plan?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_id_operador_fkey"
            columns: ["id_operador"]
            isOneToOne: false
            referencedRelation: "operador"
            referencedColumns: ["id_operador"]
          },
        ]
      }
      producto: {
        Row: {
          created_at: string | null
          created_by: string
          descripcion: string | null
          id_producto: number
          tipo: Database["public"]["Enums"]["tipo_producto_enum"]
        }
        Insert: {
          created_at?: string | null
          created_by?: string
          descripcion?: string | null
          id_producto?: number
          tipo: Database["public"]["Enums"]["tipo_producto_enum"]
        }
        Update: {
          created_at?: string | null
          created_by?: string
          descripcion?: string | null
          id_producto?: number
          tipo?: Database["public"]["Enums"]["tipo_producto_enum"]
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          nombre: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
          username: string | null
        }
        Insert: {
          created_at?: string | null
          nombre?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
          username?: string | null
        }
        Update: {
          created_at?: string | null
          nombre?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      proyecto: {
        Row: {
          descripcion_proyecto: string | null
          id_cliente: number
          id_proyecto: number
          nombre_proyecto: string
        }
        Insert: {
          descripcion_proyecto?: string | null
          id_cliente: number
          id_proyecto?: number
          nombre_proyecto: string
        }
        Update: {
          descripcion_proyecto?: string | null
          id_cliente?: number
          id_proyecto?: number
          nombre_proyecto?: string
        }
        Relationships: [
          {
            foreignKeyName: "proyecto_id_cliente_fkey"
            columns: ["id_cliente"]
            isOneToOne: false
            referencedRelation: "cliente"
            referencedColumns: ["id_cliente"]
          },
        ]
      }
      remision: {
        Row: {
          estado_remision: string | null
          fecha_remision: string | null
          id_orden_pedido: number
          id_remision: number
          numero_remision: string | null
        }
        Insert: {
          estado_remision?: string | null
          fecha_remision?: string | null
          id_orden_pedido: number
          id_remision?: number
          numero_remision?: string | null
        }
        Update: {
          estado_remision?: string | null
          fecha_remision?: string | null
          id_orden_pedido?: number
          id_remision?: number
          numero_remision?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "remision_id_orden_pedido_fkey"
            columns: ["id_orden_pedido"]
            isOneToOne: false
            referencedRelation: "ordenpedido"
            referencedColumns: ["id_orden_pedido"]
          },
        ]
      }
      responsableorden: {
        Row: {
          id_orden_pedido: number
          id_rol: number
          user_id: string
        }
        Insert: {
          id_orden_pedido: number
          id_rol: number
          user_id: string
        }
        Update: {
          id_orden_pedido?: number
          id_rol?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "responsableorden_id_orden_pedido_fkey"
            columns: ["id_orden_pedido"]
            isOneToOne: false
            referencedRelation: "ordenpedido"
            referencedColumns: ["id_orden_pedido"]
          },
          {
            foreignKeyName: "responsableorden_id_rol_fkey"
            columns: ["id_rol"]
            isOneToOne: false
            referencedRelation: "rol"
            referencedColumns: ["id_rol"]
          },
          {
            foreignKeyName: "responsableorden_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      rol: {
        Row: {
          id_rol: number
          tipo_rol: string
        }
        Insert: {
          id_rol?: number
          tipo_rol: string
        }
        Update: {
          id_rol?: number
          tipo_rol?: string
        }
        Relationships: []
      }
      tipopago: {
        Row: {
          aprobado_cartera: boolean | null
          forma_pago: string
          id_tipo_pago: number
          plazo: string | null
        }
        Insert: {
          aprobado_cartera?: boolean | null
          forma_pago: string
          id_tipo_pago?: number
          plazo?: string | null
        }
        Update: {
          aprobado_cartera?: boolean | null
          forma_pago?: string
          id_tipo_pago?: number
          plazo?: string | null
        }
        Relationships: []
      }
      transportadora: {
        Row: {
          fecha_transportadora: string | null
          id_transportadora: number
          nombre_transportadora: string | null
          observaciones_envio: string | null
        }
        Insert: {
          fecha_transportadora?: string | null
          id_transportadora?: number
          nombre_transportadora?: string | null
          observaciones_envio?: string | null
        }
        Update: {
          fecha_transportadora?: string | null
          id_transportadora?: number
          nombre_transportadora?: string | null
          observaciones_envio?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      auth_uid: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      has_role: {
        Args: { r: Database["public"]["Enums"]["app_role"] }
        Returns: boolean
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "comercial"
        | "inventarios"
        | "produccion"
        | "logistica"
        | "facturacion"
        | "financiera"
      estado_orden_enum:
        | "borrador"
        | "validacion_comercial"
        | "inventarios_pendiente"
        | "produccion_pendiente"
        | "logistica_pendiente"
        | "enviada"
        | "facturacion_pendiente"
        | "facturada"
        | "financiera_pendiente"
        | "cerrada"
        | "anulada"
      tipo_producto_enum: "equipo" | "linea_servicio"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "admin",
        "comercial",
        "inventarios",
        "produccion",
        "logistica",
        "facturacion",
        "financiera",
      ],
      estado_orden_enum: [
        "borrador",
        "validacion_comercial",
        "inventarios_pendiente",
        "produccion_pendiente",
        "logistica_pendiente",
        "enviada",
        "facturacion_pendiente",
        "facturada",
        "financiera_pendiente",
        "cerrada",
        "anulada",
      ],
      tipo_producto_enum: ["equipo", "linea_servicio"],
    },
  },
} as const
