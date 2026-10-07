// ─── Projects ─────────────────────────────────────────────────────────────────
export const demoProjects = [
  { id: 'p1', title: 'Core Banking Modernization', slug: 'core-banking-modernization', client: 'Acme Corp', industry: 'Financial Services', status: 'in_progress', progress_percent: 65, budget: 1200000, start_date: '2026-01-10', end_date: '2026-12-31', is_published: true, is_featured: true, technology_stack: ['React', 'FastAPI', 'PostgreSQL', 'AWS'] },
  { id: 'p2', title: 'Payment Gateway Integration', slug: 'payment-gateway-integration', client: 'FinTech Ltd', industry: 'Financial Services', status: 'completed', progress_percent: 100, budget: 450000, start_date: '2025-09-01', end_date: '2026-06-30', is_published: true, is_featured: false, technology_stack: ['Node.js', 'Stripe', 'Redis'] },
  { id: 'p3', title: 'Healthcare Data Warehouse', slug: 'healthcare-data-warehouse', client: 'MedCare Inc', industry: 'Healthcare', status: 'in_progress', progress_percent: 30, budget: 800000, start_date: '2026-03-01', end_date: '2027-03-15', is_published: false, is_featured: false, technology_stack: ['Python', 'Snowflake', 'dbt'] },
  { id: 'p4', title: 'E-Commerce Platform Rebuild', slug: 'ecommerce-platform-rebuild', client: 'ShopZone', industry: 'Retail', status: 'planning', progress_percent: 10, budget: 600000, start_date: '2026-07-01', end_date: '2027-01-31', is_published: false, is_featured: false, technology_stack: ['Next.js', 'Shopify', 'GraphQL'] },
  { id: 'p5', title: 'Logistics Tracking System', slug: 'logistics-tracking-system', client: 'FastMove Co', industry: 'Logistics', status: 'on_hold', progress_percent: 45, budget: 350000, start_date: '2025-11-01', end_date: '2026-08-31', is_published: false, is_featured: false, technology_stack: ['Flutter', 'Firebase', 'Google Maps'] },
  { id: 'p6', title: 'AI-Powered CRM', slug: 'ai-powered-crm', client: 'SalesForce Pro', industry: 'Technology', status: 'in_progress', progress_percent: 55, budget: 950000, start_date: '2026-02-15', end_date: '2026-11-30', is_published: true, is_featured: true, technology_stack: ['Python', 'TensorFlow', 'React', 'FastAPI'] },
];

// ─── Roles ────────────────────────────────────────────────────────────────────
export const demoRoles = [
  { id: 'r1', name: 'Super Admin',     slug: 'super_admin',     description: 'Full unrestricted access to all modules', is_system: true,  permissions: 42 },
  { id: 'r2', name: 'Admin',           slug: 'admin',           description: 'All access except system-level settings',  is_system: true,  permissions: 38 },
  { id: 'r3', name: 'HR',              slug: 'hr',              description: 'Employee management, leaves, payroll',      is_system: true,  permissions: 14 },
  { id: 'r4', name: 'Finance',         slug: 'finance',         description: 'Invoices, payments, financial reports',     is_system: true,  permissions: 12 },
  { id: 'r5', name: 'Sales',           slug: 'sales',           description: 'Client management, opportunities, CRM',    is_system: true,  permissions: 16 },
  { id: 'r6', name: 'Marketing',       slug: 'marketing',       description: 'Content, campaigns, SEO, analytics',       is_system: true,  permissions: 18 },
  { id: 'r7', name: 'Project Manager', slug: 'project_manager', description: 'Projects, tasks, team assignments',        is_system: true,  permissions: 20 },
  { id: 'r8', name: 'Developer',       slug: 'developer',       description: 'Tasks, timesheets, code repositories',     is_system: true,  permissions: 10 },
  { id: 'r9', name: 'Support',         slug: 'support',         description: 'Tickets, client communications',           is_system: true,  permissions: 8  },
  { id: 'r10',name: 'Client',          slug: 'client',          description: 'Client portal access only',                is_system: true,  permissions: 6  },
  { id: 'r11',name: 'Employee',        slug: 'employee',        description: 'Employee portal access only',              is_system: true,  permissions: 6  },
  { id: 'r12',name: 'Guest',           slug: 'guest',           description: 'Read-only public access',                  is_system: false, permissions: 2  },
];

