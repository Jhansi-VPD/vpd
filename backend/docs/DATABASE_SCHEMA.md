# Database Schema — extracted from this backend

Generated from `app/models/` via `scripts/extract_schema.py` — **58 tables**, **658 columns**, **57 foreign keys**, 33 enum types.

## Relations (foreign keys)

- **`applications`** → `careers`
- **`audit_logs`** → `users`
- **`blogs`** → `users`, `categories`
- **`courses`** → `users`
- **`employees`** → `users`, `departments`, `employees`
- **`media`** → `users`
- **`notifications`** → `users`
- **`reports`** → `users`
- **`resources`** → `users`
- **`role_permissions`** → `roles`, `permissions`
- **`attendance`** → `employees`
- **`clients`** → `users`, `employees`
- **`comments`** → `blogs`
- **`employee_documents`** → `employees`
- **`leaves`** → `employees`, `users`
- **`payslips`** → `employees`
- **`performance_reviews`** → `employees`, `users`
- **`training_enrollments`** → `employees`, `courses`
- **`client_files`** → `clients`
- **`client_reports`** → `clients`
- **`leads`** → `contact_submissions`, `users`, `clients`
- **`projects`** → `clients`, `users`
- **`testimonials`** → `clients`
- **`tickets`** → `clients`, `users`
- **`case_studies`** → `projects`
- **`gallery`** → `projects`
- **`invoices`** → `clients`, `projects`
- **`meetings`** → `projects`, `clients`, `users`
- **`portfolios`** → `projects`
- **`project_members`** → `projects`, `employees`
- **`proposals`** → `leads`, `users`
- **`tasks`** → `projects`, `users`
- **`ticket_replies`** → `tickets`, `users`
- **`contracts`** → `proposals`
- **`payments`** → `invoices`
- **`timesheets`** → `employees`, `projects`, `tasks`

## Disconnected tables (no FK in either direction)

`awards`, `downloads`, `events`, `faqs`, `industries`, `newsletter_subscribers`, `page_contents`, `page_views`, `partners`, `products`, `seo_metadata`, `services`, `settings`, `solutions`, `technologies`

These stand alone: nothing references them and they reference nothing (they usually link by plain id/UUID columns kept as bare values, or are standalone reference/CMS data).

## Table index

| # | Table | Columns | FKs out | Incoming | Purpose |
|---|-------|---------|---------|----------|---------|
| 1 | `awards` | 10 | 0 | 0 | |
| 2 | `careers` | 15 | 0 | 1 | |
| 3 | `categories` | 7 | 0 | 1 | |
| 4 | `contact_submissions` | 12 | 0 | 1 | |
| 5 | `departments` | 7 | 0 | 1 | |
| 6 | `downloads` | 12 | 0 | 0 | |
| 7 | `events` | 14 | 0 | 0 | |
| 8 | `faqs` | 9 | 0 | 0 | |
| 9 | `industries` | 10 | 0 | 0 | |
| 10 | `newsletter_subscribers` | 9 | 0 | 0 | |
| 11 | `page_contents` | 8 | 0 | 0 | |
| 12 | `page_views` | 10 | 0 | 0 | |
| 13 | `partners` | 9 | 0 | 0 | |
| 14 | `permissions` | 8 | 0 | 1 | |
| 15 | `products` | 17 | 0 | 0 | |
| 16 | `roles` | 8 | 0 | 1 | |
| 17 | `seo_metadata` | 15 | 0 | 0 | |
| 18 | `services` | 19 | 0 | 0 | |
| 19 | `settings` | 7 | 0 | 0 | |
| 20 | `solutions` | 16 | 0 | 0 | |
| 21 | `technologies` | 8 | 0 | 0 | |
| 22 | `users` | 12 | 0 | 18 | |
| 23 | `applications` | 12 | 1 | 0 | |
| 24 | `audit_logs` | 11 | 1 | 0 | |
| 25 | `blogs` | 17 | 2 | 1 | |
| 26 | `courses` | 12 | 1 | 1 | |
| 27 | `employees` | 16 | 3 | 10 | |
| 28 | `media` | 10 | 1 | 0 | |
| 29 | `notifications` | 10 | 1 | 0 | |
| 30 | `reports` | 11 | 1 | 0 | |
| 31 | `resources` | 13 | 1 | 0 | |
| 32 | `role_permissions` | 2 | 2 | 0 | |
| 33 | `attendance` | 10 | 1 | 0 | |
| 34 | `clients` | 11 | 2 | 8 | |
| 35 | `comments` | 9 | 1 | 0 | |
| 36 | `employee_documents` | 8 | 1 | 0 | |
| 37 | `leaves` | 11 | 2 | 0 | |
| 38 | `payslips` | 13 | 1 | 0 | |
| 39 | `performance_reviews` | 14 | 2 | 0 | |
| 40 | `training_enrollments` | 9 | 2 | 0 | |
| 41 | `client_files` | 10 | 1 | 0 | |
| 42 | `client_reports` | 10 | 1 | 0 | |
| 43 | `leads` | 15 | 3 | 1 | |
| 44 | `projects` | 23 | 2 | 8 | |
| 45 | `testimonials` | 12 | 1 | 0 | |
| 46 | `tickets` | 11 | 2 | 1 | |
| 47 | `case_studies` | 18 | 1 | 0 | |
| 48 | `gallery` | 10 | 1 | 0 | |
| 49 | `invoices` | 15 | 2 | 1 | |
| 50 | `meetings` | 14 | 3 | 0 | |
| 51 | `portfolios` | 13 | 1 | 0 | |
| 52 | `project_members` | 2 | 2 | 0 | |
| 53 | `proposals` | 14 | 2 | 1 | |
| 54 | `tasks` | 12 | 2 | 1 | |
| 55 | `ticket_replies` | 8 | 2 | 0 | |
| 56 | `contracts` | 9 | 1 | 0 | |
| 57 | `payments` | 10 | 1 | 0 | |
| 58 | `timesheets` | 11 | 3 | 0 | |

---

## Tables

### `awards`

| Column | Type | Null | Default | Keys |
|--------|------|------|---------|------|
| `title` | VARCHAR(200) | NO |  |  |
| `issued_by` | VARCHAR(200) | YES |  |  |
| `year` | INTEGER | YES |  |  |
| `image` | VARCHAR(500) | YES |  |  |
| `description` | TEXT | YES |  |  |
| `is_published` | BOOLEAN | NO | `True` |  |
| `id` | CHAR(32) | NO | `(func)` | PK |
| `created_at` | DATETIME | NO | server: `now()` |  |
| `updated_at` | DATETIME | NO | server: `now()` |  |
| `deleted_at` | DATETIME | YES |  |  |


