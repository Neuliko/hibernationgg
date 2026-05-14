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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      bot_tokens: {
        Row: {
          created_at: string
          id: string
          label: string | null
          last_used_at: string | null
          revoked: boolean
          server_id: string
          token_hash: string
        }
        Insert: {
          created_at?: string
          id?: string
          label?: string | null
          last_used_at?: string | null
          revoked?: boolean
          server_id: string
          token_hash: string
        }
        Update: {
          created_at?: string
          id?: string
          label?: string | null
          last_used_at?: string | null
          revoked?: boolean
          server_id?: string
          token_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "bot_tokens_server_id_fkey"
            columns: ["server_id"]
            isOneToOne: false
            referencedRelation: "discord_servers"
            referencedColumns: ["id"]
          },
        ]
      }
      discord_links: {
        Row: {
          id: string
          clerk_user_id: string
          verification_code: string | null
          expires_at: string | null
          verified: boolean
          discord_user_id: string | null
          discord_username: string | null
          linked_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          clerk_user_id: string
          verification_code?: string | null
          expires_at?: string | null
          verified?: boolean
          discord_user_id?: string | null
          discord_username?: string | null
          linked_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          clerk_user_id?: string
          verification_code?: string | null
          expires_at?: string | null
          verified?: boolean
          discord_user_id?: string | null
          discord_username?: string | null
          linked_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      discord_servers: {
        Row: {
          created_at: string
          deep_sleep_minutes: number
          frozen_minutes: number
          guild_id: string
          hibernation_enabled: boolean
          id: string
          inactivity_threshold_minutes: number
          light_sleep_minutes: number
          name: string
          nickname_automation: boolean
          owner_user_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          deep_sleep_minutes?: number
          frozen_minutes?: number
          guild_id: string
          hibernation_enabled?: boolean
          id?: string
          inactivity_threshold_minutes?: number
          light_sleep_minutes?: number
          name: string
          nickname_automation?: boolean
          owner_user_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          deep_sleep_minutes?: number
          frozen_minutes?: number
          guild_id?: string
          hibernation_enabled?: boolean
          id?: string
          inactivity_threshold_minutes?: number
          light_sleep_minutes?: number
          name?: string
          nickname_automation?: boolean
          owner_user_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      hibernation_events: {
        Row: {
          created_at: string
          duration_seconds: number | null
          from_state: Database["public"]["Enums"]["sleep_state"] | null
          id: string
          metadata: Json | null
          server_id: string
          target_id: string | null
          to_state: Database["public"]["Enums"]["sleep_state"] | null
          trigger: string | null
          type: Database["public"]["Enums"]["event_type"]
        }
        Insert: {
          created_at?: string
          duration_seconds?: number | null
          from_state?: Database["public"]["Enums"]["sleep_state"] | null
          id?: string
          metadata?: Json | null
          server_id: string
          target_id?: string | null
          to_state?: Database["public"]["Enums"]["sleep_state"] | null
          trigger?: string | null
          type: Database["public"]["Enums"]["event_type"]
        }
        Update: {
          created_at?: string
          duration_seconds?: number | null
          from_state?: Database["public"]["Enums"]["sleep_state"] | null
          id?: string
          metadata?: Json | null
          server_id?: string
          target_id?: string | null
          to_state?: Database["public"]["Enums"]["sleep_state"] | null
          trigger?: string | null
          type?: Database["public"]["Enums"]["event_type"]
        }
        Relationships: [
          {
            foreignKeyName: "hibernation_events_server_id_fkey"
            columns: ["server_id"]
            isOneToOne: false
            referencedRelation: "discord_servers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hibernation_events_target_id_fkey"
            columns: ["target_id"]
            isOneToOne: false
            referencedRelation: "hibernation_targets"
            referencedColumns: ["id"]
          },
        ]
      }
      hibernation_targets: {
        Row: {
          created_at: string
          display_name: string | null
          guild_id: string
          hibernation_started_at: string | null
          id: string
          kind: Database["public"]["Enums"]["target_kind"]
          last_active_at: string
          original_nickname: string | null
          server_id: string
          state: Database["public"]["Enums"]["sleep_state"]
          target_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          guild_id: string
          hibernation_started_at?: string | null
          id?: string
          kind: Database["public"]["Enums"]["target_kind"]
          last_active_at?: string
          original_nickname?: string | null
          server_id: string
          state?: Database["public"]["Enums"]["sleep_state"]
          target_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          guild_id?: string
          hibernation_started_at?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["target_kind"]
          last_active_at?: string
          original_nickname?: string | null
          server_id?: string
          state?: Database["public"]["Enums"]["sleep_state"]
          target_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hibernation_targets_server_id_fkey"
            columns: ["server_id"]
            isOneToOne: false
            referencedRelation: "discord_servers"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      event_type:
        | "hibernate"
        | "wake"
        | "state_change"
        | "nickname_change"
        | "config_change"
      sleep_state: "awake" | "light" | "deep" | "frozen"
      target_kind: "channel" | "user"
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
      app_role: ["admin", "user"],
      event_type: [
        "hibernate",
        "wake",
        "state_change",
        "nickname_change",
        "config_change",
      ],
      sleep_state: ["awake", "light", "deep", "frozen"],
      target_kind: ["channel", "user"],
    },
  },
} as const