// ─── Permissions ──────────────────────────────────────────────────────────────
export const demoPermissions = [
  { id: 'pm1',  name: 'users.view',        module: 'Users',    action: 'view',   description: 'View user list and profiles' },
  { id: 'pm2',  name: 'users.create',      module: 'Users',    action: 'create', description: 'Create new user accounts' },
  { id: 'pm3',  name: 'users.edit',        module: 'Users',    action: 'edit',   description: 'Edit existing user accounts' },
  { id: 'pm4',  name: 'users.delete',      module: 'Users',    action: 'delete', description: 'Delete user accounts' },
  { id: 'pm5',  name: 'projects.view',     module: 'Projects', action: 'view',   description: 'View project list and details' },
  { id: 'pm6',  name: 'projects.create',   module: 'Projects', action: 'create', description: 'Create new projects' },
  { id: 'pm7',  name: 'projects.edit',     module: 'Projects', action: 'edit',   description: 'Edit project details' },
  { id: 'pm8',  name: 'projects.delete',   module: 'Projects', action: 'delete', description: 'Delete projects' },
  { id: 'pm9',  name: 'finance.view',      module: 'Finance',  action: 'view',   description: 'View invoices and payments' },
  { id: 'pm10', name: 'finance.create',    module: 'Finance',  action: 'create', description: 'Create invoices and record payments' },
  { id: 'pm11', name: 'content.view',      module: 'Content',  action: 'view',   description: 'View CMS content' },
  { id: 'pm12', name: 'content.create',    module: 'Content',  action: 'create', description: 'Create CMS content' },
  { id: 'pm13', name: 'content.edit',      module: 'Content',  action: 'edit',   description: 'Edit CMS content' },
  { id: 'pm14', name: 'content.delete',    module: 'Content',  action: 'delete', description: 'Delete CMS content' },
  { id: 'pm15', name: 'employees.view',    module: 'Employees',action: 'view',   description: 'View employee records' },
  { id: 'pm16', name: 'employees.edit',    module: 'Employees',action: 'edit',   description: 'Edit employee records' },
  { id: 'pm17', name: 'analytics.view',    module: 'Analytics',action: 'view',   description: 'View analytics and reports' },
  { id: 'pm18', name: 'settings.manage',   module: 'Settings', action: 'edit',   description: 'Manage system settings' },
];

// ─── Analytics ────────────────────────────────────────────────────────────────
export const demoAnalytics = {
  total_views: 128450,
  unique_paths: 38,
  bounce_rate: '42%',
  avg_session: '3m 24s',
  top_pages: [
    { path: '/',              count: 32400, change: '+12%' },
    { path: '/services',      count: 18200, change: '+8%'  },
    { path: '/portfolio',     count: 14500, change: '+5%'  },
    { path: '/about',         count: 11200, change: '-2%'  },
    { path: '/contact',       count: 9800,  change: '+18%' },
    { path: '/blog',          count: 8600,  change: '+22%' },
    { path: '/careers',       count: 7200,  change: '+35%' },
    { path: '/case-studies',  count: 6100,  change: '+4%'  },
    { path: '/downloads',     count: 5400,  change: '+9%'  },
    { path: '/technologies',  count: 4950,  change: '-1%'  },
  ],
  monthly_views: [
    { month: 'Jan', views: 9200  },
    { month: 'Feb', views: 10400 },
    { month: 'Mar', views: 11800 },
    { month: 'Apr', views: 10900 },
    { month: 'May', views: 12300 },
    { month: 'Jun', views: 13100 },
    { month: 'Jul', views: 14200 },
  ],
  top_countries: [
    { country: 'United States', visits: 38200, pct: '30%' },
    { country: 'India',         visits: 25600, pct: '20%' },
    { country: 'United Kingdom',visits: 16900, pct: '13%' },
    { country: 'Germany',       visits: 12800, pct: '10%' },
    { country: 'Australia',     visits: 9600,  pct: '7%'  },
  ],
};

