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
      analytics_events: {
        Row: {
          created_at: string
          event_name: string
          id: string
          occurred_at: string
          page_path: string | null
          page_url: string | null
          props: Json
          referrer: string | null
          session_id: string | null
          visitor_id: string | null
        }
        Insert: {
          created_at?: string
          event_name: string
          id?: string
          occurred_at?: string
          page_path?: string | null
          page_url?: string | null
          props?: Json
          referrer?: string | null
          session_id?: string | null
          visitor_id?: string | null
        }
        Update: {
          created_at?: string
          event_name?: string
          id?: string
          occurred_at?: string
          page_path?: string | null
          page_url?: string | null
          props?: Json
          referrer?: string | null
          session_id?: string | null
          visitor_id?: string | null
        }
        Relationships: []
      }
      analytics_sessions: {
        Row: {
          browser: string | null
          city: string | null
          country: string | null
          created_at: string
          device: string | null
          ended_at: string | null
          exit_url: string | null
          landing_url: string | null
          last_touch: Json
          os: string | null
          page_count: number
          referrer: string | null
          session_id: string
          started_at: string
          updated_at: string
          visitor_id: string
        }
        Insert: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device?: string | null
          ended_at?: string | null
          exit_url?: string | null
          landing_url?: string | null
          last_touch?: Json
          os?: string | null
          page_count?: number
          referrer?: string | null
          session_id: string
          started_at?: string
          updated_at?: string
          visitor_id: string
        }
        Update: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device?: string | null
          ended_at?: string | null
          exit_url?: string | null
          landing_url?: string | null
          last_touch?: Json
          os?: string | null
          page_count?: number
          referrer?: string | null
          session_id?: string
          started_at?: string
          updated_at?: string
          visitor_id?: string
        }
        Relationships: []
      }
      analytics_settings: {
        Row: {
          clarity_id: string | null
          cookie_consent_required: boolean
          ga4_id: string | null
          gtm_id: string | null
          id: number
          meta_pixel_id: string | null
          reports_enabled: boolean
          reports_from_email: string | null
          retention_days: number
          updated_at: string
        }
        Insert: {
          clarity_id?: string | null
          cookie_consent_required?: boolean
          ga4_id?: string | null
          gtm_id?: string | null
          id?: number
          meta_pixel_id?: string | null
          reports_enabled?: boolean
          reports_from_email?: string | null
          retention_days?: number
          updated_at?: string
        }
        Update: {
          clarity_id?: string | null
          cookie_consent_required?: boolean
          ga4_id?: string | null
          gtm_id?: string | null
          id?: number
          meta_pixel_id?: string | null
          reports_enabled?: boolean
          reports_from_email?: string | null
          retention_days?: number
          updated_at?: string
        }
        Relationships: []
      }
      analytics_visitors: {
        Row: {
          city: string | null
          country: string | null
          created_at: string
          first_seen: string
          first_touch: Json
          last_seen: string
          total_leads: number
          total_sessions: number
          visitor_id: string
        }
        Insert: {
          city?: string | null
          country?: string | null
          created_at?: string
          first_seen?: string
          first_touch?: Json
          last_seen?: string
          total_leads?: number
          total_sessions?: number
          visitor_id: string
        }
        Update: {
          city?: string | null
          country?: string | null
          created_at?: string
          first_seen?: string
          first_touch?: Json
          last_seen?: string
          total_leads?: number
          total_sessions?: number
          visitor_id?: string
        }
        Relationships: []
      }
      announcement_reads: {
        Row: {
          announcement_id: string
          id: string
          read_at: string
          user_id: string
        }
        Insert: {
          announcement_id: string
          id?: string
          read_at?: string
          user_id: string
        }
        Update: {
          announcement_id?: string
          id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcement_reads_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "announcements"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          audience: Database["public"]["Enums"]["announcement_audience"]
          audience_id: string | null
          body: string | null
          company_id: string
          created_at: string
          created_by: string | null
          id: string
          pinned: boolean
          published_at: string | null
          title: string
          updated_at: string
        }
        Insert: {
          audience?: Database["public"]["Enums"]["announcement_audience"]
          audience_id?: string | null
          body?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          pinned?: boolean
          published_at?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          audience?: Database["public"]["Enums"]["announcement_audience"]
          audience_id?: string | null
          body?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          pinned?: boolean
          published_at?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      api_keys: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          key_hash: string
          label: string
          last_used_at: string | null
          prefix: string
          revoked_at: string | null
          scopes: string[]
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          key_hash: string
          label: string
          last_used_at?: string | null
          prefix: string
          revoked_at?: string | null
          scopes?: string[]
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          key_hash?: string
          label?: string
          last_used_at?: string | null
          prefix?: string
          revoked_at?: string | null
          scopes?: string[]
        }
        Relationships: []
      }
      application_assignments: {
        Row: {
          application_id: string
          assignment_id: string
          created_at: string
          due_at: string | null
          feedback: string | null
          id: string
          score: number | null
          sent_at: string
          submission_text: string | null
          submission_url: string | null
          submitted_at: string | null
          token: string
          updated_at: string
        }
        Insert: {
          application_id: string
          assignment_id: string
          created_at?: string
          due_at?: string | null
          feedback?: string | null
          id?: string
          score?: number | null
          sent_at?: string
          submission_text?: string | null
          submission_url?: string | null
          submitted_at?: string | null
          token?: string
          updated_at?: string
        }
        Update: {
          application_id?: string
          assignment_id?: string
          created_at?: string
          due_at?: string | null
          feedback?: string | null
          id?: string
          score?: number | null
          sent_at?: string
          submission_text?: string | null
          submission_url?: string | null
          submitted_at?: string | null
          token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_assignments_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_assignments_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      application_events: {
        Row: {
          actor_id: string | null
          application_id: string
          created_at: string
          event_type: string
          from_status: Database["public"]["Enums"]["application_status"] | null
          id: string
          payload: Json | null
          to_status: Database["public"]["Enums"]["application_status"] | null
        }
        Insert: {
          actor_id?: string | null
          application_id: string
          created_at?: string
          event_type: string
          from_status?: Database["public"]["Enums"]["application_status"] | null
          id?: string
          payload?: Json | null
          to_status?: Database["public"]["Enums"]["application_status"] | null
        }
        Update: {
          actor_id?: string | null
          application_id?: string
          created_at?: string
          event_type?: string
          from_status?: Database["public"]["Enums"]["application_status"] | null
          id?: string
          payload?: Json | null
          to_status?: Database["public"]["Enums"]["application_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "application_events_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      application_notes: {
        Row: {
          application_id: string
          author_id: string | null
          body: string
          created_at: string
          id: string
        }
        Insert: {
          application_id: string
          author_id?: string | null
          body: string
          created_at?: string
          id?: string
        }
        Update: {
          application_id?: string
          author_id?: string | null
          body?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_notes_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          allow_reapply: boolean
          applied_at: string
          candidate_id: string
          cover_letter: string | null
          created_at: string
          current_salary: string | null
          expected_salary: string | null
          experience_years: number | null
          id: string
          job_id: string
          notice_period: string | null
          rating: number | null
          rejection_reason: string | null
          screening_answers: Json
          source: string | null
          status: Database["public"]["Enums"]["application_status"]
          updated_at: string
          why_us: string | null
        }
        Insert: {
          allow_reapply?: boolean
          applied_at?: string
          candidate_id: string
          cover_letter?: string | null
          created_at?: string
          current_salary?: string | null
          expected_salary?: string | null
          experience_years?: number | null
          id?: string
          job_id: string
          notice_period?: string | null
          rating?: number | null
          rejection_reason?: string | null
          screening_answers?: Json
          source?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
          why_us?: string | null
        }
        Update: {
          allow_reapply?: boolean
          applied_at?: string
          candidate_id?: string
          cover_letter?: string | null
          created_at?: string
          current_salary?: string | null
          expected_salary?: string | null
          experience_years?: number | null
          id?: string
          job_id?: string
          notice_period?: string | null
          rating?: number | null
          rejection_reason?: string | null
          screening_answers?: Json
          source?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
          why_us?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "applications_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "job_postings"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_assignments: {
        Row: {
          asset_id: string
          assigned_at: string
          assigned_by: string | null
          company_id: string
          condition_on_return: string | null
          created_at: string
          employee_id: string
          id: string
          returned_at: string | null
        }
        Insert: {
          asset_id: string
          assigned_at?: string
          assigned_by?: string | null
          company_id: string
          condition_on_return?: string | null
          created_at?: string
          employee_id: string
          id?: string
          returned_at?: string | null
        }
        Update: {
          asset_id?: string
          assigned_at?: string
          assigned_by?: string | null
          company_id?: string
          condition_on_return?: string | null
          created_at?: string
          employee_id?: string
          id?: string
          returned_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "asset_assignments_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
      assets: {
        Row: {
          company_id: string
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["asset_kind"]
          name: string
          notes: string | null
          purchased_at: string | null
          serial_number: string | null
          status: Database["public"]["Enums"]["asset_status"]
          updated_at: string
          value: number | null
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["asset_kind"]
          name: string
          notes?: string | null
          purchased_at?: string | null
          serial_number?: string | null
          status?: Database["public"]["Enums"]["asset_status"]
          updated_at?: string
          value?: number | null
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["asset_kind"]
          name?: string
          notes?: string | null
          purchased_at?: string | null
          serial_number?: string | null
          status?: Database["public"]["Enums"]["asset_status"]
          updated_at?: string
          value?: number | null
        }
        Relationships: []
      }
      assignments: {
        Row: {
          attachment_url: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_in_days: number
          id: string
          is_active: boolean
          title: string
          updated_at: string
        }
        Insert: {
          attachment_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_in_days?: number
          id?: string
          is_active?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          attachment_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_in_days?: number
          id?: string
          is_active?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      attendance_correction_requests: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          company_id: string
          created_at: string
          employee_id: string
          id: string
          log_date: string
          reason: string | null
          requested_check_in_at: string | null
          requested_check_out_at: string | null
          status: Database["public"]["Enums"]["correction_status"]
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          company_id: string
          created_at?: string
          employee_id: string
          id?: string
          log_date: string
          reason?: string | null
          requested_check_in_at?: string | null
          requested_check_out_at?: string | null
          status?: Database["public"]["Enums"]["correction_status"]
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          company_id?: string
          created_at?: string
          employee_id?: string
          id?: string
          log_date?: string
          reason?: string | null
          requested_check_in_at?: string | null
          requested_check_out_at?: string | null
          status?: Database["public"]["Enums"]["correction_status"]
          updated_at?: string
        }
        Relationships: []
      }
      attendance_logs: {
        Row: {
          check_in_at: string | null
          check_out_at: string | null
          company_id: string
          created_at: string
          employee_id: string
          id: string
          is_early_leave: boolean
          is_late: boolean
          latitude: number | null
          location_id: string | null
          log_date: string
          longitude: number | null
          metadata: Json
          notes: string | null
          source: Database["public"]["Enums"]["attendance_source"]
          status: Database["public"]["Enums"]["attendance_status"]
          updated_at: string
          worked_minutes: number
        }
        Insert: {
          check_in_at?: string | null
          check_out_at?: string | null
          company_id: string
          created_at?: string
          employee_id: string
          id?: string
          is_early_leave?: boolean
          is_late?: boolean
          latitude?: number | null
          location_id?: string | null
          log_date?: string
          longitude?: number | null
          metadata?: Json
          notes?: string | null
          source?: Database["public"]["Enums"]["attendance_source"]
          status?: Database["public"]["Enums"]["attendance_status"]
          updated_at?: string
          worked_minutes?: number
        }
        Update: {
          check_in_at?: string | null
          check_out_at?: string | null
          company_id?: string
          created_at?: string
          employee_id?: string
          id?: string
          is_early_leave?: boolean
          is_late?: boolean
          latitude?: number | null
          location_id?: string | null
          log_date?: string
          longitude?: number | null
          metadata?: Json
          notes?: string | null
          source?: Database["public"]["Enums"]["attendance_source"]
          status?: Database["public"]["Enums"]["attendance_status"]
          updated_at?: string
          worked_minutes?: number
        }
        Relationships: [
          {
            foreignKeyName: "attendance_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_logs_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_logs_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "work_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_rules: {
        Row: {
          allowed_break_minutes: number
          allowed_ips: string[]
          auto_absent_no_checkin: boolean
          auto_checkout_after_shift: boolean
          company_id: string
          created_at: string
          cross_midnight_allowed: boolean
          deduction_logic: string
          early_exit_minutes: number
          excess_break_alert: boolean
          extra: Json
          geo_radius_meters: number
          grace_minutes: number
          half_day_after_minutes: number
          half_day_calc: string
          holiday_ot_multiplier: number
          id: string
          is_default: boolean
          late_after_minutes: number
          name: string
          night_shift_handling: string
          ot_after_minutes: number
          paid_hours_logic: string
          rotation_automation: boolean
          unpaid_break_after_minutes: number
          updated_at: string
          weekend_ot_multiplier: number
        }
        Insert: {
          allowed_break_minutes?: number
          allowed_ips?: string[]
          auto_absent_no_checkin?: boolean
          auto_checkout_after_shift?: boolean
          company_id: string
          created_at?: string
          cross_midnight_allowed?: boolean
          deduction_logic?: string
          early_exit_minutes?: number
          excess_break_alert?: boolean
          extra?: Json
          geo_radius_meters?: number
          grace_minutes?: number
          half_day_after_minutes?: number
          half_day_calc?: string
          holiday_ot_multiplier?: number
          id?: string
          is_default?: boolean
          late_after_minutes?: number
          name: string
          night_shift_handling?: string
          ot_after_minutes?: number
          paid_hours_logic?: string
          rotation_automation?: boolean
          unpaid_break_after_minutes?: number
          updated_at?: string
          weekend_ot_multiplier?: number
        }
        Update: {
          allowed_break_minutes?: number
          allowed_ips?: string[]
          auto_absent_no_checkin?: boolean
          auto_checkout_after_shift?: boolean
          company_id?: string
          created_at?: string
          cross_midnight_allowed?: boolean
          deduction_logic?: string
          early_exit_minutes?: number
          excess_break_alert?: boolean
          extra?: Json
          geo_radius_meters?: number
          grace_minutes?: number
          half_day_after_minutes?: number
          half_day_calc?: string
          holiday_ot_multiplier?: number
          id?: string
          is_default?: boolean
          late_after_minutes?: number
          name?: string
          night_shift_handling?: string
          ot_after_minutes?: number
          paid_hours_logic?: string
          rotation_automation?: boolean
          unpaid_break_after_minutes?: number
          updated_at?: string
          weekend_ot_multiplier?: number
        }
        Relationships: []
      }
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
      backup_snapshots: {
        Row: {
          completed_at: string | null
          download_url: string | null
          error: string | null
          id: string
          requested_at: string
          requested_by: string | null
          row_count: number | null
          size_bytes: number | null
          status: string
          table_count: number | null
        }
        Insert: {
          completed_at?: string | null
          download_url?: string | null
          error?: string | null
          id?: string
          requested_at?: string
          requested_by?: string | null
          row_count?: number | null
          size_bytes?: number | null
          status?: string
          table_count?: number | null
        }
        Update: {
          completed_at?: string | null
          download_url?: string | null
          error?: string | null
          id?: string
          requested_at?: string
          requested_by?: string | null
          row_count?: number | null
          size_bytes?: number | null
          status?: string
          table_count?: number | null
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author_id: string | null
          body: string | null
          category: string | null
          cover_url: string | null
          created_at: string
          excerpt: string | null
          id: string
          published_at: string | null
          seo_description: string | null
          seo_title: string | null
          slug: string
          status: Database["public"]["Enums"]["post_status"]
          tags: string[]
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          body?: string | null
          category?: string | null
          cover_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          published_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          status?: Database["public"]["Enums"]["post_status"]
          tags?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          body?: string | null
          category?: string | null
          cover_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          published_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["post_status"]
          tags?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      candidates: {
        Row: {
          auth_user_id: string | null
          city: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          in_talent_pool: boolean
          linkedin_url: string | null
          notes: string | null
          phone: string | null
          portfolio_url: string | null
          rating: number | null
          resume_url: string | null
          source: string | null
          updated_at: string
        }
        Insert: {
          auth_user_id?: string | null
          city?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          in_talent_pool?: boolean
          linkedin_url?: string | null
          notes?: string | null
          phone?: string | null
          portfolio_url?: string | null
          rating?: number | null
          resume_url?: string | null
          source?: string | null
          updated_at?: string
        }
        Update: {
          auth_user_id?: string | null
          city?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          in_talent_pool?: boolean
          linkedin_url?: string | null
          notes?: string | null
          phone?: string | null
          portfolio_url?: string | null
          rating?: number | null
          resume_url?: string | null
          source?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      cms_media: {
        Row: {
          alt_text: string | null
          created_at: string
          file_name: string
          id: string
          mime_type: string | null
          size_bytes: number
          uploaded_by: string | null
          url: string
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          file_name: string
          id?: string
          mime_type?: string | null
          size_bytes?: number
          uploaded_by?: string | null
          url: string
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          file_name?: string
          id?: string
          mime_type?: string | null
          size_bytes?: number
          uploaded_by?: string | null
          url?: string
        }
        Relationships: []
      }
      cms_pages: {
        Row: {
          body: string | null
          created_at: string
          id: string
          noindex: boolean
          published_at: string | null
          seo_description: string | null
          seo_title: string | null
          slug: string
          status: Database["public"]["Enums"]["post_status"]
          title: string
          updated_at: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          noindex?: boolean
          published_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          status?: Database["public"]["Enums"]["post_status"]
          title: string
          updated_at?: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          noindex?: boolean
          published_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["post_status"]
          title?: string
          updated_at?: string
        }
        Relationships: []
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
      company_holiday_settings: {
        Row: {
          auto_import_enabled: boolean
          company_id: string
          country_code: string | null
          last_synced_year: number | null
          updated_at: string
          weekend_days: number[]
        }
        Insert: {
          auto_import_enabled?: boolean
          company_id: string
          country_code?: string | null
          last_synced_year?: number | null
          updated_at?: string
          weekend_days?: number[]
        }
        Update: {
          auto_import_enabled?: boolean
          company_id?: string
          country_code?: string | null
          last_synced_year?: number | null
          updated_at?: string
          weekend_days?: number[]
        }
        Relationships: [
          {
            foreignKeyName: "company_holiday_settings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_holiday_settings_country_code_fkey"
            columns: ["country_code"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["code"]
          },
        ]
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
      countries: {
        Row: {
          code: string
          created_at: string
          default_timezone: string | null
          flag_emoji: string | null
          name: string
          weekend_days: number[]
        }
        Insert: {
          code: string
          created_at?: string
          default_timezone?: string | null
          flag_emoji?: string | null
          name: string
          weekend_days?: number[]
        }
        Update: {
          code?: string
          created_at?: string
          default_timezone?: string | null
          flag_emoji?: string | null
          name?: string
          weekend_days?: number[]
        }
        Relationships: []
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
      departments: {
        Row: {
          code: string | null
          company_id: string
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          code?: string | null
          company_id: string
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          code?: string | null
          company_id?: string
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "departments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      designations: {
        Row: {
          company_id: string
          created_at: string
          id: string
          level: number | null
          name: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          level?: number | null
          name: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          level?: number | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "designations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      employee_documents: {
        Row: {
          company_id: string
          created_at: string
          doc_type: Database["public"]["Enums"]["document_kind"]
          employee_id: string
          expires_at: string | null
          file_url: string | null
          id: string
          notes: string | null
          signed_at: string | null
          title: string
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          doc_type?: Database["public"]["Enums"]["document_kind"]
          employee_id: string
          expires_at?: string | null
          file_url?: string | null
          id?: string
          notes?: string | null
          signed_at?: string | null
          title: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          doc_type?: Database["public"]["Enums"]["document_kind"]
          employee_id?: string
          expires_at?: string | null
          file_url?: string | null
          id?: string
          notes?: string | null
          signed_at?: string | null
          title?: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: []
      }
      employee_floating_holidays: {
        Row: {
          created_at: string
          employee_id: string
          holiday_date: string
          id: string
          name: string
          status: Database["public"]["Enums"]["floating_holiday_status"]
          year: number | null
        }
        Insert: {
          created_at?: string
          employee_id: string
          holiday_date: string
          id?: string
          name: string
          status?: Database["public"]["Enums"]["floating_holiday_status"]
          year?: number | null
        }
        Update: {
          created_at?: string
          employee_id?: string
          holiday_date?: string
          id?: string
          name?: string
          status?: Database["public"]["Enums"]["floating_holiday_status"]
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_floating_holidays_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_holiday_assignments: {
        Row: {
          company_id: string
          country_code: string | null
          created_at: string
          department_id: string | null
          employee_id: string | null
          id: string
          location_id: string | null
          policy_id: string
          priority: number
          region: string | null
          scope_level: Database["public"]["Enums"]["holiday_scope_level"]
        }
        Insert: {
          company_id: string
          country_code?: string | null
          created_at?: string
          department_id?: string | null
          employee_id?: string | null
          id?: string
          location_id?: string | null
          policy_id: string
          priority?: number
          region?: string | null
          scope_level: Database["public"]["Enums"]["holiday_scope_level"]
        }
        Update: {
          company_id?: string
          country_code?: string | null
          created_at?: string
          department_id?: string | null
          employee_id?: string | null
          id?: string
          location_id?: string | null
          policy_id?: string
          priority?: number
          region?: string | null
          scope_level?: Database["public"]["Enums"]["holiday_scope_level"]
        }
        Relationships: [
          {
            foreignKeyName: "employee_holiday_assignments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_holiday_assignments_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_holiday_assignments_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_holiday_assignments_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "work_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_holiday_assignments_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "holiday_policies"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          city: string | null
          company_id: string
          country_code: string | null
          created_at: string
          default_location_id: string | null
          department_id: string | null
          designation_id: string | null
          email: string | null
          employee_code: string
          employment_type: Database["public"]["Enums"]["employment_type"]
          exit_date: string | null
          full_name: string
          hire_date: string | null
          holiday_policy_id: string | null
          id: string
          manager_id: string | null
          metadata: Json
          payroll_id: string | null
          phone: string | null
          region: string | null
          status: string
          timezone: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          city?: string | null
          company_id: string
          country_code?: string | null
          created_at?: string
          default_location_id?: string | null
          department_id?: string | null
          designation_id?: string | null
          email?: string | null
          employee_code: string
          employment_type?: Database["public"]["Enums"]["employment_type"]
          exit_date?: string | null
          full_name: string
          hire_date?: string | null
          holiday_policy_id?: string | null
          id?: string
          manager_id?: string | null
          metadata?: Json
          payroll_id?: string | null
          phone?: string | null
          region?: string | null
          status?: string
          timezone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          city?: string | null
          company_id?: string
          country_code?: string | null
          created_at?: string
          default_location_id?: string | null
          department_id?: string | null
          designation_id?: string | null
          email?: string | null
          employee_code?: string
          employment_type?: Database["public"]["Enums"]["employment_type"]
          exit_date?: string | null
          full_name?: string
          hire_date?: string | null
          holiday_policy_id?: string | null
          id?: string
          manager_id?: string | null
          metadata?: Json
          payroll_id?: string | null
          phone?: string | null
          region?: string | null
          status?: string
          timezone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_default_location_id_fkey"
            columns: ["default_location_id"]
            isOneToOne: false
            referencedRelation: "work_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_designation_id_fkey"
            columns: ["designation_id"]
            isOneToOne: false
            referencedRelation: "designations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_holiday_policy_fk"
            columns: ["holiday_policy_id"]
            isOneToOne: false
            referencedRelation: "holiday_policies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "employees"
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
      form_submissions: {
        Row: {
          created_at: string
          form_id: string | null
          id: string
          ip: string | null
          payload: Json
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          form_id?: string | null
          id?: string
          ip?: string | null
          payload?: Json
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          form_id?: string | null
          id?: string
          ip?: string | null
          payload?: Json
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "form_submissions_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "marketing_forms"
            referencedColumns: ["id"]
          },
        ]
      }
      holiday_overrides: {
        Row: {
          action: Database["public"]["Enums"]["holiday_override_action"]
          created_at: string
          employee_id: string
          holiday_date: string
          id: string
          name: string | null
          original_date: string | null
          reason: string | null
        }
        Insert: {
          action: Database["public"]["Enums"]["holiday_override_action"]
          created_at?: string
          employee_id: string
          holiday_date: string
          id?: string
          name?: string | null
          original_date?: string | null
          reason?: string | null
        }
        Update: {
          action?: Database["public"]["Enums"]["holiday_override_action"]
          created_at?: string
          employee_id?: string
          holiday_date?: string
          id?: string
          name?: string | null
          original_date?: string | null
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "holiday_overrides_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      holiday_policies: {
        Row: {
          company_id: string
          country_code: string | null
          created_at: string
          description: string | null
          floating_quota: number
          id: string
          is_default: boolean
          name: string
          office_location_id: string | null
          region: string | null
          updated_at: string
          weekend_days: number[]
        }
        Insert: {
          company_id: string
          country_code?: string | null
          created_at?: string
          description?: string | null
          floating_quota?: number
          id?: string
          is_default?: boolean
          name: string
          office_location_id?: string | null
          region?: string | null
          updated_at?: string
          weekend_days?: number[]
        }
        Update: {
          company_id?: string
          country_code?: string | null
          created_at?: string
          description?: string | null
          floating_quota?: number
          id?: string
          is_default?: boolean
          name?: string
          office_location_id?: string | null
          region?: string | null
          updated_at?: string
          weekend_days?: number[]
        }
        Relationships: [
          {
            foreignKeyName: "holiday_policies_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "holiday_policies_office_location_id_fkey"
            columns: ["office_location_id"]
            isOneToOne: false
            referencedRelation: "work_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      holiday_policy_holidays: {
        Row: {
          created_at: string
          holiday_date: string
          id: string
          is_optional: boolean
          is_paid: boolean
          is_recurring: boolean
          name: string
          policy_id: string
          region: string | null
          source_template_id: string | null
          type: Database["public"]["Enums"]["holiday_type"]
          year: number | null
        }
        Insert: {
          created_at?: string
          holiday_date: string
          id?: string
          is_optional?: boolean
          is_paid?: boolean
          is_recurring?: boolean
          name: string
          policy_id: string
          region?: string | null
          source_template_id?: string | null
          type?: Database["public"]["Enums"]["holiday_type"]
          year?: number | null
        }
        Update: {
          created_at?: string
          holiday_date?: string
          id?: string
          is_optional?: boolean
          is_paid?: boolean
          is_recurring?: boolean
          name?: string
          policy_id?: string
          region?: string | null
          source_template_id?: string | null
          type?: Database["public"]["Enums"]["holiday_type"]
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "holiday_policy_holidays_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "holiday_policies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "holiday_policy_holidays_source_template_id_fkey"
            columns: ["source_template_id"]
            isOneToOne: false
            referencedRelation: "holiday_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      holiday_templates: {
        Row: {
          country_code: string
          created_at: string
          holiday_date: string
          id: string
          is_recurring: boolean
          name: string
          region: string | null
          source: string | null
          type: Database["public"]["Enums"]["holiday_type"]
          year: number
        }
        Insert: {
          country_code: string
          created_at?: string
          holiday_date: string
          id?: string
          is_recurring?: boolean
          name: string
          region?: string | null
          source?: string | null
          type?: Database["public"]["Enums"]["holiday_type"]
          year: number
        }
        Update: {
          country_code?: string
          created_at?: string
          holiday_date?: string
          id?: string
          is_recurring?: boolean
          name?: string
          region?: string | null
          source?: string | null
          type?: Database["public"]["Enums"]["holiday_type"]
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "holiday_templates_country_code_fkey"
            columns: ["country_code"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["code"]
          },
        ]
      }
      holidays: {
        Row: {
          company_id: string
          country_code: string | null
          created_at: string
          description: string | null
          holiday_date: string
          id: string
          is_optional: boolean
          is_paid: boolean
          is_recurring: boolean
          name: string
          office_location_id: string | null
          region: string | null
          scope_level: Database["public"]["Enums"]["holiday_scope_level"]
          template_id: string | null
          type: Database["public"]["Enums"]["holiday_type"]
          updated_at: string
          year: number | null
        }
        Insert: {
          company_id: string
          country_code?: string | null
          created_at?: string
          description?: string | null
          holiday_date: string
          id?: string
          is_optional?: boolean
          is_paid?: boolean
          is_recurring?: boolean
          name: string
          office_location_id?: string | null
          region?: string | null
          scope_level?: Database["public"]["Enums"]["holiday_scope_level"]
          template_id?: string | null
          type?: Database["public"]["Enums"]["holiday_type"]
          updated_at?: string
          year?: number | null
        }
        Update: {
          company_id?: string
          country_code?: string | null
          created_at?: string
          description?: string | null
          holiday_date?: string
          id?: string
          is_optional?: boolean
          is_paid?: boolean
          is_recurring?: boolean
          name?: string
          office_location_id?: string | null
          region?: string | null
          scope_level?: Database["public"]["Enums"]["holiday_scope_level"]
          template_id?: string | null
          type?: Database["public"]["Enums"]["holiday_type"]
          updated_at?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "holidays_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "holidays_country_code_fkey"
            columns: ["country_code"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "holidays_office_location_id_fkey"
            columns: ["office_location_id"]
            isOneToOne: false
            referencedRelation: "work_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "holidays_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "holiday_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      integrations: {
        Row: {
          config: Json
          created_at: string
          id: string
          is_enabled: boolean
          kind: Database["public"]["Enums"]["integration_kind"]
          label: string | null
          last_synced_at: string | null
          provider: string
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          id?: string
          is_enabled?: boolean
          kind: Database["public"]["Enums"]["integration_kind"]
          label?: string | null
          last_synced_at?: string | null
          provider: string
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          id?: string
          is_enabled?: boolean
          kind?: Database["public"]["Enums"]["integration_kind"]
          label?: string | null
          last_synced_at?: string | null
          provider?: string
          updated_at?: string
        }
        Relationships: []
      }
      interviews: {
        Row: {
          application_id: string
          created_at: string
          created_by: string | null
          duration_min: number
          id: string
          link: string | null
          mode: Database["public"]["Enums"]["interview_mode"]
          notes: string | null
          outcome: Database["public"]["Enums"]["interview_outcome"]
          panel: Json
          round_label: string | null
          scheduled_at: string
          updated_at: string
        }
        Insert: {
          application_id: string
          created_at?: string
          created_by?: string | null
          duration_min?: number
          id?: string
          link?: string | null
          mode?: Database["public"]["Enums"]["interview_mode"]
          notes?: string | null
          outcome?: Database["public"]["Enums"]["interview_outcome"]
          panel?: Json
          round_label?: string | null
          scheduled_at: string
          updated_at?: string
        }
        Update: {
          application_id?: string
          created_at?: string
          created_by?: string | null
          duration_min?: number
          id?: string
          link?: string | null
          mode?: Database["public"]["Enums"]["interview_mode"]
          notes?: string | null
          outcome?: Database["public"]["Enums"]["interview_outcome"]
          panel?: Json
          round_label?: string | null
          scheduled_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "interviews_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
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
      job_postings: {
        Row: {
          apply_url: string | null
          created_at: string
          created_by: string | null
          department: string | null
          department_id: string | null
          description: string | null
          employment_type: Database["public"]["Enums"]["job_employment_type"]
          experience_level: Database["public"]["Enums"]["experience_level"]
          id: string
          location: string | null
          order_index: number
          published_at: string | null
          salary_currency: string | null
          salary_max: number | null
          salary_min: number | null
          screening_questions: Json
          short_description: string | null
          skills: string[]
          slug: string
          status: Database["public"]["Enums"]["job_posting_status"]
          summary: string | null
          title: string
          updated_at: string
          view_count: number
          work_type: Database["public"]["Enums"]["work_type"]
        }
        Insert: {
          apply_url?: string | null
          created_at?: string
          created_by?: string | null
          department?: string | null
          department_id?: string | null
          description?: string | null
          employment_type?: Database["public"]["Enums"]["job_employment_type"]
          experience_level?: Database["public"]["Enums"]["experience_level"]
          id?: string
          location?: string | null
          order_index?: number
          published_at?: string | null
          salary_currency?: string | null
          salary_max?: number | null
          salary_min?: number | null
          screening_questions?: Json
          short_description?: string | null
          skills?: string[]
          slug: string
          status?: Database["public"]["Enums"]["job_posting_status"]
          summary?: string | null
          title: string
          updated_at?: string
          view_count?: number
          work_type?: Database["public"]["Enums"]["work_type"]
        }
        Update: {
          apply_url?: string | null
          created_at?: string
          created_by?: string | null
          department?: string | null
          department_id?: string | null
          description?: string | null
          employment_type?: Database["public"]["Enums"]["job_employment_type"]
          experience_level?: Database["public"]["Enums"]["experience_level"]
          id?: string
          location?: string | null
          order_index?: number
          published_at?: string | null
          salary_currency?: string | null
          salary_max?: number | null
          salary_min?: number | null
          screening_questions?: Json
          short_description?: string | null
          skills?: string[]
          slug?: string
          status?: Database["public"]["Enums"]["job_posting_status"]
          summary?: string | null
          title?: string
          updated_at?: string
          view_count?: number
          work_type?: Database["public"]["Enums"]["work_type"]
        }
        Relationships: [
          {
            foreignKeyName: "job_postings_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      kb_article_feedback: {
        Row: {
          article_id: string | null
          comment: string | null
          created_at: string
          helpful: boolean
          id: string
          ip_hash: string | null
          slug: string
          user_agent: string | null
        }
        Insert: {
          article_id?: string | null
          comment?: string | null
          created_at?: string
          helpful: boolean
          id?: string
          ip_hash?: string | null
          slug: string
          user_agent?: string | null
        }
        Update: {
          article_id?: string | null
          comment?: string | null
          created_at?: string
          helpful?: boolean
          id?: string
          ip_hash?: string | null
          slug?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kb_article_feedback_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "kb_articles"
            referencedColumns: ["id"]
          },
        ]
      }
      kb_article_tags: {
        Row: {
          article_id: string
          tag: string
        }
        Insert: {
          article_id: string
          tag: string
        }
        Update: {
          article_id?: string
          tag?: string
        }
        Relationships: [
          {
            foreignKeyName: "kb_article_tags_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "kb_articles"
            referencedColumns: ["id"]
          },
        ]
      }
      kb_articles: {
        Row: {
          author_id: string | null
          body: string | null
          category: string | null
          category_id: string | null
          created_at: string
          excerpt: string | null
          helpful_count: number
          id: string
          position: number
          published_at: string | null
          seo_description: string | null
          seo_title: string | null
          slug: string
          status: Database["public"]["Enums"]["post_status"]
          title: string
          unhelpful_count: number
          updated_at: string
          view_count: number
        }
        Insert: {
          author_id?: string | null
          body?: string | null
          category?: string | null
          category_id?: string | null
          created_at?: string
          excerpt?: string | null
          helpful_count?: number
          id?: string
          position?: number
          published_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          status?: Database["public"]["Enums"]["post_status"]
          title: string
          unhelpful_count?: number
          updated_at?: string
          view_count?: number
        }
        Update: {
          author_id?: string | null
          body?: string | null
          category?: string | null
          category_id?: string | null
          created_at?: string
          excerpt?: string | null
          helpful_count?: number
          id?: string
          position?: number
          published_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["post_status"]
          title?: string
          unhelpful_count?: number
          updated_at?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "kb_articles_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "kb_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      kb_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          position: number
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          position?: number
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          position?: number
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      kb_search_logs: {
        Row: {
          clicked_slug: string | null
          created_at: string
          id: string
          query: string
          results_count: number
          user_id: string | null
        }
        Insert: {
          clicked_slug?: string | null
          created_at?: string
          id?: string
          query: string
          results_count?: number
          user_id?: string | null
        }
        Update: {
          clicked_slug?: string | null
          created_at?: string
          id?: string
          query?: string
          results_count?: number
          user_id?: string | null
        }
        Relationships: []
      }
      leads: {
        Row: {
          assigned_to: string | null
          company: string | null
          company_id: string | null
          created_at: string
          creative_type: string | null
          device: string | null
          email: string
          fbclid: string | null
          gclid: string | null
          id: string
          landing_url: string | null
          message: string | null
          metadata: Json | null
          name: string
          notes: string | null
          phone: string | null
          placement: string | null
          plan_interest: string | null
          referrer: string | null
          session_id: string | null
          source: string | null
          status: Database["public"]["Enums"]["lead_status"]
          updated_at: string
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          visitor_id: string | null
        }
        Insert: {
          assigned_to?: string | null
          company?: string | null
          company_id?: string | null
          created_at?: string
          creative_type?: string | null
          device?: string | null
          email: string
          fbclid?: string | null
          gclid?: string | null
          id?: string
          landing_url?: string | null
          message?: string | null
          metadata?: Json | null
          name: string
          notes?: string | null
          phone?: string | null
          placement?: string | null
          plan_interest?: string | null
          referrer?: string | null
          session_id?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          visitor_id?: string | null
        }
        Update: {
          assigned_to?: string | null
          company?: string | null
          company_id?: string | null
          created_at?: string
          creative_type?: string | null
          device?: string | null
          email?: string
          fbclid?: string | null
          gclid?: string | null
          id?: string
          landing_url?: string | null
          message?: string | null
          metadata?: Json | null
          name?: string
          notes?: string | null
          phone?: string | null
          placement?: string | null
          plan_interest?: string | null
          referrer?: string | null
          session_id?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          visitor_id?: string | null
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
      leave_balances: {
        Row: {
          allotted: number
          company_id: string
          created_at: string
          employee_id: string
          id: string
          leave_type_id: string
          updated_at: string
          used: number
          year: number
        }
        Insert: {
          allotted?: number
          company_id: string
          created_at?: string
          employee_id: string
          id?: string
          leave_type_id: string
          updated_at?: string
          used?: number
          year: number
        }
        Update: {
          allotted?: number
          company_id?: string
          created_at?: string
          employee_id?: string
          id?: string
          leave_type_id?: string
          updated_at?: string
          used?: number
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "leave_balances_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_balances_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_balances_leave_type_id_fkey"
            columns: ["leave_type_id"]
            isOneToOne: false
            referencedRelation: "leave_types"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_requests: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          company_id: string
          created_at: string
          days: number
          employee_id: string
          end_date: string
          id: string
          leave_type_id: string | null
          reason: string | null
          start_date: string
          status: Database["public"]["Enums"]["leave_request_status"]
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          company_id: string
          created_at?: string
          days?: number
          employee_id: string
          end_date: string
          id?: string
          leave_type_id?: string | null
          reason?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["leave_request_status"]
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          company_id?: string
          created_at?: string
          days?: number
          employee_id?: string
          end_date?: string
          id?: string
          leave_type_id?: string | null
          reason?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["leave_request_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leave_requests_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_requests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_requests_leave_type_id_fkey"
            columns: ["leave_type_id"]
            isOneToOne: false
            referencedRelation: "leave_types"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_types: {
        Row: {
          annual_quota: number
          code: string
          color: string | null
          company_id: string
          created_at: string
          id: string
          is_paid: boolean
          name: string
          updated_at: string
        }
        Insert: {
          annual_quota?: number
          code: string
          color?: string | null
          company_id: string
          created_at?: string
          id?: string
          is_paid?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          annual_quota?: number
          code?: string
          color?: string | null
          company_id?: string
          created_at?: string
          id?: string
          is_paid?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leave_types_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_forms: {
        Row: {
          created_at: string
          description: string | null
          fields: Json
          id: string
          is_active: boolean
          name: string
          slug: string
          submission_count: number
          target_email: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          fields?: Json
          id?: string
          is_active?: boolean
          name: string
          slug: string
          submission_count?: number
          target_email?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          fields?: Json
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          submission_count?: number
          target_email?: string | null
          updated_at?: string
        }
        Relationships: []
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
      overtime_requests: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          company_id: string
          created_at: string
          employee_id: string
          hours: number
          id: string
          reason: string | null
          request_date: string
          status: Database["public"]["Enums"]["overtime_status"]
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          company_id: string
          created_at?: string
          employee_id: string
          hours?: number
          id?: string
          reason?: string | null
          request_date: string
          status?: Database["public"]["Enums"]["overtime_status"]
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          company_id?: string
          created_at?: string
          employee_id?: string
          hours?: number
          id?: string
          reason?: string | null
          request_date?: string
          status?: Database["public"]["Enums"]["overtime_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "overtime_requests_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "overtime_requests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
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
      permissions: {
        Row: {
          action: string
          created_at: string
          description: string | null
          id: string
          key: string
          label: string
          module: string
          sort_order: number
        }
        Insert: {
          action: string
          created_at?: string
          description?: string | null
          id?: string
          key: string
          label: string
          module: string
          sort_order?: number
        }
        Update: {
          action?: string
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          label?: string
          module?: string
          sort_order?: number
        }
        Relationships: []
      }
      plans: {
        Row: {
          billing_model: string
          code: string
          comparison: Json
          created_at: string
          cta_label: string | null
          currency: string
          description: string | null
          employee_limit: number | null
          features: Json
          id: string
          included_seats: number
          is_active: boolean
          is_public: boolean
          min_seats: number
          name: string
          popular: boolean
          price_monthly: number
          price_per_user_monthly: number
          price_per_user_yearly: number
          price_yearly: number
          sort_order: number
          tagline: string | null
          tier: Database["public"]["Enums"]["plan_tier"]
          trial_days: number
          updated_at: string
        }
        Insert: {
          billing_model?: string
          code: string
          comparison?: Json
          created_at?: string
          cta_label?: string | null
          currency?: string
          description?: string | null
          employee_limit?: number | null
          features?: Json
          id?: string
          included_seats?: number
          is_active?: boolean
          is_public?: boolean
          min_seats?: number
          name: string
          popular?: boolean
          price_monthly?: number
          price_per_user_monthly?: number
          price_per_user_yearly?: number
          price_yearly?: number
          sort_order?: number
          tagline?: string | null
          tier?: Database["public"]["Enums"]["plan_tier"]
          trial_days?: number
          updated_at?: string
        }
        Update: {
          billing_model?: string
          code?: string
          comparison?: Json
          created_at?: string
          cta_label?: string | null
          currency?: string
          description?: string | null
          employee_limit?: number | null
          features?: Json
          id?: string
          included_seats?: number
          is_active?: boolean
          is_public?: boolean
          min_seats?: number
          name?: string
          popular?: boolean
          price_monthly?: number
          price_per_user_monthly?: number
          price_per_user_yearly?: number
          price_yearly?: number
          sort_order?: number
          tagline?: string | null
          tier?: Database["public"]["Enums"]["plan_tier"]
          trial_days?: number
          updated_at?: string
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          accent_color: string | null
          brand_name: string
          created_at: string
          date_format: string
          default_currency: string
          default_plan_code: string | null
          default_timezone: string
          email: Json
          id: string
          logo_url: string | null
          number_format: string
          primary_color: string | null
          product_name: string
          role_labels: Json
          secondary_color: string | null
          security: Json
          singleton: boolean
          support_email: string
          time_format: string
          updated_at: string
          updated_by: string | null
          week_start: number
        }
        Insert: {
          accent_color?: string | null
          brand_name?: string
          created_at?: string
          date_format?: string
          default_currency?: string
          default_plan_code?: string | null
          default_timezone?: string
          email?: Json
          id?: string
          logo_url?: string | null
          number_format?: string
          primary_color?: string | null
          product_name?: string
          role_labels?: Json
          secondary_color?: string | null
          security?: Json
          singleton?: boolean
          support_email?: string
          time_format?: string
          updated_at?: string
          updated_by?: string | null
          week_start?: number
        }
        Update: {
          accent_color?: string | null
          brand_name?: string
          created_at?: string
          date_format?: string
          default_currency?: string
          default_plan_code?: string | null
          default_timezone?: string
          email?: Json
          id?: string
          logo_url?: string | null
          number_format?: string
          primary_color?: string | null
          product_name?: string
          role_labels?: Json
          secondary_color?: string | null
          security?: Json
          singleton?: boolean
          support_email?: string
          time_format?: string
          updated_at?: string
          updated_by?: string | null
          week_start?: number
        }
        Relationships: []
      }
      pricing_events: {
        Row: {
          created_at: string
          currency: string | null
          cycle: string | null
          event_type: string
          id: string
          metadata: Json
          plan_code: string | null
          referrer: string | null
          session_id: string | null
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          currency?: string | null
          cycle?: string | null
          event_type: string
          id?: string
          metadata?: Json
          plan_code?: string | null
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          currency?: string | null
          cycle?: string | null
          event_type?: string
          id?: string
          metadata?: Json
          plan_code?: string | null
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      productivity_logs: {
        Row: {
          company_id: string
          created_at: string
          employee_id: string
          id: string
          idle_minutes: number
          log_date: string
          metadata: Json
          productive_minutes: number
          source: string
          tasks_completed: number
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          employee_id: string
          id?: string
          idle_minutes?: number
          log_date: string
          metadata?: Json
          productive_minutes?: number
          source?: string
          tasks_completed?: number
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          employee_id?: string
          id?: string
          idle_minutes?: number
          log_date?: string
          metadata?: Json
          productive_minutes?: number
          source?: string
          tasks_completed?: number
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
      remote_work_requests: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          company_id: string
          created_at: string
          employee_id: string
          end_date: string | null
          id: string
          reason: string | null
          request_date: string
          status: Database["public"]["Enums"]["remote_status"]
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          company_id: string
          created_at?: string
          employee_id: string
          end_date?: string | null
          id?: string
          reason?: string | null
          request_date: string
          status?: Database["public"]["Enums"]["remote_status"]
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          company_id?: string
          created_at?: string
          employee_id?: string
          end_date?: string | null
          id?: string
          reason?: string | null
          request_date?: string
          status?: Database["public"]["Enums"]["remote_status"]
          updated_at?: string
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          granted_at: string
          granted_by: string | null
          id: string
          permission_key: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          granted_at?: string
          granted_by?: string | null
          id?: string
          permission_key: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          granted_at?: string
          granted_by?: string | null
          id?: string
          permission_key?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_key_fkey"
            columns: ["permission_key"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["key"]
          },
        ]
      }
      schedule_entries: {
        Row: {
          company_id: string
          created_at: string
          employee_id: string
          id: string
          is_off: boolean
          location_id: string | null
          notes: string | null
          schedule_id: string
          shift_id: string | null
          updated_at: string
          work_date: string
        }
        Insert: {
          company_id: string
          created_at?: string
          employee_id: string
          id?: string
          is_off?: boolean
          location_id?: string | null
          notes?: string | null
          schedule_id: string
          shift_id?: string | null
          updated_at?: string
          work_date: string
        }
        Update: {
          company_id?: string
          created_at?: string
          employee_id?: string
          id?: string
          is_off?: boolean
          location_id?: string | null
          notes?: string | null
          schedule_id?: string
          shift_id?: string | null
          updated_at?: string
          work_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_entries_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      schedules: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          end_date: string
          id: string
          name: string
          published_at: string | null
          start_date: string
          status: Database["public"]["Enums"]["schedule_status"]
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          end_date: string
          id?: string
          name: string
          published_at?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["schedule_status"]
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          end_date?: string
          id?: string
          name?: string
          published_at?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["schedule_status"]
          updated_at?: string
        }
        Relationships: []
      }
      seo_settings: {
        Row: {
          default_description: string | null
          default_og_image: string | null
          id: string
          redirects: Json
          robots_txt: string | null
          scope: string
          sitemap_enabled: boolean
          title_template: string
          updated_at: string
        }
        Insert: {
          default_description?: string | null
          default_og_image?: string | null
          id?: string
          redirects?: Json
          robots_txt?: string | null
          scope?: string
          sitemap_enabled?: boolean
          title_template?: string
          updated_at?: string
        }
        Update: {
          default_description?: string | null
          default_og_image?: string | null
          id?: string
          redirects?: Json
          robots_txt?: string | null
          scope?: string
          sitemap_enabled?: boolean
          title_template?: string
          updated_at?: string
        }
        Relationships: []
      }
      shift_assignments: {
        Row: {
          company_id: string
          created_at: string
          employee_id: string
          ends_on: string | null
          id: string
          shift_id: string
          starts_on: string
        }
        Insert: {
          company_id: string
          created_at?: string
          employee_id: string
          ends_on?: string | null
          id?: string
          shift_id: string
          starts_on: string
        }
        Update: {
          company_id?: string
          created_at?: string
          employee_id?: string
          ends_on?: string | null
          id?: string
          shift_id?: string
          starts_on?: string
        }
        Relationships: [
          {
            foreignKeyName: "shift_assignments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_assignments_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_assignments_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "shifts"
            referencedColumns: ["id"]
          },
        ]
      }
      shift_swap_requests: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          company_id: string
          created_at: string
          id: string
          reason: string | null
          requester_employee_id: string
          schedule_entry_id: string | null
          status: Database["public"]["Enums"]["swap_status"]
          target_employee_id: string | null
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          company_id: string
          created_at?: string
          id?: string
          reason?: string | null
          requester_employee_id: string
          schedule_entry_id?: string | null
          status?: Database["public"]["Enums"]["swap_status"]
          target_employee_id?: string | null
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          company_id?: string
          created_at?: string
          id?: string
          reason?: string | null
          requester_employee_id?: string
          schedule_entry_id?: string | null
          status?: Database["public"]["Enums"]["swap_status"]
          target_employee_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shift_swap_requests_schedule_entry_id_fkey"
            columns: ["schedule_entry_id"]
            isOneToOne: false
            referencedRelation: "schedule_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      shifts: {
        Row: {
          break_minutes: number
          color: string | null
          company_id: string
          created_at: string
          end_time: string
          id: string
          is_night_shift: boolean
          name: string
          start_time: string
          updated_at: string
          weekly_off: number[]
        }
        Insert: {
          break_minutes?: number
          color?: string | null
          company_id: string
          created_at?: string
          end_time: string
          id?: string
          is_night_shift?: boolean
          name: string
          start_time: string
          updated_at?: string
          weekly_off?: number[]
        }
        Update: {
          break_minutes?: number
          color?: string | null
          company_id?: string
          created_at?: string
          end_time?: string
          id?: string
          is_night_shift?: boolean
          name?: string
          start_time?: string
          updated_at?: string
          weekly_off?: number[]
        }
        Relationships: [
          {
            foreignKeyName: "shifts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      sla_policies: {
        Row: {
          created_at: string
          first_response_minutes: number
          id: string
          is_active: boolean
          name: string
          priority: Database["public"]["Enums"]["ticket_priority"]
          resolution_minutes: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          first_response_minutes?: number
          id?: string
          is_active?: boolean
          name: string
          priority: Database["public"]["Enums"]["ticket_priority"]
          resolution_minutes?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          first_response_minutes?: number
          id?: string
          is_active?: boolean
          name?: string
          priority?: Database["public"]["Enums"]["ticket_priority"]
          resolution_minutes?: number
          updated_at?: string
        }
        Relationships: []
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
      support_macros: {
        Row: {
          body: string
          created_at: string
          created_by: string | null
          id: string
          name: string
          tags: string[]
          updated_at: string
        }
        Insert: {
          body: string
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          tags?: string[]
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          tags?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      support_sla_policies: {
        Row: {
          business_hours: Json
          created_at: string
          first_response_minutes: number
          id: string
          is_active: boolean
          is_default: boolean
          name: string
          priority: Database["public"]["Enums"]["ticket_priority"]
          resolution_minutes: number
          updated_at: string
        }
        Insert: {
          business_hours?: Json
          created_at?: string
          first_response_minutes?: number
          id?: string
          is_active?: boolean
          is_default?: boolean
          name: string
          priority: Database["public"]["Enums"]["ticket_priority"]
          resolution_minutes?: number
          updated_at?: string
        }
        Update: {
          business_hours?: Json
          created_at?: string
          first_response_minutes?: number
          id?: string
          is_active?: boolean
          is_default?: boolean
          name?: string
          priority?: Database["public"]["Enums"]["ticket_priority"]
          resolution_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      support_ticket_messages: {
        Row: {
          attachments: Json
          author_email: string | null
          author_id: string | null
          author_name: string | null
          body: string
          created_at: string
          id: string
          is_internal: boolean
          ticket_id: string
        }
        Insert: {
          attachments?: Json
          author_email?: string | null
          author_id?: string | null
          author_name?: string | null
          body: string
          created_at?: string
          id?: string
          is_internal?: boolean
          ticket_id: string
        }
        Update: {
          attachments?: Json
          author_email?: string | null
          author_id?: string | null
          author_name?: string | null
          body?: string
          created_at?: string
          id?: string
          is_internal?: boolean
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          body: string | null
          channel: Database["public"]["Enums"]["ticket_channel"]
          closed_at: string | null
          company_id: string | null
          created_at: string
          first_response_at: string | null
          id: string
          metadata: Json
          priority: Database["public"]["Enums"]["ticket_priority"]
          requester_email: string
          requester_name: string | null
          requester_user_id: string | null
          resolved_at: string | null
          sla_due_at: string | null
          status: Database["public"]["Enums"]["ticket_status"]
          subject: string
          tags: string[]
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          body?: string | null
          channel?: Database["public"]["Enums"]["ticket_channel"]
          closed_at?: string | null
          company_id?: string | null
          created_at?: string
          first_response_at?: string | null
          id?: string
          metadata?: Json
          priority?: Database["public"]["Enums"]["ticket_priority"]
          requester_email: string
          requester_name?: string | null
          requester_user_id?: string | null
          resolved_at?: string | null
          sla_due_at?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          subject: string
          tags?: string[]
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          body?: string | null
          channel?: Database["public"]["Enums"]["ticket_channel"]
          closed_at?: string | null
          company_id?: string | null
          created_at?: string
          first_response_at?: string | null
          id?: string
          metadata?: Json
          priority?: Database["public"]["Enums"]["ticket_priority"]
          requester_email?: string
          requester_name?: string | null
          requester_user_id?: string | null
          resolved_at?: string | null
          sla_due_at?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          subject?: string
          tags?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
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
      team_members: {
        Row: {
          added_at: string
          added_by: string | null
          id: string
          is_lead: boolean
          team_id: string
          user_id: string
        }
        Insert: {
          added_at?: string
          added_by?: string | null
          id?: string
          is_lead?: boolean
          team_id: string
          user_id: string
        }
        Update: {
          added_at?: string
          added_by?: string | null
          id?: string
          is_lead?: boolean
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          color: string | null
          company_id: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          lead_user_id: string | null
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          lead_user_id?: string | null
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          lead_user_id?: string | null
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      ticket_messages: {
        Row: {
          author_id: string | null
          author_name: string | null
          body: string
          created_at: string
          id: string
          is_internal: boolean
          ticket_id: string
        }
        Insert: {
          author_id?: string | null
          author_name?: string | null
          body: string
          created_at?: string
          id?: string
          is_internal?: boolean
          ticket_id: string
        }
        Update: {
          author_id?: string | null
          author_name?: string | null
          body?: string
          created_at?: string
          id?: string
          is_internal?: boolean
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      timesheets: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          billable_hours: number
          company_id: string
          created_at: string
          employee_id: string
          id: string
          notes: string | null
          period_end: string
          period_start: string
          status: Database["public"]["Enums"]["timesheet_status"]
          submitted_at: string | null
          total_hours: number
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          billable_hours?: number
          company_id: string
          created_at?: string
          employee_id: string
          id?: string
          notes?: string | null
          period_end: string
          period_start: string
          status?: Database["public"]["Enums"]["timesheet_status"]
          submitted_at?: string | null
          total_hours?: number
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          billable_hours?: number
          company_id?: string
          created_at?: string
          employee_id?: string
          id?: string
          notes?: string | null
          period_end?: string
          period_start?: string
          status?: Database["public"]["Enums"]["timesheet_status"]
          submitted_at?: string | null
          total_hours?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "timesheets_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timesheets_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
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
          company_id: string | null
          granted_at: string
          granted_by: string | null
          id: string
          permissions: Json
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          company_id?: string | null
          granted_at?: string
          granted_by?: string | null
          id?: string
          permissions?: Json
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          company_id?: string | null
          granted_at?: string
          granted_by?: string | null
          id?: string
          permissions?: Json
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_endpoints: {
        Row: {
          created_at: string
          events: string[]
          id: string
          is_active: boolean
          label: string
          last_called_at: string | null
          last_status: number | null
          secret: string | null
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          events?: string[]
          id?: string
          is_active?: boolean
          label: string
          last_called_at?: string | null
          last_status?: number | null
          secret?: string | null
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          events?: string[]
          id?: string
          is_active?: boolean
          label?: string
          last_called_at?: string | null
          last_status?: number | null
          secret?: string | null
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      work_locations: {
        Row: {
          address: string | null
          company_id: string
          created_at: string
          id: string
          is_active: boolean
          latitude: number | null
          longitude: number | null
          name: string
          radius_meters: number | null
          timezone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          company_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          latitude?: number | null
          longitude?: number | null
          name: string
          radius_meters?: number | null
          timezone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          company_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          latitude?: number | null
          longitude?: number | null
          name?: string
          radius_meters?: number | null
          timezone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_locations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      analytics_settings_public: {
        Row: {
          clarity_id: string | null
          cookie_consent_required: boolean | null
          ga4_id: string | null
          gtm_id: string | null
          meta_pixel_id: string | null
        }
        Insert: {
          clarity_id?: string | null
          cookie_consent_required?: boolean | null
          ga4_id?: string | null
          gtm_id?: string | null
          meta_pixel_id?: string | null
        }
        Update: {
          clarity_id?: string | null
          cookie_consent_required?: boolean | null
          ga4_id?: string | null
          gtm_id?: string | null
          meta_pixel_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      current_company_id: { Args: never; Returns: string }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      get_employee_holidays: {
        Args: { _employee_id: string; _year: number }
        Returns: {
          holiday_date: string
          is_optional: boolean
          is_paid: boolean
          name: string
          scope_level: Database["public"]["Enums"]["holiday_scope_level"]
          source: string
          type: Database["public"]["Enums"]["holiday_type"]
        }[]
      }
      has_permission: {
        Args: { _key: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_application_owner: {
        Args: { _application_id: string }
        Returns: boolean
      }
      is_attendance_admin: { Args: { _user_id: string }; Returns: boolean }
      is_candidate_owner: { Args: { _candidate_id: string }; Returns: boolean }
      is_member_of: { Args: { _company_id: string }; Returns: boolean }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
      is_team_lead: {
        Args: { _team_id: string; _user_id: string }
        Returns: boolean
      }
      kb_record_view: { Args: { _slug: string }; Returns: undefined }
      kb_record_vote: {
        Args: { _helpful: boolean; _slug: string }
        Returns: undefined
      }
      kb_search_articles: {
        Args: { _limit?: number; _q: string }
        Returns: {
          category: string
          excerpt: string
          id: string
          rank: number
          slug: string
          title: string
          view_count: number
        }[]
      }
      log_audit: {
        Args: {
          _action: string
          _company_id?: string
          _diff?: Json
          _entity_id?: string
          _entity_type?: string
        }
        Returns: string
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      needs_bootstrap: { Args: never; Returns: boolean }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      team_company_id: { Args: { _team_id: string }; Returns: string }
    }
    Enums: {
      announcement_audience: "all" | "department" | "team" | "role"
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
      application_status:
        | "new"
        | "screening"
        | "assignment_sent"
        | "assignment_submitted"
        | "interview_r1"
        | "interview_r2"
        | "selected"
        | "rejected"
        | "on_hold"
        | "hired"
        | "withdrawn"
      asset_kind: "laptop" | "phone" | "sim" | "id_card" | "accessory" | "other"
      asset_status: "available" | "assigned" | "retired" | "lost"
      attendance_source:
        | "mobile"
        | "web"
        | "biometric"
        | "kiosk"
        | "manual"
        | "geofence"
      attendance_status:
        | "present"
        | "absent"
        | "late"
        | "half_day"
        | "on_leave"
        | "holiday"
        | "weekly_off"
      billing_cycle: "monthly" | "yearly"
      contact_stage:
        | "subscriber"
        | "lead"
        | "mql"
        | "sql"
        | "customer"
        | "evangelist"
        | "other"
      correction_status: "pending" | "approved" | "rejected"
      coupon_kind: "percent" | "fixed"
      document_kind:
        | "offer_letter"
        | "nda"
        | "id_proof"
        | "contract"
        | "policy"
        | "other"
      employment_type:
        | "full_time"
        | "part_time"
        | "contract"
        | "intern"
        | "consultant"
      experience_level: "intern" | "junior" | "mid" | "senior" | "lead"
      floating_holiday_status: "pending" | "approved" | "used" | "cancelled"
      holiday_override_action: "add" | "remove" | "move"
      holiday_scope_level:
        | "global"
        | "country"
        | "region"
        | "office"
        | "employee"
      holiday_type:
        | "national"
        | "regional"
        | "religious"
        | "optional"
        | "company"
        | "half_day"
      integration_kind:
        | "payment"
        | "email"
        | "sms"
        | "whatsapp"
        | "webhook"
        | "api"
        | "storage"
        | "analytics"
      interview_mode: "video" | "phone" | "onsite"
      interview_outcome:
        | "pending"
        | "passed"
        | "failed"
        | "no_show"
        | "rescheduled"
      invoice_status: "draft" | "open" | "paid" | "void" | "uncollectible"
      job_employment_type: "full_time" | "part_time" | "contract" | "internship"
      job_posting_status: "draft" | "published" | "archived" | "closed"
      lead_status:
        | "new"
        | "contacted"
        | "demo_booked"
        | "trial"
        | "negotiation"
        | "won"
        | "lost"
      leave_request_status: "pending" | "approved" | "rejected" | "cancelled"
      overtime_status: "pending" | "approved" | "rejected"
      payment_provider: "stripe" | "razorpay" | "paypal" | "manual" | "none"
      payment_status: "pending" | "succeeded" | "failed" | "refunded"
      plan_tier: "free" | "starter" | "growth" | "business" | "enterprise"
      post_status: "draft" | "scheduled" | "published" | "archived"
      remote_status: "pending" | "approved" | "rejected" | "cancelled"
      schedule_status: "draft" | "published" | "archived"
      subscription_status:
        | "trialing"
        | "active"
        | "past_due"
        | "canceled"
        | "paused"
        | "incomplete"
      swap_status: "pending" | "approved" | "rejected" | "cancelled"
      ticket_channel: "email" | "chat" | "portal" | "api" | "whatsapp"
      ticket_priority: "low" | "normal" | "high" | "urgent"
      ticket_status: "open" | "pending" | "resolved" | "closed"
      timesheet_status:
        | "draft"
        | "submitted"
        | "approved"
        | "rejected"
        | "locked"
      work_type: "remote" | "hybrid" | "onsite"
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
      announcement_audience: ["all", "department", "team", "role"],
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
      application_status: [
        "new",
        "screening",
        "assignment_sent",
        "assignment_submitted",
        "interview_r1",
        "interview_r2",
        "selected",
        "rejected",
        "on_hold",
        "hired",
        "withdrawn",
      ],
      asset_kind: ["laptop", "phone", "sim", "id_card", "accessory", "other"],
      asset_status: ["available", "assigned", "retired", "lost"],
      attendance_source: [
        "mobile",
        "web",
        "biometric",
        "kiosk",
        "manual",
        "geofence",
      ],
      attendance_status: [
        "present",
        "absent",
        "late",
        "half_day",
        "on_leave",
        "holiday",
        "weekly_off",
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
      correction_status: ["pending", "approved", "rejected"],
      coupon_kind: ["percent", "fixed"],
      document_kind: [
        "offer_letter",
        "nda",
        "id_proof",
        "contract",
        "policy",
        "other",
      ],
      employment_type: [
        "full_time",
        "part_time",
        "contract",
        "intern",
        "consultant",
      ],
      experience_level: ["intern", "junior", "mid", "senior", "lead"],
      floating_holiday_status: ["pending", "approved", "used", "cancelled"],
      holiday_override_action: ["add", "remove", "move"],
      holiday_scope_level: [
        "global",
        "country",
        "region",
        "office",
        "employee",
      ],
      holiday_type: [
        "national",
        "regional",
        "religious",
        "optional",
        "company",
        "half_day",
      ],
      integration_kind: [
        "payment",
        "email",
        "sms",
        "whatsapp",
        "webhook",
        "api",
        "storage",
        "analytics",
      ],
      interview_mode: ["video", "phone", "onsite"],
      interview_outcome: [
        "pending",
        "passed",
        "failed",
        "no_show",
        "rescheduled",
      ],
      invoice_status: ["draft", "open", "paid", "void", "uncollectible"],
      job_employment_type: ["full_time", "part_time", "contract", "internship"],
      job_posting_status: ["draft", "published", "archived", "closed"],
      lead_status: [
        "new",
        "contacted",
        "demo_booked",
        "trial",
        "negotiation",
        "won",
        "lost",
      ],
      leave_request_status: ["pending", "approved", "rejected", "cancelled"],
      overtime_status: ["pending", "approved", "rejected"],
      payment_provider: ["stripe", "razorpay", "paypal", "manual", "none"],
      payment_status: ["pending", "succeeded", "failed", "refunded"],
      plan_tier: ["free", "starter", "growth", "business", "enterprise"],
      post_status: ["draft", "scheduled", "published", "archived"],
      remote_status: ["pending", "approved", "rejected", "cancelled"],
      schedule_status: ["draft", "published", "archived"],
      subscription_status: [
        "trialing",
        "active",
        "past_due",
        "canceled",
        "paused",
        "incomplete",
      ],
      swap_status: ["pending", "approved", "rejected", "cancelled"],
      ticket_channel: ["email", "chat", "portal", "api", "whatsapp"],
      ticket_priority: ["low", "normal", "high", "urgent"],
      ticket_status: ["open", "pending", "resolved", "closed"],
      timesheet_status: [
        "draft",
        "submitted",
        "approved",
        "rejected",
        "locked",
      ],
      work_type: ["remote", "hybrid", "onsite"],
    },
  },
} as const
