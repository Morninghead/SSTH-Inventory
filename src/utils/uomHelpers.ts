import { supabase } from '../lib/supabase'
import type { Database } from '../types/database.types'

type UOM = Database['public']['Tables']['uom']['Row']
type UOMConversion = Database['public']['Tables']['uom_conversions']['Row']
type Item = Database['public']['Tables']['items']['Row']

export interface UOMWithConversion extends UOM {
  conversion_to_base?: number
  level?: number
}

export interface ConversionResult {
  quantity: number
  from_uom: string
  to_uom: string
  converted_quantity: number
}

/**
 * Get all UOMs from the database
 */
export async function getAllUOMs(): Promise<UOM[]> {
  const { data, error } = await supabase
    .from('uom')
    .select('*')
    .order('uom_code')

  if (error) throw error
  return data || []
}

/**
 * Get UOMs by category
 */
export async function getUOMsByCategory(category: string = 'GENERAL'): Promise<UOM[]> {
  const { data, error } = await supabase
    .from('uom')
    .select('*')
    .eq('category', category)
    .order('uom_code')

  if (error) throw error
  return data || []
}

/**
 * Get all UOM conversions for a specific item
 * Includes global conversions (item_id = null)
 */
export async function getItemUOMConversions(itemId: string): Promise<UOMConversion[]> {
  const { data, error } = await supabase
    .from('uom_conversions')
    .select('*')
    .or(`item_id.eq.${itemId},item_id.is.null`)
    .eq('is_active', true)
    .order('from_uom, to_uom')

  if (error) throw error
  return data || []
}

/**
 * Get UOM hierarchy for an item with conversion factors
 */
export async function getItemUOMHierarchy(itemId: string): Promise<UOMWithConversion[]> {
  const { data: uoms, error } = await supabase
    .rpc('get_item_uoms', { p_item_id: itemId })

  if (error) throw error

  // Get conversions for this item
  const conversions = await getItemUOMConversions(itemId)

  // Combine UOMs with their conversion factors
  const uomsWithConversions: UOMWithConversion[] = (uoms || []).map(uom => {
    // Find if this UOM has a conversion to base UOM
    const conversion = conversions.find(c => c.to_uom === uom.uom_code || c.from_uom === uom.uom_code)
    return {
      ...uom,
      conversion_to_base: conversion ?
        (conversion.to_uom === uom.uom_code ? conversion.conversion_factor : 1 / conversion.conversion_factor) :
        1,
      level: uom.is_base_uom ? 0 : 1 // Simple level assignment
    }
  })

  return uomsWithConversions
}

/**
 * Convert quantity from one UOM to another
 */
export async function convertUOMQuantity(
  itemId: string,
  quantity: number,
  fromUOM: string,
  toUOM: string
): Promise<number> {
  const { data, error } = await supabase
    .rpc('convert_uom_quantity', {
      p_item_id: itemId,
      p_quantity: quantity,
      p_from_uom: fromUOM,
      p_to_uom: toUOM
    })

  if (error) throw error
  return data || quantity
}

/**
 * Get conversion factor between two UOMs for an item
 */
export async function getUOMConversionFactor(
  itemId: string,
  fromUOM: string,
  toUOM: string
): Promise<number> {
  const { data, error } = await supabase
    .rpc('get_uom_conversion', {
      p_item_id: itemId,
      p_from_uom: fromUOM,
      p_to_uom: toUOM
    })

  if (error) throw error
  return data || 1
}

/**
 * Create or update a UOM conversion for an item
 */