// ─── Media ────────────────────────────────────────────────────────────────────
export const demoMedia = [
  { id: 'm1', file_name: 'hero-banner.jpg',        url: 'https://placehold.co/800x400/1a56db/ffffff?text=Hero+Banner',    mime_type: 'image/jpeg', size_bytes: 245000, folder: 'images',    uploaded_by: 'Admin',        created_at: '2026-06-01' },
  { id: 'm2', file_name: 'company-brochure.pdf',   url: '#',                                                               mime_type: 'application/pdf', size_bytes: 1800000, folder: 'documents', uploaded_by: 'Marketing',    created_at: '2026-06-05' },
  { id: 'm3', file_name: 'team-photo.jpg',         url: 'https://placehold.co/800x400/16a34a/ffffff?text=Team+Photo',     mime_type: 'image/jpeg', size_bytes: 380000, folder: 'images',    uploaded_by: 'HR',           created_at: '2026-06-10' },
  { id: 'm4', file_name: 'case-study-fintech.pdf', url: '#',                                                               mime_type: 'application/pdf', size_bytes: 2100000, folder: 'documents', uploaded_by: 'Sales',        created_at: '2026-06-15' },
  { id: 'm5', file_name: 'product-demo.mp4',       url: '#',                                                               mime_type: 'video/mp4',  size_bytes: 52000000, folder: 'videos',   uploaded_by: 'Marketing',    created_at: '2026-06-18' },
  { id: 'm6', file_name: 'office-interior.jpg',    url: 'https://placehold.co/800x400/7c3aed/ffffff?text=Office',         mime_type: 'image/jpeg', size_bytes: 310000, folder: 'images',    uploaded_by: 'Admin',        created_at: '2026-06-20' },
  { id: 'm7', file_name: 'annual-report-2025.pdf', url: '#',                                                               mime_type: 'application/pdf', size_bytes: 4200000, folder: 'documents', uploaded_by: 'Finance',      created_at: '2026-06-22' },
  { id: 'm8', file_name: 'logo-dark.png',          url: 'https://placehold.co/400x200/111827/ffffff?text=Logo',           mime_type: 'image/png',  size_bytes: 42000,  folder: 'branding',  uploaded_by: 'Admin',        created_at: '2026-06-25' },
];

// ─── Notifications ────────────────────────────────────────────────────────────
export const demoNotifications = [
  { id: 'n1', title: 'New Support Ticket',         message: 'Client Acme Corp submitted ticket TCK-009: API timeout issue.', type: 'warning', is_read: false, link: '/admin#tickets', created_at: '2026-07-07T09:15:00Z' },
  { id: 'n2', title: 'Invoice Overdue',            message: 'Invoice INV-003 for $200,000 is 7 days overdue.',               type: 'error',   is_read: false, link: '/admin#finance', created_at: '2026-07-07T08:30:00Z' },
  { id: 'n3', title: 'New Job Application',        message: '3 new applications received for Senior React Developer role.',  type: 'info',    is_read: false, link: '/admin#careers', created_at: '2026-07-06T17:45:00Z' },
  { id: 'n4', title: 'Project Milestone Reached',  message: 'Core Banking Modernization reached 65% completion.',            type: 'success', is_read: true,  link: '/admin#projects',created_at: '2026-07-06T14:00:00Z' },
  { id: 'n5', title: 'New Client Registered',      message: 'HealthPlus Inc has registered as a new client.',               type: 'success', is_read: true,  link: '/admin#clients', created_at: '2026-07-05T11:20:00Z' },
  { id: 'n6', title: 'Server High CPU Alert',      message: 'Production server CPU usage exceeded 85% for 10 minutes.',     type: 'error',   is_read: true,  link: '#',              created_at: '2026-07-05T03:10:00Z' },
  { id: 'n7', title: 'Blog Post Published',        message: '"Top 10 AI Trends 2026" has been published successfully.',     type: 'info',    is_read: true,  link: '/blog',          created_at: '2026-07-04T10:00:00Z' },
  { id: 'n8', title: 'Payment Received',           message: 'Payment of $120,000 received from Acme Corp for INV-001.',     type: 'success', is_read: true,  link: '/admin#finance', created_at: '2026-07-03T16:30:00Z' },
];

