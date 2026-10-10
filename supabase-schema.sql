-- ===================================================================
-- 99 SOLAR HAT YAI - SUPABASE DATABASE SCHEMA
-- บริษัท 99 แมทช์ เมคเกอร์ จำกัด (คุณไจ๋ไจ๋ 090-715-1987)
-- ===================================================================
-- วิธีใช้: นำโค้ดทั้งหมดนี้ไปวางในหน้า SQL Editor ของ Supabase แล้วกด "RUN" 1 ครั้ง
-- ===================================================================

-- 1. ตารางลูกค้าติดต่อ / นัดหมายสำรวจหน้างาน (Leads)
CREATE TABLE IF NOT EXISTS public.solar_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    line_id TEXT DEFAULT '-',
    monthly_bill NUMERIC DEFAULT 0,
    location TEXT DEFAULT 'หาดใหญ่/สงขลา',
    interests JSONB DEFAULT '[]'::jsonb,
    source TEXT DEFAULT 'website_consult_form',
    status TEXT DEFAULT 'new' -- 'new', 'contacted', 'surveyed', 'closed'
);

-- 2. ตารางใบเสนอราคาติดตั้งโซลาร์เซลล์ (Quotations)
CREATE TABLE IF NOT EXISTS public.quotations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    quote_no TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    customer_type TEXT DEFAULT 'personal', -- 'personal' or 'company'
    tax_id TEXT DEFAULT '-',
    branch TEXT DEFAULT '-',
    contact_person TEXT DEFAULT '-',
    phone TEXT DEFAULT '-',
    address TEXT DEFAULT 'หาดใหญ่-สงขลา',
    system_key TEXT NOT NULL,
    system_title TEXT NOT NULL,
    gross_price NUMERIC NOT NULL,
    monthly_savings NUMERIC DEFAULT 0,
    annual_savings NUMERIC DEFAULT 0,
    payback_years NUMERIC DEFAULT 0,
    purpose TEXT DEFAULT 'ขออนุมัติจัดซื้อ',
    status TEXT DEFAULT 'active'
);

-- 3. ตารางใบขอราคาอะไหล่ & ซัพพลายเออร์ (Parts RFQs)
CREATE TABLE IF NOT EXISTS public.parts_rfqs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    rfq_no TEXT NOT NULL,
    vendor_name TEXT DEFAULT '-',
    delivery_site TEXT DEFAULT 'หาดใหญ่',
    requester TEXT DEFAULT 'ฝ่ายจัดซื้อ 99 Solar',
    items JSONB DEFAULT '[]'::jsonb,
    target_total NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'pending' -- 'pending', 'quoted', 'po_issued'
);

-- 4. ตารางระบบแนะนำเพื่อนรับค่าคอมฯ (Referrals)
CREATE TABLE IF NOT EXISTS public.referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    ref_phone TEXT NOT NULL,
    friend_name TEXT NOT NULL,
    friend_phone TEXT NOT NULL,
    friend_bill TEXT DEFAULT '-',
    commission_estimate NUMERIC DEFAULT 3000,
    status TEXT DEFAULT 'pending' -- 'pending', 'installed', 'paid'
);

-- 5. ตารางสต็อกสินค้าและอุปกรณ์ ERP (Inventory)
CREATE TABLE IF NOT EXISTS public.erp_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    sku TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    qty NUMERIC DEFAULT 0,
    unit TEXT DEFAULT 'ชิ้น',
    cost_price NUMERIC DEFAULT 0,
    selling_price NUMERIC DEFAULT 0
);

-- 6. ตารางประวัติการเบิกของช่างไปหน้างาน (Requisitions)
CREATE TABLE IF NOT EXISTS public.erp_requisitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    req_code TEXT NOT NULL,
    site_name TEXT NOT NULL,
    tech_name TEXT NOT NULL,
    items JSONB DEFAULT '[]'::jsonb,
    status TEXT DEFAULT 'approved'
);

-- ===================================================================
-- การตั้งค่าความปลอดภัย ROW LEVEL SECURITY (RLS)
-- อนุญาตให้หน้าเว็บส่งข้อมูล (Insert) และอ่านข้อมูล (Select) ได้
-- ===================================================================

ALTER TABLE public.solar_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parts_rfqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_requisitions ENABLE ROW LEVEL SECURITY;

-- นโยบาย Allow All สำหรับ Public Anon Key (แก้ไของค์ประกอบ DROP / CREATE ให้ถูกต้อง 100%)
DROP POLICY IF EXISTS "Public insert leads" ON public.solar_leads;
CREATE POLICY "Public insert leads" ON public.solar_leads FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public select leads" ON public.solar_leads;
CREATE POLICY "Public select leads" ON public.solar_leads FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public insert quotations" ON public.quotations;
CREATE POLICY "Public insert quotations" ON public.quotations FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public select quotations" ON public.quotations;
CREATE POLICY "Public select quotations" ON public.quotations FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public insert rfq" ON public.parts_rfqs;
CREATE POLICY "Public insert rfq" ON public.parts_rfqs FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public select rfq" ON public.parts_rfqs;
CREATE POLICY "Public select rfq" ON public.parts_rfqs FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public insert referrals" ON public.referrals;
CREATE POLICY "Public insert referrals" ON public.referrals FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public select referrals" ON public.referrals;
CREATE POLICY "Public select referrals" ON public.referrals FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public access inventory" ON public.erp_inventory;
CREATE POLICY "Public access inventory" ON public.erp_inventory FOR ALL USING (true);

DROP POLICY IF EXISTS "Public access requisitions" ON public.erp_requisitions;
CREATE POLICY "Public access requisitions" ON public.erp_requisitions FOR ALL USING (true);

-- 7. ตารางสัญญาจ้างติดตั้งโซลาร์เซลล์ (E-Contracts & Digital Signatures)
CREATE TABLE IF NOT EXISTS public.solar_contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    contract_no TEXT UNIQUE NOT NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_id_card TEXT DEFAULT '-',
    install_address TEXT DEFAULT '-',
    system_title TEXT NOT NULL,
    total_price NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'draft', -- 'draft', 'signed', 'completed'
    signed_at TIMESTAMPTZ
);

ALTER TABLE public.solar_contracts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public insert contracts" ON public.solar_contracts;
CREATE POLICY "Public insert contracts" ON public.solar_contracts FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public select contracts" ON public.solar_contracts;
CREATE POLICY "Public select contracts" ON public.solar_contracts FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public update contracts" ON public.solar_contracts;
CREATE POLICY "Public update contracts" ON public.solar_contracts FOR UPDATE USING (true);

-- 8. ตารางคลังสมองความรู้โซลาร์เซลล์ (Solar Knowledge Base Brain)
CREATE TABLE IF NOT EXISTS public.solar_knowledge (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    category TEXT DEFAULT 'general', -- 'technical', 'packages', 'legal_tax', 'general'
    question TEXT NOT NULL,
    keywords JSONB DEFAULT '[]'::jsonb,
    answer TEXT NOT NULL,
    status TEXT DEFAULT 'active'
);

ALTER TABLE public.solar_knowledge ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public access knowledge" ON public.solar_knowledge;
CREATE POLICY "Public access knowledge" ON public.solar_knowledge FOR ALL USING (true);

