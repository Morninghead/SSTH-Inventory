import type { Database } from './database.types'

export type DepartmentPlan = {
    plan_id: string
    department_id: string
    month: number
    year: number
    status: 'DRAFT' | 'SUBMITTED' | 'APPROVED'
    created_by: string | null
    created_at: string
    updated_at: string
    // Joins
    departments?: { dept_name: string } | null
    user_profiles?: { first_name: string; last_name: string } | null
}

export type DepartmentPlanItem = {
    plan_item_id: string
    plan_id: string
    item_id: string
    planned_quantity: number
    notes: string | null
    created_at: string
    // Joins
    items?: Database['public']['Tables']['items']['Row'] | null
}

export type Backorder = {
    backorder_id: string
    department_id: string
    item_id: string
    quantity: number
    status: 'PENDING' | 'FULFILLED' | 'CANCELLED'
    created_at: string
    updated_at: string
    notes: string | null
    // Joins
    items?: Database['public']['Tables']['items']['Row'] | null
    departments?: { dept_name: string } | null
}

export type BackorderWithDetails = {
    backorder_id: string
    department_id: string
    item_id: string
    quantity: number
    status: 'PENDING' | 'FULFILLED' | 'CANCELLED'
    created_at: string
    updated_at: string
    notes: string | null
    items: {
        item_code: string
        description: string
        unit_cost: number
        reorder_level: number
    }
    departments: {
        dept_name: string
    }
}