### `careers`

| Column | Type | Null | Default | Keys |
|--------|------|------|---------|------|
| `title` | VARCHAR(200) | NO |  |  |
| `slug` | VARCHAR(220) | NO |  | UQ |
| `department` | VARCHAR(100) | YES |  |  |
| `location` | VARCHAR(150) | YES |  |  |
| `employment_type` | VARCHAR(10) | NO | `CareerEmploymentType.full_time` |  |
| `experience_required` | VARCHAR(100) | YES |  |  |
| `description` | TEXT | YES |  |  |
| `responsibilities` | ARRAY | YES | `(func)` |  |
| `requirements` | ARRAY | YES | `(func)` |  |
| `status` | VARCHAR(6) | NO | `CareerStatus.open` |  |
| `posted_at` | DATETIME | NO | server: `now()` |  |
| `id` | CHAR(32) | NO | `(func)` | PK |
| `created_at` | DATETIME | NO | server: `now()` |  |
| `updated_at` | DATETIME | NO | server: `now()` |  |
| `deleted_at` | DATETIME | YES |  |  |


### `categories`

| Column | Type | Null | Default | Keys |
|--------|------|------|---------|------|
| `name` | VARCHAR(150) | NO |  |  |
| `slug` | VARCHAR(170) | NO |  | UQ |
| `type` | VARCHAR(8) | NO | `CategoryType.blog` |  |
| `id` | CHAR(32) | NO | `(func)` | PK |
| `created_at` | DATETIME | NO | server: `now()` |  |
| `updated_at` | DATETIME | NO | server: `now()` |  |
| `deleted_at` | DATETIME | YES |  |  |


### `contact_submissions`

| Column | Type | Null | Default | Keys |
|--------|------|------|---------|------|
| `name` | VARCHAR(150) | NO |  |  |
| `email` | VARCHAR(255) | NO |  |  |
| `phone` | VARCHAR(30) | YES |  |  |
| `company` | VARCHAR(200) | YES |  |  |
| `department` | VARCHAR(100) | YES |  |  |
| `subject` | VARCHAR(255) | YES |  |  |
| `message` | TEXT | NO |  |  |
| `status` | VARCHAR(11) | NO | `ContactStatus.new` |  |
| `id` | CHAR(32) | NO | `(func)` | PK |
| `created_at` | DATETIME | NO | server: `now()` |  |
| `updated_at` | DATETIME | NO | server: `now()` |  |
| `deleted_at` | DATETIME | YES |  |  |


### `departments`

| Column | Type | Null | Default | Keys |
|--------|------|------|---------|------|
| `name` | VARCHAR(150) | NO |  | UQ |
| `description` | TEXT | YES |  |  |
| `head_employee_id` | UUID | YES |  |  |
| `id` | CHAR(32) | NO | `(func)` | PK |
| `created_at` | DATETIME | NO | server: `now()` |  |
| `updated_at` | DATETIME | NO | server: `now()` |  |
| `deleted_at` | DATETIME | YES |  |  |


### `downloads`

| Column | Type | Null | Default | Keys |
|--------|------|------|---------|------|
| `title` | VARCHAR(200) | NO |  |  |
| `description` | TEXT | YES |  |  |
| `file_url` | VARCHAR(500) | NO |  |  |
| `file_type` | VARCHAR(20) | YES |  |  |
| `category` | VARCHAR(100) | YES |  |  |
| `download_count` | INTEGER | NO | `0` |  |
| `requires_lead` | BOOLEAN | NO | `False` |  |
| `is_published` | BOOLEAN | NO | `True` |  |
| `id` | CHAR(32) | NO | `(func)` | PK |
| `created_at` | DATETIME | NO | server: `now()` |  |
| `updated_at` | DATETIME | NO | server: `now()` |  |
| `deleted_at` | DATETIME | YES |  |  |


### `events`

| Column | Type | Null | Default | Keys |
|--------|------|------|---------|------|
| `title` | VARCHAR(200) | NO |  |  |
| `slug` | VARCHAR(220) | NO |  | UQ |
| `description` | TEXT | YES |  |  |
| `cover_image` | VARCHAR(500) | YES |  |  |
| `location` | VARCHAR(200) | YES |  |  |
| `start_date` | DATETIME | NO |  |  |
| `end_date` | DATETIME | YES |  |  |
| `is_virtual` | BOOLEAN | NO | `False` |  |
| `registration_url` | VARCHAR(500) | YES |  |  |
| `is_published` | BOOLEAN | NO | `True` |  |
| `id` | CHAR(32) | NO | `(func)` | PK |
| `created_at` | DATETIME | NO | server: `now()` |  |
| `updated_at` | DATETIME | NO | server: `now()` |  |
| `deleted_at` | DATETIME | YES |  |  |


### `faqs`

| Column | Type | Null | Default | Keys |
|--------|------|------|---------|------|
| `question` | VARCHAR(500) | NO |  |  |
| `answer` | TEXT | NO |  |  |
| `category` | VARCHAR(100) | NO | `general` |  |
| `order` | INTEGER | NO | `0` |  |
| `is_published` | BOOLEAN | NO | `True` |  |
| `id` | CHAR(32) | NO | `(func)` | PK |
| `created_at` | DATETIME | NO | server: `now()` |  |
| `updated_at` | DATETIME | NO | server: `now()` |  |
| `deleted_at` | DATETIME | YES |  |  |


### `industries`

| Column | Type | Null | Default | Keys |
|--------|------|------|---------|------|
| `name` | VARCHAR(150) | NO |  | UQ |
| `slug` | VARCHAR(170) | NO |  | UQ |
| `icon` | VARCHAR(255) | YES |  |  |
| `description` | TEXT | YES |  |  |
| `cover_image` | VARCHAR(500) | YES |  |  |
| `is_published` | BOOLEAN | NO | `True` |  |
| `id` | CHAR(32) | NO | `(func)` | PK |
| `created_at` | DATETIME | NO | server: `now()` |  |
| `updated_at` | DATETIME | NO | server: `now()` |  |
| `deleted_at` | DATETIME | YES |  |  |


### `newsletter_subscribers`

| Column | Type | Null | Default | Keys |
|--------|------|------|---------|------|
| `email` | VARCHAR(255) | NO |  | UQ, IX |
| `name` | VARCHAR(150) | YES |  |  |
| `is_active` | BOOLEAN | NO | `True` |  |
| `subscribed_at` | DATETIME | NO | `(func)` |  |
| `unsubscribed_at` | DATETIME | YES |  |  |
| `id` | CHAR(32) | NO | `(func)` | PK |
| `created_at` | DATETIME | NO | server: `now()` |  |
| `updated_at` | DATETIME | NO | server: `now()` |  |
| `deleted_at` | DATETIME | YES |  |  |

