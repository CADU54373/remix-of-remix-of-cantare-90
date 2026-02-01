-- Remove OTP system completely

-- Drop trigger first
DROP TRIGGER IF EXISTS cleanup_expired_otps_trigger ON public.otp_codes;

-- Drop functions
DROP FUNCTION IF EXISTS public.trigger_cleanup_expired_otps();
DROP FUNCTION IF EXISTS public.cleanup_expired_otps();

-- Drop table (CASCADE removes all policies and indexes automatically)
DROP TABLE IF EXISTS public.otp_codes CASCADE;