-- =====================================================
-- FIX AUTH FOR NOPANAT.APLUS@GMAIL.COM
-- =====================================================

DO $$
DECLARE
    target_email TEXT := 'nopanat.aplus@gmail.com';
    target_role TEXT := 'developer'; -- Granting highest privilege
    v_user_id UUID;
    v_profile_exists BOOLEAN;
BEGIN
    -- 1. Get the User ID from auth.users
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = target_email;

    -- 2. Check if user exists in Auth
    IF v_user_id IS NULL THEN
        RAISE NOTICE '❌ User % NOT FOUND in auth.users. Please sign up first.', target_email;
    ELSE
        RAISE NOTICE '✅ Found User % with ID: %', target_email, v_user_id;

        -- 3. Check if profile exists
        SELECT EXISTS(SELECT 1 FROM public.user_profiles WHERE id = v_user_id)
        INTO v_profile_exists;

        IF v_profile_exists THEN
            -- Update existing profile
            UPDATE public.user_profiles
            SET 
                role = target_role,
                is_active = true,
                updated_at = now()
            WHERE id = v_user_id;
            
            RAISE NOTICE '✅ Updated existing profile: Role set to %', target_role;
        ELSE
            -- Create new profile
            -- Note: email column does not exist in user_profiles, only in auth.users
            INSERT INTO public.user_profiles (id, full_name, role, is_active, created_at, updated_at)
            VALUES (
                v_user_id, 
                'Nopanat (Dev)', -- Default name
                target_role, 
                true, 
                now(), 
                now()
            );
            
            RAISE NOTICE '✅ Created NEW profile with Role %', target_role;
        END IF;
    END IF;
END $$;

-- =====================================================
-- VERIFICATION
-- =====================================================
-- Join with auth.users to verify (requires privileges)
-- If running as anon, just check user_profiles
SELECT * FROM public.user_profiles 
WHERE id = (SELECT id FROM auth.users WHERE email = 'nopanat.aplus@gmail.com');
