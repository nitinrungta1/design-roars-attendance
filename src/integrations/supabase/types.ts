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
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          company_id: string | null
          created_at: string
          diff: Json | null
          entity_id: string | null
          entity_type: string | null
          id: string
          ip: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          company_id?: string | null
          created_at?: string
          diff?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          company_id?: string | null
          created_at?: string
          diff?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          created_at: string
          id: string
          is_default: boolean
          name: string
          plan: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_default?: boolean
          name: string
          plan?: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_default?: boolean
          name?: string
          plan?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      company_members: {
        Row: {
          company_id: string
          id: string
          invited_by: string | null
          is_owner: boolean
          joined_at: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          company_id: string
          id?: string
          invited_by?: string | null
          is_owner?: boolean
          joined_at?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          company_id?: string
          id?: string
          invited_by?: string | null
          is_owner?: boolean
          joined_at?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_members_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          company_id: string | null
          company_name: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          metadata: Json
          notes: string | null
          owner_id: string | null
          phone: string | null
          stage: Database["public"]["Enums"]["contact_stage"]
          title: string | null
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          company_name?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          metadata?: Json
          notes?: string | null
          owner_id?: string | null
          phone?: string | null
          stage?: Database["public"]["Enums"]["contact_stage"]
          title?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          company_name?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          metadata?: Json
          notes?: string | null
          owner_id?: string | null
          phone?: string | null
          stage?: Database["public"]["Enums"]["contact_stage"]
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          applies_to_plan_ids: string[] | null
          code: string
          created_at: string
          currency: string | null
          description: string | null
          expires_at: string | null
          id: string
          is_active: boolean
          kind: Database["public"]["Enums"]["coupon_kind"]
          max_redemptions: number | null
          redeemed_count: number
          starts_at: string | null
          updated_at: string
          value: number
        }
        Insert: {
          applies_to_plan_ids?: string[] | null
          code: string
          created_at?: string
          currency?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          kind?: Database["public"]["Enums"]["coupon_kind"]
          max_redemptions?: number | null
          redeemed_count?: number
          starts_at?: string | null
          updated_at?: string
          value?: number
        }
        Update: {
          applies_to_plan_ids?: string[] | null
          code?: string
          created_at?: string
          currency?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          kind?: Database["public"]["Enums"]["coupon_kind"]
          max_redemptions?: number | null
          redeemed_count?: number
          starts_at?: string | null
          updated_at?: string
          value?: number
        }
        Relationships: []
      }
      demo_requests: {
        Row: {
          company: string | null
          company_id: string | null
          created_at: string
          email: string
          id: string
          message: string | null
          metadata: Json | null
          name: string
          preferred_time: string | null
          source: string | null
          team_size: string | null
        }
        Insert: {
          company?: string | null
          company_id?: string | null
          created_at?: string
          email: string
          id?: string
          message?: string | null
          metadata?: Json | null
          name: string
          preferred_time?: string | null
          source?: string | null
          team_size?: string | null
        }
        Update: {
          company?: string | null
          company_id?: string | null
          created_at?: string
          email?: string
          id?: string
          message?: string | null
          metadata?: Json | null
          name?: string
          preferred_time?: string | null
          source?: string | null
          team_size?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "demo_requests_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_flags: {
        Row: {
          company_id: string | null
          enabled: boolean
          id: string
          key: string
          payload: Json | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          company_id?: string | null
          enabled?: boolean
          id?: string
          key: string
          payload?: Json | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          company_id?: string | null
          enabled?: boolean
          id?: string
          key?: string
          payload?: Json | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feature_flags_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount_due: number
          amount_paid: number
          company_id: string
          created_at: string
          currency: string
          due_at: string | null
          hosted_pdf_url: string | null
          id: string
          issued_at: string | null
          notes: string | null
          number: string
          paid_at: string | null
          provider: Database["public"]["Enums"]["payment_provider"]
          provider_invoice_id: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          subscription_id: string | null
          subtotal: number
          tax_amount: number
          total: number
          updated_at: string
        }
        Insert: {
          amount_due?: number
          amount_paid?: number
          company_id: string
          created_at?: string
          currency?: string
          due_at?: string | null
          hosted_pdf_url?: string | null
          id?: string
          issued_at?: string | null
          notes?: string | null
          number: string
          paid_at?: string | null
          provider?: Database["public"]["Enums"]["payment_provider"]
          provider_invoice_id?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          subscription_id?: string | null
          subtotal?: number
          tax_amount?: number
          total?: number
          updated_at?: string
        }
        Update: {
          amount_due?: number
          amount_paid?: number
          company_id?: string
          created_at?: string
          currency?: string
          due_at?: string | null
          hosted_pdf_url?: string | null
          id?: string
          issued_at?: string | null
          notes?: string | null
          number?: string
          paid_at?: string | null
          provider?: Database["public"]["Enums"]["payment_provider"]
          provider_invoice_id?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          subscription_id?: string | null
          subtotal?: number
          tax_amount?: number
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          assigned_to: string | null
          company: string | null
          company_id: string | null
          created_at: string
          email: string
          id: string
          message: string | null
          metadata: Json | null
          name: string
          notes: string | null
          phone: string | null
          plan_interest: string | null
          source: string | null
          status: Database["public"]["Enums"]["lead_status"]
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          company?: string | null
          company_id?: string | null
          created_at?: string
          email: string
          id?: string
          message?: string | null
          metadata?: Json | null
          name: string
          notes?: string | null
          phone?: string | null
          plan_interest?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          company?: string | null
          company_id?: string | null
          created_at?: string
          email?: string
          id?: string
          message?: string | null
          metadata?: Json | null
          name?: string
          notes?: string | null
          phone?: string | null
          plan_interest?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          company_id: string | null
          created_at: string
          id: string
          link: string | null
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          company_id?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          company_id?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          company_id: string
          created_at: string
          currency: string
          failure_reason: string | null
          id: string
          invoice_id: string | null
          metadata: Json
          method: string | null
          processed_at: string | null
          provider: Database["public"]["Enums"]["payment_provider"]
          provider_charge_id: string | null
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
        }
        Insert: {
          amount?: number
          company_id: string
          created_at?: string
          currency?: string
          failure_reason?: string | null
          id?: string
          invoice_id?: string | null
          metadata?: Json
          method?: string | null
          processed_at?: string | null
          provider?: Database["public"]["Enums"]["payment_provider"]
          provider_charge_id?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Update: {
          amount?: number
          company_id?: string
          created_at?: string
          currency?: string
          failure_reason?: string | null
          id?: string
          invoice_id?: string | null
          metadata?: Json
          method?: string | null
          processed_at?: string | null
          provider?: Database["public"]["Enums"]["payment_provider"]
          provider_charge_id?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          code: string
          created_at: string
          currency: string
          description: string | null
          employee_limit: number | null
          features: Json
          id: string
          is_active: boolean
          is_public: boolean
          name: string
          price_monthly: number
          price_yearly: number
          sort_order: number
          tier: Database["public"]["Enums"]["plan_tier"]
          trial_days: number
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          currency?: string
          description?: string | null
          employee_limit?: number | null
          features?: Json
          id?: string
          is_active?: boolean
          is_public?: boolean
          name: string
          price_monthly?: number
          price_yearly?: number
          sort_order?: number
          tier?: Database["public"]["Enums"]["plan_tier"]
          trial_days?: number
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          currency?: string
          description?: string | null
          employee_limit?: number | null
          features?: Json
          id?: string
          is_active?: boolean
          is_public?: boolean
          name?: string
          price_monthly?: number
          price_yearly?: number
          sort_order?: number
          tier?: Database["public"]["Enums"]["plan_tier"]
          trial_days?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company_id: string | null
          created_at: string
          full_name: string | null
          id: string
          locale: string
          phone: string | null
          timezone: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          company_id?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          locale?: string
          phone?: string | null
          timezone?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          company_id?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          locale?: string
          phone?: string | null
          timezone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          source: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          source?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          source?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at: string | null
          canceled_at: string | null
          company_id: string
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          cycle: Database["public"]["Enums"]["billing_cycle"]
          id: string
          metadata: Json
          plan_id: string | null
          provider: Database["public"]["Enums"]["payment_provider"]
          provider_subscription_id: string | null
          seats: number
          status: Database["public"]["Enums"]["subscription_status"]
          trial_end: string | null
          trial_start: string | null
          updated_at: string
        }
        Insert: {
          cancel_at?: string | null
          canceled_at?: string | null
          company_id: string
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          cycle?: Database["public"]["Enums"]["billing_cycle"]
          id?: string
          metadata?: Json
          plan_id?: string | null
          provider?: Database["public"]["Enums"]["payment_provider"]
          provider_subscription_id?: string | null
          seats?: number
          status?: Database["public"]["Enums"]["subscription_status"]
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string
        }
        Update: {
          cancel_at?: string | null
          canceled_at?: string | null
          company_id?: string
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          cycle?: Database["public"]["Enums"]["billing_cycle"]
          id?: string
          metadata?: Json
          plan_id?: string | null
          provider?: Database["public"]["Enums"]["payment_provider"]
          provider_subscription_id?: string | null
          seats?: number
          status?: Database["public"]["Enums"]["subscription_status"]
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_rates: {
        Row: {
          country: string | null
          created_at: string
          id: string
          inclusive: boolean
          is_active: boolean
          name: string
          rate: number
          region: string | null
          updated_at: string
        }
        Insert: {
          country?: string | null
          created_at?: string
          id?: string
          inclusive?: boolean
          is_active?: boolean
          name: string
          rate?: number
          region?: string | null
          updated_at?: string
        }
        Update: {
          country?: string | null
          created_at?: string
          id?: string
          inclusive?: boolean
          is_active?: boolean
          name?: string
          rate?: number
          region?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      usage_metrics: {
        Row: {
          active_users: number
          api_calls: number
          checkins: number
          company_id: string
          created_at: string
          employees: number
          id: string
          metadata: Json
          metric_date: string
          storage_mb: number
          updated_at: string
        }
        Insert: {
          active_users?: number
          api_calls?: number
          checkins?: number
          company_id: string
          created_at?: string
          employees?: number
          id?: string
          metadata?: Json
          metric_date?: string
          storage_mb?: number
          updated_at?: string
        }
        Update: {
          active_users?: number
          api_calls?: number
          checkins?: number
          company_id?: string
          created_at?: string
          employees?: number
          id?: string
          metadata?: Json
          metric_date?: string
          storage_mb?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "usage_metrics_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          granted_at: string
          granted_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          granted_at?: string
          granted_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          granted_at?: string
          granted_by?: string | null
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
      current_company_id: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_attendance_admin: { Args: { _user_id: string }; Returns: boolean }
      is_member_of: { Args: { _company_id: string }; Returns: boolean }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
      needs_bootstrap: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role:
        | "super_admin"
        | "admin"
        | "hr"
        | "manager"
        | "employee"
        | "sales"
        | "support"
        | "finance"
        | "developer"
        | "viewer"
      billing_cycle: "monthly" | "yearly"
      contact_stage:
        | "subscriber"
        | "lead"
        | "mql"
        | "sql"
        | "customer"
        | "evangelist"
        | "other"
      coupon_kind: "percent" | "fixed"
      invoice_status: "draft" | "open" | "paid" | "void" | "uncollectible"
      lead_status:
        | "new"
        | "contacted"
        | "demo_booked"
        | "trial"
        | "negotiation"
        | "won"
        | "lost"
      payment_provider: "stripe" | "razorpay" | "paypal" | "manual" | "none"
      payment_status: "pending" | "succeeded" | "failed" | "refunded"
      plan_tier: "free" | "starter" | "growth" | "business" | "enterprise"
      subscription_status:
        | "trialing"
        | "active"
        | "past_due"
        | "canceled"
        | "paused"
        | "incomplete"
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
        "super_admin",
        "admin",
        "hr",
        "manager",
        "employee",
        "sales",
        "support",
        "finance",
        "developer",
        "viewer",
      ],
      billing_cycle: ["monthly", "yearly"],
      contact_stage: [
        "subscriber",
        "lead",
        "mql",
        "sql",
        "customer",
        "evangelist",
        "other",
      ],
      coupon_kind: ["percent", "fixed"],
      invoice_status: ["draft", "open", "paid", "void", "uncollectible"],
      lead_status: [
        "new",
        "contacted",
        "demo_booked",
        "trial",
        "negotiation",
        "won",
        "lost",
      ],
      payment_provider: ["stripe", "razorpay", "paypal", "manual", "none"],
      payment_status: ["pending", "succeeded", "failed", "refunded"],
      plan_tier: ["free", "starter", "growth", "business", "enterprise"],
      subscription_status: [
        "trialing",
        "active",
        "past_due",
        "canceled",
        "paused",
        "incomplete",
      ],
    },
  },
} as const
