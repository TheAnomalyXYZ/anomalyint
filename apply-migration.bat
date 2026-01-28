@echo off
echo Applying brand_profiles migration to Supabase...
psql "postgresql://postgres.poxtygumdxfuxjohfsqh:i4rLFuDslfCmfiVx@aws-1-us-east-1.pooler.supabase.com:5432/postgres?pgbouncer=true" -f supabase\migrations\20260127_create_brand_profiles.sql
echo Migration complete!
pause