- **Indexes:** `ix_newsletter_subscribers_email` (`email`) UNIQUE

### `page_contents`

| Column | Type | Null | Default | Keys |
|--------|------|------|---------|------|
| `slug` | VARCHAR(150) | NO |  | UQ, IX |
| `title` | VARCHAR(255) | NO |  |  |
| `content` | TEXT | YES |  |  |
| `is_published` | BOOLEAN | NO | `True` |  |
| `id` | CHAR(32) | NO | `(func)` | PK |
| `created_at` | DATETIME | NO | server: `now()` |  |
| `updated_at` | DATETIME | NO | server: `now()` |  |
| `deleted_at` | DATETIME | YES |  |  |

- **Indexes:** `ix_page_contents_slug` (`slug`) UNIQUE

### `page_views`

| Column | Type | Null | Default | Keys |
|--------|------|------|---------|------|
| `path` | VARCHAR(500) | NO |  | IX |
| `ip_address` | VARCHAR(50) | YES |  |  |
| `user_agent` | TEXT | YES |  |  |
| `referrer` | VARCHAR(500) | YES |  |  |
| `country` | VARCHAR(100) | YES |  |  |
| `viewed_at` | DATETIME | NO | `(func)` | IX |
| `id` | CHAR(32) | NO | `(func)` | PK |
| `created_at` | DATETIME | NO | server: `now()` |  |
| `updated_at` | DATETIME | NO | server: `now()` |  |
| `deleted_at` | DATETIME | YES |  |  |

- **Indexes:** `ix_page_views_path` (`path`); `ix_page_views_viewed_at` (`viewed_at`)

### `partners`

| Column | Type | Null | Default | Keys |
|--------|------|------|---------|------|
| `name` | VARCHAR(200) | NO |  |  |
| `logo` | VARCHAR(500) | YES |  |  |
| `website` | VARCHAR(500) | YES |  |  |
| `type` | VARCHAR(18) | NO | `PartnerType.technology_partner` |  |
| `is_published` | BOOLEAN | NO | `True` |  |
| `id` | CHAR(32) | NO | `(func)` | PK |
| `created_at` | DATETIME | NO | server: `now()` |  |
| `updated_at` | DATETIME | NO | server: `now()` |  |
| `deleted_at` | DATETIME | YES |  |  |


### `permissions`

| Column | Type | Null | Default | Keys |
|--------|------|------|---------|------|
| `name` | VARCHAR(150) | NO |  | UQ |
| `module` | VARCHAR(100) | NO |  |  |
| `action` | VARCHAR(50) | NO |  |  |
| `description` | VARCHAR(255) | YES |  |  |
| `id` | CHAR(32) | NO | `(func)` | PK |
| `created_at` | DATETIME | NO | server: `now()` |  |
| `updated_at` | DATETIME | NO | server: `now()` |  |
| `deleted_at` | DATETIME | YES |  |  |


### `products`

| Column | Type | Null | Default | Keys |
|--------|------|------|---------|------|
| `name` | VARCHAR(200) | NO |  |  |
| `slug` | VARCHAR(220) | NO |  | UQ |
| `tagline` | VARCHAR(300) | YES |  |  |
| `description` | TEXT | YES |  |  |
| `features` | ARRAY | YES | `(func)` |  |
| `benefits` | ARRAY | YES | `(func)` |  |
| `pricing_tiers` | JSONB | YES | `(func)` |  |
| `technology_stack` | ARRAY | YES | `(func)` |  |
| `use_cases` | ARRAY | YES | `(func)` |  |
| `cover_image` | VARCHAR(500) | YES |  |  |
| `icon` | VARCHAR(255) | YES |  |  |
| `is_published` | BOOLEAN | NO | `True` |  |
| `order` | INTEGER | NO | `0` |  |
| `id` | CHAR(32) | NO | `(func)` | PK |
| `created_at` | DATETIME | NO | server: `now()` |  |
| `updated_at` | DATETIME | NO | server: `now()` |  |
| `deleted_at` | DATETIME | YES |  |  |


### `roles`

| Column | Type | Null | Default | Keys |
|--------|------|------|---------|------|
| `name` | VARCHAR(100) | NO |  | UQ |
| `slug` | VARCHAR(100) | NO |  | UQ |
| `description` | TEXT | YES |  |  |
| `is_system` | BOOLEAN | NO | `False` |  |
| `id` | CHAR(32) | NO | `(func)` | PK |
| `created_at` | DATETIME | NO | server: `now()` |  |
| `updated_at` | DATETIME | NO | server: `now()` |  |
| `deleted_at` | DATETIME | YES |  |  |


### `seo_metadata`

| Column | Type | Null | Default | Keys |
|--------|------|------|---------|------|
| `page_path` | VARCHAR(255) | NO |  | UQ, IX |
| `title` | VARCHAR(160) | YES |  |  |
| `description` | VARCHAR(320) | YES |  |  |
| `keywords` | VARCHAR(500) | YES |  |  |
| `og_title` | VARCHAR(160) | YES |  |  |
| `og_description` | VARCHAR(320) | YES |  |  |
| `og_image` | VARCHAR(500) | YES |  |  |
| `og_type` | VARCHAR(50) | YES | `website` |  |
| `canonical_url` | VARCHAR(500) | YES |  |  |
| `schema_markup` | JSONB | YES |  |  |
| `no_index` | BOOLEAN | NO | `False` |  |
| `id` | CHAR(32) | NO | `(func)` | PK |
| `created_at` | DATETIME | NO | server: `now()` |  |
| `updated_at` | DATETIME | NO | server: `now()` |  |
| `deleted_at` | DATETIME | YES |  |  |

- **Indexes:** `ix_seo_metadata_page_path` (`page_path`) UNIQUE

### `services`

| Column | Type | Null | Default | Keys |
|--------|------|------|---------|------|
| `name` | VARCHAR(200) | NO |  |  |
| `slug` | VARCHAR(220) | NO |  | UQ |
| `icon` | VARCHAR(255) | YES |  |  |
| `overview` | TEXT | YES |  |  |
| `business_problems` | TEXT | YES |  |  |
| `solutions` | TEXT | YES |  |  |
| `features` | ARRAY | YES | `(func)` |  |
| `benefits` | ARRAY | YES | `(func)` |  |
| `process` | JSONB | YES | `(func)` |  |
| `technology_stack` | ARRAY | YES | `(func)` |  |
| `deliverables` | ARRAY | YES | `(func)` |  |
| `related_industries` | ARRAY | YES | `(func)` |  |
| `cover_image` | VARCHAR(500) | YES |  |  |
| `is_published` | BOOLEAN | NO | `True` |  |
| `order` | INTEGER | NO | `0` |  |
| `id` | CHAR(32) | NO | `(func)` | PK |
| `created_at` | DATETIME | NO | server: `now()` |  |
| `updated_at` | DATETIME | NO | server: `now()` |  |
| `deleted_at` | DATETIME | YES |  |  |


