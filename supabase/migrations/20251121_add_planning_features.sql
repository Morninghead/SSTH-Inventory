-- Create department_plans table
CREATE TABLE IF NOT EXISTS public.department_plans (
    plan_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    department_id UUID REFERENCES public.departments(dept_id) NOT NULL,
    month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
    year INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'DRAFT', -- DRAFT, SUBMITTED, APPROVED
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(department_id, month, year)
);

-- Create department_plan_items table
CREATE TABLE IF NOT EXISTS public.department_plan_items (
    plan_item_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    plan_id UUID REFERENCES public.department_plans(plan_id) ON DELETE CASCADE NOT NULL,
    item_id UUID REFERENCES public.items(item_id) NOT NULL,
    planned_quantity INTEGER NOT NULL CHECK (planned_quantity > 0),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create backorders table
CREATE TABLE IF NOT EXISTS public.backorders (
    backorder_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    department_id UUID REFERENCES public.departments(dept_id) NOT NULL,
    item_id UUID REFERENCES public.items(item_id) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, FULFILLED, CANCELLED
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    notes TEXT
);

-- Enable RLS
ALTER TABLE public.department_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.department_plan_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backorders ENABLE ROW LEVEL SECURITY;

-- Create policies (simplified for now, allow authenticated users to do everything)
CREATE POLICY "Enable all access for authenticated users" ON public.department_plans
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all access for authenticated users" ON public.department_plan_items
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all access for authenticated users" ON public.backorders
    FOR ALL USING (auth.role() = 'authenticated');