// ─── Reports ──────────────────────────────────────────────────────────────────
export const demoReports = [
  { id: 'rp1', title: 'Q2 2026 Financial Summary',      report_type: 'Financial', period: 'Q2 2026', generated_by: 'Admin', summary: 'Total revenue $3.2M, expenses $1.8M, net profit $1.4M.', file_url: '#', size_bytes: 950000,  created_at: '2026-07-01' },
  { id: 'rp2', title: 'Q2 2026 Project Status Report',  report_type: 'Project',   period: 'Q2 2026', generated_by: 'Admin', summary: '42 active projects, 8 completed, 3 on hold.',            file_url: '#', size_bytes: 1800000, created_at: '2026-07-01' },
  { id: 'rp3', title: 'Q2 2026 HR & Headcount Report',  report_type: 'HR',        period: 'Q2 2026', generated_by: 'HR',    summary: '285 employees, 7 new hires, 2 exits this quarter.',       file_url: '#', size_bytes: 720000,  created_at: '2026-07-02' },
  { id: 'rp4', title: 'Q1 2026 Financial Summary',      report_type: 'Financial', period: 'Q1 2026', generated_by: 'Admin', summary: 'Total revenue $2.9M, expenses $1.6M, net profit $1.3M.', file_url: '#', size_bytes: 880000,  created_at: '2026-04-02' },
  { id: 'rp5', title: 'Q1 2026 Project Status Report',  report_type: 'Project',   period: 'Q1 2026', generated_by: 'Admin', summary: '38 active projects, 12 completed, 1 cancelled.',         file_url: '#', size_bytes: 1650000, created_at: '2026-04-02' },
  { id: 'rp6', title: 'Annual Report FY 2025',          report_type: 'Annual',    period: 'FY 2025', generated_by: 'Admin', summary: 'Full year revenue $11.2M, 430 total projects delivered.',  file_url: '#', size_bytes: 4200000, created_at: '2026-01-15' },
  { id: 'rp7', title: 'Client Satisfaction Q2 2026',    report_type: 'Client',    period: 'Q2 2026', generated_by: 'Sales', summary: 'NPS score 72, 94% client retention rate.',               file_url: '#', size_bytes: 540000,  created_at: '2026-07-03' },
];

// ─── Settings ─────────────────────────────────────────────────────────────────
export const demoSettings = [
  { key: 'site_name',          value: 'VPD Technologies',          group: 'general',  label: 'Site Name' },
  { key: 'site_tagline',       value: 'Engineering the Future',           group: 'general',  label: 'Site Tagline' },
  { key: 'contact_email',      value: 'info@vpdtechnologies.com',          group: 'general',  label: 'Contact Email' },
  { key: 'support_email',      value: 'support@vpdtechnologies.com',       group: 'general',  label: 'Support Email' },
  { key: 'phone',              value: '+1-800-CORE-FUS',                  group: 'general',  label: 'Phone Number' },
  { key: 'address',            value: '123 Tech Park, San Francisco, CA', group: 'general',  label: 'Address' },
  { key: 'smtp_host',          value: 'smtp.mailtrap.io',                 group: 'email',    label: 'SMTP Host' },
  { key: 'smtp_port',          value: '587',                              group: 'email',    label: 'SMTP Port' },
  { key: 'smtp_from',          value: 'no-reply@vpdtechnologies.com',      group: 'email',    label: 'From Email' },
  { key: 'rate_limit',         value: '300/15minute',                     group: 'security', label: 'Rate Limit' },
  { key: 'max_file_size_mb',   value: '10',                               group: 'security', label: 'Max Upload Size (MB)' },
  { key: 'maintenance_mode',   value: 'false',                            group: 'security', label: 'Maintenance Mode' },
  { key: 'google_analytics_id',value: 'G-XXXXXXXXXX',                     group: 'integrations', label: 'Google Analytics ID' },
  { key: 'recaptcha_site_key', value: '6LeXXXXXXXXXXXXXXXXXXXXXXXXXXXX', group: 'integrations', label: 'reCAPTCHA Site Key' },
  { key: 'stripe_public_key',  value: 'pk_live_XXXXXXXXXXXXXXXXXXXXXXXX', group: 'integrations', label: 'Stripe Public Key' },
];