### `settings`

| Column | Type | Null | Default | Keys |
|--------|------|------|---------|------|
| `key` | VARCHAR(150) | NO |  | UQ |
| `value` | JSONB | YES |  |  |
| `group` | VARCHAR(50) | NO | `general` |  |
| `id` | CHAR(32) | NO | `(func)` | PK |
| `created_at` | DATETIME | NO | server: `now()` |  |
| `updated_at` | DATETIME | NO | server: `now()` |  |
| `deleted_at` | DATETIME | YES |  |  |


### `solutions`

| Column | Type | Null | Default | Keys |
|--------|------|------|---------|------|
| `name` | VARCHAR(200) | NO |  |  |
| `slug` | VARCHAR(220) | NO |  | UQ |
| `icon` | VARCHAR(255) | YES |  |  |
| `overview` | TEXT | YES |  |  |
| `problem_statement` | TEXT | YES |  |  |
| `approach` | ARRAY | YES | `(func)` |  |
| `outcomes` | ARRAY | YES | `(func)` |  |
| `related_industries` | ARRAY | YES | `(func)` |  |
| `related_services` | ARRAY | YES | `(func)` |  |
| `cover_image` | VARCHAR(500) | YES |  |  |
| `is_published` | BOOLEAN | NO | `True` |  |
| `order` | INTEGER | NO | `0` |  |
| `id` | CHAR(32) | NO | `(func)` | PK |
| `created_at` | DATETIME | NO | server: `now()` |  |
| `updated_at` | DATETIME | NO | server: `now()` |  |
| `deleted_at` | DATETIME | YES |  |  |


### `technologies`

| Column | Type | Null | Default | Keys |
|--------|------|------|---------|------|
| `name` | VARCHAR(150) | NO |  | UQ |
| `category` | VARCHAR(8) | NO | `TechnologyCategory.other` |  |
| `logo` | VARCHAR(500) | YES |  |  |
| `description` | TEXT | YES |  |  |
| `id` | CHAR(32) | NO | `(func)` | PK |
| `created_at` | DATETIME | NO | server: `now()` |  |
| `updated_at` | DATETIME | NO | server: `now()` |  |
| `deleted_at` | DATETIME | YES |  |  |


### `users`

| Column | Type | Null | Default | Keys |
|--------|------|------|---------|------|
| `id` | UUID | NO |  | PK |
| `name` | VARCHAR(150) | NO |  |  |
| `email` | VARCHAR(255) | NO |  | UQ, IX |
| `phone` | VARCHAR(30) | YES |  |  |
| `avatar` | VARCHAR(500) | YES |  |  |
| `role` | VARCHAR(15) | NO | `UserRole.guest` |  |
| `is_active` | BOOLEAN | NO | `True` |  |
| `is_email_verified` | BOOLEAN | NO | `False` |  |
| `last_login_at` | DATETIME | YES |  |  |
| `created_at` | DATETIME | NO | server: `now()` |  |
| `updated_at` | DATETIME | NO | server: `now()` |  |
| `deleted_at` | DATETIME | YES |  |  |

- **Indexes:** `ix_users_email` (`email`) UNIQUE

### `applications`

| Column | Type | Null | Default | Keys |
|--------|------|------|---------|------|
| `career_id` | UUID | NO |  | FK → `careers.id` |
| `full_name` | VARCHAR(150) | NO |  |  |
| `email` | VARCHAR(255) | NO |  |  |
| `phone` | VARCHAR(30) | YES |  |  |
| `resume_url` | VARCHAR(500) | NO |  |  |
| `cover_letter` | TEXT | YES |  |  |
| `linkedin_url` | VARCHAR(500) | YES |  |  |
| `status` | VARCHAR(11) | NO | `ApplicationStatus.applied` |  |
| `id` | CHAR(32) | NO | `(func)` | PK |
| `created_at` | DATETIME | NO | server: `now()` |  |
| `updated_at` | DATETIME | NO | server: `now()` |  |
| `deleted_at` | DATETIME | YES |  |  |


### `audit_logs`

| Column | Type | Null | Default | Keys |
|--------|------|------|---------|------|
| `user_id` | UUID | YES |  | FK → `users.id` |
| `action` | VARCHAR(150) | NO |  |  |
| `entity_type` | VARCHAR(100) | YES |  |  |
| `entity_id` | UUID | YES |  |  |
| `ip_address` | VARCHAR(50) | YES |  |  |
| `user_agent` | VARCHAR(255) | YES |  |  |
| `log_metadata` | JSONB | YES | `(func)` |  |
| `id` | CHAR(32) | NO | `(func)` | PK |
| `created_at` | DATETIME | NO | server: `now()` |  |
| `updated_at` | DATETIME | NO | server: `now()` |  |
| `deleted_at` | DATETIME | YES |  |  |


### `blogs`

| Column | Type | Null | Default | Keys |
|--------|------|------|---------|------|
| `title` | VARCHAR(255) | NO |  |  |
| `slug` | VARCHAR(280) | NO |  | UQ |
| `excerpt` | VARCHAR(500) | YES |  |  |
| `content` | TEXT | NO |  |  |
| `cover_image` | VARCHAR(500) | YES |  |  |
| `author_id` | UUID | YES |  | FK → `users.id` |
| `category_id` | UUID | YES |  | FK → `categories.id` |
| `tags` | ARRAY | YES | `(func)` |  |
| `status` | VARCHAR(9) | NO | `BlogStatus.draft` |  |
| `views` | INTEGER | NO | `0` |  |
| `published_at` | DATETIME | YES |  |  |
| `meta_title` | VARCHAR(255) | YES |  |  |
| `meta_description` | VARCHAR(500) | YES |  |  |
| `id` | CHAR(32) | NO | `(func)` | PK |
| `created_at` | DATETIME | NO | server: `now()` |  |
| `updated_at` | DATETIME | NO | server: `now()` |  |
| `deleted_at` | DATETIME | YES |  |  |


### `courses`

| Column | Type | Null | Default | Keys |
|--------|------|------|---------|------|
| `title` | VARCHAR(255) | NO |  |  |
| `slug` | VARCHAR(280) | NO |  | UQ |
| `description` | TEXT | YES |  |  |
| `category` | VARCHAR(100) | YES |  |  |
| `duration_hours` | INTEGER | YES |  |  |
| `cover_image` | VARCHAR(500) | YES |  |  |
| `is_published` | BOOLEAN | NO | `False` |  |
| `created_by` | UUID | YES |  | FK → `users.id` |
| `id` | CHAR(32) | NO | `(func)` | PK |
| `created_at` | DATETIME | NO | server: `now()` |  |
| `updated_at` | DATETIME | NO | server: `now()` |  |
| `deleted_at` | DATETIME | YES |  |  |


