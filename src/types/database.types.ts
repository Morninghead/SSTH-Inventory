export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      admin_password_reset_audit: {
        Row: {
          audit_id: string
          reset_by: string
          target_user_email: string
          reset_method: string
          reset_at: string | null
          success: boolean
          error_message: string | null
          ip_address: string | null
          user_agent: string | null
        }
        Insert: {
          audit_id?: string
          reset_by: string
          target_user_email: string
          reset_method: string
          reset_at?: string | null
          success: boolean
          error_message?: string | null
          ip_address?: string | null
          user_agent?: string | null
        }
        Update: {
          audit_id?: string | null
          reset_by?: string | null
          target_user_email?: string | null
          reset_method?: string | null
          reset_at?: string | null
          success?: boolean | null
          error_message?: string | null
          ip_address?: string | null
          user_agent?: string | null
        }
      }
      admin_password_reset_permissions: {
        Row: {
          user_id: string | null
          role: string | null
          is_active: boolean | null
          can_reset_passwords: boolean | null
        }
        Insert: {
          user_id?: string | null
          role?: string | null
          is_active?: boolean | null
          can_reset_passwords?: boolean | null
        }
        Update: {
          user_id?: string | null
          role?: string | null
          is_active?: boolean | null
          can_reset_passwords?: boolean | null
        }
      }
      ai_insights: {
        Row: {
          insight_id: string
          title: string
          description: string
          insight_type: string
          impact_level: string | null
          action_required: boolean | null
          recommendation: string | null
          potential_savings: number | null
          affected_items: any[] | null
          affected_departments: any[] | null
          metadata: any | null
          reviewed_by: string | null
          implemented_at: string | null
          expires_at: string | null
          status: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          insight_id?: string
          title: string
          description: string
          insight_type: string
          impact_level?: string | null
          action_required?: boolean | null
          recommendation?: string | null
          potential_savings?: number | null
          affected_items?: any[] | null
          affected_departments?: any[] | null
          metadata?: any | null
          reviewed_by?: string | null
          implemented_at?: string | null
          expires_at?: string | null
          status?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          insight_id?: string | null
          title?: string | null
          description?: string | null
          insight_type?: string | null
          impact_level?: string | null
          action_required?: boolean | null
          recommendation?: string | null
          potential_savings?: number | null
          affected_items?: any[] | null
          affected_departments?: any[] | null
          metadata?: any | null
          reviewed_by?: string | null
          implemented_at?: string | null
          expires_at?: string | null
          status?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      ai_predictions: {
        Row: {
          prediction_id: string
          item_id: string
          department_id: string | null
          prediction_type: string
          predicted_value: number
          confidence_score: number | null
          prediction_date: string
          model_version: string | null
          factors_used: any | null
          status: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          prediction_id?: string
          item_id: string
          department_id?: string | null
          prediction_type: string
          predicted_value: number
          confidence_score?: number | null
          prediction_date: string
          model_version?: string | null
          factors_used?: any | null
          status?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          prediction_id?: string | null
          item_id?: string | null
          department_id?: string | null
          prediction_type?: string | null
          predicted_value?: number | null
          confidence_score?: number | null
          prediction_date?: string | null
          model_version?: string | null
          factors_used?: any | null
          status?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      audit_logs: {
        Row: {
          log_id: string
          table_name: string | null
          record_id: string | null
          action: string
          old_values: any | null
          new_values: any | null
          user_id: string | null
          ip_address: string | null
          user_agent: string | null
          created_at: string | null
        }
        Insert: {
          log_id?: string
          table_name?: string | null
          record_id?: string | null
          action: string
          old_values?: any | null
          new_values?: any | null
          user_id?: string | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string | null
        }
        Update: {
          log_id?: string | null
          table_name?: string | null
          record_id?: string | null
          action?: string | null
          old_values?: any | null
          new_values?: any | null
          user_id?: string | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string | null
        }
      }
      automated_issues: {
        Row: {
          issue_id: string
          item_id: string
          department_id: string
          issue_type: string
          quantity: number
          reason: string
          urgency_level: string | null
          ai_generated: boolean | null
          auto_generated_score: number | null
          adjusted_quantity: number | null
          adjusted_reason: string | null
          cost_impact: number | null
          status: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          issue_id?: string
          item_id: string
          department_id: string
          issue_type: string
          quantity: number
          reason: string
          urgency_level?: string | null
          ai_generated?: boolean | null
          auto_generated_score?: number | null
          adjusted_quantity?: number | null
          adjusted_reason?: string | null
          cost_impact?: number | null
          status?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          issue_id?: string | null
          item_id?: string | null
          department_id?: string | null
          issue_type?: string | null
          quantity?: number | null
          reason?: string | null
          urgency_level?: string | null
          ai_generated?: boolean | null
          auto_generated_score?: number | null
          adjusted_quantity?: number | null
          adjusted_reason?: string | null
          cost_impact?: number | null
          status?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      backorders: {
        Row: {
          backorder_id: string
          department_id: string
          item_id: string
          quantity: number
          status: string | null
          created_at: string
          updated_at: string
          notes: string | null
        }
        Insert: {
          backorder_id?: string
          department_id: string
          item_id: string
          quantity: number
          status?: string | null
          created_at?: string
          updated_at?: string
          notes?: string | null
        }
        Update: {
          backorder_id?: string | null
          department_id?: string | null
          item_id?: string | null
          quantity?: number | null
          status?: string | null
          created_at?: string | null
          updated_at?: string | null
          notes?: string | null
        }
      }
      categories: {
        Row: {
          category_id: string
          category_code: string
          category_name: string
          description: string | null
          is_active: boolean | null
          created_at: string | null
        }
        Insert: {
          category_id?: string
          category_code: string
          category_name: string
          description?: string | null
          is_active?: boolean | null
          created_at?: string | null
        }
        Update: {
          category_id?: string | null
          category_code?: string | null
          category_name?: string | null
          description?: string | null
          is_active?: boolean | null
          created_at?: string | null
        }
      }
      department_plan_items: {
        Row: {
          plan_item_id: string
          plan_id: string
          item_id: string
          planned_quantity: number
          notes: string | null
          created_at: string
        }
        Insert: {
          plan_item_id?: string
          plan_id: string
          item_id: string
          planned_quantity: number
          notes?: string | null
          created_at?: string
        }
        Update: {
          plan_item_id?: string | null
          plan_id?: string | null
          item_id?: string | null
          planned_quantity?: number | null
          notes?: string | null
          created_at?: string | null
        }
      }
      department_plans: {
        Row: {
          plan_id: string
          department_id: string
          month: number
          year: number
          status: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          plan_id?: string
          department_id: string
          month: number
          year: number
          status?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          plan_id?: string | null
          department_id?: string | null
          month?: number | null
          year?: number | null
          status?: string | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      departments: {
        Row: {
          dept_id: string
          dept_code: string
          dept_name: string
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          dept_id?: string
          dept_code: string
          dept_name: string
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          dept_id?: string | null
          dept_code?: string | null
          dept_name?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
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
          item_id?: string | null
          quantity?: number | null
          updated_at?: string | null
        }
      }
      items: {
        Row: {
          item_id: string
          item_code: string
          description: string
          category_id: string | null
          base_uom: string
          unit_cost: number | null
          reorder_level: number | null
          image_path: string | null
          image_url: string | null
          is_active: boolean | null
          created_by: string
          created_at: string | null
          updated_at: string | null
          vat_rate: number | null
          is_vat_applicable: boolean | null
          preferred_vendor_id: string | null
          name_en: string | null
          name_th: string | null
          description_en: string | null
          description_th: string | null
          ordering_uom: string | null
          pricing_uom: string | null
          uom_length: number | null
          outermost_uom: string | null
        }
        Insert: {
          item_id?: string
          item_code: string
          description: string
          category_id?: string | null
          base_uom: string
          unit_cost?: number | null
          reorder_level?: number | null
          image_path?: string | null
          image_url?: string | null
          is_active?: boolean | null
          created_by: string
          created_at?: string | null
          updated_at?: string | null
          vat_rate?: number | null
          is_vat_applicable?: boolean | null
          preferred_vendor_id?: string | null
          name_en?: string | null
          name_th?: string | null
          description_en?: string | null
          description_th?: string | null
          ordering_uom?: string | null
          pricing_uom?: string | null
          uom_length?: number | null
          outermost_uom?: string | null
        }
        Update: {
          item_id?: string | null
          item_code?: string | null
          description?: string | null
          category_id?: string | null
          base_uom?: string | null
          unit_cost?: number | null
          reorder_level?: number | null
          image_path?: string | null
          image_url?: string | null
          is_active?: boolean | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
          vat_rate?: number | null
          is_vat_applicable?: boolean | null
          preferred_vendor_id?: string | null
          name_en?: string | null
          name_th?: string | null
          description_en?: string | null
          description_th?: string | null
          ordering_uom?: string | null
          pricing_uom?: string | null
          uom_length?: number | null
          outermost_uom?: string | null
        }
      }
      locations: {
        Row: {
          location_id: string
          location_code: string
          location_name: string
          address: string | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          location_id?: string
          location_code: string
          location_name: string
          address?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          location_id?: string | null
          location_code?: string | null
          location_name?: string | null
          address?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      notification_logs: {
        Row: {
          log_id: string
          notification_type: string
          message_content: string
          sent_at: string | null
          success: boolean | null
          error_message: string | null
          metadata: any | null
        }
        Insert: {
          log_id?: string
          notification_type: string
          message_content: string
          sent_at?: string | null
          success?: boolean | null
          error_message?: string | null
          metadata?: any | null
        }
        Update: {
          log_id?: string | null
          notification_type?: string | null
          message_content?: string | null
          sent_at?: string | null
          success?: boolean | null
          error_message?: string | null
          metadata?: any | null
        }
      }
      notification_settings: {
        Row: {
          id: string
          low_stock_alerts: boolean | null
          transaction_notifications: boolean | null
          daily_summary: boolean | null
          bot_token: string | null
          chat_id: string | null
          enabled: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          low_stock_alerts?: boolean | null
          transaction_notifications?: boolean | null
          daily_summary?: boolean | null
          bot_token?: string | null
          chat_id?: string | null
          enabled?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string | null
          low_stock_alerts?: boolean | null
          transaction_notifications?: boolean | null
          daily_summary?: boolean | null
          bot_token?: string | null
          chat_id?: string | null
          enabled?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      purchase_order: {
        Row: {
          po_id: string
          po_number: string
          supplier_id: string
          po_date: string | null
          expected_date: string | null
          status: string | null
          total_amount: number | null
          notes: string | null
          created_by: string
          approved_by: string | null
          approved_at: string | null
          created_at: string | null
          updated_at: string | null
          vendor_id: string | null
          vat_rate: number | null
          subtotal_amount: number | null
          vat_amount: number | null
          payment_status: string | null
          delivery_status: string | null
          is_enabled: boolean | null
        }
        Insert: {
          po_id?: string
          po_number: string
          supplier_id: string
          po_date?: string | null
          expected_date?: string | null
          status?: string | null
          total_amount?: number | null
          notes?: string | null
          created_by: string
          approved_by?: string | null
          approved_at?: string | null
          created_at?: string | null
          updated_at?: string | null
          vendor_id?: string | null
          vat_rate?: number | null
          subtotal_amount?: number | null
          vat_amount?: number | null
          payment_status?: string | null
          delivery_status?: string | null
          is_enabled?: boolean | null
        }
        Update: {
          po_id?: string | null
          po_number?: string | null
          supplier_id?: string | null
          po_date?: string | null
          expected_date?: string | null
          status?: string | null
          total_amount?: number | null
          notes?: string | null
          created_by?: string | null
          approved_by?: string | null
          approved_at?: string | null
          created_at?: string | null
          updated_at?: string | null
          vendor_id?: string | null
          vat_rate?: number | null
          subtotal_amount?: number | null
          vat_amount?: number | null
          payment_status?: string | null
          delivery_status?: string | null
          is_enabled?: boolean | null
        }
      }
      purchase_order_line: {
        Row: {
          po_line_id: string
          po_id: string
          item_id: string
          quantity: number
          unit_cost: number
          line_total: number | null
          quantity_received: number | null
          notes: string | null
          created_at: string | null
          updated_at: string | null
          unit_price: number | null
          vat_rate: number | null
          received_quantity: number | null
          remaining_quantity: number | null
        }
        Insert: {
          po_line_id?: string
          po_id: string
          item_id: string
          quantity: number
          unit_cost: number
          line_total?: number | null
          quantity_received?: number | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
          unit_price?: number | null
          vat_rate?: number | null
          received_quantity?: number | null
          remaining_quantity?: number | null
        }
        Update: {
          po_line_id?: string | null
          po_id?: string | null
          item_id?: string | null
          quantity?: number | null
          unit_cost?: number | null
          line_total?: number | null
          quantity_received?: number | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
          unit_price?: number | null
          vat_rate?: number | null
          received_quantity?: number | null
          remaining_quantity?: number | null
        }
      }
      stock_count_adjustments: {
        Row: {
          adjustment_id: string
          count_id: string
          item_id: string
          adjustment_type: string
          system_quantity: number
          adjustment_quantity: number
          new_quantity: number
          reason: string
          reference_no: string | null
          transaction_id: string | null
          created_by: string
          created_at: string | null
        }
        Insert: {
          adjustment_id?: string
          count_id: string
          item_id: string
          adjustment_type: string
          system_quantity: number
          adjustment_quantity: number
          new_quantity: number
          reason: string
          reference_no?: string | null
          transaction_id?: string | null
          created_by: string
          created_at?: string | null
        }
        Update: {
          adjustment_id?: string | null
          count_id?: string | null
          item_id?: string | null
          adjustment_type?: string | null
          system_quantity?: number | null
          adjustment_quantity?: number | null
          new_quantity?: number | null
          reason?: string | null
          reference_no?: string | null
          transaction_id?: string | null
          created_by?: string | null
          created_at?: string | null
        }
      }
      stock_count_lines: {
        Row: {
          line_id: string
          count_id: string
          item_id: string
          system_quantity: number
          counted_quantity: number | null
          discrepancy: number | null
          notes: string | null
          status: string | null
          row_number: number
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          line_id?: string
          count_id: string
          item_id: string
          system_quantity: number
          counted_quantity?: number | null
          discrepancy?: number | null
          notes?: string | null
          status?: string | null
          row_number: number
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          line_id?: string | null
          count_id?: string | null
          item_id?: string | null
          system_quantity?: number | null
          counted_quantity?: number | null
          discrepancy?: number | null
          notes?: string | null
          status?: string | null
          row_number?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      stock_counts: {
        Row: {
          count_id: string
          count_type: string
          count_date: string
          period_month: string
          status: string
          notes: string | null
          created_by: string
          completed_by: string | null
          posted_by: string | null
          posted_at: string | null
          total_items: number | null
          total_discrepancies: number | null
          total_variance_value: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          count_id?: string
          count_type: string
          count_date: string
          period_month: string
          status: string
          notes?: string | null
          created_by: string
          completed_by?: string | null
          posted_by?: string | null
          posted_at?: string | null
          total_items?: number | null
          total_discrepancies?: number | null
          total_variance_value?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          count_id?: string | null
          count_type?: string | null
          count_date?: string | null
          period_month?: string | null
          status?: string | null
          notes?: string | null
          created_by?: string | null
          completed_by?: string | null
          posted_by?: string | null
          posted_at?: string | null
          total_items?: number | null
          total_discrepancies?: number | null
          total_variance_value?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      suppliers: {
        Row: {
          supplier_id: string
          supplier_code: string
          supplier_name: string
          contact_name: string | null
          phone: string | null
          email: string | null
          address: string | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          supplier_id?: string
          supplier_code: string
          supplier_name: string
          contact_name?: string | null
          phone?: string | null
          email?: string | null
          address?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          supplier_id?: string | null
          supplier_code?: string | null
          supplier_name?: string | null
          contact_name?: string | null
          phone?: string | null
          email?: string | null
          address?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      system_settings: {
        Row: {
          setting_id: string
          setting_key: string
          setting_value: string | null
          category: string
          description: string | null
          created_at: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          setting_id?: string
          setting_key: string
          setting_value?: string | null
          category: string
          description?: string | null
          created_at?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          setting_id?: string | null
          setting_key?: string | null
          setting_value?: string | null
          category?: string | null
          description?: string | null
          created_at?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
      }
      transaction_lines: {
        Row: {
          line_id: string
          transaction_id: string
          item_id: string
          quantity: number
          unit_cost: number | null
          line_total: number | null
          notes: string | null
          created_at: string | null
        }
        Insert: {
          line_id?: string
          transaction_id: string
          item_id: string
          quantity: number
          unit_cost?: number | null
          line_total?: number | null
          notes?: string | null
          created_at?: string | null
        }
        Update: {
          line_id?: string | null
          transaction_id?: string | null
          item_id?: string | null
          quantity?: number | null
          unit_cost?: number | null
          line_total?: number | null
          notes?: string | null
          created_at?: string | null
        }
      }
      transactions: {
        Row: {
          transaction_id: string
          transaction_type: string
          transaction_date: string | null
          department_id: string | null
          supplier_id: string | null
          reference_number: string | null
          notes: string | null
          status: string | null
          created_by: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          transaction_id?: string
          transaction_type: string
          transaction_date?: string | null
          department_id?: string | null
          supplier_id?: string | null
          reference_number?: string | null
          notes?: string | null
          status?: string | null
          created_by: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          transaction_id?: string | null
          transaction_type?: string | null
          transaction_date?: string | null
          department_id?: string | null
          supplier_id?: string | null
          reference_number?: string | null
          notes?: string | null
          status?: string | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      uom: {
        Row: {
          uom_code: string
          description: string
          is_base_uom: boolean | null
          category: string | null
          created_at: string | null
          created_by: string | null
          updated_at: string | null
        }
        Insert: {
          uom_code: string
          description: string
          is_base_uom?: boolean | null
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          updated_at?: string | null
        }
        Update: {
          uom_code?: string | null
          description?: string | null
          is_base_uom?: boolean | null
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          updated_at?: string | null
        }
      }
      uom_conversions: {
        Row: {
          conversion_id: string
          item_id: string | null
          from_uom: string
          to_uom: string
          conversion_factor: number
          is_active: boolean | null
          created_at: string | null
          created_by: string | null
          updated_at: string | null
        }
        Insert: {
          conversion_id?: string
          item_id?: string | null
          from_uom: string
          to_uom: string
          conversion_factor: number
          is_active?: boolean | null
          created_at?: string | null
          created_by?: string | null
          updated_at?: string | null
        }
        Update: {
          conversion_id?: string | null
          item_id?: string | null
          from_uom?: string | null
          to_uom?: string | null
          conversion_factor?: number | null
          is_active?: boolean | null
          created_at?: string | null
          created_by?: string | null
          updated_at?: string | null
        }
      }
      uom_hierarchy: {
        Row: {
          uom_code: string | null
          description: string | null
          category: string | null
          is_base_uom: boolean | null
          level: number | null
        }
        Insert: {
          uom_code?: string | null
          description?: string | null
          category?: string | null
          is_base_uom?: boolean | null
          level?: number | null
        }
        Update: {
          uom_code?: string | null
          description?: string | null
          category?: string | null
          is_base_uom?: boolean | null
          level?: number | null
        }
      }
      user_preferences: {
        Row: {
          preference_id: string
          user_id: string
          preference_key: string
          preference_value: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          preference_id?: string
          user_id: string
          preference_key: string
          preference_value?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          preference_id?: string | null
          user_id?: string | null
          preference_key?: string | null
          preference_value?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      user_profiles: {
        Row: {
          id: string
          full_name: string | null
          role: string | null
          department_id: string | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          full_name?: string | null
          role?: string | null
          department_id?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string | null
          full_name?: string | null
          role?: string | null
          department_id?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      vendor_categories: {
        Row: {
          vendor_category_id: string
          category_code: string
          category_name: string
          description: string | null
          is_active: boolean | null
          created_at: string | null
          created_by: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          vendor_category_id?: string
          category_code: string
          category_name: string
          description?: string | null
          is_active?: boolean | null
          created_at?: string | null
          created_by?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          vendor_category_id?: string | null
          category_code?: string | null
          category_name?: string | null
          description?: string | null
          is_active?: boolean | null
          created_at?: string | null
          created_by?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
      }
      vendor_items: {
        Row: {
          vendor_item_id: string
          vendor_id: string
          item_id: string
          vendor_sku: string | null
          unit_price: number | null
          lead_time_days: number | null
          min_order_quantity: number | null
          is_preferred_supplier: boolean | null
          last_purchase_date: string | null
          notes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          vendor_item_id?: string
          vendor_id: string
          item_id: string
          vendor_sku?: string | null
          unit_price?: number | null
          lead_time_days?: number | null
          min_order_quantity?: number | null
          is_preferred_supplier?: boolean | null
          last_purchase_date?: string | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          vendor_item_id?: string | null
          vendor_id?: string | null
          item_id?: string | null
          vendor_sku?: string | null
          unit_price?: number | null
          lead_time_days?: number | null
          min_order_quantity?: number | null
          is_preferred_supplier?: boolean | null
          last_purchase_date?: string | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      vendor_summary: {
        Row: {
          vendor_id: string | null
          vendor_code: string | null
          vendor_name: string | null
          category_name: string | null
          contact_person: string | null
          contact_email: string | null
          payment_terms: string | null
          default_vat_rate: number | null
          rating: number | null
          is_active: boolean | null
          item_count: number | null
          total_purchase_value: number | null
        }
        Insert: {
          vendor_id?: string | null
          vendor_code?: string | null
          vendor_name?: string | null
          category_name?: string | null
          contact_person?: string | null
          contact_email?: string | null
          payment_terms?: string | null
          default_vat_rate?: number | null
          rating?: number | null
          is_active?: boolean | null
          item_count?: number | null
          total_purchase_value?: number | null
        }
        Update: {
          vendor_id?: string | null
          vendor_code?: string | null
          vendor_name?: string | null
          category_name?: string | null
          contact_person?: string | null
          contact_email?: string | null
          payment_terms?: string | null
          default_vat_rate?: number | null
          rating?: number | null
          is_active?: boolean | null
          item_count?: number | null
          total_purchase_value?: number | null
        }
      }
      vendors: {
        Row: {
          vendor_id: string
          vendor_code: string
          vendor_name: string
          business_registration_no: string | null
          tax_id: string | null
          vendor_category_id: string | null
          contact_person: string | null
          contact_phone: string | null
          contact_email: string | null
          address_line1: string | null
          address_line2: string | null
          city: string | null
          province: string | null
          postal_code: string | null
          country: string | null
          payment_terms: string | null
          default_vat_rate: number | null
          is_vat_registered: boolean | null
          bank_account_name: string | null
          bank_account_number: string | null
          bank_name: string | null
          bank_branch: string | null
          website: string | null
          notes: string | null
          is_active: boolean | null
          rating: number | null
          created_at: string | null
          created_by: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          vendor_id?: string
          vendor_code: string
          vendor_name: string
          business_registration_no?: string | null
          tax_id?: string | null
          vendor_category_id?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          contact_email?: string | null
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          province?: string | null
          postal_code?: string | null
          country?: string | null
          payment_terms?: string | null
          default_vat_rate?: number | null
          is_vat_registered?: boolean | null
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_name?: string | null
          bank_branch?: string | null
          website?: string | null
          notes?: string | null
          is_active?: boolean | null
          rating?: number | null
          created_at?: string | null
          created_by?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          vendor_id?: string | null
          vendor_code?: string | null
          vendor_name?: string | null
          business_registration_no?: string | null
          tax_id?: string | null
          vendor_category_id?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          contact_email?: string | null
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          province?: string | null
          postal_code?: string | null
          country?: string | null
          payment_terms?: string | null
          default_vat_rate?: number | null
          is_vat_registered?: boolean | null
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_name?: string | null
          bank_branch?: string | null
          website?: string | null
          notes?: string | null
          is_active?: boolean | null
          rating?: number | null
          created_at?: string | null
          created_by?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [key: string]: {
        Args: Record<string, unknown>
        Returns: unknown
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}