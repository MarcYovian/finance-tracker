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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      budget_items: {
        Row: {
          budget_id: string
          category_id: string
          created_at: string
          id: string
          planned_amount: number
          spent_amount: number
          updated_at: string
        }
        Insert: {
          budget_id: string
          category_id: string
          created_at?: string
          id?: string
          planned_amount: number
          spent_amount?: number
          updated_at?: string
        }
        Update: {
          budget_id?: string
          category_id?: string
          created_at?: string
          id?: string
          planned_amount?: number
          spent_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_items_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "budgets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      budgets: {
        Row: {
          alert_threshold: number
          created_at: string
          description: string | null
          end_date: string
          id: string
          is_active: boolean
          name: string
          period: string
          start_date: string
          total_limit: number
          updated_at: string
          user_id: string
        }
        Insert: {
          alert_threshold?: number
          created_at?: string
          description?: string | null
          end_date: string
          id?: string
          is_active?: boolean
          name: string
          period: string
          start_date: string
          total_limit: number
          updated_at?: string
          user_id: string
        }
        Update: {
          alert_threshold?: number
          created_at?: string
          description?: string | null
          end_date?: string
          id?: string
          is_active?: boolean
          name?: string
          period?: string
          start_date?: string
          total_limit?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean
          name: string
          parent_id: string | null
          sort_order: number | null
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name: string
          parent_id?: string | null
          sort_order?: number | null
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name?: string
          parent_id?: string | null
          sort_order?: number | null
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_goals: {
        Row: {
          category: string
          created_at: string
          current_amount: number
          description: string | null
          id: string
          name: string
          priority: number | null
          status: string
          target_amount: number
          target_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          current_amount?: number
          description?: string | null
          id?: string
          name: string
          priority?: number | null
          status?: string
          target_amount: number
          target_date: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          current_amount?: number
          description?: string | null
          id?: string
          name?: string
          priority?: number | null
          status?: string
          target_amount?: number
          target_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      fund_sources: {
        Row: {
          balance: number
          created_at: string
          currency: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      recurring_patterns: {
        Row: {
          amount: number
          category_id: string | null
          created_at: string
          description: string | null
          destination_fund_id: string | null
          end_date: string | null
          frequency: string
          id: string
          interval: number
          is_active: boolean
          name: string
          next_execution_date: string
          source_fund_id: string | null
          start_date: string
          transaction_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          category_id?: string | null
          created_at?: string
          description?: string | null
          destination_fund_id?: string | null
          end_date?: string | null
          frequency: string
          id?: string
          interval?: number
          is_active?: boolean
          name: string
          next_execution_date: string
          source_fund_id?: string | null
          start_date: string
          transaction_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          category_id?: string | null
          created_at?: string
          description?: string | null
          destination_fund_id?: string | null
          end_date?: string | null
          frequency?: string
          id?: string
          interval?: number
          is_active?: boolean
          name?: string
          next_execution_date?: string
          source_fund_id?: string | null
          start_date?: string
          transaction_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurring_patterns_category_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_patterns_destination_fund_fkey"
            columns: ["destination_fund_id"]
            isOneToOne: false
            referencedRelation: "fund_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_patterns_source_fund_fkey"
            columns: ["source_fund_id"]
            isOneToOne: false
            referencedRelation: "fund_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          category_id: string | null
          created_at: string
          description: string | null
          destination_fund_id: string | null
          id: string
          is_recurring: boolean
          notes: string | null
          recurring_pattern_id: string | null
          source_fund_id: string | null
          status: string
          transaction_date: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          category_id?: string | null
          created_at?: string
          description?: string | null
          destination_fund_id?: string | null
          id?: string
          is_recurring?: boolean
          notes?: string | null
          recurring_pattern_id?: string | null
          source_fund_id?: string | null
          status?: string
          transaction_date: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          category_id?: string | null
          created_at?: string
          description?: string | null
          destination_fund_id?: string | null
          id?: string
          is_recurring?: boolean
          notes?: string | null
          recurring_pattern_id?: string | null
          source_fund_id?: string | null
          status?: string
          transaction_date?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_destination_fund_fkey"
            columns: ["destination_fund_id"]
            isOneToOne: false
            referencedRelation: "fund_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_recurring_pattern_fkey"
            columns: ["recurring_pattern_id"]
            isOneToOne: false
            referencedRelation: "recurring_patterns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_source_fund_fkey"
            columns: ["source_fund_id"]
            isOneToOne: false
            referencedRelation: "fund_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          default_currency: string | null
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          default_currency?: string | null
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          default_currency?: string | null
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_next_execution_date: {
        Args: {
          p_current_date: string
          p_frequency: string
          p_interval: number
        }
        Returns: string
      }
      create_transaction_with_balance_update: {
        Args: {
          p_amount: number
          p_category_id: string
          p_description: string
          p_destination_fund_id: string
          p_notes?: string
          p_recurring_pattern_id?: string
          p_source_fund_id: string
          p_transaction_date: string
          p_type: string
        }
        Returns: {
          amount: number
          category_id: string | null
          created_at: string
          description: string | null
          destination_fund_id: string | null
          id: string
          is_recurring: boolean
          notes: string | null
          recurring_pattern_id: string | null
          source_fund_id: string | null
          status: string
          transaction_date: string
          type: string
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "transactions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      delete_transaction_with_balance_adjustment: {
        Args: { p_transaction_id: string }
        Returns: boolean
      }
      get_budget_spending_details: {
        Args: { p_budget_id: string }
        Returns: {
          category_id: string
          category_name: string
          percentage: number
          planned_amount: number
          spent_amount: number
          status: string
        }[]
      }
      get_current_user: {
        Args: never
        Returns: {
          avatar_url: string | null
          created_at: string
          default_currency: string | null
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "user_profiles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_dashboard_summary: {
        Args: never
        Returns: {
          active_budgets_count: number
          active_goals_count: number
          fund_sources_count: number
          net_flow: number
          total_balance: number
          total_expense: number
          total_income: number
        }[]
      }
      get_goals_with_progress: {
        Args: never
        Returns: {
          current_amount: number
          days_remaining: number
          goal_id: string
          goal_name: string
          is_on_track: boolean
          progress_percentage: number
          status: string
          target_amount: number
          target_date: string
        }[]
      }
      get_monthly_spending: {
        Args: { p_month: number; p_year: number }
        Returns: {
          category_id: string
          category_name: string
          category_type: string
          total_amount: number
          transaction_count: number
        }[]
      }
      refresh_budget_spending: {
        Args: { p_budget_id: string }
        Returns: undefined
      }
      update_transaction_with_balance_adjustment: {
        Args: {
          p_amount: number
          p_category_id: string
          p_description: string
          p_destination_fund_id: string
          p_notes: string
          p_source_fund_id: string
          p_transaction_date: string
          p_transaction_id: string
        }
        Returns: {
          amount: number
          category_id: string | null
          created_at: string
          description: string | null
          destination_fund_id: string | null
          id: string
          is_recurring: boolean
          notes: string | null
          recurring_pattern_id: string | null
          source_fund_id: string | null
          status: string
          transaction_date: string
          type: string
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "transactions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
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