// ─── Audit Logs ───────────────────────────────────────────────────────────────
export const demoAuditLogs = [
  { id: 'al1', user: 'admin@vpdtechnologies.com', action: 'POST_api_v1_users',          entity_type: 'users',    ip_address: '192.168.1.10', created_at: '2026-07-07T09:20:00Z' },
  { id: 'al2', user: 'admin@vpdtechnologies.com', action: 'PUT_api_v1_projects_p1',     entity_type: 'projects', ip_address: '192.168.1.10', created_at: '2026-07-07T09:10:00Z' },
  { id: 'al3', user: 'hr@vpdtechnologies.com',    action: 'POST_api_v1_employees',      entity_type: 'employees',ip_address: '10.0.0.45',    created_at: '2026-07-07T08:55:00Z' },
  { id: 'al4', user: 'hr@vpdtechnologies.com',action:'POST_api_v1_finance_invoices',entity_type: 'invoices', ip_address: '10.0.0.52',    created_at: '2026-07-07T08:40:00Z' },
  { id: 'al5', user: 'admin@vpdtechnologies.com', action: 'DELETE_api_v1_users_u99',    entity_type: 'users',    ip_address: '192.168.1.10', created_at: '2026-07-06T17:30:00Z' },
  { id: 'al6', user: 'sales@vpdtechnologies.com',action:'POST_api_v1_blog',         entity_type: 'blog',     ip_address: '10.0.0.61',    created_at: '2026-07-06T15:20:00Z' },
  { id: 'al7', user: 'admin@vpdtechnologies.com', action: 'PUT_api_v1_settings_site_name',entity_type:'settings', ip_address: '192.168.1.10', created_at: '2026-07-06T14:10:00Z' },
  { id: 'al8', user: 'sales@vpdtechnologies.com', action: 'POST_api_v1_clients',        entity_type: 'clients',  ip_address: '10.0.0.33',    created_at: '2026-07-06T11:05:00Z' },
  { id: 'al9', user: 'admin@vpdtechnologies.com', action: 'PATCH_api_v1_users_deactivate',entity_type:'users',   ip_address: '192.168.1.10', created_at: '2026-07-05T16:45:00Z' },
  { id: 'al10',user: 'pm@vpdtechnologies.com',    action: 'PATCH_api_v1_projects_team', entity_type: 'projects', ip_address: '10.0.0.78',    created_at: '2026-07-05T14:30:00Z' },
];

// ─── SEO ──────────────────────────────────────────────────────────────────────
export const demoSeo = [
  { id: 's1', page_path: '/',              title: 'VPD Technologies — Engineering the Future', description: 'Leading software engineering firm delivering enterprise solutions.', keywords: 'software, engineering, enterprise, AI, cloud', og_type: 'website', no_index: false },
  { id: 's2', page_path: '/services',      title: 'Our Services | VPD Technologies',           description: 'Explore our full range of software development and consulting services.', keywords: 'services, software development, consulting', og_type: 'website', no_index: false },
  { id: 's3', page_path: '/portfolio',     title: 'Portfolio | VPD Technologies',              description: 'Browse our portfolio of successful enterprise projects.',                keywords: 'portfolio, projects, case studies',           og_type: 'website', no_index: false },
  { id: 's4', page_path: '/about',         title: 'About Us | VPD Technologies',               description: 'Learn about our mission, vision, and the team behind VPD.',      keywords: 'about, team, mission, vision',                og_type: 'website', no_index: false },
  { id: 's5', page_path: '/contact',       title: 'Contact Us | VPD Technologies',             description: 'Get in touch with our team for project inquiries and support.',          keywords: 'contact, support, inquiry',                   og_type: 'website', no_index: false },
  { id: 's6', page_path: '/careers',       title: 'Careers | VPD Technologies',                description: 'Join our team of world-class engineers and innovators.',                 keywords: 'careers, jobs, hiring, engineering',          og_type: 'website', no_index: false },
  { id: 's7', page_path: '/blog',          title: 'Blog | VPD Technologies',                   description: 'Insights, tutorials, and news from the VPD engineering team.',   keywords: 'blog, insights, technology, engineering',     og_type: 'website', no_index: false },
];
