
-- Enums
DO $$ BEGIN
  CREATE TYPE public.seo_status AS ENUM ('draft','published');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Services
CREATE TABLE IF NOT EXISTS public.seo_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  noun text NOT NULL,
  tagline text,
  default_meta_title_tpl text,
  default_meta_description_tpl text,
  default_h1_tpl text,
  default_hero_intro_tpl text,
  default_cta_text_tpl text,
  default_faqs jsonb NOT NULL DEFAULT '[]'::jsonb,
  default_testimonials jsonb NOT NULL DEFAULT '[]'::jsonb,
  status public.seo_status NOT NULL DEFAULT 'published',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Industries
CREATE TABLE IF NOT EXISTS public.seo_industries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  noun text NOT NULL,
  hero_blurb text,
  pain_points jsonb NOT NULL DEFAULT '[]'::jsonb,
  use_cases jsonb NOT NULL DEFAULT '[]'::jsonb,
  default_faqs jsonb NOT NULL DEFAULT '[]'::jsonb,
  status public.seo_status NOT NULL DEFAULT 'published',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- City overrides
CREATE TABLE IF NOT EXISTS public.seo_city_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid NOT NULL REFERENCES public.seo_services(id) ON DELETE CASCADE,
  city_slug text NOT NULL,
  meta_title text,
  meta_description text,
  h1 text,
  hero_intro text,
  cta_text text,
  body_html text,
  faqs jsonb NOT NULL DEFAULT '[]'::jsonb,
  testimonials jsonb NOT NULL DEFAULT '[]'::jsonb,
  nearby_slugs text[] NOT NULL DEFAULT '{}',
  status public.seo_status NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (service_id, city_slug)
);

-- Industry overrides
CREATE TABLE IF NOT EXISTS public.seo_industry_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid NOT NULL REFERENCES public.seo_services(id) ON DELETE CASCADE,
  industry_slug text NOT NULL,
  meta_title text,
  meta_description text,
  h1 text,
  hero_intro text,
  cta_text text,
  body_html text,
  faqs jsonb NOT NULL DEFAULT '[]'::jsonb,
  testimonials jsonb NOT NULL DEFAULT '[]'::jsonb,
  status public.seo_status NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (service_id, industry_slug)
);

-- Industry + city overrides
CREATE TABLE IF NOT EXISTS public.seo_industry_city_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid NOT NULL REFERENCES public.seo_services(id) ON DELETE CASCADE,
  industry_slug text NOT NULL,
  city_slug text NOT NULL,
  meta_title text,
  meta_description text,
  h1 text,
  hero_intro text,
  cta_text text,
  body_html text,
  faqs jsonb NOT NULL DEFAULT '[]'::jsonb,
  testimonials jsonb NOT NULL DEFAULT '[]'::jsonb,
  nearby_slugs text[] NOT NULL DEFAULT '{}',
  status public.seo_status NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (service_id, industry_slug, city_slug)
);

-- updated_at triggers
DROP TRIGGER IF EXISTS seo_services_updated_at ON public.seo_services;
CREATE TRIGGER seo_services_updated_at BEFORE UPDATE ON public.seo_services
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS seo_industries_updated_at ON public.seo_industries;
CREATE TRIGGER seo_industries_updated_at BEFORE UPDATE ON public.seo_industries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS seo_city_pages_updated_at ON public.seo_city_pages;
CREATE TRIGGER seo_city_pages_updated_at BEFORE UPDATE ON public.seo_city_pages
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS seo_industry_pages_updated_at ON public.seo_industry_pages;
CREATE TRIGGER seo_industry_pages_updated_at BEFORE UPDATE ON public.seo_industry_pages
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS seo_industry_city_pages_updated_at ON public.seo_industry_city_pages;
CREATE TRIGGER seo_industry_city_pages_updated_at BEFORE UPDATE ON public.seo_industry_city_pages
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.seo_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_industries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_city_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_industry_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_industry_city_pages ENABLE ROW LEVEL SECURITY;

-- Public read of published rows
CREATE POLICY "Public read published seo_services" ON public.seo_services
  FOR SELECT USING (status = 'published');
CREATE POLICY "Public read published seo_industries" ON public.seo_industries
  FOR SELECT USING (status = 'published');
CREATE POLICY "Public read published seo_city_pages" ON public.seo_city_pages
  FOR SELECT USING (status = 'published');
CREATE POLICY "Public read published seo_industry_pages" ON public.seo_industry_pages
  FOR SELECT USING (status = 'published');
CREATE POLICY "Public read published seo_industry_city_pages" ON public.seo_industry_city_pages
  FOR SELECT USING (status = 'published');

