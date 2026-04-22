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
          session_id?: string
          subtotal?: number
          total?: number
          updated_at?: string
          user_id?: string | null
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
          billing_type: string | null
          city: string | null
          company_cui: string | null
          company_name: string | null
          company_reg: string | null
          county: string | null
          created_at: string | null
          customer_email: string
          customer_name: string
          customer_phone: string | null
          discount: number | null
          discount_amount: number | null
          discount_code: string | null
          id: string
          items: Json
          notes: string | null
          order_number: string
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
        }
        Insert: {
          billing_type?: string | null
          city?: string | null
          company_cui?: string | null
          company_name?: string | null
          company_reg?: string | null
          county?: string | null
          created_at?: string | null
          customer_email: string
          customer_name: string
          customer_phone?: string | null
          discount?: number | null
          discount_amount?: number | null
          discount_code?: string | null
          id?: string
          items?: Json
          notes?: string | null
          order_number: string
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
        }
        Update: {
          billing_type?: string | null
          city?: string | null
          company_cui?: string | null
          company_name?: string | null
          company_reg?: string | null
          county?: string | null
          created_at?: string | null
          customer_email?: string
          customer_name?: string
          customer_phone?: string | null
          discount?: number | null
          discount_amount?: number | null
          discount_code?: string | null
          id?: string
          items?: Json
          notes?: string | null
          order_number?: string
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
        }
        Relationships: []
      }
      product_reviews: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          product_id: string
          rating: number
          status: string | null
          title: string | null
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          product_id: string
          rating: number
          status?: string | null
          title?: string | null
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          product_id?: string
          rating?: number
          status?: string | null
          title?: string | null
          user_id?: string
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
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