### `employees`

| Column | Type | Null | Default | Keys |
|--------|------|------|---------|------|
| `user_id` | UUID | NO |  | UQ, FK → `users.id` |
| `employee_code` | VARCHAR(50) | NO |  | UQ |
| `department_id` | UUID | YES |  | FK → `departments.id` |
| `designation` | VARCHAR(150) | YES |  |  |
| `date_of_joining` | DATE | YES |  |  |
| `date_of_birth` | DATE | YES |  |  |
| `employment_type` | VARCHAR(9) | NO | `EmploymentType.full_time` |  |
| `status` | VARCHAR(10) | NO | `EmployeeStatus.active` |  |
| `office_location` | VARCHAR(100) | YES |  |  |
| `reporting_manager_id` | UUID | YES |  | FK → `employees.id` |
| `salary` | NUMERIC(12, 2) | YES |  |  |
| `address` | TEXT | YES |  |  |
| `id` | CHAR(32) | NO | `(func)` | PK |
| `created_at` | DATETIME | NO | server: `now()` |  |
| `updated_at` | DATETIME | NO | server: `now()` |  |
| `deleted_at` | DATETIME | YES |  |  |


### `media`

| Column | Type | Null | Default | Keys |
|--------|------|------|---------|------|
| `file_name` | VARCHAR(255) | NO |  |  |
| `url` | VARCHAR(500) | NO |  |  |
| `mime_type` | VARCHAR(100) | YES |  |  |
| `size_bytes` | INTEGER | YES |  |  |
| `uploaded_by` | UUID | YES |  | FK → `users.id` |
| `folder` | VARCHAR(100) | NO | `misc` |  |
| `id` | CHAR(32) | NO | `(func)` | PK |
| `created_at` | DATETIME | NO | server: `now()` |  |
| `updated_at` | DATETIME | NO | server: `now()` |  |
| `deleted_at` | DATETIME | YES |  |  |


### `notifications`

| Column | Type | Null | Default | Keys |
|--------|------|------|---------|------|
| `user_id` | UUID | NO |  | FK → `users.id` |
| `title` | VARCHAR(255) | NO |  |  |
| `message` | TEXT | YES |  |  |
| `type` | VARCHAR(7) | NO | `NotificationType.info` |  |
| `link` | VARCHAR(500) | YES |  |  |
| `is_read` | BOOLEAN | NO | `False` |  |
| `id` | CHAR(32) | NO | `(func)` | PK |
| `created_at` | DATETIME | NO | server: `now()` |  |
| `updated_at` | DATETIME | NO | server: `now()` |  |
| `deleted_at` | DATETIME | YES |  |  |


### `reports`

| Column | Type | Null | Default | Keys |
|--------|------|------|---------|------|
| `title` | VARCHAR(255) | NO |  |  |
| `report_type` | VARCHAR(100) | NO |  |  |
| `period` | VARCHAR(100) | NO |  |  |
| `generated_by` | UUID | YES |  | FK → `users.id` |
| `file_url` | VARCHAR(500) | YES |  |  |
| `size_bytes` | INTEGER | YES |  |  |
| `summary` | TEXT | YES |  |  |
| `id` | CHAR(32) | NO | `(func)` | PK |
| `created_at` | DATETIME | NO | server: `now()` |  |
| `updated_at` | DATETIME | NO | server: `now()` |  |
| `deleted_at` | DATETIME | YES |  |  |


### `resources`

| Column | Type | Null | Default | Keys |
|--------|------|------|---------|------|
| `title` | VARCHAR(255) | NO |  |  |
| `slug` | VARCHAR(280) | NO |  | UQ |
| `resource_type` | VARCHAR(50) | NO | `guide` |  |
| `description` | TEXT | YES |  |  |
| `file_url` | VARCHAR(500) | YES |  |  |
| `cover_image` | VARCHAR(500) | YES |  |  |
| `author_id` | UUID | YES |  | FK → `users.id` |
| `download_count` | INTEGER | NO | `0` |  |
| `is_published` | BOOLEAN | NO | `True` |  |
| `id` | CHAR(32) | NO | `(func)` | PK |
| `created_at` | DATETIME | NO | server: `now()` |  |
| `updated_at` | DATETIME | NO | server: `now()` |  |
| `deleted_at` | DATETIME | YES |  |  |


### `role_permissions`

| Column | Type | Null | Default | Keys |
|--------|------|------|---------|------|
| `role_id` | UUID | NO |  | PK, FK → `roles.id` |
| `permission_id` | UUID | NO |  | PK, FK → `permissions.id` |


### `attendance`

| Column | Type | Null | Default | Keys |
|--------|------|------|---------|------|
| `employee_id` | UUID | NO |  | FK → `employees.id` |
| `date` | DATE | NO |  |  |
| `check_in` | TIME | YES |  |  |
| `check_out` | TIME | YES |  |  |
| `status` | VARCHAR(8) | NO | `AttendanceStatus.present` |  |
| `notes` | VARCHAR(255) | YES |  |  |
| `id` | CHAR(32) | NO | `(func)` | PK |
| `created_at` | DATETIME | NO | server: `now()` |  |
| `updated_at` | DATETIME | NO | server: `now()` |  |
| `deleted_at` | DATETIME | YES |  |  |

- **UNIQUE** (`employee_id`, `date`) — `uq_attendance_employee_date`

### `clients`

| Column | Type | Null | Default | Keys |
|--------|------|------|---------|------|
| `user_id` | UUID | NO |  | UQ, FK → `users.id` |
| `company_name` | VARCHAR(200) | YES |  |  |
| `industry` | VARCHAR(100) | YES |  |  |
| `country` | VARCHAR(100) | YES |  |  |
| `website` | VARCHAR(255) | YES |  |  |
| `billing_address` | TEXT | YES |  |  |
| `account_manager_id` | UUID | YES |  | FK → `employees.id` |
| `id` | CHAR(32) | NO | `(func)` | PK |
| `created_at` | DATETIME | NO | server: `now()` |  |
| `updated_at` | DATETIME | NO | server: `now()` |  |
| `deleted_at` | DATETIME | YES |  |  |


### `comments`