-- Admin full access
CREATE POLICY "Admins manage seo_services" ON public.seo_services
  FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins manage seo_industries" ON public.seo_industries
  FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins manage seo_city_pages" ON public.seo_city_pages
  FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins manage seo_industry_pages" ON public.seo_industry_pages
  FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins manage seo_industry_city_pages" ON public.seo_industry_city_pages
  FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- Seed services
INSERT INTO public.seo_services (slug, name, noun, tagline, default_meta_title_tpl, default_meta_description_tpl, default_h1_tpl, default_hero_intro_tpl, default_cta_text_tpl, default_faqs, status) VALUES
('attendance-management-software','Attendance Management Software','Attendance Management Software','Track attendance, shifts and payroll hours.',
 'Best Attendance Management Software in {city} (2026) — Punchly',
 'Looking for the best attendance management software in {city}, {state}? Punchly by Oqlio gives {city} teams GPS check-ins, shift scheduling and payroll-ready reports.',
 'Best attendance management software in {city}',
 'Punchly helps {city} businesses replace clunky biometric devices with a 2-second mobile check-in, geofenced shifts and automatic payroll exports.',
 'Start your free Punchly trial for {city}',
 '[{"q":"Which is the best attendance management software in {city}?","a":"Punchly by Oqlio is trusted by {city} teams of every size — from 5-person cafes to 500-employee factories — for GPS check-ins, shift scheduling and payroll-ready reports."},{"q":"Does Punchly work for multiple branches in {city}?","a":"Yes. Add unlimited locations, assign geofences and roll up attendance across all of your {city} branches in one dashboard."},{"q":"Can employees mark attendance without a biometric device?","a":"Yes — any phone, tablet or shared kiosk works. Face check-in, GPS and PIN fallback are included."}]'::jsonb,
 'published'),
('employee-management-software','Employee Management Software','Employee Management Software','Manage your entire workforce in one place.',
 'Best Employee Management Software in {city} (2026) — Punchly',
 'Punchly by Oqlio is the modern employee management software for {city}, {state} businesses. Profiles, attendance, leaves, payroll exports.',
 'Best employee management software in {city}',
 'From onboarding to payroll, Punchly gives {city} HR teams one clean system for every employee record.',
 'Try Punchly free in {city}',
 '[{"q":"Is Punchly suitable for small businesses in {city}?","a":"Yes — start free for up to 5 employees and scale to thousands without changing tools."}]'::jsonb,
 'published'),
('gps-attendance-software','GPS Attendance Software','GPS Attendance Software','Geo-verified check-ins from any phone.',
 'GPS Attendance Software in {city} (2026) — Punchly',
 'Punchly GPS attendance for {city}, {state}. Geofenced check-ins, spoof detection, offline-first, payroll-ready.',
 'GPS attendance software in {city}',
 'Punchly verifies every {city} check-in with GPS + device binding so field staff and remote teams stay accountable.',
 'Start GPS tracking for your {city} team',
 '[{"q":"Can field staff mark attendance from anywhere in {city}?","a":"Yes — Punchly works on any phone and queues check-ins offline when network is patchy."}]'::jsonb,
 'published'),
('employee-tracking-software','Employee Tracking Software','Employee Tracking Software','See where your team is working from.',
 'Employee Tracking Software in {city} (2026) — Punchly',
 'Track field employees in {city}, {state} with Punchly — GPS, geofencing, productivity insights and payroll exports.',
 'Employee tracking software in {city}',
 'Punchly gives {city} managers a live view of who is on-site, on-shift and on-task — without spy-grade surveillance.',
 'Track your {city} team with Punchly',
 '[]'::jsonb,
 'published'),
('time-tracking-software','Time Tracking Software','Time Tracking Software','Project hours, billable time, payroll-ready.',
 'Time Tracking Software in {city} (2026) — Punchly',
 'Punchly time tracking for {city}, {state} teams. Project hours, billable time, timesheets and one-click payroll exports.',
 'Time tracking software in {city}',
 'Punchly turns every check-in into project-tagged, billable hours your {city} finance team can trust.',
 'Start time tracking in {city}',
 '[]'::jsonb,
 'published'),
('biometric-attendance-software','Biometric Attendance Software','Biometric Attendance Software','Face + PIN kiosk that beats legacy devices.',
 'Biometric Attendance Software in {city} (2026) — Punchly',
 'Replace fragile biometric devices in {city}, {state} with Punchly''s tablet kiosk — face check-in, PIN fallback, audit trail.',
 'Biometric attendance software in {city}',
 'Any tablet becomes a face-recognition kiosk for your {city} office — no special hardware, no annual maintenance contracts.',
 'Modernize {city} biometrics with Punchly',
 '[]'::jsonb,
 'published')
