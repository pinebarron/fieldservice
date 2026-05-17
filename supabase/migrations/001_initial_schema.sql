-- FieldService Database Schema for Supabase
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor)

-- Enable UUID extension (usually already enabled in Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 1. Sessions table (for auth session storage)
-- =============================================
CREATE TABLE IF NOT EXISTS sessions (
    sid VARCHAR PRIMARY KEY,
    sess JSONB NOT NULL,
    expire TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_session_expire ON sessions(expire);

-- =============================================
-- 2. Users table
-- =============================================
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    email VARCHAR UNIQUE,
    first_name VARCHAR,
    last_name VARCHAR,
    profile_image_url VARCHAR,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- 3. Businesses table
-- =============================================
CREATE TABLE IF NOT EXISTS businesses (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    owner_id VARCHAR NOT NULL REFERENCES users(id),
    address TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    phone TEXT,
    overview TEXT,
    hours_of_operation JSONB,
    brand_color TEXT,
    logo_url TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_businesses_owner ON businesses(owner_id);

-- =============================================
-- 4. Business Members table (employees)
-- =============================================
CREATE TABLE IF NOT EXISTS business_members (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    business_id VARCHAR NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'technician',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_business_members_business ON business_members(business_id);
CREATE INDEX IF NOT EXISTS idx_business_members_user ON business_members(user_id);

-- =============================================
-- 5. Vendors table
-- =============================================
CREATE TABLE IF NOT EXISTS vendors (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    business_id VARCHAR NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    contact_name TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    services_provided JSONB DEFAULT '[]'::jsonb,
    regions_served JSONB DEFAULT '[]'::jsonb,
    insurance_provider TEXT,
    insurance_policy_number TEXT,
    insurance_expiry TEXT,
    license_number TEXT,
    license_expiry TEXT,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vendors_business ON vendors(business_id);

-- =============================================
-- 6. Properties table (job sites)
-- =============================================
CREATE TABLE IF NOT EXISTS properties (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    business_id VARCHAR NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    property_name TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    location_name TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    zip_code TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_properties_business ON properties(business_id);

-- =============================================
-- 7. Pricing Items table (rate card / catalog)
-- =============================================
CREATE TABLE IF NOT EXISTS pricing_items (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    business_id VARCHAR NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    category TEXT NOT NULL DEFAULT 'General',
    name TEXT NOT NULL,
    description TEXT,
    unit TEXT NOT NULL DEFAULT 'each',
    unit_price TEXT NOT NULL DEFAULT '0',
    is_active TEXT NOT NULL DEFAULT 'true',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pricing_items_business ON pricing_items(business_id);

-- =============================================
-- 8. Estimates table
-- =============================================
CREATE TABLE IF NOT EXISTS estimates (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    business_id VARCHAR NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    property_id VARCHAR REFERENCES properties(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT,
    customer_phone TEXT,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'draft',
    valid_until TEXT,
    tax_rate TEXT NOT NULL DEFAULT '0',
    discount_amount TEXT NOT NULL DEFAULT '0',
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_estimates_business ON estimates(business_id);
CREATE INDEX IF NOT EXISTS idx_estimates_property ON estimates(property_id);

-- =============================================
-- 9. Estimate Line Items table
-- =============================================
CREATE TABLE IF NOT EXISTS estimate_line_items (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    estimate_id VARCHAR NOT NULL REFERENCES estimates(id) ON DELETE CASCADE,
    pricing_item_id VARCHAR REFERENCES pricing_items(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    quantity TEXT NOT NULL DEFAULT '1',
    unit TEXT NOT NULL DEFAULT 'each',
    unit_price TEXT NOT NULL DEFAULT '0',
    sort_order TEXT NOT NULL DEFAULT '0'
);

CREATE INDEX IF NOT EXISTS idx_estimate_line_items_estimate ON estimate_line_items(estimate_id);

-- =============================================
-- 10. API Clients table (developer access)
-- =============================================
CREATE TABLE IF NOT EXISTS api_clients (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    business_id VARCHAR NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    client_id TEXT NOT NULL UNIQUE,
    client_secret_hash TEXT NOT NULL,
    is_active TEXT NOT NULL DEFAULT 'true',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_clients_business ON api_clients(business_id);
CREATE INDEX IF NOT EXISTS idx_api_clients_client_id ON api_clients(client_id);

-- =============================================
-- 11. Work Logs table (service records)
-- =============================================
CREATE TABLE IF NOT EXISTS work_logs (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    business_id VARCHAR NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    property_id VARCHAR REFERENCES properties(id) ON DELETE SET NULL,
    technician_user_id VARCHAR NOT NULL REFERENCES users(id),
    customer_name TEXT NOT NULL,
    work_type TEXT NOT NULL,
    location_name TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    zip_code TEXT NOT NULL,
    service_date TEXT NOT NULL,
    start_time TEXT,
    end_time TEXT,
    work_performed TEXT NOT NULL,
    additional_notes TEXT,
    status TEXT NOT NULL DEFAULT 'completed',
    technician_user_ids JSONB DEFAULT '[]'::jsonb,
    image_urls JSONB DEFAULT '[]'::jsonb,
    pdf_urls JSONB DEFAULT '[]'::jsonb,
    photo_metadata JSONB DEFAULT '[]'::jsonb,
    check_in_time TEXT,
    check_out_time TEXT,
    check_in_lat TEXT,
    check_in_lng TEXT,
    check_out_lat TEXT,
    check_out_lng TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_work_logs_business ON work_logs(business_id);
CREATE INDEX IF NOT EXISTS idx_work_logs_property ON work_logs(property_id);
CREATE INDEX IF NOT EXISTS idx_work_logs_technician ON work_logs(technician_user_id);
CREATE INDEX IF NOT EXISTS idx_work_logs_service_date ON work_logs(service_date);

-- =============================================
-- Row Level Security (RLS) Policies
-- =============================================
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE estimate_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_logs ENABLE ROW LEVEL SECURITY;

-- Service role bypass (for server-side operations)
-- These policies allow the service role to perform all operations
CREATE POLICY "Service role has full access to users" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role has full access to businesses" ON businesses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role has full access to business_members" ON business_members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role has full access to vendors" ON vendors FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role has full access to properties" ON properties FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role has full access to pricing_items" ON pricing_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role has full access to estimates" ON estimates FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role has full access to estimate_line_items" ON estimate_line_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role has full access to api_clients" ON api_clients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role has full access to work_logs" ON work_logs FOR ALL USING (true) WITH CHECK (true);

-- =============================================
-- Updated_at trigger function
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_businesses_updated_at BEFORE UPDATE ON businesses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vendors_updated_at BEFORE UPDATE ON vendors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON properties FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pricing_items_updated_at BEFORE UPDATE ON pricing_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_estimates_updated_at BEFORE UPDATE ON estimates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_work_logs_updated_at BEFORE UPDATE ON work_logs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
