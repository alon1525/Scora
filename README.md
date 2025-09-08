https://scora-nine.vercel.app/
# Premier League Predictions

A full-stack web application for predicting Premier League match results and table standings. Users can create accounts, make predictions, and compete with friends in private leagues.

## 🚀 Features

- **User Authentication**: Secure sign-up and sign-in with email verification
- **Table Predictions**: Drag and drop teams to predict final league standings
- **Match Predictions**: Predict individual match results
- **Live Standings**: Real-time Premier League table updates via football-data.org API
- **Private Leagues**: Create and join leagues with friends
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Modern UI**: Beautiful, intuitive interface with smooth animations

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern React with hooks
- **Vite** - Fast build tool and dev server
- **JavaScript** - No TypeScript, pure JS for simplicity
- **CSS3** - Custom CSS with CSS variables and modern features
- **React Router** - Client-side routing
- **Radix UI** - Accessible UI components
- **React Beautiful DnD** - Drag and drop functionality
- **TanStack Query** - Data fetching and caching
- **Sonner** - Toast notifications

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **Supabase** - Backend-as-a-Service (Database, Auth, Edge Functions)
- **CORS** - Cross-origin resource sharing

### External APIs
- **football-data.org** - Real-time Premier League standings and match data

### Database
- **PostgreSQL** - Via Supabase
- **Real-time subscriptions** - Live data updates

## 📦 Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Supabase account
- football-data.org API key

### 1. Clone the repository
```bash
git clone <your-repo-url>
cd league-predict-battle-57
```

### 2. Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
# Edit .env with your Supabase credentials
npm run dev
```

### 3. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your API keys
npm start
```

## 🔑 Environment Variables

### Frontend (.env)
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Backend (.env)
```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
LEAGUE_STANDINGS_API_KEY=your_football_data_api_key
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:8080
```

## 🗄️ Database Setup

### Supabase Configuration
1. Create a new Supabase project
2. Run the SQL migrations in the `supabase/migrations/` directory
3. Set up the following tables:
   - `user_table_predictions` - User's table predictions
   - `user_match_predictions` - User's match predictions
   - `leagues` - Private leagues
   - `league_members` - League membership

### Required Tables
```sql
-- User table predictions
CREATE TABLE user_table_predictions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  season TEXT NOT NULL,
  table_order TEXT[] NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, season)
);

-- User match predictions
CREATE TABLE user_match_predictions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  match_id TEXT NOT NULL,
  home_score INTEGER,
  away_score INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, match_id)
);

-- Leagues
CREATE TABLE leagues (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- League members
CREATE TABLE league_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(league_id, user_id)
);
```

## 🌐 API Integration

### Football Data API
The application uses the football-data.org API to fetch real-time Premier League standings:

- **Endpoint**: `https://api.football-data.org/v4/competitions/PL/standings?season=2025`
- **Authentication**: API key in `X-Auth-Token` header
- **Environment Variable**: `LEAGUE_STANDINGS_API_KEY`

### Team Mapping
The backend maps football-data.org team codes (TLAs) to internal team IDs:

```javascript
const TLA_TO_ID = {
  ARS: 'arsenal',
  AVL: 'aston-villa', 
  BOU: 'bournemouth',
  BRE: 'brentford',
  BHA: 'brighton',
  BUR: 'burnley',
  CHE: 'chelsea',
  CRY: 'crystal-palace',
  EVE: 'everton',
  FUL: 'fulham',
  LIV: 'liverpool',
  MCI: 'man-city',
  MUN: 'man-united',
  NEW: 'newcastle',
  NOT: 'nottingham',
  TOT: 'tottenham',
  WHU: 'west-ham',
  WOL: 'wolves',
  // ... more teams
};
```

## 🚀 Deployment

### Frontend (Vercel/Netlify)
1. Build the project: `npm run build`
2. Deploy the `dist` folder to your hosting platform
3. Set environment variables in your hosting platform

### Backend (Railway/Heroku)
1. Set up a Node.js project
2. Install dependencies: `npm install`
3. Set environment variables
4. Deploy the backend code

### Environment Variables for Production
```env
# Frontend
VITE_SUPABASE_URL=your_production_supabase_url
VITE_SUPABASE_ANON_KEY=your_production_supabase_anon_key

# Backend
SUPABASE_URL=your_production_supabase_url
SUPABASE_ANON_KEY=your_production_supabase_anon_key
LEAGUE_STANDINGS_API_KEY=your_football_data_api_key
PORT=3001
NODE_ENV=production
CORS_ORIGIN=https://your-frontend-domain.com
```

## 📱 Usage

### Getting Started
1. **Sign Up**: Create an account with email and password
2. **Verify Email**: Check your email for verification link
3. **Sign In**: Access your dashboard
4. **Make Predictions**: 
   - Drag and drop teams to predict final table
   - Predict individual match results
   - Create or join private leagues

### Features Guide
- **Table Predictions**: Drag teams in the "My Predictions" tab
- **Match Predictions**: Predict scores in the "Match Predictions" tab
- **Live Standings**: View current Premier League table
- **Leagues**: Create private leagues with friends

## 🎨 Customization

### Styling
The app uses custom CSS with CSS variables for easy theming:
```css
:root {
  --primary-green: hsl(152, 43%, 45%);
  --accent-gold: hsl(48, 96%, 53%);
  --text-primary: hsl(0, 0%, 98%);
  /* ... more variables */
}
```

### Adding New Features
1. Create components in `frontend/src/components/`
2. Add pages in `frontend/src/pages/`
3. Update routing in `frontend/src/App.jsx`
4. Add styles in `frontend/src/index.css`
5. Add backend routes in `backend/routes/`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

If you encounter any issues:
1. Check the console for errors
2. Verify environment variables are set correctly
3. Ensure Supabase is properly configured
4. Check the network tab for API errors
5. Verify your football-data.org API key is valid

## 🔮 Future Features

- [ ] Mobile app (React Native)
- [ ] Push notifications
- [ ] Advanced statistics
- [ ] Social features
- [ ] Tournament mode
- [ ] API for third-party integrations
- [ ] Match prediction scoring system
- [ ] League leaderboards

## 📊 Project Structure

```
league-predict-battle-57/
├── frontend/                 # React frontend
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── contexts/       # React contexts
│   │   ├── hooks/          # Custom hooks
│   │   ├── data/           # Static data
│   │   ├── integrations/   # External service integrations
│   │   ├── lib/            # Utility functions
│   │   └── index.css       # Global styles
│   ├── public/             # Static assets
│   ├── .env.example        # Frontend environment template
│   └── package.json        # Frontend dependencies
├── backend/                 # Node.js backend
│   ├── routes/             # API routes
│   ├── controllers/        # Route controllers
│   ├── models/             # Data models
│   ├── utils/              # Utility functions
│   ├── .env.example        # Backend environment template
│   └── server.js           # Main server file
├── supabase/               # Database migrations
│   └── migrations/         # SQL migration files
├── .gitignore              # Git ignore rules
└── README.md               # This file
```

## 🔧 Development

### Running Locally
1. Start the backend: `cd backend && npm start`
2. Start the frontend: `cd frontend && npm run dev`
3. Access the app at `http://localhost:8080`

### API Endpoints
- `GET /api/standings` - Get current Premier League standings
- `GET /api/health` - Health check endpoint

---

**Made with ⚽ by football fans, for football fans!**
