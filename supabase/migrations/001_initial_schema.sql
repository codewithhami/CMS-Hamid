-- ============================================
-- Industry Management System - Initial Schema
-- ============================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================
-- 1. PROFILES (extends Supabase auth.users)
-- ============================================
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text not null default '',
  email text not null default '',
  avatar_url text default '',
  role text not null default 'admin' check (role in ('admin', 'manager', 'viewer')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.email
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================
-- 2. EMPLOYEES
-- ============================================
create table public.employees (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  father_name text default '',
  cnic text default '',
  phone text default '',
  designation text default '',
  department text default '',
  salary numeric(12, 2) not null default 0,
  joining_date date default current_date,
  status text not null default 'active' check (status in ('active', 'inactive', 'terminated')),
  address text default '',
  created_by uuid references auth.users on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.employees enable row level security;

create policy "Authenticated users can view employees" on public.employees
  for select to authenticated using (true);

create policy "Authenticated users can insert employees" on public.employees
  for insert to authenticated with check (true);

create policy "Authenticated users can update employees" on public.employees
  for update to authenticated using (true);

create policy "Authenticated users can delete employees" on public.employees
  for delete to authenticated using (true);

-- ============================================
-- 3. MEAL RECORDS
-- ============================================
create table public.meal_records (
  id uuid primary key default uuid_generate_v4(),
  employee_id uuid references public.employees on delete cascade not null,
  date date not null default current_date,
  meal_type text not null default 'lunch' check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack')),
  amount numeric(10, 2) not null default 0,
  notes text default '',
  created_by uuid references auth.users on delete set null,
  created_at timestamptz not null default now()
);

alter table public.meal_records enable row level security;

create policy "Authenticated users can manage meal_records" on public.meal_records
  for all to authenticated using (true) with check (true);

-- ============================================
-- 4. SALARY RECORDS
-- ============================================
create table public.salary_records (
  id uuid primary key default uuid_generate_v4(),
  employee_id uuid references public.employees on delete cascade not null,
  month int not null check (month between 1 and 12),
  year int not null,
  base_salary numeric(12, 2) not null default 0,
  deductions numeric(12, 2) not null default 0,
  bonus numeric(12, 2) not null default 0,
  net_salary numeric(12, 2) not null default 0,
  status text not null default 'pending' check (status in ('pending', 'paid', 'partial')),
  paid_date date,
  notes text default '',
  created_by uuid references auth.users on delete set null,
  created_at timestamptz not null default now(),
  unique(employee_id, month, year)
);

alter table public.salary_records enable row level security;

create policy "Authenticated users can manage salary_records" on public.salary_records
  for all to authenticated using (true) with check (true);

-- ============================================
-- 5. THREAD EXPENSES
-- ============================================
create table public.thread_expenses (
  id uuid primary key default uuid_generate_v4(),
  date date not null default current_date,
  vendor text not null default '',
  thread_type text not null default '',
  quantity numeric(10, 2) not null default 0,
  unit text not null default 'kg',
  unit_price numeric(10, 2) not null default 0,
  total_amount numeric(12, 2) not null default 0,
  notes text default '',
  created_by uuid references auth.users on delete set null,
  created_at timestamptz not null default now()
);

alter table public.thread_expenses enable row level security;

create policy "Authenticated users can manage thread_expenses" on public.thread_expenses
  for all to authenticated using (true) with check (true);

-- ============================================
-- 6. CLIPPING EXPENSES
-- ============================================
create table public.clipping_expenses (
  id uuid primary key default uuid_generate_v4(),
  date date not null default current_date,
  description text not null default '',
  quantity numeric(10, 2) not null default 0,
  unit_price numeric(10, 2) not null default 0,
  total_amount numeric(12, 2) not null default 0,
  notes text default '',
  created_by uuid references auth.users on delete set null,
  created_at timestamptz not null default now()
);

alter table public.clipping_expenses enable row level security;

create policy "Authenticated users can manage clipping_expenses" on public.clipping_expenses
  for all to authenticated using (true) with check (true);

-- ============================================
-- 7. RENT RECORDS
-- ============================================
create table public.rent_records (
  id uuid primary key default uuid_generate_v4(),
  property_name text not null default '',
  month int not null check (month between 1 and 12),
  year int not null,
  amount numeric(12, 2) not null default 0,
  status text not null default 'pending' check (status in ('pending', 'paid')),
  paid_date date,
  notes text default '',
  created_by uuid references auth.users on delete set null,
  created_at timestamptz not null default now(),
  unique(property_name, month, year)
);

alter table public.rent_records enable row level security;

create policy "Authenticated users can manage rent_records" on public.rent_records
  for all to authenticated using (true) with check (true);

-- ============================================
-- 8. ELECTRICITY BILLS
-- ============================================
create table public.electricity_bills (
  id uuid primary key default uuid_generate_v4(),
  meter_name text not null default 'Main Meter',
  month int not null check (month between 1 and 12),
  year int not null,
  units_consumed numeric(10, 2) not null default 0,
  rate_per_unit numeric(8, 2) not null default 0,
  total_amount numeric(12, 2) not null default 0,
  status text not null default 'pending' check (status in ('pending', 'paid')),
  paid_date date,
  notes text default '',
  created_by uuid references auth.users on delete set null,
  created_at timestamptz not null default now(),
  unique(meter_name, month, year)
);

alter table public.electricity_bills enable row level security;

create policy "Authenticated users can manage electricity_bills" on public.electricity_bills
  for all to authenticated using (true) with check (true);

-- ============================================
-- 9. OTHER EXPENSES
-- ============================================
create table public.other_expenses (
  id uuid primary key default uuid_generate_v4(),
  date date not null default current_date,
  category text not null default 'general',
  description text not null default '',
  amount numeric(12, 2) not null default 0,
  notes text default '',
  created_by uuid references auth.users on delete set null,
  created_at timestamptz not null default now()
);

alter table public.other_expenses enable row level security;

create policy "Authenticated users can manage other_expenses" on public.other_expenses
  for all to authenticated using (true) with check (true);

-- ============================================
-- INDEXES for performance
-- ============================================
create index idx_employees_status on public.employees(status);
create index idx_meal_records_date on public.meal_records(date);
create index idx_meal_records_employee on public.meal_records(employee_id);
create index idx_salary_records_employee on public.salary_records(employee_id);
create index idx_salary_records_period on public.salary_records(year, month);
create index idx_thread_expenses_date on public.thread_expenses(date);
create index idx_clipping_expenses_date on public.clipping_expenses(date);
create index idx_rent_records_period on public.rent_records(year, month);
create index idx_electricity_bills_period on public.electricity_bills(year, month);
create index idx_other_expenses_date on public.other_expenses(date);

-- ============================================
-- Updated_at trigger function
-- ============================================
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.update_updated_at_column();

create trigger update_employees_updated_at
  before update on public.employees
  for each row execute procedure public.update_updated_at_column();
