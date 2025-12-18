/**
 * Notification Service for SSTH Inventory System
 * Integrates with Telegram bot for real-time alerts
 */

import { supabase } from '../lib/supabase'
import telegramBot from './telegramBot'

// Define interfaces locally to avoid import issues
interface LowStockAlert {
  itemCode: string
  itemName: string
  currentStock: number
  reorderLevel: number
  unitCost: number
  department: string
}

interface TransactionAlert {
  transactionId: string
  transactionType: 'ISSUE' | 'RECEIVE' | 'ADJUSTMENT'
  department: string
  itemCount: number
  totalValue: number
  processedBy: string
  timestamp: string
}

export interface NotificationSettings {
  id?: string
  low_stock_alerts: boolean
  transaction_notifications: boolean
  daily_summary: boolean
  bot_token?: string
  chat_id?: string
  enabled: boolean
  created_at?: string
  updated_at?: string
}

class NotificationService {
  private settings: NotificationSettings | null = null
  private isInitialized = false

  /**
   * Create default notification settings if they don't exist
   */
  private async createDefaultSettings(): Promise<void> {
    try {
      const defaultSettings = {
        id: 'default',
        low_stock_alerts: false,
        transaction_notifications: false,
        daily_summary: false,
        enabled: false
      }

      const { error } = await supabase
        .from('notification_settings')
        .upsert(defaultSettings, { onConflict: 'id' })

      if (error) {
        console.error('Failed to create default notification settings:', error)
      } else {
        console.log('✅ Default notification settings created successfully')
      }
    } catch (error) {
      console.error('Error creating default notification settings:', error)
    }
  }