export async function upsertUOMConversion(
  itemId: string,
  fromUOM: string,
  toUOM: string,
  conversionFactor: number
): Promise<UOMConversion> {
  const { data, error } = await supabase
    .from('uom_conversions')
    .upsert({
      item_id: itemId,
      from_uom: fromUOM,
      to_uom: toUOM,
      conversion_factor: conversionFactor,
      is_active: true
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Delete a UOM conversion for an item
 */
export async function deleteUOMConversion(
  itemId: string,
  fromUOM: string,
  toUOM: string
): Promise<void> {
  const { error } = await supabase
    .from('uom_conversions')
    .delete()
    .eq('item_id', itemId)
    .eq('from_uom', fromUOM)
    .eq('to_uom', toUOM)

  if (error) throw error
}

/**
 * Format quantity with UOM, with proper pluralization
 */
export function formatQuantityWithUOM(quantity: number, uom: string): string {
  const roundedQuantity = Math.round(quantity * 1000) / 1000 // Round to 3 decimal places

  // Handle pluralization for common UOMs
  if (roundedQuantity === 1) {
    // Singular form
    switch (uom.toUpperCase()) {
      case 'BOX':
        return `${roundedQuantity} Box`
      case 'CASE':
        return `${roundedQuantity} Case`
      case 'PACK':
        return `${roundedQuantity} Pack`
      case 'PALLET':
        return `${roundedQuantity} Pallet`
      case 'EA':
      case 'EACH':
        return `${roundedQuantity} Each`
      case 'PCS':
      case 'PIECE':
        return `${roundedQuantity} Piece`
      default:
        return `${roundedQuantity} ${uom}`
    }
  } else {
    // Plural form
    switch (uom.toUpperCase()) {
      case 'BOX':
        return `${roundedQuantity} Boxes`
      case 'CASE':
        return `${roundedQuantity} Cases`
      case 'PACK':
        return `${roundedQuantity} Packs`
      case 'PALLET':
        return `${roundedQuantity} Pallets`
      case 'EA':
      case 'EACH':
        return `${roundedQuantity} Each`
      case 'PCS':
      case 'PIECE':
        return `${roundedQuantity} Pieces`
      default:
        return `${roundedQuantity} ${uom}`
    }
  }
}

/**
 * Convert stock quantity to display in multiple UOMs
 * Returns the quantity broken down into the largest possible UOMs
 */
export async function formatStockInMultipleUOMs(
  itemId: string,
  baseQuantity: number,
  baseUOM: string
): Promise<string> {
  try {
    // Get all conversions for this item
    const conversions = await getItemUOMConversions(itemId)

    // Find conversions from base UOM to other UOMs
    const fromBaseConversions = conversions.filter(c => c.from_uom === baseUOM)

    let remainingQuantity = baseQuantity
    const parts: string[] = []

    // Convert to each larger UOM
    for (const conversion of fromBaseConversions) {
      if (remainingQuantity <= 0) break

      const convertedQuantity = remainingQuantity / conversion.conversion_factor

      if (convertedQuantity >= 1) {
        const wholeUnits = Math.floor(convertedQuantity)
        parts.push(formatQuantityWithUOM(wholeUnits, conversion.to_uom))
        remainingQuantity -= wholeUnits * conversion.conversion_factor
      }
    }

    // Add remaining base units
    if (remainingQuantity > 0 || parts.length === 0) {
      parts.push(formatQuantityWithUOM(remainingQuantity, baseUOM))
    }

    return parts.join(', ') || formatQuantityWithUOM(0, baseUOM)
  } catch (error) {
    // If anything fails, return base quantity
    return formatQuantityWithUOM(baseQuantity, baseUOM)
  }
}

/**
 * Calculate the best UOM to display for a given quantity
 * Returns the UOM that results in the smallest whole number >= 1
 */
export async function getBestDisplayUOM(
  itemId: string,
  quantity: number,
  fromUOM: string
): Promise<{ quantity: number; uom: string }> {
  try {
    const uomHierarchy = await getItemUOMHierarchy(itemId)

    // Test each UOM from largest to smallest
    const sortedUOMs = uomHierarchy.sort((a, b) => (b.level || 0) - (a.level || 0))

    for (const uom of sortedUOMs) {
      const convertedQuantity = await convertUOMQuantity(
        itemId,
        quantity,
        fromUOM,
        uom.uom_code
      )

      if (convertedQuantity >= 0.5 && convertedQuantity <= 1000) {
        return {
          quantity: convertedQuantity,
          uom: uom.uom_code
        }
      }
    }

    // If no suitable UOM found, return original
    return { quantity, uom: fromUOM }
  } catch (error) {
    return { quantity, uom: fromUOM }
  }
}

/**
 * Validate UOM conversion chain exists for an item
 */
export async function validateUOMChain(
  itemId: string,
  uomList: string[]
): Promise<boolean> {
  try {
    for (let i = 0; i < uomList.length - 1; i++) {
      const factor = await getUOMConversionFactor(itemId, uomList[i], uomList[i + 1])
      if (!factor || factor === 1) {
        return false
      }
    }
    return true
  } catch {
    return false
  }
}

/**
 * Get all possible conversions for a UOM
 */
export async function getUOMConversionPaths(
  itemId: string,
  fromUOM: string
): Promise<{ to_uom: string; factor: number }[]> {
  const conversions = await getItemUOMConversions(itemId)

  // Find direct conversions
  const directConversions = conversions
    .filter(c => c.from_uom === fromUOM)
    .map(c => ({ to_uom: c.to_uom, factor: c.conversion_factor }))

  // Find reverse conversions
  const reverseConversions = conversions
    .filter(c => c.to_uom === fromUOM)
    .map(c => ({ to_uom: c.from_uom, factor: 1 / c.conversion_factor }))

  return [...directConversions, ...reverseConversions]
}

/**
 * Batch convert quantities to multiple UOMs
 */
export async function batchConvertToMultipleUOMs(
  itemId: string,
  quantity: number,
  fromUOM: string,
  targetUOMs: string[]
): Promise<ConversionResult[]> {
  const results: ConversionResult[] = []

  for (const toUOM of targetUOMs) {
    try {
      const convertedQuantity = await convertUOMQuantity(
        itemId,
        quantity,
        fromUOM,
        toUOM
      )

      results.push({
        quantity,
        from_uom: fromUOM,
        to_uom: toUOM,
        converted_quantity: convertedQuantity
      })
    } catch (error) {
      results.push({
        quantity,
        from_uom: fromUOM,
        to_uom: toUOM,
        converted_quantity: 0
      })
    }
  }

  return results
}