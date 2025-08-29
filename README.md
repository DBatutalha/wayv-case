# Campaign Management Mini-App

A full-stack web application for managing marketing campaigns and influencer partnerships. Built with Next.js 15, tRPC, Supabase, and Drizzle ORM.

## 🚀 Features

- **Authentication**: User signup/login with Supabase Auth
- **Campaign Management**: Create, view, edit, and delete campaigns
- **Influencer Management**: Add influencers with follower count and engagement rate
- **Campaign Assignment**: Assign influencers to campaigns
- **Responsive UI**: Modern, mobile-friendly interface built with Tailwind CSS

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS v4
- **Backend**: tRPC, Node.js
- **Database**: PostgreSQL (Supabase)
- **ORM**: Drizzle ORM
- **Authentication**: Supabase Auth
- **Language**: TypeScript

## 📋 Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account and project
- PostgreSQL database (or use Supabase's hosted solution)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd campaign-app
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Database Connection (Use Session Pooler for IPv4 compatibility)
DATABASE_URL=postgresql://postgres.your_project_ref:your_password@aws-1-eu-north-1.pooler.supabase.com:5432/postgres?sslmode=require
```

### 4. Database Setup

Run the database migrations:

```bash
npx drizzle-kit push
```

### 5. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🔧 Supabase Configuration

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your project URL and anon key from Settings → API

### 2. Database Connection

For IPv4 compatibility, use the **Session Pooler** connection string:

1. Go to Project Settings → Database
2. Copy the "Session pooler (Shared Pooler)" connection string
3. Replace `[YOUR-PASSWORD]` with your database password
4. Add `?sslmode=require` at the end

### 3. Authentication Setup

1. Go to Authentication → Settings
2. Configure your site URL (e.g., `http://localhost:3000` for development)
3. Add redirect URLs for your domains

## 📁 Project Structure

```
campaign-app/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   └── trpc/         # tRPC endpoints
│   ├── dashboard/         # Dashboard page
│   ├── login/            # Login page
│   ├── signup/           # Signup page
│   └── layout.tsx        # Root layout
├── drizzle/               # Database schema and migrations
│   └── schema.ts         # Drizzle schema definitions
├── lib/                   # Utility libraries
│   ├── drizzle.ts        # Database connection
│   └── supabase.ts       # Supabase client
├── server/                # tRPC server
│   ├── context.ts        # tRPC context
│   ├── trpc.ts           # tRPC configuration
│   └── routers/          # API route handlers
└── public/                # Static assets
```

## 🗄️ Database Schema

### Tables

- **campaigns**: Campaign information (title, description, budget, dates)
- **influencers**: Influencer profiles (name, follower count, engagement rate)
- **campaign_influencers**: Many-to-many relationship between campaigns and influencers

### Schema Management

```bash
# Generate migrations
npx drizzle-kit generate

# Apply migrations
npx drizzle-kit push

# View database
npx drizzle-kit studio
```

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Environment Variables for Production

```env
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_supabase_anon_key
DATABASE_URL=your_production_database_url
```

### Build Commands

```bash
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## 🔒 Security Features

- User authentication with Supabase Auth
- Row-level security (RLS) in database
- User-specific data isolation
- Secure API endpoints with tRPC

## 🧪 Testing

```bash
# Run type checking
npx tsc --noEmit

# Run linting
npm run lint

# Check for build errors
npm run build
```

## 📱 Responsive Design

The application is fully responsive and works on:

- Desktop (1024px+)
- Tablet (768px - 1023px)
- Mobile (< 768px)

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection Error**: Ensure you're using Session Pooler for IPv4 compatibility
2. **Authentication Issues**: Check Supabase project settings and redirect URLs
3. **Build Errors**: Verify all environment variables are set correctly

### Debug Commands

```bash
# Check database connection
npx drizzle-kit push

# Verify environment variables
echo $DATABASE_URL

# Check Supabase connection
npm run dev
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

If you encounter any issues:

1. Check the troubleshooting section above
2. Review Supabase documentation
3. Open an issue in the repository
4. Check the console for error messages

## 🔄 Updates

Keep your dependencies updated:

```bash
npm update
npx drizzle-kit push
```

---

Built with ❤️ using Next.js, tRPC, Supabase, and Drizzle ORM.
