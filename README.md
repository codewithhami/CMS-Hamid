# Industry Operations Management System (CMS)

A comprehensive, multi-tenant web application designed to manage the daily operations, financials, and human resources of manufacturing and embroidery factories. Built for scale, it allows factory owners to seamlessly track vendors, employees, raw material expenses, utility bills, and generate detailed Excel reports—all isolated across multiple distinct business profiles (factories).

## 🚀 Features

*   **Multi-Tenant Architecture**: Manage multiple independent factories from a single account. Data, employees, and expenses are strictly isolated per factory.
*   **Vendor Management**: Track vendor orders, specific stitched parts (Front, Back, Duppatta), billing, advance payments, and remaining balances (Taans).
*   **Employee & Payroll System**: Manage employee profiles, track monthly salaries, apply deductions, and handle advance payments.
*   **Mess (Food) Tracking**: Log daily employee meals and automatically distribute the collective monthly mess bill across employees based on individual consumption.
*   **Expense Tracking**: Dedicated modules for recording Thread Purchases, Clipping Expenses, Rent, Electricity Bills, and custom Other Expenses.
*   **Comprehensive Financial Dashboard**: Real-time insights into total revenue, individual expenses, overall net profit, and recent transactions.
*   **Advanced Excel Reporting**: Export fully formatted, multi-sheet Excel backups detailing every aspect of the business, including dynamically calculated Vendor Balances, Mess Breakdowns, and Remaining Employee Salaries.
*   **Real-time Notifications**: Alerts for pending salaries, unpaid electricity bills, and outstanding vendor balances.

## 🛠️ Tech Stack

*   **Frontend**: [Next.js 14](https://nextjs.org/) (App Router), React, Tailwind CSS
*   **Backend / Database**: [Supabase](https://supabase.com/) (PostgreSQL), Supabase Auth
*   **Icons**: [Lucide React](https://lucide.dev/)
*   **Utilities**: `date-fns` for date manipulation, `xlsx` for Excel generation

## 📂 Project Structure

```text
src/
├── app/
│   ├── (auth)/        # Authentication routes (Login, Register, Forgot Password)
│   ├── (dashboard)/   # Main authenticated application modules
│   │   ├── dashboard/ # Financial overview & charts
│   │   ├── employees/ # Employee management
│   │   ├── vendors/   # Vendor orders and payments
│   │   ├── salary/    # Payroll processing
│   │   ├── mess/      # Meal tracking and bill distribution
│   │   ├── rent/      # Rent records
│   │   ├── electricity/ # Electricity bills
│   │   ├── thread-expense/ # Raw material tracking
│   │   ├── clipping-expense/ # Raw material tracking
│   │   ├── other-expenses/ # Miscellaneous costs
│   │   ├── reports/   # Global Excel export tools
│   │   └── settings/  # Multi-tenant factory configuration (Coming Soon)
│   ├── layout.tsx     # Global layout
│   └── page.tsx       # Landing page / entry point
├── components/        # Reusable UI components (TopBar, Sidebar, Modal, DataTable)
├── lib/               # Utility functions, Supabase clients, export formats, global styles
└── middleware.ts      # Auth protection
supabase/
└── migrations/        # SQL schema definitions and RLS policies
```

## 💻 Getting Started

### Prerequisites
*   Node.js (v18+)
*   npm, yarn, pnpm, or bun
*   A [Supabase](https://supabase.com/) account and project.

### Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/yourusername/industry-cms.git
    cd industry-cms
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Environment Variables:**
    Create a `.env.local` file in the root directory and add your Supabase credentials:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```
    *Note: For database migrations and scripts, you may also need `SUPABASE_SERVICE_ROLE_KEY` depending on your setup workflow.*

4.  **Database Setup:**
    Execute the SQL scripts found in `supabase/migrations/` sequentially in your Supabase SQL Editor to construct the schema. Ensure `011_multi_tenant_factories.sql` is run to support the latest multi-business architecture.

5.  **Run the application locally:**
    ```bash
    npm run dev
    ```

6.  Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