| Column | Type | Null | Default | Keys |
|--------|------|------|---------|------|
| `blog_id` | UUID | NO |  | FK → `blogs.id` |
| `name` | VARCHAR(150) | NO |  |  |
| `email` | VARCHAR(255) | NO |  |  |
| `content` | TEXT | NO |  |  |
| `status` | VARCHAR(8) | NO | `CommentStatus.pending` |  |
| `id` | CHAR(32) | NO | `(func)` | PK |
| `created_at` | DATETIME | NO | server: `now()` |  |
| `updated_at` | DATETIME | NO | server: `now()` |  |
| `deleted_at` | DATETIME | YES |  |  |


### `employee_documents`

| Column | Type | Null | Default | Keys |
|--------|------|------|---------|------|
| `employee_id` | UUID | NO |  | FK → `employees.id` |
| `title` | VARCHAR(200) | NO |  |  |
| `type` | VARCHAR(11) | NO | `DocumentType.other` |  |
| `file_url` | VARCHAR(500) | NO |  |  |
| `id` | CHAR(32) | NO | `(func)` | PK |
| `created_at` | DATETIME | NO | server: `now()` |  |
| `updated_at` | DATETIME | NO | server: `now()` |  |
| `deleted_at` | DATETIME | YES |  |  |


### `leaves`

| Column | Type | Null | Default | Keys |
|--------|------|------|---------|------|
| `employee_id` | UUID | NO |  | FK → `employees.id` |
| `type` | VARCHAR(9) | NO |  |  |
| `start_date` | DATE | NO |  |  |
| `end_date` | DATE | NO |  |  |
| `reason` | TEXT | YES |  |  |
| `status` | VARCHAR(9) | NO | `LeaveStatus.pending` |  |
| `approved_by` | UUID | YES |  | FK → `users.id` |
| `id` | CHAR(32) | NO | `(func)` | PK |
| `created_at` | DATETIME | NO | server: `now()` |  |
| `updated_at` | DATETIME | NO | server: `now()` |  |
| `deleted_at` | DATETIME | YES |  |  |


### `payslips`

| Column | Type | Null | Default | Keys |
|--------|------|------|---------|------|
| `employee_id` | UUID | NO |  | FK → `employees.id` |
| `month` | INTEGER | NO |  |  |
| `year` | INTEGER | NO |  |  |
| `basic` | NUMERIC(12, 2) | NO |  |  |
| `allowances` | NUMERIC(12, 2) | NO | `0` |  |
| `deductions` | NUMERIC(12, 2) | NO | `0` |  |
| `net_pay` | NUMERIC(12, 2) | NO |  |  |
| `file_url` | VARCHAR(500) | YES |  |  |
| `status` | VARCHAR(9) | NO | `PayslipStatus.generated` |  |
| `id` | CHAR(32) | NO | `(func)` | PK |
| `created_at` | DATETIME | NO | server: `now()` |  |
| `updated_at` | DATETIME | NO | server: `now()` |  |
| `deleted_at` | DATETIME | YES |  |  |

- **UNIQUE** (`employee_id`, `month`, `year`) — `uq_payslip_employee_period`

### `performance_reviews`

| Column | Type | Null | Default | Keys |
|--------|------|------|---------|------|
| `employee_id` | UUID | NO |  | FK → `employees.id` |
| `reviewer_id` | UUID | NO |  | FK → `users.id` |
| `review_period` | VARCHAR(50) | NO |  |  |
| `review_date` | DATE | NO |  |  |
| `rating` | INTEGER | YES |  |  |
| `strengths` | TEXT | YES |  |  |
| `areas_for_improvement` | TEXT | YES |  |  |
| `goals` | TEXT | YES |  |  |
| `comments` | TEXT | YES |  |  |
| `status` | VARCHAR(20) | NO | `draft` |  |
| `id` | CHAR(32) | NO | `(func)` | PK |
| `created_at` | DATETIME | NO | server: `now()` |  |
| `updated_at` | DATETIME | NO | server: `now()` |  |
| `deleted_at` | DATETIME | YES |  |  |


### `training_enrollments`

| Column | Type | Null | Default | Keys |
|--------|------|------|---------|------|
| `employee_id` | UUID | NO |  | FK → `employees.id` |
| `course_id` | UUID | NO |  | FK → `courses.id` |
| `status` | VARCHAR(20) | NO | `enrolled` |  |
| `enrolled_at` | DATETIME | NO | `(func)` |  |
| `completed_at` | DATETIME | YES |  |  |
| `id` | CHAR(32) | NO | `(func)` | PK |
| `created_at` | DATETIME | NO | server: `now()` |  |
| `updated_at` | DATETIME | NO | server: `now()` |  |
| `deleted_at` | DATETIME | YES |  |  |


### `client_files`

| Column | Type | Null | Default | Keys |
|--------|------|------|---------|------|
| `client_id` | UUID | NO |  | FK → `clients.id` |
| `name` | VARCHAR(255) | NO |  |  |
| `category` | VARCHAR(100) | NO |  |  |
| `file_url` | VARCHAR(500) | NO |  |  |
| `size_bytes` | INTEGER | YES |  |  |
| `uploaded_by` | VARCHAR(150) | YES |  |  |
| `id` | CHAR(32) | NO | `(func)` | PK |
| `created_at` | DATETIME | NO | server: `now()` |  |
| `updated_at` | DATETIME | NO | server: `now()` |  |
| `deleted_at` | DATETIME | YES |  |  |


### `client_reports`

| Column | Type | Null | Default | Keys |
|--------|------|------|---------|------|
| `client_id` | UUID | NO |  | FK → `clients.id` |
| `title` | VARCHAR(255) | NO |  |  |
| `report_type` | VARCHAR(100) | NO |  |  |
| `period` | VARCHAR(50) | NO |  |  |
| `file_url` | VARCHAR(500) | YES |  |  |
| `size_bytes` | INTEGER | YES |  |  |
| `id` | CHAR(32) | NO | `(func)` | PK |
| `created_at` | DATETIME | NO | server: `now()` |  |
| `updated_at` | DATETIME | NO | server: `now()` |  |
| `deleted_at` | DATETIME | YES |  |  |


### `leads`

| Column | Type | Null | Default | Keys |
|--------|------|------|---------|------|
| `contact_submission_id` | UUID | YES |  | FK → `contact_submissions.id` |
| `company` | VARCHAR(200) | YES |  |  |
| `contact_name` | VARCHAR(150) | NO |  |  |
| `email` | VARCHAR(255) | NO |  |  |
| `phone` | VARCHAR(30) | YES |  |  |
| `source` | VARCHAR(13) | NO | `LeadSource.other` |  |
| `status` | VARCHAR(21) | NO | `LeadStatus.new` |  |
| `estimated_value` | NUMERIC(12, 2) | YES |  |  |
| `notes` | TEXT | YES |  |  |
| `owner_id` | UUID | YES |  | FK → `users.id` |
| `converted_client_id` | UUID | YES |  | FK → `clients.id` |
| `id` | CHAR(32) | NO | `(func)` | PK |
| `created_at` | DATETIME | NO | server: `now()` |  |
| `updated_at` | DATETIME | NO | server: `now()` |  |
| `deleted_at` | DATETIME | YES |  |  |


