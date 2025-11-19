// Multi-Provider AI Service
// Supports OpenAI, Gemini, GLM, Anthropic, Cohere, and Mistral

interface AIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface AIProvider {
  id: string
  name: string
  baseUrl: string
  apiKey: string
  model: string
  temperature: number
  maxTokens: number
}

interface AIResponse {
  content: string
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
  provider: string
}

interface InventoryInsightRequest {
  itemData: Array<{
    item_code: string
    description: string
    current_stock: number
    avg_monthly_usage: number
    unit_cost: number
    reorder_level: number
  }>
  transactionData?: Array<{
    item_code: string
    quantity: number
    transaction_date: string
    department: string
  }>
  context?: string
}

class MultiAIService {
  private providers: Record<string, AIProvider> = {}
  private defaultProvider: string = 'openai'

  constructor() {
    this.loadConfigurations()
  }

  // Load configurations from localStorage
  private loadConfigurations() {
    const savedConfigs = localStorage.getItem('ai-configs')
    if (savedConfigs) {
      try {
        const configs = JSON.parse(savedConfigs)
        Object.keys(configs).forEach(providerId => {
          const config = configs[providerId]
          if (config.apiKey && config.isEnabled) {
            this.providers[providerId] = {
              id: providerId,
              name: this.getProviderName(providerId),
              baseUrl: this.getProviderBaseUrl(providerId),
              apiKey: config.apiKey,
              model: config.model || this.getDefaultModel(providerId),
              temperature: config.temperature || 0.7,
              maxTokens: config.maxTokens || 2000
            }
          }
        })

        // Set default provider to first enabled one
        const enabledProviders = Object.keys(this.providers)
        if (enabledProviders.length > 0) {
          this.defaultProvider = enabledProviders[0]
        }
      } catch (error) {
        console.error('Failed to load AI configurations:', error)
      }
    }
  }

  // Reload configurations (for hot reloading from settings)
  reloadConfigurations() {
    this.providers = {}
    this.loadConfigurations()
  }

  // Get provider information
  private getProviderName(providerId: string): string {
    const names: Record<string, string> = {
      openai: 'OpenAI',
      gemini: 'Google Gemini',
      glm: 'GLM',
      anthropic: 'Anthropic Claude',
      cohere: 'Cohere',
      mistral: 'Mistral AI'
    }
    return names[providerId] || providerId
  }

  private getProviderBaseUrl(providerId: string): string {
    const urls: Record<string, string> = {
      openai: 'https://api.openai.com/v1',
      gemini: 'https://generativelanguage.googleapis.com/v1',
      glm: 'https://open.bigmodel.cn/api/paas/v4',
      anthropic: 'https://api.anthropic.com/v1',
      cohere: 'https://api.cohere.ai/v1',
      mistral: 'https://api.mistral.ai/v1'
    }
    return urls[providerId] || ''
  }

  private getDefaultModel(providerId: string): string {
    const models: Record<string, string> = {
      openai: 'gpt-3.5-turbo',
      gemini: 'gemini-pro',
      glm: 'glm-4',
      anthropic: 'claude-3-haiku',
      cohere: 'command',
      mistral: 'mistral-small'
    }
    return models[providerId] || 'default'
  }

  // Check if any providers are configured
  hasProviders(): boolean {
    return Object.keys(this.providers).length > 0
  }

  // Get list of configured providers
  getConfiguredProviders(): string[] {
    return Object.keys(this.providers)
  }

  // Get default provider
  getDefaultProvider(): string | null {
    return this.defaultProvider || null
  }

  // Set default provider
  setDefaultProvider(providerId: string) {
    if (this.providers[providerId]) {
      this.defaultProvider = providerId
    }
  }

  // Make API call to specific provider
  private async callProvider(
    providerId: string,
    messages: AIMessage[]
  ): Promise<AIResponse> {
    const provider = this.providers[providerId]
    if (!provider) {
      throw new Error(`Provider ${providerId} not configured`)
    }

    try {
      switch (providerId) {
        case 'openai':
          return await this.callOpenAI(provider, messages)
        case 'gemini':
          return await this.callGemini(provider, messages)
        case 'glm':
          return await this.callGLM(provider, messages)
        case 'anthropic':
          return await this.callAnthropic(provider, messages)
        case 'cohere':
          return await this.callCohere(provider, messages)
        case 'mistral':
          return await this.callMistral(provider, messages)
        default:
          throw new Error(`Unsupported provider: ${providerId}`)
      }
    } catch (error) {
      console.error(`Error calling ${provider.name}:`, error)
      throw error
    }
  }