  /**
   * Initialize notification service with settings from database
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      const { data, error } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('id', 'default')
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // No settings found, try to create default settings
          console.log('📋 No notification settings found, creating default...')
          await this.createDefaultSettings()
        } else {
          console.error('Error loading notification settings:', error)
          console.log('💡 Tip: Run TELEGRAM-NOTIFICATIONS-SCHEMA.sql in Supabase to create notification tables')
        }
      }

      if (!data) {
        // Set fallback defaults if no data
        this.settings = {
          id: 'default',
          low_stock_alerts: false,
          transaction_notifications: false,
          daily_summary: false,
          enabled: false,
          bot_token: undefined,
          chat_id: undefined
        }
      } else {
        // Type cast to handle null values from database
        this.settings = {
          id: data.id,
          low_stock_alerts: data.low_stock_alerts ?? false,
          transaction_notifications: data.transaction_notifications ?? false,
          daily_summary: data.daily_summary ?? false,
          enabled: data.enabled ?? false,
          bot_token: data.bot_token || undefined,
          chat_id: data.chat_id || undefined,
          created_at: data.created_at || undefined,
          updated_at: data.updated_at || undefined
        }
      }

      console.log('📋 Notification settings loaded:', this.settings)

      if (this.settings && this.settings.enabled && this.settings.bot_token && this.settings.chat_id) {
        telegramBot.initialize({
          botToken: this.settings.bot_token,
          chatId: this.settings.chat_id,
          enabled: true
        })
      }

      this.isInitialized = true
    } catch (error) {
      console.error('Failed to initialize notification service:', error)
      console.log('💡 Tip: Run TELEGRAM-NOTIFICATIONS-SCHEMA.sql in Supabase to create notification tables')
    }
  }

  /**
   * Save notification settings to database
   */
  async saveSettings(settings: Partial<NotificationSettings>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notification_settings')
        .upsert({
          id: 'default',
          ...settings,
          updated_at: new Date().toISOString()
        })

      if (error) {
        // Check if table doesn't exist
        if (error.code === 'PGRST205') {
          console.error('Notification settings table does not exist. Please run the TELEGRAM-NOTIFICATIONS-SCHEMA.sql script in Supabase.')
          return false
        }
        throw error
      }

      // Refresh settings and initialize bot if needed
      await this.initialize()
      return true
    } catch (error) {
      console.error('Failed to save notification settings:', error)
      return false
    }
  }

  /**
   * Get current notification settings
   */
  getSettings(): NotificationSettings | null {
    return this.settings
  }

  /**
   * Check if notifications are enabled
   */
  async isEnabled(): Promise<boolean> {
    // Re-initialize if settings are null
    if (!this.settings) {
      console.log('🔄 Settings null, re-initializing...')
      await this.initialize()
    }

    const settingsEnabled = !!this.settings?.enabled
    const botConfigured = telegramBot.isConfigured()
    const result = settingsEnabled && botConfigured

    console.log('🔍 Notification status check:', {
      settingsEnabled,
      botConfigured,
      result,
      settings: this.settings,
      telegramBotConfigured: telegramBot.isConfigured()
    })

    return result
  }

  /**
   * Check low stock and send alerts if needed
   */
  async checkLowStockAlerts(): Promise<void> {
    if (!this.settings?.low_stock_alerts || !this.isEnabled()) return

    try {
      // Query items with low stock
      const { data, error } = await supabase
        .from('inventory_status')
        .select(`
          item_id,
          quantity,
          items!inner (
            item_code,
            description,
            unit_cost,
            reorder_level,
            categories(category_name)
          ),
          locations!inner (
            name
          )
        `)
        .lt('quantity', 'items.reorder_level')
        .gt('items.reorder_level', 0)

      if (error) {
        console.error('Database error checking low stock:', error)
        return
      }

      if (!data?.length) return // No low stock items

      // Format alerts
      const alerts: LowStockAlert[] = data.map((item: any) => ({
        itemCode: item.items?.item_code || '',
        itemName: item.items?.description || '',
        currentStock: item.quantity || 0,
        reorderLevel: item.items?.reorder_level || 0,
        unitCost: item.items?.unit_cost || 0,
        department: item.locations?.name || 'Unknown'
      }))

      // Send Telegram notification
      await telegramBot.sendLowStockAlert(alerts)

    } catch (error) {
      console.error('Failed to check low stock alerts:', error)
    }
  }

  /**
   * Send transaction notification
   */
  async sendTransactionNotification(
    transactionId: string,
    transactionType: 'ISSUE' | 'RECEIVE' | 'ADJUSTMENT',
    departmentId: string,
    processedBy: string,
    _language?: 'en' | 'th'
  ): Promise<void> {
    const notificationsEnabled = await this.isEnabled()

    console.log('🚨 sendTransactionNotification called:', {
      transactionId,
      transactionType,
      departmentId,
      processedBy,
      transactionNotificationsEnabled: this.settings?.transaction_notifications,
      isEnabled: notificationsEnabled,
      settings: this.settings
    })

    if (!this.settings?.transaction_notifications || !notificationsEnabled) {
      console.log('❌ Transaction notification disabled or service not enabled')
      return
    }

    try {
      console.log('📡 Fetching transaction details for:', transactionId)

      // Get transaction details
      const { data: transactions, error: txError } = await supabase
        .from('transactions')
        .select(`
          created_at,
          transaction_type,
          department_id,
          supplier_id,
          departments(
            dept_name
          ),
          suppliers(
            supplier_name
          ),
          transaction_lines!inner (
            quantity,
            items!transaction_lines_item_id_fkey (
              item_code,
              description,
              unit_cost
            )
          )
        `)
        .eq('reference_number', transactionId)

      // Get first transaction for basic info
      const transaction = transactions?.[0]

      if (txError) {
        console.error('❌ Error fetching transaction:', txError)
        throw txError
      }

      console.log('✅ Transaction data fetched:', transaction)

      if (!transaction) {
        console.error('❌ Transaction not found')
        return
      }

      // Calculate totals and prepare item details
      const itemCount = transaction.transaction_lines.length

      // Determine department or supplier name
      let departmentOrSupplier = 'Unknown'
      if (transaction.transaction_type === 'RECEIVE') {
        // For receive transactions, use supplier name
        departmentOrSupplier = (transaction.suppliers as any)?.supplier_name || 'Unknown Supplier'
      } else {
        // For issue and adjustment transactions, use department name
        departmentOrSupplier = (transaction.departments as any)?.dept_name || 'Unknown Department'
      }

      const alert: TransactionAlert = {
        transactionId,
        transactionType,
        department: departmentOrSupplier,
        itemCount,
        totalValue: 0, // Not used in message anymore
        processedBy,
        timestamp: transaction?.created_at || new Date().toISOString()
      }

      console.log('📤 Sending transaction alert:', alert)

      // Send Telegram notification
      await telegramBot.sendTransactionAlert(alert)

      console.log('✅ Transaction notification sent successfully')

    } catch (error) {
      console.error('❌ Failed to send transaction notification:', error)
    }
  }

  /**
   * Send system notifications
   */
  async sendSystemNotification(
    title: string,
    message: string,
    priority: 'low' | 'medium' | 'high' = 'medium'
  ): Promise<void> {
    if (!this.isEnabled()) return

    await telegramBot.sendSystemNotification(title, message, priority)
  }

  /**
   * Test Telegram bot connection
   */
  async testConnection(): Promise<boolean> {
    if (!this.isEnabled()) return false

    return await telegramBot.testConnection()
  }

  /**
   * Send daily summary report (could be called by a cron job)
   */
  async sendDailySummary(): Promise<void> {
    if (!this.settings?.daily_summary || !this.isEnabled()) return

    try {
      const today = new Date().toISOString().split('T')[0]

      // Get today's transactions
      const { data: transactions, error: txError } = await supabase
        .from('transactions')
        .select(`
          transaction_type,
          transaction_lines!inner (
            quantity,
            items!transaction_lines_item_id_fkey (
              unit_cost
            )
          )
        `)
        .gte('created_at', today)

      if (txError) throw txError

      // Get low stock count
      const { count: lowStockCount, error: stockError } = await supabase
        .from('inventory_status')
        .select('*', { count: 'exact', head: true })
        .lt('quantity', 'reorder_level')
        .gt('reorder_level', 0)

      if (stockError) throw stockError

      // Calculate today's totals
      const issuedItems = transactions
        .filter(tx => tx.transaction_type === 'ISSUE')
        .reduce((sum, tx) => sum + tx.transaction_lines.reduce((s, item) => s + Math.abs(item.quantity), 0), 0)

      const receivedItems = transactions
        .filter(tx => tx.transaction_type === 'RECEIVE')
        .reduce((sum, tx) => sum + tx.transaction_lines.reduce((s, item) => s + Math.abs(item.quantity), 0), 0)

      const totalTransactions = transactions.length

      const message = `
📊 <b>Daily Inventory Summary</b>

<b>Date:</b> ${new Date().toLocaleDateString('th-TH')}
<b>Transactions:</b> ${totalTransactions}
<b>Items Issued:</b> ${issuedItems}
<b>Items Received:</b> ${receivedItems}
<b>Low Stock Items:</b> ${lowStockCount}

<i>SSTH Inventory System - Daily Report</i>
      `.trim()

      await telegramBot.sendMessage({ text: message, parse_mode: 'HTML' })

    } catch (error) {
      console.error('Failed to send daily summary:', error)
    }
  }
}

// Singleton instance
export const notificationService = new NotificationService()

export default notificationService