### `projects`

| Column | Type | Null | Default | Keys |
|--------|------|------|---------|------|
| `title` | VARCHAR(200) | NO |  |  |
| `slug` | VARCHAR(220) | NO |  | UQ |
| `client_id` | UUID | YES |  | FK → `clients.id` |
| `overview` | TEXT | YES |  |  |
| `challenge` | TEXT | YES |  |  |
| `solution` | TEXT | YES |  |  |
| `technology_stack` | ARRAY | YES | `(func)` |  |
| `architecture_notes` | TEXT | YES |  |  |
| `industry` | VARCHAR(100) | YES |  |  |
| `start_date` | DATE | YES |  |  |
| `end_date` | DATE | YES |  |  |
| `budget` | NUMERIC(14, 2) | YES |  |  |
| `status` | VARCHAR(11) | NO | `ProjectStatus.planning` |  |
| `progress_percent` | INTEGER | NO | `0` |  |
| `project_manager_id` | UUID | YES |  | FK → `users.id` |
| `cover_image` | VARCHAR(500) | YES |  |  |
| `video_url` | VARCHAR(500) | YES |  |  |
| `is_featured` | BOOLEAN | NO | `False` |  |
| `is_published` | BOOLEAN | NO | `False` |  |
| `id` | CHAR(32) | NO | `(func)` | PK |
| `created_at` | DATETIME | NO | server: `now()` |  |
| `updated_at` | DATETIME | NO | server: `now()` |  |
| `deleted_at` | DATETIME | YES |  |  |


### `testimonials`

| Column | Type | Null | Default | Keys |
|--------|------|------|---------|------|
| `client_id` | UUID | YES |  | FK → `clients.id` |
| `author_name` | VARCHAR(150) | NO |  |  |
| `author_title` | VARCHAR(150) | YES |  |  |
| `company_name` | VARCHAR(200) | YES |  |  |
| `avatar` | VARCHAR(500) | YES |  |  |
| `rating` | INTEGER | NO | `5` |  |
| `content` | TEXT | NO |  |  |
| `is_published` | BOOLEAN | NO | `True` |  |
| `id` | CHAR(32) | NO | `(func)` | PK |
| `created_at` | DATETIME | NO | server: `now()` |  |
| `updated_at` | DATETIME | NO | server: `now()` |  |
| `deleted_at` | DATETIME | YES |  |  |


### `tickets`

| Column | Type | Null | Default | Keys |
|--------|------|------|---------|------|
| `ticket_number` | VARCHAR(50) | NO |  | UQ |
| `client_id` | UUID | YES |  | FK → `clients.id` |
| `subject` | VARCHAR(255) | NO |  |  |
| `description` | TEXT | NO |  |  |
| `priority` | VARCHAR(8) | NO | `TicketPriority.medium` |  |
| `status` | VARCHAR(11) | NO | `TicketStatus.open` |  |
| `assigned_to` | UUID | YES |  | FK → `users.id` |
| `id` | CHAR(32) | NO | `(func)` | PK |
| `created_at` | DATETIME | NO | server: `now()` |  |
| `updated_at` | DATETIME | NO | server: `now()` |  |
| `deleted_at` | DATETIME | YES |  |  |


### `case_studies`

| Column | Type | Null | Default | Keys |
|--------|------|------|---------|------|
| `title` | VARCHAR(255) | NO |  |  |
| `slug` | VARCHAR(280) | NO |  | UQ |
| `project_id` | UUID | YES |  | FK → `projects.id` |
| `client_name` | VARCHAR(200) | YES |  |  |
| `industry` | VARCHAR(100) | YES |  |  |
| `problem` | TEXT | YES |  |  |
| `solution` | TEXT | YES |  |  |
| `implementation` | TEXT | YES |  |  |
| `result` | TEXT | YES |  |  |
| `roi` | VARCHAR(100) | YES |  |  |
| `customer_feedback` | TEXT | YES |  |  |
| `download_url` | VARCHAR(500) | YES |  |  |
| `cover_image` | VARCHAR(500) | YES |  |  |
| `is_published` | BOOLEAN | NO | `True` |  |
| `id` | CHAR(32) | NO | `(func)` | PK |
| `created_at` | DATETIME | NO | server: `now()` |  |
| `updated_at` | DATETIME | NO | server: `now()` |  |
| `deleted_at` | DATETIME | YES |  |  |


### `gallery`

| Column | Type | Null | Default | Keys |
|--------|------|------|---------|------|
| `title` | VARCHAR(200) | YES |  |  |
| `image_url` | VARCHAR(500) | NO |  |  |
| `type` | VARCHAR(5) | NO | `GalleryType.image` |  |
| `project_id` | UUID | YES |  | FK → `projects.id` |
| `album_name` | VARCHAR(150) | YES |  |  |
| `is_published` | BOOLEAN | NO | `True` |  |
| `id` | CHAR(32) | NO | `(func)` | PK |
| `created_at` | DATETIME | NO | server: `now()` |  |
| `updated_at` | DATETIME | NO | server: `now()` |  |
| `deleted_at` | DATETIME | YES |  |  |


### `invoices`

| Column | Type | Null | Default | Keys |
|--------|------|------|---------|------|
| `invoice_number` | VARCHAR(50) | NO |  | UQ |
| `client_id` | UUID | NO |  | FK → `clients.id` |
| `project_id` | UUID | YES |  | FK → `projects.id` |
| `amount` | NUMERIC(14, 2) | NO |  |  |
| `tax` | NUMERIC(14, 2) | NO | `0` |  |
| `total_amount` | NUMERIC(14, 2) | NO |  |  |
| `currency` | VARCHAR(10) | NO | `INR` |  |
| `issue_date` | DATE | NO |  |  |
| `due_date` | DATE | NO |  |  |
| `status` | VARCHAR(9) | NO | `InvoiceStatus.draft` |  |
| `notes` | TEXT | YES |  |  |
| `id` | CHAR(32) | NO | `(func)` | PK |
| `created_at` | DATETIME | NO | server: `now()` |  |
| `updated_at` | DATETIME | NO | server: `now()` |  |
| `deleted_at` | DATETIME | YES |  |  |


### `meetings`