ON CONFLICT (slug) DO NOTHING;

-- Seed industries
INSERT INTO public.seo_industries (slug, name, noun, hero_blurb, pain_points, use_cases, default_faqs, status) VALUES
('restaurants','Restaurants','restaurants',
 'Late-night shifts, multi-branch staff and high turnover make restaurant attendance painful. Punchly fixes it in a week.',
 '["Rotating shifts across kitchen, service and delivery","Late-night and split shifts that paper registers miss","Multi-branch tracking with one payroll","Buddy-punching at shared terminals"]'::jsonb,
 '["Mark shift staff in/out from a tablet at the counter","Geofence delivery riders per outlet","Auto-compute overtime for late-night service"]'::jsonb,
 '[{"q":"Can restaurant staff mark GPS attendance?","a":"Yes — riders and floor staff check in from any phone, and kitchen teams use a shared tablet kiosk."}]'::jsonb,
 'published'),
('retail-stores','Retail Stores','retail stores',
 'Multi-store retail needs roster visibility, geofenced check-ins and payroll that just works.',
 '["Multi-store rosters","Part-time and seasonal staff","Shrinkage from buddy-punching"]'::jsonb,
 '["Per-store geofences","Manager approvals on mobile","Daily headcount across all outlets"]'::jsonb,
 '[]'::jsonb, 'published'),
('schools','Schools','schools',
 'Track teacher and staff attendance, sync with timetables and generate audit-ready reports for management.',
 '["Period-wise teacher attendance","Substitution tracking","Audit reports for management"]'::jsonb,
 '["Staff kiosk at reception","Period-level reporting","Leaves + holidays in one place"]'::jsonb,
 '[]'::jsonb, 'published'),
('hospitals','Hospitals','hospitals',
 'Rotating shifts, on-call doctors and 24/7 nursing stations need a system built for round-the-clock teams.',
 '["24x7 rotating shifts","On-call doctor logs","Strict audit trails for compliance"]'::jsonb,
 '["Ward-level kiosks","Doctor on-call tracking","Compliance-ready exports"]'::jsonb,
 '[]'::jsonb, 'published'),
('construction-companies','Construction Companies','construction companies',
 'Site attendance, geo verification and payroll for daily-wage and contract crews — on any phone, even offline.',
 '["Multiple sites with no fixed devices","Daily-wage worker payroll","Site supervisor approvals"]'::jsonb,
 '["Site-level geofences","Offline-first check-ins","Crew-level payroll exports"]'::jsonb,
 '[]'::jsonb, 'published'),
('logistics-companies','Logistics Companies','logistics companies',
 'Track drivers, warehouse staff and last-mile riders in one system with live GPS and shift-aware payroll.',
 '["Drivers across multiple hubs","Hourly riders","Compliance with shift laws"]'::jsonb,
 '["Hub-level geofences","Live driver status","Shift-aware overtime"]'::jsonb,
 '[]'::jsonb, 'published'),
('hotels','Hotels','hotels',
 'Front-desk, housekeeping and F&B staff all on one attendance system with multi-property roll-up.',
 '["24x7 shifts","Multi-property reporting","Departmental rosters"]'::jsonb,
 '["Property-level dashboards","Departmental rosters","Tip-and-hour reports"]'::jsonb,
 '[]'::jsonb, 'published'),
('manufacturing','Manufacturing','manufacturing companies',
 'Shop-floor shift tracking, overtime control and union-compliant payroll without legacy biometric devices.',
 '["Multiple shifts per day","Union-compliant payroll","Strict OT rules"]'::jsonb,
 '["Shop-floor kiosks","Shift-wise headcount","Configurable OT rules"]'::jsonb,
 '[]'::jsonb, 'published'),
('it-services','IT Services','IT services companies',
 'Hybrid teams, project hours and billable time in one tool that talks to payroll and finance.',
 '["Hybrid + remote teams","Project-based billing","Client-billable hours"]'::jsonb,
 '["Project tags on every check-in","Billable vs non-billable","Export to payroll + invoicing"]'::jsonb,
 '[]'::jsonb, 'published'),
('bpos','BPOs & Call Centres','BPOs and call centres',
 'Shift-aware attendance, seat utilization and SLA-grade reporting for 24x7 operations.',
 '["24x7 rotating shifts","Seat utilization","SLA reporting"]'::jsonb,
 '["Login/logout from desktops","Shift-wise dashboards","SLA-ready exports"]'::jsonb,
 '[]'::jsonb, 'published')
ON CONFLICT (slug) DO NOTHING;
