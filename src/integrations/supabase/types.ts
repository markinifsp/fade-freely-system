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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      agendamentos: {
        Row: {
          barbearia_id: string
          barbeiro_id: string
          cliente_id: string | null
          created_at: string | null
          data: string
          duracao: number
          hora: string
          id: string
          preco: number
          servico_id: string
          status: string | null
        }
        Insert: {
          barbearia_id: string
          barbeiro_id: string
          cliente_id?: string | null
          created_at?: string | null
          data: string
          duracao: number
          hora: string
          id?: string
          preco: number
          servico_id: string
          status?: string | null
        }
        Update: {
          barbearia_id?: string
          barbeiro_id?: string
          cliente_id?: string | null
          created_at?: string | null
          data?: string
          duracao?: number
          hora?: string
          id?: string
          preco?: number
          servico_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agendamentos_barbearia_id_fkey"
            columns: ["barbearia_id"]
            isOneToOne: false
            referencedRelation: "barbearias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_barbeiro_id_fkey"
            columns: ["barbeiro_id"]
            isOneToOne: false
            referencedRelation: "barbeiros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_servico_id_fkey"
            columns: ["servico_id"]
            isOneToOne: false
            referencedRelation: "servicos"
            referencedColumns: ["id"]
          },
        ]
      }
      barbearias: {
        Row: {
          created_at: string | null
          dias_funcionamento: number[] | null
          endereco: string | null
          hora_abertura: string | null
          hora_fechamento: string | null
          id: string
          intervalo_fim: string | null
          intervalo_inicio: string | null
          nome: string
          telefone: string | null
        }
        Insert: {
          created_at?: string | null
          dias_funcionamento?: number[] | null
          endereco?: string | null
          hora_abertura?: string | null
          hora_fechamento?: string | null
          id?: string
          intervalo_fim?: string | null
          intervalo_inicio?: string | null
          nome: string
          telefone?: string | null
        }
        Update: {
          created_at?: string | null
          dias_funcionamento?: number[] | null
          endereco?: string | null
          hora_abertura?: string | null
          hora_fechamento?: string | null
          id?: string
          intervalo_fim?: string | null
          intervalo_inicio?: string | null
          nome?: string
          telefone?: string | null
        }
        Relationships: []
      }
      barbeiro_bloqueios: {
        Row: {
          barbeiro_id: string
          created_at: string | null
          data: string
          dia_inteiro: boolean | null
          hora_fim: string | null
          hora_inicio: string | null
          id: string
          motivo: string | null
        }
        Insert: {
          barbeiro_id: string
          created_at?: string | null
          data: string
          dia_inteiro?: boolean | null
          hora_fim?: string | null
          hora_inicio?: string | null
          id?: string
          motivo?: string | null
        }
        Update: {
          barbeiro_id?: string
          created_at?: string | null
          data?: string
          dia_inteiro?: boolean | null
          hora_fim?: string | null
          hora_inicio?: string | null
          id?: string
          motivo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "barbeiro_bloqueios_barbeiro_id_fkey"
            columns: ["barbeiro_id"]
            isOneToOne: false
            referencedRelation: "barbeiros"
            referencedColumns: ["id"]
          },
        ]
      }
      barbeiro_permissoes: {
        Row: {
          barbeiro_id: string
          editar_propria_agenda: boolean | null
          id: string
          ver_agenda_outros: boolean | null
          ver_faturamento_total: boolean | null
        }
        Insert: {
          barbeiro_id: string
          editar_propria_agenda?: boolean | null
          id?: string
          ver_agenda_outros?: boolean | null
          ver_faturamento_total?: boolean | null
        }
        Update: {
          barbeiro_id?: string
          editar_propria_agenda?: boolean | null
          id?: string
          ver_agenda_outros?: boolean | null
          ver_faturamento_total?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "barbeiro_permissoes_barbeiro_id_fkey"
            columns: ["barbeiro_id"]
            isOneToOne: true
            referencedRelation: "barbeiros"
            referencedColumns: ["id"]
          },
        ]
      }
      barbeiros: {
        Row: {
          ativo: boolean | null
          barbearia_id: string
          comissao: number | null
          created_at: string | null
          dias_folga: number[] | null
          email: string | null
          hora_fim: string | null
          hora_inicio: string | null
          id: string
          nome: string
          telefone: string | null
          user_id: string | null
        }
        Insert: {
          ativo?: boolean | null
          barbearia_id: string
          comissao?: number | null
          created_at?: string | null
          dias_folga?: number[] | null
          email?: string | null
          hora_fim?: string | null
          hora_inicio?: string | null
          id?: string
          nome: string
          telefone?: string | null
          user_id?: string | null
        }
        Update: {
          ativo?: boolean | null
          barbearia_id?: string
          comissao?: number | null
          created_at?: string | null
          dias_folga?: number[] | null
          email?: string | null
          hora_fim?: string | null
          hora_inicio?: string | null
          id?: string
          nome?: string
          telefone?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "barbeiros_barbearia_id_fkey"
            columns: ["barbearia_id"]
            isOneToOne: false
            referencedRelation: "barbearias"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes: {
        Row: {
          barbearia_id: string
          created_at: string | null
          email: string | null
          id: string
          nome: string
          telefone: string | null
        }
        Insert: {
          barbearia_id: string
          created_at?: string | null
          email?: string | null
          id?: string
          nome: string
          telefone?: string | null
        }
        Update: {
          barbearia_id?: string
          created_at?: string | null
          email?: string | null
          id?: string
          nome?: string
          telefone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clientes_barbearia_id_fkey"
            columns: ["barbearia_id"]
            isOneToOne: false
            referencedRelation: "barbearias"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          barbearia_id: string | null
          created_at: string | null
          email: string | null
          id: string
          nome: string
          telefone: string | null
        }
        Insert: {
          avatar_url?: string | null
          barbearia_id?: string | null
          created_at?: string | null
          email?: string | null
          id: string
          nome: string
          telefone?: string | null
        }
        Update: {
          avatar_url?: string | null
          barbearia_id?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          nome?: string
          telefone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_barbearia_id_fkey"
            columns: ["barbearia_id"]
            isOneToOne: false
            referencedRelation: "barbearias"
            referencedColumns: ["id"]
          },
        ]
      }
      servicos: {
        Row: {
          ativo: boolean | null
          barbearia_id: string
          created_at: string | null
          duracao: number
          id: string
          nome: string
          preco: number
        }
        Insert: {
          ativo?: boolean | null
          barbearia_id: string
          created_at?: string | null
          duracao: number
          id?: string
          nome: string
          preco: number
        }
        Update: {
          ativo?: boolean | null
          barbearia_id?: string
          created_at?: string | null
          duracao?: number
          id?: string
          nome?: string
          preco?: number
        }
        Relationships: [
          {
            foreignKeyName: "servicos_barbearia_id_fkey"
            columns: ["barbearia_id"]
            isOneToOne: false
            referencedRelation: "barbearias"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      barbeiro_has_permission: {
        Args: { _permission: string; _user_id: string }
        Returns: boolean
      }
      get_barbeiro_id: { Args: { _user_id: string }; Returns: string }
      get_user_barbearia_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "barbeiro"
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
      app_role: ["admin", "barbeiro"],
    },
  },
} as const
