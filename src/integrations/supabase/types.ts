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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      match_events: {
        Row: {
          away_score: number | null
          away_team: string
          betting_closes_at: string
          betting_opens_at: string
          created_at: string
          home_score: number | null
          home_team: string
          id: string
          match_date: string
          status: string
          updated_at: string
        }
        Insert: {
          away_score?: number | null
          away_team: string
          betting_closes_at: string
          betting_opens_at: string
          created_at?: string
          home_score?: number | null
          home_team: string
          id?: string
          match_date: string
          status?: string
          updated_at?: string
        }
        Update: {
          away_score?: number | null
          away_team?: string
          betting_closes_at?: string
          betting_opens_at?: string
          created_at?: string
          home_score?: number | null
          home_team?: string
          id?: string
          match_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      match_predictions: {
        Row: {
          created_at: string
          id: string
          match_id: string
          penalty_applied: number | null
          predicted_away_score: number
          predicted_home_score: number
          updated_at: string
          user_id: string
          username: string
        }
        Insert: {
          created_at?: string
          id?: string
          match_id: string
          penalty_applied?: number | null
          predicted_away_score: number
          predicted_home_score: number
          updated_at?: string
          user_id: string
          username: string
        }
        Update: {
          created_at?: string
          id?: string
          match_id?: string
          penalty_applied?: number | null
          predicted_away_score?: number
          predicted_home_score?: number
          updated_at?: string
          user_id?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_predictions_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "match_events"
            referencedColumns: ["id"]
          },
        ]
      }
      prediction_sets: {
        Row: {
          created_at: string
          id: string
          label: string
          p1_order: string[]
          p2_order: string[]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          label: string
          p1_order: string[]
          p2_order: string[]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          p1_order?: string[]
          p2_order?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      real_standings: {
        Row: {
          created_at: string
          id: string
          label: string
          positions: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          label: string
          positions: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          positions?: Json
          updated_at?: string
        }
        Relationships: []
      }
      reservations: {
        Row: {
          created_at: string | null
          customer_name: string
          id: string
          meal_type: string
          party_size: number
          phone_number: string
          reservation_date: string
          seat_number: number
          seating_type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          customer_name: string
          id?: string
          meal_type: string
          party_size: number
          phone_number: string
          reservation_date: string
          seat_number: number
          seating_type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          customer_name?: string
          id?: string
          meal_type?: string
          party_size?: number
          phone_number?: string
          reservation_date?: string
          seat_number?: number
          seating_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          created_at: string
          id: string
          total_penalties: number
          updated_at: string
          user_id: string
          username: string
        }
        Insert: {
          created_at?: string
          id?: string
          total_penalties?: number
          updated_at?: string
          user_id: string
          username: string
        }
        Update: {
          created_at?: string
          id?: string
          total_penalties?: number
          updated_at?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