| Column | Type | Null | Default | Keys |
|--------|------|------|---------|------|
| `project_id` | UUID | YES |  | FK → `projects.id` |
| `client_id` | UUID | YES |  | FK → `clients.id` |
| `title` | VARCHAR(255) | NO |  |  |
| `agenda` | TEXT | YES |  |  |
| `scheduled_at` | DATETIME | NO |  |  |
| `duration_minutes` | INTEGER | NO | `30` |  |
| `meeting_link` | VARCHAR(500) | YES |  |  |
| `organizer_id` | UUID | YES |  | FK → `users.id` |
| `status` | VARCHAR(9) | NO | `MeetingStatus.scheduled` |  |
| `notes` | TEXT | YES |  |  |
| `id` | CHAR(32) | NO | `(func)` | PK |
| `created_at` | DATETIME | NO | server: `now()` |  |
| `updated_at` | DATETIME | NO | server: `now()` |  |
| `deleted_at` | DATETIME | YES |  |  |


### `portfolios`

| Column | Type | Null | Default | Keys |
|--------|------|------|---------|------|
| `title` | VARCHAR(200) | NO |  |  |
| `slug` | VARCHAR(220) | NO |  | UQ |
| `category` | VARCHAR(100) | YES |  |  |
| `thumbnail` | VARCHAR(500) | YES |  |  |
| `description` | TEXT | YES |  |  |
| `live_url` | VARCHAR(500) | YES |  |  |
| `project_id` | UUID | YES |  | FK → `projects.id` |
| `is_featured` | BOOLEAN | NO | `False` |  |
| `order` | INTEGER | NO | `0` |  |
| `id` | CHAR(32) | NO | `(func)` | PK |
| `created_at` | DATETIME | NO | server: `now()` |  |
| `updated_at` | DATETIME | NO | server: `now()` |  |
| `deleted_at` | DATETIME | YES |  |  |


### `project_members`

| Column | Type | Null | Default | Keys |
|--------|------|------|---------|------|
| `project_id` | UUID | NO |  | PK, FK → `projects.id` |
| `employee_id` | UUID | NO |  | PK, FK → `employees.id` |


### `proposals`

| Column | Type | Null | Default | Keys |
|--------|------|------|---------|------|
| `lead_id` | UUID | NO |  | FK → `leads.id` |
| `version` | INTEGER | NO | `1` |  |
| `scope_summary` | TEXT | NO |  |  |
| `price` | NUMERIC(12, 2) | NO |  |  |
| `currency` | VARCHAR(3) | NO | `USD` |  |
| `status` | VARCHAR(8) | NO | `ProposalStatus.draft` |  |
| `file_url` | VARCHAR(500) | YES |  |  |
| `sent_at` | DATETIME | YES |  |  |
| `viewed_at` | DATETIME | YES |  |  |
| `created_by` | UUID | YES |  | FK → `users.id` |
| `id` | CHAR(32) | NO | `(func)` | PK |
| `created_at` | DATETIME | NO | server: `now()` |  |
| `updated_at` | DATETIME | NO | server: `now()` |  |
| `deleted_at` | DATETIME | YES |  |  |


### `tasks`

| Column | Type | Null | Default | Keys |
|--------|------|------|---------|------|
| `project_id` | UUID | NO |  | FK → `projects.id` |
| `title` | VARCHAR(255) | NO |  |  |
| `description` | TEXT | YES |  |  |
| `assigned_to` | UUID | YES |  | FK → `users.id` |
| `priority` | VARCHAR(6) | NO | `TaskPriority.medium` |  |
| `status` | VARCHAR(11) | NO | `TaskStatus.todo` |  |
| `due_date` | DATE | YES |  |  |
| `estimated_hours` | NUMERIC(6, 2) | YES |  |  |
| `id` | CHAR(32) | NO | `(func)` | PK |
| `created_at` | DATETIME | NO | server: `now()` |  |
| `updated_at` | DATETIME | NO | server: `now()` |  |
| `deleted_at` | DATETIME | YES |  |  |


### `ticket_replies`

| Column | Type | Null | Default | Keys |
|--------|------|------|---------|------|
| `ticket_id` | UUID | NO |  | FK → `tickets.id` |
| `user_id` | UUID | NO |  | FK → `users.id` |
| `message` | TEXT | NO |  |  |
| `attachment_url` | VARCHAR(500) | YES |  |  |
| `id` | CHAR(32) | NO | `(func)` | PK |
| `created_at` | DATETIME | NO | server: `now()` |  |
| `updated_at` | DATETIME | NO | server: `now()` |  |
| `deleted_at` | DATETIME | YES |  |  |


### `contracts`

| Column | Type | Null | Default | Keys |
|--------|------|------|---------|------|
| `proposal_id` | UUID | NO |  | UQ, FK → `proposals.id` |
| `document_url` | VARCHAR(500) | YES |  |  |
| `status` | VARCHAR(7) | NO | `ContractStatus.pending` |  |
| `signed_by_client_at` | DATETIME | YES |  |  |
| `signed_by_company_at` | DATETIME | YES |  |  |
| `id` | CHAR(32) | NO | `(func)` | PK |
| `created_at` | DATETIME | NO | server: `now()` |  |
| `updated_at` | DATETIME | NO | server: `now()` |  |
| `deleted_at` | DATETIME | YES |  |  |


### `payments`

| Column | Type | Null | Default | Keys |
|--------|------|------|---------|------|
| `invoice_id` | UUID | NO |  | FK → `invoices.id` |
| `amount` | NUMERIC(14, 2) | NO |  |  |
| `method` | VARCHAR(13) | NO |  |  |
| `transaction_ref` | VARCHAR(150) | YES |  |  |
| `paid_at` | DATETIME | NO |  |  |
| `status` | VARCHAR(9) | NO | `PaymentStatus.completed` |  |
| `id` | CHAR(32) | NO | `(func)` | PK |
| `created_at` | DATETIME | NO | server: `now()` |  |
| `updated_at` | DATETIME | NO | server: `now()` |  |
| `deleted_at` | DATETIME | YES |  |  |


### `timesheets`

| Column | Type | Null | Default | Keys |
|--------|------|------|---------|------|
| `employee_id` | UUID | NO |  | FK → `employees.id` |
| `project_id` | UUID | YES |  | FK → `projects.id` |
| `task_id` | UUID | YES |  | FK → `tasks.id` |
| `date` | DATE | NO |  |  |
| `hours` | NUMERIC(4, 2) | NO |  |  |
| `description` | TEXT | YES |  |  |
| `status` | VARCHAR(9) | NO | `TimesheetStatus.draft` |  |
| `id` | CHAR(32) | NO | `(func)` | PK |
| `created_at` | DATETIME | NO | server: `now()` |  |
| `updated_at` | DATETIME | NO | server: `now()` |  |
| `deleted_at` | DATETIME | YES |  |  |

