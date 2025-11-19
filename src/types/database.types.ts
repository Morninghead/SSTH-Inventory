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
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          ip_address: unknown
          log_id: string
          new_values: Json | null
          old_values: Json | null
          record_id: string | null
          table_name: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          ip_address?: unknown
          log_id?: string
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          ip_address?: unknown
          log_id?: string
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          category_code: string
          category_id: string
          category_name: string
          created_at: string | null
          description: string | null
          is_active: boolean | null
        }
        Insert: {
          category_code: string
          category_id?: string
          category_name: string
          created_at?: string | null
          description?: string | null
          is_active?: boolean | null
        }
        Update: {
          category_code?: string
          category_id?: string
          category_name?: string
          created_at?: string | null
          description?: string | null
          is_active?: boolean | null
        }
        Relationships: []
      }
      departments: {
        Row: {
          created_at: string | null
          dept_code: string
          dept_id: string
          dept_name: string
          is_active: boolean | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          dept_code: string
          dept_id?: string
          dept_name: string
          is_active?: boolean | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          dept_code?: string
          dept_id?: string
          dept_name?: string
          is_active?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      inventory_status: {
        Row: {
          item_id: string
          quantity: number | null
          updated_at: string | null
        }
        Insert: {
          item_id: string
          quantity?: number | null
          updated_at?: string | null
        }
        Update: {
          item_id?: string
          quantity?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_status_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: true
            referencedRelation: "items"
            referencedColumns: ["item_id"]
          },
        ]
      }
      items: {
        Row: {
          base_uom: string
          category_id: string | null
          created_at: string | null
          created_by: string
          description: string
          image_path: string | null
          image_url: string | null
          is_active: boolean | null
          item_code: string
          item_id: string
          reorder_level: number | null
          unit_cost: number | null
          updated_at: string | null
        }
        Insert: {
          base_uom: string
          category_id?: string | null
          created_at?: string | null
          created_by: string
          description: string
          image_path?: string | null
          image_url?: string | null
          is_active?: boolean | null
          item_code: string
          item_id?: string
          reorder_level?: number | null
          unit_cost?: number | null
          updated_at?: string | null
        }
        Update: {
          base_uom?: string
          category_id?: string | null
          created_at?: string | null
          created_by?: string
          description?: string
          image_path?: string | null
          image_url?: string | null
          is_active?: boolean | null
          item_code?: string
          item_id?: string
          reorder_level?: number | null
          unit_cost?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "items_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          address: string | null
          created_at: string | null
          is_active: boolean | null
          location_code: string
          location_id: string
          location_name: string
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          is_active?: boolean | null
          location_code: string
          location_id?: string
          location_name: string
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          is_active?: boolean | null
          location_code?: string
          location_id?: string
          location_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      purchase_order: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          created_by: string
          expected_date: string | null
          notes: string | null
          po_date: string | null
          po_id: string
          po_number: string
          status: string | null
          supplier_id: string
          total_amount: number | null
          updated_at: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          created_by: string
          expected_date?: string | null
          notes?: string | null
          po_date?: string | null
          po_id?: string
          po_number: string
          status?: string | null
          supplier_id: string
          total_amount?: number | null
          updated_at?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          created_by?: string
          expected_date?: string | null
          notes?: string | null
          po_date?: string | null
          po_id?: string
          po_number?: string
          status?: string | null
          supplier_id?: string
          total_amount?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["supplier_id"]
          },
        ]
      }
      purchase_order_line: {
        Row: {
          created_at: string | null
          item_id: string
          line_total: number | null
          notes: string | null
          po_id: string
          po_line_id: string
          quantity: number
          quantity_received: number | null
          unit_cost: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          item_id: string
          line_total?: number | null
          notes?: string | null
          po_id: string
          po_line_id?: string
          quantity: number
          quantity_received?: number | null
          unit_cost: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          item_id?: string
          line_total?: number | null
          notes?: string | null
          po_id?: string
          po_line_id?: string
          quantity?: number
          quantity_received?: number | null
          unit_cost?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_line_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["item_id"]
          },
          {
            foreignKeyName: "purchase_order_line_po_id_fkey"
            columns: ["po_id"]
            isOneToOne: false
            referencedRelation: "purchase_order"
            referencedColumns: ["po_id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          contact_name: string | null
          created_at: string | null
          email: string | null
          is_active: boolean | null
          phone: string | null
          supplier_code: string
          supplier_id: string
          supplier_name: string
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          contact_name?: string | null
          created_at?: string | null
          email?: string | null
          is_active?: boolean | null
          phone?: string | null
          supplier_code: string
          supplier_id?: string
          supplier_name: string
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          contact_name?: string | null
          created_at?: string | null
          email?: string | null
          is_active?: boolean | null
          phone?: string | null
          supplier_code?: string
          supplier_id?: string
          supplier_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          setting_id: string
          setting_key: string
          setting_value: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          setting_id?: string
          setting_key: string
          setting_value?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          setting_id?: string
          setting_key?: string
          setting_value?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      transaction_lines: {
        Row: {
          created_at: string | null
          item_id: string
          line_id: string
          line_total: number | null
          notes: string | null
          quantity: number
          transaction_id: string
          unit_cost: number | null
        }
        Insert: {
          created_at?: string | null
          item_id: string
          line_id?: string
          line_total?: number | null
          notes?: string | null
          quantity: number
          transaction_id: string
          unit_cost?: number | null
        }
        Update: {
          created_at?: string | null
          item_id?: string
          line_id?: string
          line_total?: number | null
          notes?: string | null
          quantity?: number
          transaction_id?: string
          unit_cost?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "transaction_lines_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["item_id"]
          },
          {
            foreignKeyName: "transaction_lines_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["transaction_id"]
          },
        ]
      }
      transactions: {
        Row: {
          created_at: string | null
          created_by: string
          department_id: string | null
          notes: string | null
          reference_number: string | null
          status: string | null
          supplier_id: string | null
          transaction_date: string | null
          transaction_id: string
          transaction_type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          department_id?: string | null
          notes?: string | null
          reference_number?: string | null
          status?: string | null
          supplier_id?: string | null
          transaction_date?: string | null
          transaction_id?: string
          transaction_type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          department_id?: string | null
          notes?: string | null
          reference_number?: string | null
          status?: string | null
          supplier_id?: string | null
          transaction_date?: string | null
          transaction_id?: string
          transaction_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["dept_id"]
          },
          {
            foreignKeyName: "transactions_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["supplier_id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          created_at: string | null
          preference_id: string
          preference_key: string
          preference_value: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          preference_id?: string
          preference_key: string
          preference_value?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          preference_id?: string
          preference_key?: string
          preference_value?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          created_at: string | null
          department_id: string | null
          full_name: string | null
          id: string
          is_active: boolean | null
          role: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          department_id?: string | null
          full_name?: string | null
          id: string
          is_active?: boolean | null
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          department_id?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          role?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["dept_id"]
          },
        ]
      }
      ai_predictions: {
        Row: {
          approval_chain: Json | null
          confidence_score: number | null
          created_at: string | null
          department_id: string | null
          factors_used: Json | null
          item_id: string
          model_version: string | null
          prediction_id: string
          prediction_date: string
          prediction_type: string
          predicted_value: number
          status: string | null
          updated_at: string | null
        }
        Insert: {
          approval_chain?: Json | null
          confidence_score?: number | null
          created_at?: string | null
          department_id?: string | null
          factors_used?: Json | null
          item_id: string
          model_version?: string | null
          prediction_date: string
          prediction_type: string
          predicted_value: number
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          approval_chain?: Json | null
          confidence_score?: number | null
          created_at?: string | null
          department_id?: string | null
          factors_used?: Json | null
          item_id?: string
          model_version?: string | null
          prediction_date?: string
          prediction_type?: string
          predicted_value?: number
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_predictions_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["department_id"]
          },
          {
            foreignKeyName: "ai_predictions_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["item_id"]
          },
        ]
      }
      automated_issues: {
        Row: {
          adjusted_quantity: number | null
          adjusted_reason: string | null
          approval_chain: Json | null
          approval_notes: string | null
          approver_id: string | null
          auto_generated_score: number | null
          ai_generated: boolean | null
          cost_impact: number | null
          created_at: string | null
          department_id: string
          issue_id: string
          item_id: string
          original_transaction_id: string | null
          predicted_need_id: string | null
          quantity: number
          reason: string
          status: string | null
          urgency_level: string | null
          updated_at: string | null
        }
        Insert: {
          adjusted_quantity?: number | null
          adjusted_reason?: string | null
          approval_chain?: Json | null
          approval_notes?: string | null
          approver_id?: string | null
          auto_generated_score?: number | null
          ai_generated?: boolean | null
          cost_impact?: number | null
          created_at?: string | null
          department_id: string
          item_id: string
          original_transaction_id?: string | null
          predicted_need_id?: string | null
          quantity: number
          reason: string
          status?: string | null
          urgency_level?: string | null
          updated_at?: string | null
        }
        Update: {
          adjusted_quantity?: number | null
          adjusted_reason?: string | null
          approval_chain?: Json | null
          approval_notes?: string | null
          approver_id?: string | null
          auto_generated_score?: number | null
          ai_generated?: boolean | null
          cost_impact?: number | null
          created_at?: string | null
          department_id?: string
          item_id?: string
          original_transaction_id?: string | null
          predicted_need_id?: string | null
          quantity?: number
          reason?: string
          status?: string | null
          urgency_level?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "automated_issues_approver_id_fkey"
            columns: ["approver_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "automated_issues_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["department_id"]
          },
          {
            foreignKeyName: "automated_issues_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["item_id"]
          },
          {
            foreignKeyName: "automated_issues_original_transaction_id_fkey"
            columns: ["original_transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["transaction_id"]
          },
          {
            foreignKeyName: "automated_issues_predicted_need_id_fkey"
            columns: ["predicted_need_id"]
            isOneToOne: false
            referencedRelation: "ai_predictions"
            referencedColumns: ["prediction_id"]
          },
        ]
      }
      department_usage_patterns: {
        Row: {
          avg_monthly_usage: number | null
          confidence_level: number | null
          created_at: string | null
          data_points_count: number | null
          department_id: string
          item_id: string
          last_updated: string | null
          pattern_id: string
          seasonal_multiplier: number | null
          trend_direction: string | null
          trend_strength: number | null
          updated_at: string | null
        }
        Insert: {
          avg_monthly_usage?: number | null
          confidence_level?: number | null
          created_at?: string | null
          data_points_count?: number | null
          department_id: string
          item_id: string
          last_updated?: string | null
          seasonal_multiplier?: number | null
          trend_direction?: string | null
          trend_strength?: number | null
          updated_at?: string | null
        }
        Update: {
          avg_monthly_usage?: number | null
          confidence_level?: number | null
          created_at?: string | null
          data_points_count?: number | null
          department_id?: string
          item_id?: string
          last_updated?: string | null
          seasonal_multiplier?: number | null
          trend_direction?: string | null
          trend_strength?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "department_usage_patterns_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["department_id"]
          },
          {
            foreignKeyName: "department_usage_patterns_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["item_id"]
          },
        ]
      }
      ai_insights: {
        Row: {
          action_required: boolean | null
          affected_departments: string[] | null
          affected_items: string[] | null
          created_at: string | null
          description: string
          expires_at: string | null
          impact_level: string | null
            implemented_at: string | null
          insight_id: string
          insight_type: string
          metadata: Json | null
          potential_savings: number | null
          recommendation: string
          reviewed_by: string | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          action_required?: boolean | null
          affected_departments?: string[] | null
          affected_items?: string[] | null
          created_at?: string | null
          description: string
          expires_at?: string | null
          impact_level?: string | null
          implemented_at?: string | null
          insight_type: string
          metadata?: Json | null
          potential_savings?: number | null
          recommendation: string
          reviewed_by?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          action_required?: boolean | null
          affected_departments?: string[] | null
          affected_items?: string[] | null
          created_at?: string | null
          description?: string
          expires_at?: string | null
          impact_level?: string | null
          implemented_at?: string | null
          insight_type?: string
          metadata?: Json | null
          potential_savings?: number | null
          recommendation?: string
          reviewed_by?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_insights_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      ai_model_performance: {
        Row: {
          accuracy_score: number | null
          created_at: string | null
          is_active: boolean | null
          last_trained_at: string | null
          mean_absolute_error: number | null
          model_name: string
          model_version: string
          notes: string | null
          performance_id: string
          precision_score: number | null
          recall_score: number | null
          training_data_points: number | null
          validation_data_points: number | null
        }
        Insert: {
          accuracy_score?: number | null
          created_at?: string | null
          is_active?: boolean | null
          last_trained_at?: string | null
          mean_absolute_error?: number | null
          model_name: string
          model_version: string
          notes?: string | null
          precision_score?: number | null
          recall_score?: number | null
          training_data_points?: number | null
          validation_data_points?: number | null
        }
        Update: {
          accuracy_score?: number | null
          created_at?: string | null
          is_active?: boolean | null
          last_trained_at?: string | null
          mean_absolute_error?: number | null
          model_name?: string
          model_version?: string
          notes?: string | null
          precision_score?: number | null
          recall_score?: number | null
          training_data_points?: number | null
          validation_data_points?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_reset_password: {
        Args: { p_admin_id?: string; p_new_password: string; p_user_id: string }
        Returns: {
          message: string
          success: boolean
        }[]
      }
      bulk_update_settings: {
        Args: { p_settings: Json; p_updated_by?: string }
        Returns: Json
      }
      cancel_purchase_order:
        | {
            Args: {
              p_cancelled_by?: string
              p_po_id: string
              p_reason?: string
            }
            Returns: {
              message: string
              success: boolean
            }[]
          }
        | { Args: { p_po_id: string }; Returns: undefined }
      check_sku_exists: { Args: { input_sku: string }; Returns: boolean }
      check_stock_availability: {
        Args: { item_ids: string[] }
        Returns: {
          current_quantity: number
          description: string
          item_code: string
          item_id: string
          reorder_level: number
        }[]
      }
      create_alert_rule: {
        Args: {
          p_conditions: Json
          p_created_by?: string
          p_notification_channels: Json
          p_recipients: Json
          p_rule_name: string
          p_rule_type: string
        }
        Returns: Json
      }
      create_new_user: {
        Args: {
          p_dept_id?: string
          p_email: string
          p_full_name: string
          p_password: string
          p_role: string
        }
        Returns: string
      }
      create_purchase_order:
        | {
            Args: {
              p_created_by?: string
              p_delivery_date?: string
              p_items?: Json
              p_notes?: string
              p_po_date: string
              p_supplier_id: string
            }
            Returns: {
              message: string
              po_id: string
              po_number: string
              success: boolean
            }[]
          }
        | {
            Args: {
              p_created_by: string
              p_items: Database["public"]["CompositeTypes"]["po_line_item_input"][]
              p_po_date: string
              p_supplier_id: string
            }
            Returns: string
          }
        | {
            Args: {
              p_created_by: string
              p_items: Json
              p_po_date: string
              p_supplier_id: string
            }
            Returns: string
          }
      create_user: {
        Args: {
          p_created_by?: string
          p_department_id?: string
          p_email: string
          p_full_name: string
          p_password: string
          p_role: string
        }
        Returns: {
          message: string
          success: boolean
          user_id: string
        }[]
      }
      delete_alert_rule: {
        Args: { p_deleted_by?: string; p_rule_id: string }
        Returns: Json
      }
      delete_supplier: { Args: { p_supplier_id: string }; Returns: undefined }
      delete_user: {
        Args: { p_deleted_by?: string; p_user_id: string }
        Returns: {
          message: string
          success: boolean
        }[]
      }
      ensure_foreign_key: {
        Args: {
          p_columns: string[]
          p_fk_name: string
          p_on_delete?: string
          p_on_update?: string
          p_ref_columns: string[]
          p_ref_table: unknown
          p_table: unknown
        }
        Returns: undefined
      }
      ensure_index: {
        Args: {
          p_columns: string
          p_index_name: string
          p_table: unknown
          p_using?: string
          p_where?: string
        }
        Returns: undefined
      }
      ensure_primary_key: {
        Args: { p_columns: string[]; p_pk_name: string; p_table: unknown }
        Returns: undefined
      }
      ensure_unique: {
        Args: { p_columns: string[]; p_table: unknown; p_uk_name: string }
        Returns: undefined
      }
      fn_calculate_abc_xyz_classification: { Args: never; Returns: Json }
      fn_create_issue_bulk: {
        Args: {
          p_dept_id: number
          p_items: Json
          p_reason: string
          p_requester_name: string
          p_user_id?: string
        }
        Returns: Json
      }
      fn_create_notification_from_template: {
        Args: {
          p_channels: Json
          p_recipients: Json
          p_rule_id: string
          p_template_type: string
          p_variables: Json
        }
        Returns: Json
      }
      fn_generate_cycle_tasks:
        | {
            Args: {
              p_abc_class?: string
              p_days_ahead?: number
              p_xyz_class?: string
            }
            Returns: number
          }
        | {
            Args: {
              p_abc_class?: string
              p_days_ahead?: number
              p_location_id?: string
              p_xyz_class?: string
            }
            Returns: number
          }
      fn_next_tx_id: { Args: never; Returns: string }
      fn_receive_partial: {
        Args: {
          p_delivery_date: string
          p_location_id?: string
          p_po_line_id: string
          p_qty_received: number
          p_supplier_name?: string
          p_user_id?: string
        }
        Returns: Json
      }
      fn_send_slack_alert: {
        Args: { p_event_type: string; p_payload: Json }
        Returns: boolean
      }
      fn_stock_reconciliation: {
        Args: {
          p_end_date: string
          p_location_id?: string
          p_start_date: string
        }
        Returns: {
          discrepancy: number
          expected_stock: number
          item_code: string
          opening_balance: number
          physical_stock: number
          total_issued: number
          total_received: number
        }[]
      }
      generate_unique_sku: { Args: { base_sku: string }; Returns: string }
      get_alert_rules: {
        Args: never
        Returns: {
          conditions: Json
          created_at: string
          is_active: boolean
          notification_channels: Json
          recipients: Json
          rule_id: string
          rule_name: string
          rule_type: string
          updated_at: string
        }[]
      }
      get_asset_assignments: {
        Args: { limit_count?: number; status_filter?: string }
        Returns: {
          actual_return_date: string
          assigned_by: string
          assigned_to_department: string
          assigned_to_name: string
          assignment_date: string
          assignment_id: string
          assignment_item_name: string
          assignment_sku: string
          assignment_status: string
          condition_assigned: string
          condition_returned: string
          expected_return_date: string
        }[]
      }
      get_audit_logs: {
        Args: {
          p_action?: string
          p_end_date?: string
          p_limit?: number
          p_start_date?: string
          p_table_name?: string
          p_user_id?: string
        }
        Returns: {
          action: string
          created_at: string
          log_id: string
          new_values: Json
          old_values: Json
          record_id: string
          table_name: string
          user_id: string
          user_name: string
        }[]
      }
      get_dashboard_data: { Args: never; Returns: Json }
      get_dashboard_stats: { Args: never; Returns: Json }
      get_internal_requests: {
        Args: { limit_count?: number; status_filter?: string }
        Returns: {
          approved_by: string
          approved_date: string
          approved_quantity: number
          fulfilled_date: string
          request_date: string
          request_department: string
          request_id: string
          request_item_name: string
          request_no: string
          request_priority: string
          request_purpose: string
          request_sku: string
          request_status: string
          requested_by: string
          requested_quantity: number
        }[]
      }
      get_inventory_items: {
        Args: {
          category_filter?: string
          item_limit?: number
          search_term?: string
        }
        Returns: {
          item_asset_tag: string
          item_category: string
          item_cost: number
          item_created_at: string
          item_department_owner: string
          item_id: string
          item_image_url: string
          item_location: string
          item_maintenance_schedule: string
          item_name: string
          item_quantity: number
          item_reorder_level: number
          item_sku: string
          item_status: string
          item_supplier: string
          item_unit: string
          item_warranty_expires: string
          stock_status: string
          total_value: number
        }[]
      }
      get_items_paginated:
        | {
            Args: {
              p_active_filter: string
              p_limit: number
              p_offset: number
              p_search_term: string
              p_status_filter: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_limit: number
              p_offset: number
              p_search_term: string
              p_status_filter: string
            }
            Returns: Json
          }
      get_low_stock_items: {
        Args: { p_limit?: number }
        Returns: {
          description: string
          item_code: string
          item_id: string
          quantity: number
          reorder_level: number
        }[]
      }
      get_out_of_stock_items: {
        Args: { p_limit?: number }
        Returns: {
          description: string
          item_code: string
          item_id: string
        }[]
      }
      get_po_details: { Args: { p_po_id: string }; Returns: Json }
      get_purchase_order_details: {
        Args: { p_po_id: string }
        Returns: {
          created_at: string
          created_by: string
          created_by_name: string
          delivery_date: string
          line_items: Json
          notes: string
          po_date: string
          po_id: string
          po_number: string
          status: string
          supplier_id: string
          supplier_name: string
        }[]
      }
      get_purchase_orders: {
        Args: {
          p_date_from?: string
          p_date_to?: string
          p_limit?: number
          p_status?: string
          p_supplier_id?: string
        }
        Returns: {
          created_by_name: string
          delivery_date: string
          line_count: number
          po_date: string
          po_id: string
          po_number: string
          status: string
          supplier_id: string
          supplier_name: string
          total_amount: number
        }[]
      }
      get_purchase_orders_paginated: {
        Args: {
          p_limit: number
          p_offset: number
          p_search_term: string
          p_status_filter: string
        }
        Returns: Json
      }
      get_recent_items: {
        Args: { limit_count?: number }
        Returns: {
          item_category: string
          item_id: string
          item_name: string
          item_quantity: number
          item_sku: string
          item_unit: string
          item_updated_at: string
        }[]
      }
      get_recent_transactions: {
        Args: { p_limit?: number }
        Returns: {
          dept_name: string
          item_count: number
          reference_no: string
          transaction_date: string
          transaction_id: string
          transaction_type: string
          user_full_name: string
        }[]
      }
      get_report_data: {
        Args: { p_end_date: string; p_start_date: string }
        Returns: Json
      }
      get_suppliers_paginated: {
        Args: { p_limit: number; p_offset: number; p_search_term: string }
        Returns: Json
      }
      get_system_settings: {
        Args: never
        Returns: {
          category: string
          description: string
          setting_key: string
          setting_value: string
          updated_at: string
        }[]
      }
      get_transaction_details: {
        Args: { p_transaction_id: string }
        Returns: Json
      }
      get_transaction_history: {
        Args: {
          p_date_from?: string
          p_date_to?: string
          p_department_id?: string
          p_limit?: number
          p_transaction_type?: string
        }
        Returns: {
          created_by_name: string
          department_name: string
          line_items: Json
          notes: string
          reference_number: string
          status: string
          supplier_name: string
          transaction_date: string
          transaction_id: string
          transaction_type: string
        }[]
      }
      get_transactions_paginated:
        | {
            Args: {
              p_limit: number
              p_offset: number
              p_search_term: string
              p_transaction_type: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_end_date: string
              p_limit: number
              p_offset: number
              p_search_term: string
              p_start_date: string
              p_type_filter: string
            }
            Returns: Json
          }
      get_user_activity: {
        Args: { p_limit?: number; p_user_id?: string }
        Returns: {
          action: string
          created_at: string
          log_id: string
          new_values: Json
          old_values: Json
          record_id: string
          table_name: string
          user_id: string
          user_name: string
        }[]
      }
      get_user_preferences: {
        Args: { p_user_id?: string }
        Returns: {
          preference_key: string
          preference_value: string
          updated_at: string
        }[]
      }
      get_user_role: { Args: { input_user_id?: string }; Returns: string }
      get_user_statistics: {
        Args: never
        Returns: {
          active_users: number
          inactive_users: number
          total_users: number
          users_by_role: Json
        }[]
      }
      get_users_list: {
        Args: {
          p_department_id?: string
          p_is_active?: boolean
          p_role?: string
          p_search?: string
        }
        Returns: {
          created_at: string
          department_id: string
          department_name: string
          email: string
          full_name: string
          is_active: boolean
          last_login: string
          role: string
          user_id: string
        }[]
      }
      has_role: {
        Args: { input_user_id?: string; required_role: string }
        Returns: boolean
      }
      has_role_or_higher: {
        Args: { input_user_id?: string; required_role: string }
        Returns: boolean
      }
      inv_tx: {
        Args: {
          p_item_id: string
          p_qty: number
          p_ref_doc?: string
          p_tx_type: string
          p_user_id?: string
        }
        Returns: undefined
      }
      is_admin: { Args: { input_user_id?: string }; Returns: boolean }
      log_audit_event: {
        Args: {
          p_action?: string
          p_ip_address?: unknown
          p_new_values?: Json
          p_old_values?: Json
          p_record_id?: string
          p_table_name?: string
          p_user_agent?: string
          p_user_id?: string
        }
        Returns: string
      }
      process_inventory_transaction: {
        Args: {
          p_department?: string
          p_item_name: string
          p_notes?: string
          p_quantity: number
          p_sku: string
          p_transaction_type: string
          p_unit: string
          p_user_name?: string
        }
        Returns: Json
      }
      process_transaction: {
        Args: {
          p_created_by?: string
          p_department_id?: string
          p_items?: Json
          p_notes?: string
          p_reference_number?: string
          p_supplier_id?: string
          p_transaction_type: string
        }
        Returns: {
          message: string
          success: boolean
          transaction_id: string
        }[]
      }
      safe_insert_inventory_item: {
        Args: {
          p_category: string
          p_cost: number
          p_name: string
          p_notes: string
          p_quantity: number
          p_reorder_level: number
          p_sku: string
          p_supplier: string
          p_unit: string
        }
        Returns: {
          final_sku: string
          success: boolean
        }[]
      }
      safe_json_build: { Args: { p_object: string }; Returns: Json }
      safe_json_text: { Args: { input_text: string }; Returns: string }
      toggle_user_status: {
        Args: { p_is_active: boolean; p_updated_by?: string; p_user_id: string }
        Returns: {
          message: string
          success: boolean
        }[]
      }
      update_alert_rule: {
        Args: {
          p_conditions: Json
          p_is_active: boolean
          p_notification_channels: Json
          p_recipients: Json
          p_rule_id: string
          p_rule_name: string
          p_rule_type: string
          p_updated_by?: string
        }
        Returns: Json
      }
      update_inventory_quantity: {
        Args: {
          p_item_id: string
          p_quantity_change: number
          p_transaction_type: string
        }
        Returns: {
          message: string
          new_quantity: number
          success: boolean
        }[]
      }
      update_notification_settings: {
        Args: {
          p_settings: Database["public"]["CompositeTypes"]["notification_setting_input"][]
        }
        Returns: undefined
      }
      update_po_line_items: {
        Args: { p_items: Json; p_po_id: string; p_updated_by?: string }
        Returns: {
          message: string
          success: boolean
        }[]
      }
      update_po_status: {
        Args: { p_new_status: string; p_po_id: string; p_updated_by?: string }
        Returns: {
          message: string
          success: boolean
        }[]
      }
      update_system_setting: {
        Args: {
          p_setting_key: string
          p_setting_value: string
          p_updated_by?: string
        }
        Returns: Json
      }
      update_user_details: {
        Args: { p_is_active: boolean; p_new_role: string; p_user_id: string }
        Returns: undefined
      }
      update_user_preference: {
        Args: {
          p_preference_key: string
          p_preference_value: string
          p_user_id?: string
        }
        Returns: Json
      }
      update_user_profile: {
        Args: {
          p_department_id?: string
          p_full_name: string
          p_role: string
          p_updated_by?: string
          p_user_id: string
        }
        Returns: {
          message: string
          success: boolean
        }[]
      }
      upsert_item_with_uoms: {
        Args: {
          p_base_uom: string
          p_category_id: string
          p_description: string
          p_image_path: string
          p_image_url: string
          p_is_active: boolean
          p_item_code: string
          p_item_id: string
          p_reorder_level: number
          p_unit_cost: number
          p_uoms: Database["public"]["CompositeTypes"]["item_uom_input"][]
        }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      item_uom_input: {
        uom_id: string | null
        unit_name: string | null
        conversion_factor: number | null
        is_purchase_unit: boolean | null
        is_issue_unit: boolean | null
      }
      notification_setting_input: {
        key: string | null
        value: string | null
      }
      po_line_item_input: {
        item_id: string | null
        quantity_ordered: number | null
        unit_price: number | null
      }
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
