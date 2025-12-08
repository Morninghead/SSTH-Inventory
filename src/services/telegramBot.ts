/**
 * Telegram Bot Service for SSTH Inventory System
 * Provides real-time notifications for inventory events
 */

export interface TelegramConfig {
  botToken: string
  chatId: string
  enabled: boolean
}

export interface NotificationMessage {
  text: string
  parse_mode?: 'HTML' | 'Markdown'
  disable_web_page_preview?: boolean
}

export interface LowStockAlert {
  itemCode: string
  itemName: string
  currentStock: number
  reorderLevel: number
  unitCost: number
  department: string
}

export interface TransactionAlert {
  transactionId: string
  transactionType: 'ISSUE' | 'RECEIVE' | 'ADJUSTMENT'
  department: string
  itemCount: number
  totalValue: number
  processedBy: string
  timestamp: string
  language?: 'en' | 'th'
  adjustmentType?: 'set' | 'add' | 'subtract'  // For adjustment transactions
  adjustmentReason?: string  // For adjustment transactions
  items?: Array<{
    item_code: string
    description: string
    quantity: number
    current_qty?: number  // Before quantity for adjustments
    new_qty?: number      // After quantity for adjustments
  }>
}

class TelegramBotService {
  private config: TelegramConfig | null = null

  /**
   * Initialize Telegram bot configuration
   */
  initialize(config: TelegramConfig): void {
    this.config = config
  }

  /**
   * Check if Telegram bot is configured and enabled
   */
  isConfigured(): boolean {
    const enabled = !!this.config?.enabled
    const hasToken = !!this.config?.botToken
    const hasChatId = !!this.config?.chatId
    const configured = enabled && hasToken && hasChatId

    console.log('🤖 Telegram bot configuration check:', {
      enabled,
      hasToken,
      hasChatId,
      configured,
      config: this.config
    })

    return configured
  }

