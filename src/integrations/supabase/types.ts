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
      ab_test_variants: {
        Row: {
          config: Json | null
          conversions: number
          id: string
          name: string
          test_id: string
          traffic_percent: number
          visitors: number
        }
        Insert: {
          config?: Json | null
          conversions?: number
          id?: string
          name: string
          test_id: string
          traffic_percent?: number
          visitors?: number
        }
        Update: {
          config?: Json | null
          conversions?: number
          id?: string
          name?: string
          test_id?: string
          traffic_percent?: number
          visitors?: number
        }
        Relationships: [
          {
            foreignKeyName: "ab_test_variants_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "ab_tests"
            referencedColumns: ["id"]
          },
        ]
      }
      ab_tests: {
        Row: {
          created_at: string
          description: string | null
          ends_at: string | null
          id: string
          name: string
          starts_at: string | null
          status: string
          target_url: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          name: string
          starts_at?: string | null
          status?: string
          target_url?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          name?: string
          starts_at?: string | null
          status?: string
          target_url?: string | null
        }
        Relationships: []
      }
      abandoned_carts: {
        Row: {
          created_at: string
          customer_name: string | null
          email: string | null
          id: string
          items: Json
          last_activity_at: string
          recovered: boolean | null
          recovered_order_id: string | null
          recovery_email_sent: boolean
          session_id: string
          subtotal: number
          total: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          customer_name?: string | null
          email?: string | null
          id?: string
          items?: Json
          last_activity_at?: string
          recovered?: boolean | null
          recovered_order_id?: string | null
          recovery_email_sent?: boolean
          session_id: string
          subtotal?: number
          total?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          customer_name?: string | null
          email?: string | null
          id?: string
          items?: Json
          last_activity_at?: string
          recovered?: boolean | null
          recovered_order_id?: string | null
          recovery_email_sent?: boolean
          session_id?: string
          subtotal?: number
          total?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      activity_log: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_name: string | null
          entity_type: string
          id: string
          ip_address: string | null
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_name?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_name?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: []
      }
      addresses: {
        Row: {
          address: string
          city: string
          county: string
          created_at: string | null
          full_name: string
          id: string
          is_default: boolean | null
          label: string | null
          phone: string | null
          postal_code: string | null
          user_id: string
        }
        Insert: {
          address: string
          city: string
          county: string
          created_at?: string | null
          full_name: string
          id?: string
          is_default?: boolean | null
          label?: string | null
          phone?: string | null
          postal_code?: string | null
          user_id: string
        }
        Update: {
          address?: string
          city?: string
          county?: string
          created_at?: string | null
          full_name?: string
          id?: string
          is_default?: boolean | null
          label?: string | null
          phone?: string | null
          postal_code?: string | null
          user_id?: string
        }
        Relationships: []
      }
      admin_notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean | null
          link: string | null
          message: string | null
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          link?: string | null
          message?: string | null
          title: string
          type?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          link?: string | null
          message?: string | null
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      affiliate_clicks: {
        Row: {
          affiliate_id: string
          created_at: string
          id: string
          ip_address: string | null
          landing_page: string | null
          referrer: string | null
          user_agent: string | null
        }
        Insert: {
          affiliate_id: string
          created_at?: string
          id?: string
          ip_address?: string | null
          landing_page?: string | null
          referrer?: string | null
          user_agent?: string | null
        }
        Update: {
          affiliate_id?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          landing_page?: string | null
          referrer?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_clicks_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_conversions: {
        Row: {
          affiliate_id: string
          commission_amount: number
          created_at: string
          id: string
          order_id: string | null
          order_total: number
          paid_at: string | null
          status: string
        }
        Insert: {
          affiliate_id: string
          commission_amount: number
          created_at?: string
          id?: string
          order_id?: string | null
          order_total: number
          paid_at?: string | null
          status?: string
        }
        Update: {
          affiliate_id?: string
          commission_amount?: number
          created_at?: string
          id?: string
          order_id?: string | null
          order_total?: number
          paid_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_conversions_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_payout_requests: {
        Row: {
          affiliate_id: string
          amount: number
          created_at: string
          id: string
          notes: string | null
          processed_at: string | null
          processed_by: string | null
          status: string
        }
        Insert: {
          affiliate_id: string
          amount: number
          created_at?: string
          id?: string
          notes?: string | null
          processed_at?: string | null
          processed_by?: string | null
          status?: string
        }
        Update: {
          affiliate_id?: string
          amount?: number
          created_at?: string
          id?: string
          notes?: string | null
          processed_at?: string | null
          processed_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_payout_requests_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliates: {
        Row: {
          code: string
          commission_percent: number
          created_at: string
          email: string
          id: string
          name: string
          payout_details: Json | null
          payout_method: string | null
          status: string
          total_earned: number
          total_paid: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          code: string
          commission_percent?: number
          created_at?: string
          email: string
          id?: string
          name: string
          payout_details?: Json | null
          payout_method?: string | null
          status?: string
          total_earned?: number
          total_paid?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          code?: string
          commission_percent?: number
          created_at?: string
          email?: string
          id?: string
          name?: string
          payout_details?: Json | null
          payout_method?: string | null
          status?: string
          total_earned?: number
          total_paid?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          category: string | null
          description: string | null
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          category?: string | null
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          category?: string | null
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      attribute_values: {
        Row: {
          attribute_id: string
          display_value: string | null
          id: string
          sort_order: number | null
          value: string
        }
        Insert: {
          attribute_id: string
          display_value?: string | null
          id?: string
          sort_order?: number | null
          value: string
        }
        Update: {
          attribute_id?: string
          display_value?: string | null
          id?: string
          sort_order?: number | null
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "attribute_values_attribute_id_fkey"
            columns: ["attribute_id"]
            isOneToOne: false
            referencedRelation: "product_attributes"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: string | null
          new_values: Json | null
          old_values: Json | null
          resource_id: string | null
          resource_type: string | null
          user_agent: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      auth_audit_log: {
        Row: {
          created_at: string
          event_details: Json | null
          event_type: string
          id: string
          ip_address: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_details?: Json | null
          event_type: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_details?: Json | null
          event_type?: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      back_in_stock_notifications: {
        Row: {
          created_at: string
          email: string
          id: string
          notified_at: string | null
          product_id: string
          user_id: string | null
          variant_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          notified_at?: string | null
          product_id: string
          user_id?: string | null
          variant_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          notified_at?: string | null
          product_id?: string
          user_id?: string | null
          variant_id?: string | null
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author_id: string | null
          content: string | null
          created_at: string | null
          excerpt: string | null
          id: string
          image_url: string | null
          meta_description: string | null
          meta_title: string | null
          published_at: string | null
          slug: string
          status: string
          title: string
          updated_at: string | null
        }
        Insert: {
          author_id?: string | null
          content?: string | null
          created_at?: string | null
          excerpt?: string | null
          id?: string
          image_url?: string | null
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          slug: string
          status?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          author_id?: string | null
          content?: string | null
          created_at?: string | null
          excerpt?: string | null
          id?: string
          image_url?: string | null
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          slug?: string
          status?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      brands: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          slug: string
          sort_order: number | null
          updated_at: string
          website: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          slug: string
          sort_order?: number | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          slug?: string
          sort_order?: number | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          image_url: string | null
          name: string
          parent_id: string | null
          slug: string
          sort_order: number | null
          visible: boolean | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          image_url?: string | null
          name: string
          parent_id?: string | null
          slug: string
          sort_order?: number | null
          visible?: boolean | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          image_url?: string | null
          name?: string
          parent_id?: string | null
          slug?: string
          sort_order?: number | null
          visible?: boolean | null
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
      chatbot_faq: {
        Row: {
          answer: string
          category: string | null
          created_at: string
          id: string
          is_active: boolean
          keywords: string[] | null
          question: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          answer: string
          category?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          keywords?: string[] | null
          question: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          answer?: string
          category?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          keywords?: string[] | null
          question?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      chatbot_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          metadata: Json | null
          role: string
          session_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role: string
          session_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chatbot_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chatbot_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      chatbot_sessions: {
        Row: {
          created_at: string
          id: string
          metadata: Json | null
          session_token: string
          status: string
          updated_at: string
          user_id: string | null
          visitor_email: string | null
          visitor_name: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json | null
          session_token: string
          status?: string
          updated_at?: string
          user_id?: string | null
          visitor_email?: string | null
          visitor_name?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json | null
          session_token?: string
          status?: string
          updated_at?: string
          user_id?: string | null
          visitor_email?: string | null
          visitor_name?: string | null
        }
        Relationships: []
      }
      chatbot_settings: {
        Row: {
          ai_model: string | null
          bot_name: string
          config: Json
          created_at: string
          fallback_email: string | null
          id: string
          is_enabled: boolean
          system_prompt: string | null
          updated_at: string
          welcome_message: string | null
        }
        Insert: {
          ai_model?: string | null
          bot_name?: string
          config?: Json
          created_at?: string
          fallback_email?: string | null
          id?: string
          is_enabled?: boolean
          system_prompt?: string | null
          updated_at?: string
          welcome_message?: string | null
        }
        Update: {
          ai_model?: string | null
          bot_name?: string
          config?: Json
          created_at?: string
          fallback_email?: string | null
          id?: string
          is_enabled?: boolean
          system_prompt?: string | null
          updated_at?: string
          welcome_message?: string | null
        }
        Relationships: []
      }
      cms_pages: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          meta_description: string | null
          meta_title: string | null
          slug: string
          status: string
          title: string
          updated_at: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          slug: string
          status?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          slug?: string
          status?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      complaints: {
        Row: {
          created_at: string
          customer_email: string
          customer_name: string
          description: string | null
          id: string
          order_id: string | null
          priority: string
          resolved_at: string | null
          sla_deadline: string | null
          status: string
          subject: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_email: string
          customer_name: string
          description?: string | null
          id?: string
          order_id?: string | null
          priority?: string
          resolved_at?: string | null
          sla_deadline?: string | null
          status?: string
          subject: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_email?: string
          customer_name?: string
          description?: string | null
          id?: string
          order_id?: string | null
          priority?: string
          resolved_at?: string | null
          sla_deadline?: string | null
          status?: string
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "complaints_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          active: boolean | null
          code: string
          created_at: string | null
          expires_at: string | null
          id: string
          max_uses: number | null
          min_order: number | null
          type: string | null
          uses: number | null
          value: number
        }
        Insert: {
          active?: boolean | null
          code: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          min_order?: number | null
          type?: string | null
          uses?: number | null
          value: number
        }
        Update: {
          active?: boolean | null
          code?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          min_order?: number | null
          type?: string | null
          uses?: number | null
          value?: number
        }
        Relationships: []
      }
      customer_blacklist: {
        Row: {
          blocked_by: string | null
          created_at: string
          email: string | null
          id: string
          ip_address: string | null
          phone: string | null
          reason: string
        }
        Insert: {
          blocked_by?: string | null
          created_at?: string
          email?: string | null
          id?: string
          ip_address?: string | null
          phone?: string | null
          reason: string
        }
        Update: {
          blocked_by?: string | null
          created_at?: string
          email?: string | null
          id?: string
          ip_address?: string | null
          phone?: string | null
          reason?: string
        }
        Relationships: []
      }
      customer_group_members: {
        Row: {
          added_at: string
          group_id: string
          id: string
          user_id: string
        }
        Insert: {
          added_at?: string
          group_id: string
          id?: string
          user_id: string
        }
        Update: {
          added_at?: string
          group_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "customer_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_groups: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          discount_percent: number | null
          id: string
          name: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          discount_percent?: number | null
          id?: string
          name: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          discount_percent?: number | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      customer_notes: {
        Row: {
          created_at: string
          created_by: string | null
          customer_user_id: string
          id: string
          note: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          customer_user_id: string
          id?: string
          note: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          customer_user_id?: string
          id?: string
          note?: string
        }
        Relationships: []
      }
      customer_segments: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          rules: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          rules?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          rules?: Json
          updated_at?: string
        }
        Relationships: []
      }
      customer_tag_assignments: {
        Row: {
          assigned_at: string
          id: string
          tag_id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          id?: string
          tag_id: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          id?: string
          tag_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_tag_assignments_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "customer_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_tags: {
        Row: {
          color: string | null
          id: string
          name: string
        }
        Insert: {
          color?: string | null
          id?: string
          name: string
        }
        Update: {
          color?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      customer_wallets: {
        Row: {
          balance: number
          currency: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          currency?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          currency?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      email_logs: {
        Row: {
          created_at: string
          error: string | null
          id: string
          metadata: Json | null
          provider: string | null
          provider_id: string | null
          recipient_email: string
          status: string
          subject: string | null
          template: string | null
        }
        Insert: {
          created_at?: string
          error?: string | null
          id?: string
          metadata?: Json | null
          provider?: string | null
          provider_id?: string | null
          recipient_email: string
          status?: string
          subject?: string | null
          template?: string | null
        }
        Update: {
          created_at?: string
          error?: string | null
          id?: string
          metadata?: Json | null
          provider?: string | null
          provider_id?: string | null
          recipient_email?: string
          status?: string
          subject?: string | null
          template?: string | null
        }
        Relationships: []
      }
      error_log: {
        Row: {
          created_at: string
          error_type: string
          id: string
          message: string
          metadata: Json | null
          stack_trace: string | null
          url: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          error_type: string
          id?: string
          message: string
          metadata?: Json | null
          stack_trace?: string | null
          url?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          error_type?: string
          id?: string
          message?: string
          metadata?: Json | null
          stack_trace?: string | null
          url?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      external_webhooks: {
        Row: {
          created_at: string
          events: string[]
          failure_count: number
          headers: Json | null
          id: string
          is_active: boolean
          last_triggered_at: string | null
          name: string
          secret: string | null
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          events?: string[]
          failure_count?: number
          headers?: Json | null
          id?: string
          is_active?: boolean
          last_triggered_at?: string | null
          name: string
          secret?: string | null
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          events?: string[]
          failure_count?: number
          headers?: Json | null
          id?: string
          is_active?: boolean
          last_triggered_at?: string | null
          name?: string
          secret?: string | null
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string | null
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      gdpr_consents: {
        Row: {
          consent_type: string
          created_at: string
          email: string | null
          granted: boolean
          id: string
          ip_address: string | null
          metadata: Json | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          consent_type: string
          created_at?: string
          email?: string | null
          granted?: boolean
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          consent_type?: string
          created_at?: string
          email?: string | null
          granted?: boolean
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      gdpr_requests: {
        Row: {
          created_at: string
          details: string | null
          email: string
          id: string
          processed_at: string | null
          processed_by: string | null
          request_type: string
          status: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          details?: string | null
          email: string
          id?: string
          processed_at?: string | null
          processed_by?: string | null
          request_type: string
          status?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          details?: string | null
          email?: string
          id?: string
          processed_at?: string | null
          processed_by?: string | null
          request_type?: string
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
      gift_card_transactions: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          gift_card_id: string
          id: string
          notes: string | null
          order_id: string | null
          performed_by: string | null
          type: string
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string
          gift_card_id: string
          id?: string
          notes?: string | null
          order_id?: string | null
          performed_by?: string | null
          type: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          gift_card_id?: string
          id?: string
          notes?: string | null
          order_id?: string | null
          performed_by?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "gift_card_transactions_gift_card_id_fkey"
            columns: ["gift_card_id"]
            isOneToOne: false
            referencedRelation: "gift_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      gift_cards: {
        Row: {
          balance: number
          code: string
          created_at: string
          created_by: string | null
          currency: string
          expires_at: string | null
          id: string
          initial_amount: number
          message: string | null
          recipient_email: string | null
          recipient_name: string | null
          sender_name: string | null
          status: string
          updated_at: string
        }
        Insert: {
          balance?: number
          code: string
          created_at?: string
          created_by?: string | null
          currency?: string
          expires_at?: string | null
          id?: string
          initial_amount: number
          message?: string | null
          recipient_email?: string | null
          recipient_name?: string | null
          sender_name?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          balance?: number
          code?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          expires_at?: string | null
          id?: string
          initial_amount?: number
          message?: string | null
          recipient_email?: string | null
          recipient_name?: string | null
          sender_name?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      health_logs: {
        Row: {
          check_name: string
          created_at: string
          details: Json | null
          id: string
          response_time_ms: number | null
          status: string
        }
        Insert: {
          check_name: string
          created_at?: string
          details?: Json | null
          id?: string
          response_time_ms?: number | null
          status: string
        }
        Update: {
          check_name?: string
          created_at?: string
          details?: Json | null
          id?: string
          response_time_ms?: number | null
          status?: string
        }
        Relationships: []
      }
      invoice_items: {
        Row: {
          id: string
          invoice_id: string
          product_name: string
          quantity: number
          total: number
          unit_price: number
          vat_percent: number
        }
        Insert: {
          id?: string
          invoice_id: string
          product_name: string
          quantity?: number
          total: number
          unit_price: number
          vat_percent?: number
        }
        Update: {
          id?: string
          invoice_id?: string
          product_name?: string
          quantity?: number
          total?: number
          unit_price?: number
          vat_percent?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          created_at: string
          currency: string
          customer_address: string | null
          customer_cui: string | null
          customer_email: string | null
          customer_name: string
          id: string
          invoice_number: string
          issued_at: string
          order_id: string | null
          paid_at: string | null
          pdf_url: string | null
          series: string | null
          smartbill_id: string | null
          status: string
          subtotal: number
          total: number
          vat_amount: number
        }
        Insert: {
          created_at?: string
          currency?: string
          customer_address?: string | null
          customer_cui?: string | null
          customer_email?: string | null
          customer_name: string
          id?: string
          invoice_number: string
          issued_at?: string
          order_id?: string | null
          paid_at?: string | null
          pdf_url?: string | null
          series?: string | null
          smartbill_id?: string | null
          status?: string
          subtotal?: number
          total?: number
          vat_amount?: number
        }
        Update: {
          created_at?: string
          currency?: string
          customer_address?: string | null
          customer_cui?: string | null
          customer_email?: string | null
          customer_name?: string
          id?: string
          invoice_number?: string
          issued_at?: string
          order_id?: string | null
          paid_at?: string | null
          pdf_url?: string | null
          series?: string | null
          smartbill_id?: string | null
          status?: string
          subtotal?: number
          total?: number
          vat_amount?: number
        }
        Relationships: []
      }
      legal_consents: {
        Row: {
          accepted_at: string
          document_type: string
          document_version: string
          id: string
          ip_address: string | null
          user_id: string | null
        }
        Insert: {
          accepted_at?: string
          document_type: string
          document_version: string
          id?: string
          ip_address?: string | null
          user_id?: string | null
        }
        Update: {
          accepted_at?: string
          document_type?: string
          document_version?: string
          id?: string
          ip_address?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      login_attempts: {
        Row: {
          created_at: string
          email: string
          failure_reason: string | null
          id: string
          ip_address: string | null
          success: boolean
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          email: string
          failure_reason?: string | null
          id?: string
          ip_address?: string | null
          success?: boolean
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          failure_reason?: string | null
          id?: string
          ip_address?: string | null
          success?: boolean
          user_agent?: string | null
        }
        Relationships: []
      }
      loyalty_levels: {
        Row: {
          badge_color: string | null
          benefits: string[] | null
          discount_percent: number | null
          id: string
          min_points: number
          name: string
          sort_order: number | null
        }
        Insert: {
          badge_color?: string | null
          benefits?: string[] | null
          discount_percent?: number | null
          id?: string
          min_points?: number
          name: string
          sort_order?: number | null
        }
        Update: {
          badge_color?: string | null
          benefits?: string[] | null
          discount_percent?: number | null
          id?: string
          min_points?: number
          name?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          created_at: string | null
          discount_code: string | null
          email: string
          id: string
          is_active: boolean | null
          name: string | null
          source: string | null
        }
        Insert: {
          created_at?: string | null
          discount_code?: string | null
          email: string
          id?: string
          is_active?: boolean | null
          name?: string | null
          source?: string | null
        }
        Update: {
          created_at?: string | null
          discount_code?: string | null
          email?: string
          id?: string
          is_active?: boolean | null
          name?: string | null
          source?: string | null
        }
        Relationships: []
      }
      notification_templates: {
        Row: {
          body: string
          channel: string
          created_at: string
          id: string
          is_active: boolean
          key: string
          subject: string | null
          updated_at: string
          variables: Json | null
        }
        Insert: {
          body: string
          channel: string
          created_at?: string
          id?: string
          is_active?: boolean
          key: string
          subject?: string | null
          updated_at?: string
          variables?: Json | null
        }
        Update: {
          body?: string
          channel?: string
          created_at?: string
          id?: string
          is_active?: boolean
          key?: string
          subject?: string | null
          updated_at?: string
          variables?: Json | null
        }
        Relationships: []
      }
      order_notes: {
        Row: {
          created_at: string
          id: string
          note: string
          order_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          note: string
          order_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          note?: string
          order_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_notes_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_timeline: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          order_id: string
          performed_by: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          order_id: string
          performed_by?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          order_id?: string
          performed_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_timeline_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          admin_notes: string | null
          awb_carrier: string | null
          awb_number: string | null
          billing_type: string | null
          city: string | null
          company_cui: string | null
          company_name: string | null
          company_reg: string | null
          county: string | null
          created_at: string | null
          currency: string
          customer_email: string
          customer_name: string
          customer_phone: string | null
          discount: number | null
          discount_amount: number | null
          discount_code: string | null
          gift_message: string | null
          gift_wrapping: boolean | null
          id: string
          items: Json
          notes: string | null
          order_number: string
          paid_at: string | null
          payment_method: string | null
          payment_reference: string | null
          payment_status: string | null
          postal_code: string | null
          shipping_address: string | null
          shipping_cost: number | null
          status: string | null
          subtotal: number
          total: number
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          admin_notes?: string | null
          awb_carrier?: string | null
          awb_number?: string | null
          billing_type?: string | null
          city?: string | null
          company_cui?: string | null
          company_name?: string | null
          company_reg?: string | null
          county?: string | null
          created_at?: string | null
          currency?: string
          customer_email: string
          customer_name: string
          customer_phone?: string | null
          discount?: number | null
          discount_amount?: number | null
          discount_code?: string | null
          gift_message?: string | null
          gift_wrapping?: boolean | null
          id?: string
          items?: Json
          notes?: string | null
          order_number: string
          paid_at?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          payment_status?: string | null
          postal_code?: string | null
          shipping_address?: string | null
          shipping_cost?: number | null
          status?: string | null
          subtotal?: number
          total?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          admin_notes?: string | null
          awb_carrier?: string | null
          awb_number?: string | null
          billing_type?: string | null
          city?: string | null
          company_cui?: string | null
          company_name?: string | null
          company_reg?: string | null
          county?: string | null
          created_at?: string | null
          currency?: string
          customer_email?: string
          customer_name?: string
          customer_phone?: string | null
          discount?: number | null
          discount_amount?: number | null
          discount_code?: string | null
          gift_message?: string | null
          gift_wrapping?: boolean | null
          id?: string
          items?: Json
          notes?: string | null
          order_number?: string
          paid_at?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          payment_status?: string | null
          postal_code?: string | null
          shipping_address?: string | null
          shipping_cost?: number | null
          status?: string | null
          subtotal?: number
          total?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      points_transactions: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          id: string
          reason: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          id?: string
          reason?: string | null
          type?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          id?: string
          reason?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      popups: {
        Row: {
          content: Json
          conversions: number
          created_at: string
          ends_at: string | null
          id: string
          is_active: boolean
          name: string
          starts_at: string | null
          trigger: string
          trigger_value: number | null
          type: string
          views: number
        }
        Insert: {
          content?: Json
          conversions?: number
          created_at?: string
          ends_at?: string | null
          id?: string
          is_active?: boolean
          name: string
          starts_at?: string | null
          trigger?: string
          trigger_value?: number | null
          type?: string
          views?: number
        }
        Update: {
          content?: Json
          conversions?: number
          created_at?: string
          ends_at?: string | null
          id?: string
          is_active?: boolean
          name?: string
          starts_at?: string | null
          trigger?: string
          trigger_value?: number | null
          type?: string
          views?: number
        }
        Relationships: []
      }
      price_alerts: {
        Row: {
          created_at: string
          email: string
          id: string
          is_active: boolean
          product_id: string
          target_price: number
          triggered_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_active?: boolean
          product_id: string
          target_price: number
          triggered_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          product_id?: string
          target_price?: number
          triggered_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      price_list_items: {
        Row: {
          id: string
          min_quantity: number | null
          price: number
          price_list_id: string
          product_id: string
        }
        Insert: {
          id?: string
          min_quantity?: number | null
          price: number
          price_list_id: string
          product_id: string
        }
        Update: {
          id?: string
          min_quantity?: number | null
          price?: number
          price_list_id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "price_list_items_price_list_id_fkey"
            columns: ["price_list_id"]
            isOneToOne: false
            referencedRelation: "price_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      price_lists: {
        Row: {
          applies_to_group_id: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          applies_to_group_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          applies_to_group_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "price_lists_applies_to_group_id_fkey"
            columns: ["applies_to_group_id"]
            isOneToOne: false
            referencedRelation: "customer_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      product_attributes: {
        Row: {
          created_at: string
          id: string
          is_filterable: boolean | null
          name: string
          slug: string
          sort_order: number | null
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_filterable?: boolean | null
          name: string
          slug: string
          sort_order?: number | null
          type?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_filterable?: boolean | null
          name?: string
          slug?: string
          sort_order?: number | null
          type?: string
        }
        Relationships: []
      }
      product_batches: {
        Row: {
          batch_number: string
          cost_price: number | null
          created_at: string | null
          expiry_date: string | null
          id: string
          notes: string | null
          product_id: string
          production_date: string | null
          quantity: number | null
          warehouse_id: string | null
        }
        Insert: {
          batch_number: string
          cost_price?: number | null
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          notes?: string | null
          product_id: string
          production_date?: string | null
          quantity?: number | null
          warehouse_id?: string | null
        }
        Update: {
          batch_number?: string
          cost_price?: number | null
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          notes?: string | null
          product_id?: string
          production_date?: string | null
          quantity?: number | null
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_batches_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_batches_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      product_bundle_items: {
        Row: {
          bundle_id: string
          id: string
          product_id: string
          quantity: number
          sort_order: number | null
        }
        Insert: {
          bundle_id: string
          id?: string
          product_id: string
          quantity?: number
          sort_order?: number | null
        }
        Update: {
          bundle_id?: string
          id?: string
          product_id?: string
          quantity?: number
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_bundle_items_bundle_id_fkey"
            columns: ["bundle_id"]
            isOneToOne: false
            referencedRelation: "product_bundles"
            referencedColumns: ["id"]
          },
        ]
      }
      product_bundles: {
        Row: {
          created_at: string
          description: string | null
          discount_percent: number
          id: string
          is_active: boolean
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          discount_percent?: number
          id?: string
          is_active?: boolean
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          discount_percent?: number
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      product_reviews: {
        Row: {
          author_name: string | null
          content: string | null
          created_at: string | null
          id: string
          photo_urls: string[] | null
          product_id: string
          rating: number
          status: string | null
          title: string | null
          user_id: string | null
          verified_purchase: boolean | null
        }
        Insert: {
          author_name?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          photo_urls?: string[] | null
          product_id: string
          rating: number
          status?: string | null
          title?: string | null
          user_id?: string | null
          verified_purchase?: boolean | null
        }
        Update: {
          author_name?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          photo_urls?: string[] | null
          product_id?: string
          rating?: number
          status?: string | null
          title?: string | null
          user_id?: string | null
          verified_purchase?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "product_reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_subscriptions: {
        Row: {
          cancelled_at: string | null
          created_at: string
          discount_percent: number
          frequency_days: number
          id: string
          next_delivery_date: string
          product_id: string
          quantity: number
          shipping_address: Json | null
          status: string
          updated_at: string
          user_id: string
          variant_id: string | null
        }
        Insert: {
          cancelled_at?: string | null
          created_at?: string
          discount_percent?: number
          frequency_days?: number
          id?: string
          next_delivery_date?: string
          product_id: string
          quantity?: number
          shipping_address?: Json | null
          status?: string
          updated_at?: string
          user_id: string
          variant_id?: string | null
        }
        Update: {
          cancelled_at?: string | null
          created_at?: string
          discount_percent?: number
          frequency_days?: number
          id?: string
          next_delivery_date?: string
          product_id?: string
          quantity?: number
          shipping_address?: Json | null
          status?: string
          updated_at?: string
          user_id?: string
          variant_id?: string | null
        }
        Relationships: []
      }
      product_tag_links: {
        Row: {
          id: string
          product_id: string
          tag_id: string
        }
        Insert: {
          id?: string
          product_id: string
          tag_id: string
        }
        Update: {
          id?: string
          product_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_tag_links_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_tag_links_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "product_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      product_tags: {
        Row: {
          created_at: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      product_variants: {
        Row: {
          created_at: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          old_price: number | null
          options: Json | null
          price: number | null
          product_id: string
          sku: string | null
          sort_order: number | null
          stock: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          old_price?: number | null
          options?: Json | null
          price?: number | null
          product_id: string
          sku?: string | null
          sort_order?: number | null
          stock?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          old_price?: number | null
          options?: Json | null
          price?: number | null
          product_id?: string
          sku?: string | null
          sort_order?: number | null
          stock?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          allow_backorder: boolean | null
          badge: string | null
          badge_type: string | null
          barcode: string | null
          brand: string | null
          category_id: string | null
          cost_price: number | null
          countdown_end: string | null
          created_at: string | null
          description: string | null
          digital_file_url: string | null
          digital_max_downloads: number | null
          gallery: Json | null
          height_cm: number | null
          id: string
          image_url: string | null
          internal_notes: string | null
          is_active: boolean | null
          is_digital: boolean | null
          is_featured: boolean | null
          length_cm: number | null
          meta_description: string | null
          meta_title: string | null
          min_stock_alert: number | null
          name: string
          old_price: number | null
          price: number
          promo_end: string | null
          promo_start: string | null
          rating: number | null
          reviews_count: number | null
          short_description: string | null
          sku: string | null
          slug: string
          sold_count: number
          sort_order: number | null
          stock: number | null
          updated_at: string | null
          weight: string | null
          width_cm: number | null
        }
        Insert: {
          allow_backorder?: boolean | null
          badge?: string | null
          badge_type?: string | null
          barcode?: string | null
          brand?: string | null
          category_id?: string | null
          cost_price?: number | null
          countdown_end?: string | null
          created_at?: string | null
          description?: string | null
          digital_file_url?: string | null
          digital_max_downloads?: number | null
          gallery?: Json | null
          height_cm?: number | null
          id?: string
          image_url?: string | null
          internal_notes?: string | null
          is_active?: boolean | null
          is_digital?: boolean | null
          is_featured?: boolean | null
          length_cm?: number | null
          meta_description?: string | null
          meta_title?: string | null
          min_stock_alert?: number | null
          name: string
          old_price?: number | null
          price: number
          promo_end?: string | null
          promo_start?: string | null
          rating?: number | null
          reviews_count?: number | null
          short_description?: string | null
          sku?: string | null
          slug: string
          sold_count?: number
          sort_order?: number | null
          stock?: number | null
          updated_at?: string | null
          weight?: string | null
          width_cm?: number | null
        }
        Update: {
          allow_backorder?: boolean | null
          badge?: string | null
          badge_type?: string | null
          barcode?: string | null
          brand?: string | null
          category_id?: string | null
          cost_price?: number | null
          countdown_end?: string | null
          created_at?: string | null
          description?: string | null
          digital_file_url?: string | null
          digital_max_downloads?: number | null
          gallery?: Json | null
          height_cm?: number | null
          id?: string
          image_url?: string | null
          internal_notes?: string | null
          is_active?: boolean | null
          is_digital?: boolean | null
          is_featured?: boolean | null
          length_cm?: number | null
          meta_description?: string | null
          meta_title?: string | null
          min_stock_alert?: number | null
          name?: string
          old_price?: number | null
          price?: number
          promo_end?: string | null
          promo_start?: string | null
          rating?: number | null
          reviews_count?: number | null
          short_description?: string | null
          sku?: string | null
          slug?: string
          sold_count?: number
          sort_order?: number | null
          stock?: number | null
          updated_at?: string | null
          weight?: string | null
          width_cm?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      purchase_order_items: {
        Row: {
          id: string
          product_id: string
          purchase_order_id: string
          quantity: number
          received_quantity: number | null
          unit_price: number | null
        }
        Insert: {
          id?: string
          product_id: string
          purchase_order_id: string
          quantity?: number
          received_quantity?: number | null
          unit_price?: number | null
        }
        Update: {
          id?: string
          product_id?: string
          purchase_order_id?: string
          quantity?: number
          received_quantity?: number | null
          unit_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          created_at: string | null
          created_by: string | null
          expected_delivery: string | null
          id: string
          notes: string | null
          po_number: string
          received_at: string | null
          status: string | null
          supplier_id: string
          total: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          expected_delivery?: string | null
          id?: string
          notes?: string | null
          po_number: string
          received_at?: string | null
          status?: string | null
          supplier_id: string
          total?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          expected_delivery?: string | null
          id?: string
          notes?: string | null
          po_number?: string
          received_at?: string | null
          status?: string | null
          supplier_id?: string
          total?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          last_used_at: string | null
          p256dh: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          last_used_at?: string | null
          p256dh: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          last_used_at?: string | null
          p256dh?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          count: number
          created_at: string
          key: string
          reset_at: string
        }
        Insert: {
          count?: number
          created_at?: string
          key: string
          reset_at: string
        }
        Update: {
          count?: number
          created_at?: string
          key?: string
          reset_at?: string
        }
        Relationships: []
      }
      related_products: {
        Row: {
          id: string
          relation_type: string
          sort_order: number | null
          source_product_id: string
          target_product_id: string
        }
        Insert: {
          id?: string
          relation_type?: string
          sort_order?: number | null
          source_product_id: string
          target_product_id: string
        }
        Update: {
          id?: string
          relation_type?: string
          sort_order?: number | null
          source_product_id?: string
          target_product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "related_products_source_product_id_fkey"
            columns: ["source_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "related_products_target_product_id_fkey"
            columns: ["target_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      returns: {
        Row: {
          created_at: string
          id: string
          items: Json | null
          notes: string | null
          order_id: string
          reason: string
          refund_amount: number | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          items?: Json | null
          notes?: string | null
          order_id: string
          reason: string
          refund_amount?: number | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          items?: Json | null
          notes?: string | null
          order_id?: string
          reason?: string
          refund_amount?: number | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "returns_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          action: string
          allowed: boolean
          id: string
          resource: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          action: string
          allowed?: boolean
          id?: string
          resource: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          action?: string
          allowed?: boolean
          id?: string
          resource?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
      romania_judete: {
        Row: {
          auto: string | null
          cod: string
          id: string
          nume: string
        }
        Insert: {
          auto?: string | null
          cod: string
          id?: string
          nume: string
        }
        Update: {
          auto?: string | null
          cod?: string
          id?: string
          nume?: string
        }
        Relationships: []
      }
      romania_localitati: {
        Row: {
          cod_postal: string | null
          id: string
          judet_cod: string
          nume: string
          tip: string | null
        }
        Insert: {
          cod_postal?: string | null
          id?: string
          judet_cod: string
          nume: string
          tip?: string | null
        }
        Update: {
          cod_postal?: string | null
          id?: string
          judet_cod?: string
          nume?: string
          tip?: string | null
        }
        Relationships: []
      }
      seo_redirects: {
        Row: {
          created_at: string
          hits: number
          id: string
          is_active: boolean
          redirect_type: number
          source_path: string
          target_path: string
        }
        Insert: {
          created_at?: string
          hits?: number
          id?: string
          is_active?: boolean
          redirect_type?: number
          source_path: string
          target_path: string
        }
        Update: {
          created_at?: string
          hits?: number
          id?: string
          is_active?: boolean
          redirect_type?: number
          source_path?: string
          target_path?: string
        }
        Relationships: []
      }
      site_banners: {
        Row: {
          created_at: string
          ends_at: string | null
          id: string
          image_url: string | null
          is_active: boolean
          link_url: string | null
          position: string
          sort_order: number | null
          starts_at: string | null
          subtitle: string | null
          title: string
        }
        Insert: {
          created_at?: string
          ends_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          link_url?: string | null
          position?: string
          sort_order?: number | null
          starts_at?: string | null
          subtitle?: string | null
          title: string
        }
        Update: {
          created_at?: string
          ends_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          link_url?: string | null
          position?: string
          sort_order?: number | null
          starts_at?: string | null
          subtitle?: string | null
          title?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          id: string
          key: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string | null
          value?: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string | null
          value?: Json
        }
        Relationships: []
      }
      sms_log: {
        Row: {
          cost: number | null
          created_at: string
          error: string | null
          id: string
          message: string
          provider: string | null
          provider_id: string | null
          recipient_phone: string
          status: string
        }
        Insert: {
          cost?: number | null
          created_at?: string
          error?: string | null
          id?: string
          message: string
          provider?: string | null
          provider_id?: string | null
          recipient_phone: string
          status?: string
        }
        Update: {
          cost?: number | null
          created_at?: string
          error?: string | null
          id?: string
          message?: string
          provider?: string | null
          provider_id?: string | null
          recipient_phone?: string
          status?: string
        }
        Relationships: []
      }
      stock_adjustments: {
        Row: {
          adjustment_type: string
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          created_by: string | null
          id: string
          notes: string | null
          product_id: string
          quantity: number
          reason: string
          status: string | null
          warehouse_id: string | null
        }
        Insert: {
          adjustment_type: string
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          notes?: string | null
          product_id: string
          quantity: number
          reason: string
          status?: string | null
          warehouse_id?: string | null
        }
        Update: {
          adjustment_type?: string
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          notes?: string | null
          product_id?: string
          quantity?: number
          reason?: string
          status?: string | null
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_adjustments_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_adjustments_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_alert_log: {
        Row: {
          alerted_at: string
          id: string
          product_id: string
          stock_at_alert: number
          threshold: number | null
        }
        Insert: {
          alerted_at?: string
          id?: string
          product_id: string
          stock_at_alert?: number
          threshold?: number | null
        }
        Update: {
          alerted_at?: string
          id?: string
          product_id?: string
          stock_at_alert?: number
          threshold?: number | null
        }
        Relationships: []
      }
      stock_alerts: {
        Row: {
          category_id: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          last_triggered_at: string | null
          min_threshold: number | null
          notify_email: string | null
          product_id: string | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          min_threshold?: number | null
          notify_email?: string | null
          product_id?: string | null
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          min_threshold?: number | null
          notify_email?: string | null
          product_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_alerts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_alerts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_levels: {
        Row: {
          available: number | null
          id: string
          location_code: string | null
          product_id: string
          reserved: number | null
          updated_at: string | null
          warehouse_id: string
        }
        Insert: {
          available?: number | null
          id?: string
          location_code?: string | null
          product_id: string
          reserved?: number | null
          updated_at?: string | null
          warehouse_id: string
        }
        Update: {
          available?: number | null
          id?: string
          location_code?: string | null
          product_id?: string
          reserved?: number | null
          updated_at?: string | null
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_levels_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_levels_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          created_at: string | null
          id: string
          movement_type: string
          new_stock: number | null
          performed_by: string | null
          previous_stock: number | null
          product_id: string
          quantity: number
          reason: string | null
          reference_id: string | null
          reference_type: string | null
          warehouse_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          movement_type: string
          new_stock?: number | null
          performed_by?: string | null
          previous_stock?: number | null
          product_id: string
          quantity: number
          reason?: string | null
          reference_id?: string | null
          reference_type?: string | null
          warehouse_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          movement_type?: string
          new_stock?: number | null
          performed_by?: string | null
          previous_stock?: number | null
          product_id?: string
          quantity?: number
          reason?: string | null
          reference_id?: string | null
          reference_type?: string | null
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_notifications: {
        Row: {
          created_at: string
          email: string
          id: string
          notified_at: string | null
          product_id: string
          user_id: string | null
          variant_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          notified_at?: string | null
          product_id: string
          user_id?: string | null
          variant_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          notified_at?: string | null
          product_id?: string
          user_id?: string | null
          variant_id?: string | null
        }
        Relationships: []
      }
      stock_transfer_items: {
        Row: {
          id: string
          product_id: string
          quantity: number
          received_quantity: number | null
          transfer_id: string
        }
        Insert: {
          id?: string
          product_id: string
          quantity?: number
          received_quantity?: number | null
          transfer_id: string
        }
        Update: {
          id?: string
          product_id?: string
          quantity?: number
          received_quantity?: number | null
          transfer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_transfer_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_transfer_items_transfer_id_fkey"
            columns: ["transfer_id"]
            isOneToOne: false
            referencedRelation: "stock_transfers"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_transfers: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          created_by: string | null
          from_warehouse_id: string
          id: string
          notes: string | null
          received_at: string | null
          status: string | null
          to_warehouse_id: string
          transfer_number: string
          updated_at: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          created_by?: string | null
          from_warehouse_id: string
          id?: string
          notes?: string | null
          received_at?: string | null
          status?: string | null
          to_warehouse_id: string
          transfer_number: string
          updated_at?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          created_by?: string | null
          from_warehouse_id?: string
          id?: string
          notes?: string | null
          received_at?: string | null
          status?: string | null
          to_warehouse_id?: string
          transfer_number?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_transfers_from_warehouse_id_fkey"
            columns: ["from_warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_transfers_to_warehouse_id_fkey"
            columns: ["to_warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          city: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          county: string | null
          created_at: string | null
          cui: string | null
          discount_percent: number | null
          id: string
          is_active: boolean | null
          name: string
          notes: string | null
          payment_terms: number | null
          product_categories: string | null
          rating: number | null
          reg_com: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          county?: string | null
          created_at?: string | null
          cui?: string | null
          discount_percent?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          notes?: string | null
          payment_terms?: number | null
          product_categories?: string | null
          rating?: number | null
          reg_com?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          county?: string | null
          created_at?: string | null
          cui?: string | null
          discount_percent?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          notes?: string | null
          payment_terms?: number | null
          product_categories?: string | null
          rating?: number | null
          reg_com?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          category: string | null
          created_at: string
          customer_email: string
          customer_name: string
          customer_phone: string | null
          description: string | null
          id: string
          order_id: string | null
          priority: string
          resolved_at: string | null
          sla_deadline: string | null
          status: string
          subject: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          category?: string | null
          created_at?: string
          customer_email: string
          customer_name: string
          customer_phone?: string | null
          description?: string | null
          id?: string
          order_id?: string | null
          priority?: string
          resolved_at?: string | null
          sla_deadline?: string | null
          status?: string
          subject: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          category?: string | null
          created_at?: string
          customer_email?: string
          customer_name?: string
          customer_phone?: string | null
          description?: string | null
          id?: string
          order_id?: string | null
          priority?: string
          resolved_at?: string | null
          sla_deadline?: string | null
          status?: string
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          sender_name: string | null
          sender_type: string
          ticket_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          sender_name?: string | null
          sender_type?: string
          ticket_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          sender_name?: string | null
          sender_type?: string
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
      two_factor_auth: {
        Row: {
          backup_codes: string[] | null
          created_at: string
          id: string
          is_enabled: boolean
          last_used_at: string | null
          secret: string
          user_id: string
        }
        Insert: {
          backup_codes?: string[] | null
          created_at?: string
          id?: string
          is_enabled?: boolean
          last_used_at?: string | null
          secret: string
          user_id: string
        }
        Update: {
          backup_codes?: string[] | null
          created_at?: string
          id?: string
          is_enabled?: boolean
          last_used_at?: string | null
          secret?: string
          user_id?: string
        }
        Relationships: []
      }
      user_notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          message: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      user_points: {
        Row: {
          balance: number
          id: string
          lifetime_points: number
          tier: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          id?: string
          lifetime_points?: number
          tier?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          id?: string
          lifetime_points?: number
          tier?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      wallet_transactions: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          created_by: string | null
          id: string
          order_id: string | null
          reason: string | null
          type: string
          wallet_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string
          created_by?: string | null
          id?: string
          order_id?: string | null
          reason?: string | null
          type: string
          wallet_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          created_by?: string | null
          id?: string
          order_id?: string | null
          reason?: string | null
          type?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "customer_wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouses: {
        Row: {
          address: string | null
          capacity: number | null
          city: string | null
          county: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          notes: string | null
          responsible_name: string | null
          responsible_phone: string | null
          updated_at: string | null
          warehouse_type: string | null
        }
        Insert: {
          address?: string | null
          capacity?: number | null
          city?: string | null
          county?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          notes?: string | null
          responsible_name?: string | null
          responsible_phone?: string | null
          updated_at?: string | null
          warehouse_type?: string | null
        }
        Update: {
          address?: string | null
          capacity?: number | null
          city?: string | null
          county?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          notes?: string | null
          responsible_name?: string | null
          responsible_phone?: string | null
          updated_at?: string | null
          warehouse_type?: string | null
        }
        Relationships: []
      }
      webhook_queue: {
        Row: {
          attempts: number
          created_at: string
          delivered_at: string | null
          event_type: string
          id: string
          last_error: string | null
          next_retry_at: string | null
          payload: Json
          status: string
          webhook_id: string | null
        }
        Insert: {
          attempts?: number
          created_at?: string
          delivered_at?: string | null
          event_type: string
          id?: string
          last_error?: string | null
          next_retry_at?: string | null
          payload?: Json
          status?: string
          webhook_id?: string | null
        }
        Update: {
          attempts?: number
          created_at?: string
          delivered_at?: string | null
          event_type?: string
          id?: string
          last_error?: string | null
          next_retry_at?: string | null
          payload?: Json
          status?: string
          webhook_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "webhook_queue_webhook_id_fkey"
            columns: ["webhook_id"]
            isOneToOne: false
            referencedRelation: "external_webhooks"
            referencedColumns: ["id"]
          },
        ]
      }
      winback_campaigns: {
        Row: {
          created_at: string
          discount_percent: number | null
          email_body: string | null
          email_subject: string | null
          id: string
          is_active: boolean
          name: string
          trigger_days_inactive: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          discount_percent?: number | null
          email_body?: string | null
          email_subject?: string | null
          id?: string
          is_active?: boolean
          name: string
          trigger_days_inactive?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          discount_percent?: number | null
          email_body?: string | null
          email_subject?: string | null
          id?: string
          is_active?: boolean
          name?: string
          trigger_days_inactive?: number
          updated_at?: string
        }
        Relationships: []
      }
      winback_enrollments: {
        Row: {
          campaign_id: string | null
          converted: boolean | null
          converted_at: string | null
          created_at: string
          email: string
          id: string
          sent_at: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          campaign_id?: string | null
          converted?: boolean | null
          converted_at?: string | null
          created_at?: string
          email: string
          id?: string
          sent_at?: string | null
          status?: string
          user_id?: string | null
        }
        Update: {
          campaign_id?: string | null
          converted?: boolean | null
          converted_at?: string | null
          created_at?: string
          email?: string
          id?: string
          sent_at?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "winback_enrollments_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "winback_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_rate_limit: {
        Args: { p_key: string; p_limit: number; p_window_seconds: number }
        Returns: {
          allowed: boolean
          current_count: number
          reset_at: string
        }[]
      }
      compute_tier: { Args: { pts: number }; Returns: string }
      decrement_stock: {
        Args: { p_product_id: string; p_quantity: number }
        Returns: undefined
      }
      generate_order_number: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      redeem_gift_card: {
        Args: { p_amount: number; p_code: string; p_order_id?: string }
        Returns: {
          message: string
          new_balance: number
          success: boolean
        }[]
      }
      search_categories_unaccent: {
        Args: { lim?: number; term: string }
        Returns: {
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          image_url: string | null
          name: string
          parent_id: string | null
          slug: string
          sort_order: number | null
          visible: boolean | null
        }[]
        SetofOptions: {
          from: "*"
          to: "categories"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      search_product_ids_unaccent: {
        Args: { term: string }
        Returns: {
          id: string
        }[]
      }
      search_products_unaccent: {
        Args: { lim?: number; term: string }
        Returns: {
          allow_backorder: boolean | null
          badge: string | null
          badge_type: string | null
          barcode: string | null
          brand: string | null
          category_id: string | null
          cost_price: number | null
          countdown_end: string | null
          created_at: string | null
          description: string | null
          digital_file_url: string | null
          digital_max_downloads: number | null
          gallery: Json | null
          height_cm: number | null
          id: string
          image_url: string | null
          internal_notes: string | null
          is_active: boolean | null
          is_digital: boolean | null
          is_featured: boolean | null
          length_cm: number | null
          meta_description: string | null
          meta_title: string | null
          min_stock_alert: number | null
          name: string
          old_price: number | null
          price: number
          promo_end: string | null
          promo_start: string | null
          rating: number | null
          reviews_count: number | null
          short_description: string | null
          sku: string | null
          slug: string
          sold_count: number
          sort_order: number | null
          stock: number | null
          updated_at: string | null
          weight: string | null
          width_cm: number | null
        }[]
        SetofOptions: {
          from: "*"
          to: "products"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      update_reviews_count: {
        Args: { p_product_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
    },
  },
} as const