  // OpenAI implementation
  private async callOpenAI(provider: AIProvider, messages: AIMessage[]): Promise<AIResponse> {
    const response = await fetch(`${provider.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${provider.apiKey}`
      },
      body: JSON.stringify({
        model: provider.model,
        messages,
        temperature: provider.temperature,
        max_tokens: provider.maxTokens
      })
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`)
    }

    const data = await response.json()
    return {
      content: data.choices[0].message.content,
      usage: data.usage,
      provider: provider.id
    }
  }

  // Gemini implementation
  private async callGemini(provider: AIProvider, messages: AIMessage[]): Promise<AIResponse> {
    // Convert messages to Gemini format
    const contents = messages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }))

    const response = await fetch(
      `${provider.baseUrl}/models/${provider.model}:generateContent?key=${provider.apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: provider.temperature,
            maxOutputTokens: provider.maxTokens
          }
        })
      }
    )

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`)
    }

    const data = await response.json()
    return {
      content: data.candidates[0].content.parts[0].text,
      provider: provider.id
    }
  }

  // GLM implementation
  private async callGLM(provider: AIProvider, messages: AIMessage[]): Promise<AIResponse> {
    const response = await fetch(`${provider.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${provider.apiKey}`
      },
      body: JSON.stringify({
        model: provider.model,
        messages,
        temperature: provider.temperature,
        max_tokens: provider.maxTokens
      })
    })

    if (!response.ok) {
      throw new Error(`GLM API error: ${response.statusText}`)
    }

    const data = await response.json()
    return {
      content: data.choices[0].message.content,
      usage: data.usage,
      provider: provider.id
    }
  }

  // Anthropic implementation
  private async callAnthropic(provider: AIProvider, messages: AIMessage[]): Promise<AIResponse> {
    // Filter out system message and handle separately
    const systemMessage = messages.find(msg => msg.role === 'system')
    const userMessages = messages.filter(msg => msg.role !== 'system')

    const response = await fetch(`${provider.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': provider.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: provider.model,
        max_tokens: provider.maxTokens,
        temperature: provider.temperature,
        system: systemMessage?.content,
        messages: userMessages.map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      })
    })

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.statusText}`)
    }

    const data = await response.json()
    return {
      content: data.content[0].text,
      usage: data.usage,
      provider: provider.id
    }
  }

  // Cohere implementation
  private async callCohere(provider: AIProvider, messages: AIMessage[]): Promise<AIResponse> {
    // Convert messages to Cohere format
    const chatHistory = messages.slice(0, -1).map(msg => ({
      role: msg.role === 'assistant' ? 'CHATBOT' : 'USER',
      message: msg.content
    }))
    const lastMessage = messages[messages.length - 1]

    const response = await fetch(`${provider.baseUrl}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${provider.apiKey}`
      },
      body: JSON.stringify({
        model: provider.model,
        message: lastMessage.content,
        chat_history: chatHistory,
        temperature: provider.temperature,
        max_tokens: provider.maxTokens
      })
    })

    if (!response.ok) {
      throw new Error(`Cohere API error: ${response.statusText}`)
    }

    const data = await response.json()
    return {
      content: data.text,
      provider: provider.id
    }
  }

  // Mistral implementation
  private async callMistral(provider: AIProvider, messages: AIMessage[]): Promise<AIResponse> {
    const response = await fetch(`${provider.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${provider.apiKey}`
      },
      body: JSON.stringify({
        model: provider.model,
        messages,
        temperature: provider.temperature,
        max_tokens: provider.maxTokens
      })
    })

    if (!response.ok) {
      throw new Error(`Mistral API error: ${response.statusText}`)
    }

    const data = await response.json()
    return {
      content: data.choices[0].message.content,
      usage: data.usage,
      provider: provider.id
    }
  }

  // Generate inventory insights with fallback providers
  async generateInventoryInsights(request: InventoryInsightRequest): Promise<string> {
    if (!this.hasProviders()) {
      return this.getRuleBasedInsights(request)
    }

    const systemPrompt = `You are an AI assistant for inventory management. Analyze the provided inventory data and provide actionable insights.
Focus on:
1. Stock optimization recommendations
2. Cost saving opportunities
3. Demand forecasting
4. Risk identification

Be specific, data-driven, and provide clear action items.`

    const userPrompt = this.formatInventoryData(request)

    const messages: AIMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ]

    // Try default provider first, then fallback to others
    const providers = [this.defaultProvider, ...this.getConfiguredProviders().filter(p => p !== this.defaultProvider)]

    for (const providerId of providers) {
      try {
        const response = await this.callProvider(providerId, messages)
        return response.content
      } catch (error) {
        console.warn(`Failed to use provider ${providerId}, trying next...`, error)
        continue
      }
    }

    // If all providers fail, fall back to rule-based insights
    console.warn('All AI providers failed, using rule-based insights')
    return this.getRuleBasedInsights(request)
  }

  // Format inventory data for AI prompt
  private formatInventoryData(request: InventoryInsightRequest): string {
    let prompt = `Inventory Data Analysis Request:\n\n`

    prompt += `Items (${request.itemData.length}):\n`
    prompt += request.itemData.map(item =>
      `- ${item.item_code}: ${item.description}\n` +
      `  Current Stock: ${item.current_stock}, Avg Monthly Usage: ${item.avg_monthly_usage}, Reorder Level: ${item.reorder_level}\n` +
      `  Unit Cost: ฿${item.unit_cost.toFixed(2)}, Total Value: ฿${(item.current_stock * item.unit_cost).toFixed(2)}`
    ).join('\n\n')

    if (request.transactionData && request.transactionData.length > 0) {
      prompt += `\n\nRecent Transactions (${request.transactionData.length}):\n`
      prompt += request.transactionData.map(tx =>
        `- ${tx.item_code}: ${tx.quantity} units to ${tx.department} on ${new Date(tx.transaction_date).toLocaleDateString()}`
      ).join('\n')
    }

    if (request.context) {
      prompt += `\n\nAdditional Context: ${request.context}`
    }

    prompt += `\n\nPlease analyze this data and provide 3-5 key insights with specific recommendations.`

    return prompt
  }

  // Rule-based insights as fallback
  private getRuleBasedInsights(request: InventoryInsightRequest): string {
    const insights = []

    // Low stock analysis
    const lowStockItems = request.itemData.filter(item =>
      item.current_stock <= item.reorder_level
    )

    if (lowStockItems.length > 0) {
      insights.push(`🚨 **Low Stock Alert**: ${lowStockItems.length} items need reordering. Consider prioritizing ${lowStockItems[0].item_code}.`)
    }

    // Overstock analysis
    const overstockItems = request.itemData.filter(item =>
      item.current_stock > item.reorder_level * 3
    )

    if (overstockItems.length > 0) {
      insights.push(`📦 **Overstock Detected**: ${overstockItems.length} items have excess inventory. Total value: ฿${overstockItems.reduce((sum, item) => sum + (item.current_stock * item.unit_cost), 0).toFixed(2)}.`)
    }

    // High value analysis
    const highValueItems = request.itemData
      .filter(item => item.current_stock * item.unit_cost > 10000)
      .sort((a, b) => (b.current_stock * b.unit_cost) - (a.current_stock * a.unit_cost))

    if (highValueItems.length > 0) {
      insights.push(`💰 **High Value Items**: Top items by inventory value: ${highValueItems.slice(0, 3).map(item => item.item_code).join(', ')}`)
    }

    // Usage analysis
    const highUsageItems = request.itemData
      .filter(item => item.avg_monthly_usage > 0)
      .sort((a, b) => b.avg_monthly_usage - a.avg_monthly_usage)

    if (highUsageItems.length > 0) {
      insights.push(`📊 **High Usage Items**: Most consumed items: ${highUsageItems.slice(0, 3).map(item => `${item.item_code} (${item.avg_monthly_usage}/month)`).join(', ')}`)
    }

    if (insights.length === 0) {
      insights.push("✅ **Inventory Status**: All items are within normal stock levels. Continue monitoring for any changes in demand patterns.")
    }

    return insights.join('\n\n')
  }

  // Simple query method
  async query(prompt: string, context?: string): Promise<string> {
    if (!this.hasProviders()) {
      return `AI features are not configured. Please set up API keys in Settings > AI Configuration to enable AI-powered insights.`
    }

    const systemPrompt = context || `You are a helpful AI assistant for inventory management. Provide clear, concise, and actionable responses.`

    const messages: AIMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ]

    try {
      const response = await this.callProvider(this.defaultProvider!, messages)
      return response.content
    } catch (error) {
      console.error('AI query failed:', error)
      return `I apologize, but I'm unable to process your request at the moment. Please check your AI configuration or try again later.`
    }
  }
}

// Create singleton instance
const multiAIService = new MultiAIService()

// Make it available globally for hot reloading
if (typeof window !== 'undefined') {
  (window as any).reloadAIService = () => multiAIService.reloadConfigurations()
}

export default multiAIService