  /**
   * Send message to Telegram
   */
  async sendMessage(message: NotificationMessage): Promise<boolean> {
    if (!this.isConfigured()) {
      console.warn('⚠️ Telegram bot not configured or disabled')
      console.log('🔍 Bot config status:', {
        hasConfig: !!this.config,
        enabled: this.config?.enabled,
        hasToken: !!this.config?.botToken,
        hasChatId: !!this.config?.chatId
      })
      return false
    }

    try {
      const url = `https://api.telegram.org/bot${this.config!.botToken}/sendMessage`

      const payload = {
        chat_id: this.config!.chatId,
        text: message.text,
        parse_mode: message.parse_mode || 'HTML',
        disable_web_page_preview: message.disable_web_page_preview ?? true
      }

      console.log('📤 Sending Telegram message to:', this.config!.chatId)
      console.log('📨 Message preview (first 100 chars):', message.text.substring(0, 100) + (message.text.length > 100 ? '...' : ''))

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        console.error('❌ Telegram API Error:', {
          status: response.status,
          statusText: response.statusText,
          error: data.description,
          fullResponse: data
        })
        throw new Error(`Telegram API error: ${data.description}`)
      }

      console.log('✅ Telegram message sent successfully:', data.ok)
      return data.ok
    } catch (error) {
      console.error('❌ Failed to send Telegram message:', error)
      return false
    }
  }

  /**
   * Send low stock alert
   */
  async sendLowStockAlert(alerts: LowStockAlert[]): Promise<boolean> {
    if (!alerts.length) return false

    const message = this.formatLowStockMessage(alerts)

    return await this.sendMessage({
      text: message,
      parse_mode: 'HTML'
    })
  }

  /**
   * Send transaction notification
   */
  async sendTransactionAlert(transaction: TransactionAlert): Promise<boolean> {
    console.log('📤 sendTransactionAlert called with:', transaction);
    const message = this.formatTransactionMessage(transaction)
    console.log('📝 Formatted transaction message:', message);
    const result = await this.sendMessage({
      text: message,
      parse_mode: 'HTML'
    })
    console.log('✅ sendTransactionAlert result:', result);
    return result
  }

  /**
   * Send system notification (user creation, errors, etc.)
   */
  async sendSystemNotification(
    title: string,
    message: string,
    priority: 'low' | 'medium' | 'high' = 'medium'
  ): Promise<boolean> {
    const priorityEmoji = {
      low: '🔵',
      medium: '🟡',
      high: '🔴'
    }

    const fullMessage = `
<b>${priorityEmoji[priority]} ${title}</b>

${message}

<i>SSTH Inventory System</i>
    `.trim()

    return await this.sendMessage({
      text: fullMessage,
      parse_mode: 'HTML'
    })
  }

  /**
   * Format low stock alerts into HTML message
   */
  private formatLowStockMessage(alerts: LowStockAlert[]): string {
    const totalValue = alerts.reduce((sum, item) => sum + (item.currentStock * item.unitCost), 0)
    const totalItems = alerts.length

    let message = `
🚨 <b>Low Stock Alert</b>

<b>${totalItems} items need attention</b>
Total inventory value at risk: <b>฿${totalValue.toFixed(2)}</b>

    `.trim()

    // Add top 10 items (limit to prevent message too long)
    alerts.slice(0, 10).forEach((alert, index) => {
      message += `
${index + 1}. <b>${alert.itemName}</b>
   • Code: ${alert.itemCode}
   • Stock: <b>${alert.currentStock}</b> (Reorder: ${alert.reorderLevel})
   • Value: ฿${(alert.currentStock * alert.unitCost).toFixed(2)}
   • Department: ${alert.department}
      `
    })

    if (alerts.length > 10) {
      message += `\n... and ${alerts.length - 10} more items`
    }

    message += `

<i>Please check inventory and place purchase orders as needed.</i>`

    return message
  }

  /**
   * Format transaction notification into HTML message
   */
  private formatTransactionMessage(transaction: TransactionAlert): string {
    const isThai = transaction.language === 'th'

    // Determine if this is a receive transaction
      const isReceiveTransaction = transaction.transactionType === 'RECEIVE'

      const labels = {
        en: {
          transaction: 'Transaction',
          transactionId: 'Transaction ID',
          department: isReceiveTransaction ? 'Supplier' : 'Department',
          items: 'Items',
          processedBy: 'Processed by',
          time: 'Time',
          itemsDetails: 'Items Details',
          code: 'Code',
          quantity: 'Quantity',
          beforeQuantity: 'Before',
          afterQuantity: 'After',
          adjustmentType: 'Adjustment Type',
          reason: 'Reason',
          increase: 'Increase',
          decrease: 'Decrease',
          setTo: 'Set to',
          noItems: 'No items found',
          moreItems: 'more items',
          recordedIn: 'Transaction recorded in SSTH Inventory System'
        },
        th: {
          transaction: 'รายการ',
          transactionId: 'เลขที่รายการ',
          department: isReceiveTransaction ? 'ผู้ขาย' : 'แผนก',
          items: 'รายการ',
          processedBy: 'ดำเนินการโดย',
          time: 'เวลา',
          itemsDetails: 'รายละเอียดสินค้า',
          code: 'รหัส',
          quantity: 'จำนวน',
          beforeQuantity: 'ก่อนปรับ',
          afterQuantity: 'หลังปรับ',
          adjustmentType: 'ประเภทการปรับ',
          reason: 'เหตุผล',
          increase: 'ปรับเพิ่ม',
          decrease: 'ปรับลด',
          setTo: 'กำหนดเป็น',
          noItems: 'ไม่พบรายการสินค้า',
          moreItems: 'รายการเพิ่มเติม',
          recordedIn: 'รายการถูกบันทึกในระบบ SSTH Inventory System'
        }
      }

    const l = labels[isThai ? 'th' : 'en']

    const typeEmoji = {
      'ISSUE': '📤',
      'RECEIVE': '📥',
      'ADJUSTMENT': '🔄'
    }

    const typeLabels = {
      'ISSUE': isThai ? 'เบิก' : 'ISSUE',
      'RECEIVE': isThai ? 'รับ' : 'RECEIVE',
      'ADJUSTMENT': isThai ? 'ปรับ' : 'ADJUSTMENT'
    }

    let message = `
${typeEmoji[transaction.transactionType]} <b>${l.transaction} ${typeLabels[transaction.transactionType]}</b>

<b>${l.transactionId}:</b> ${transaction.transactionId}
<b>${l.department}:</b> ${transaction.department}
<b>${l.items}:</b> ${transaction.itemCount}
<b>${l.processedBy}:</b> ${transaction.processedBy}
<b>${l.time}:</b> ${new Date(transaction.timestamp).toLocaleString(isThai ? 'th-TH' : 'en-US')}
    `.trim()

    // Add adjustment specific information
    if (transaction.transactionType === 'ADJUSTMENT') {
      // Show adjustment type
      if (transaction.adjustmentType) {
        const adjustmentTypeLabels = {
          'add': l.increase,
          'subtract': l.decrease,
          'set': l.setTo
        }
        message += `\n<b>${l.adjustmentType}:</b> ${adjustmentTypeLabels[transaction.adjustmentType] || transaction.adjustmentType}`
      }

      // Show adjustment reason
      if (transaction.adjustmentReason) {
        message += `\n<b>${l.reason}:</b> ${transaction.adjustmentReason}`
      }
    }

    message += `\n\n<b>${l.itemsDetails}:</b>`

    // Add item details (limit to prevent message too long)
    if (transaction.items && transaction.items.length > 0) {
      transaction.items.slice(0, 10).forEach((item, index) => {
        message += `
${index + 1}. <b>${item.description}</b>
   • ${l.code}: ${item.item_code}`

        // For adjustment transactions, show before and after quantities
        if (transaction.transactionType === 'ADJUSTMENT' && item.current_qty !== undefined && item.new_qty !== undefined) {
          message += `
   • ${l.beforeQuantity}: ${item.current_qty}
   • ${l.afterQuantity}: ${item.new_qty}
   • ${l.quantity}: ${Math.abs(item.quantity)} (${item.quantity > 0 ? '+' : ''}${item.quantity})`
        } else {
          // For other transaction types, show regular quantity
          message += `
   • ${l.quantity}: ${Math.abs(item.quantity)}`
        }
      })

      if (transaction.items.length > 10) {
        message += `
... ${transaction.items.length - 10} ${l.moreItems}`
      }
    } else {
      message += `
   ${l.noItems}`
    }

    message += `

<i>${l.recordedIn}</i>`

    return message.trim()
  }

  /**
   * Test bot connection
   */
  async testConnection(): Promise<boolean> {
    return await this.sendSystemNotification(
      'Telegram Bot Test',
      '🎉 Telegram bot is working correctly! This is a test message from SSTH Inventory System.',
      'low'
    )
  }
}

// Singleton instance
export const telegramBot = new TelegramBotService()

export default telegramBot