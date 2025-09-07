-- Complete Database Schema for League Prediction Battle
-- This script creates the entire database from scratch
-- Run this in your Supabase SQL Editor

-- ==============================================
-- 1. DROP EXISTING TABLES (in correct order due to foreign keys)
-- ==============================================
DROP TABLE IF EXISTS league_memberships CASCADE;
DROP TABLE IF EXISTS leagues CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS fixtures CASCADE;
DROP TABLE IF EXISTS standings CASCADE;

-- ==============================================
-- 2. DROP EXISTING FUNCTIONS AND TRIGGERS
-- ==============================================
DROP FUNCTION IF EXISTS create_league_owner_membership() CASCADE;
DROP FUNCTION IF EXISTS generate_league_code() CASCADE;

-- ==============================================
-- 3. CREATE CORE TABLES
-- ==============================================

-- User Profiles Table
CREATE TABLE user_profiles (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    display_name TEXT,
    table_prediction TEXT[],
    fixture_predictions JSONB DEFAULT '{}',
    fixture_points INTEGER DEFAULT 0,
    table_points INTEGER DEFAULT 0,
    total_points INTEGER DEFAULT 0,
    exact_predictions INTEGER DEFAULT 0,
    result_predictions INTEGER DEFAULT 0,
    total_predictions INTEGER DEFAULT 0,
    close_predictions INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Fixtures Table
CREATE TABLE fixtures (
    id SERIAL PRIMARY KEY,
    external_id INTEGER,
    home_team_id TEXT,
    away_team_id TEXT,
    home_team_name TEXT,
    away_team_name TEXT,
    home_team_logo TEXT,
    away_team_logo TEXT,
    matchday INTEGER,
    season TEXT,
    status TEXT,
    scheduled_date TIMESTAMP WITH TIME ZONE,
    home_score INTEGER,
    away_score INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Standings Table
CREATE TABLE standings (
    id SERIAL PRIMARY KEY,
    season TEXT,
    team_id TEXT,
    position INTEGER,
    team_name TEXT,
    played INTEGER,
    wins INTEGER,
    draws INTEGER,
    losses INTEGER,
    goals_for INTEGER,
    goals_against INTEGER,
    goal_difference INTEGER,
    points INTEGER,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- 4. CREATE LEAGUE SYSTEM TABLES
-- ==============================================

-- Leagues Table
CREATE TABLE leagues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(8) UNIQUE NOT NULL,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    max_members INTEGER DEFAULT 50
);

-- League Memberships Table
CREATE TABLE league_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('owner', 'member')),
    UNIQUE(league_id, user_id)
);

-- ==============================================
-- 5. CREATE INDEXES FOR PERFORMANCE
-- ==============================================

-- User Profiles Indexes
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_display_name ON user_profiles(display_name);

-- Fixtures Indexes
CREATE INDEX idx_fixtures_external_id ON fixtures(external_id);
CREATE INDEX idx_fixtures_matchday ON fixtures(matchday);
CREATE INDEX idx_fixtures_status ON fixtures(status);
CREATE INDEX idx_fixtures_scheduled_date ON fixtures(scheduled_date);

-- Standings Indexes
CREATE INDEX idx_standings_season ON standings(season);
CREATE INDEX idx_standings_team_id ON standings(team_id);
CREATE INDEX idx_standings_position ON standings(position);

-- Leagues Indexes
CREATE INDEX idx_leagues_code ON leagues(code);
CREATE INDEX idx_leagues_created_by ON leagues(created_by);

-- League Memberships Indexes
CREATE INDEX idx_league_memberships_league_id ON league_memberships(league_id);
CREATE INDEX idx_league_memberships_user_id ON league_memberships(user_id);

-- ==============================================
-- 6. ENABLE ROW LEVEL SECURITY
-- ==============================================
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixtures ENABLE ROW LEVEL SECURITY;
ALTER TABLE standings ENABLE ROW LEVEL SECURITY;
ALTER TABLE leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE league_memberships ENABLE ROW LEVEL SECURITY;

-- ==============================================
-- 7. CREATE RLS POLICIES
-- ==============================================

-- User Profiles Policies
CREATE POLICY "Users can view their own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Fixtures Policies (Allow all authenticated users to read)
CREATE POLICY "Authenticated users can view fixtures" ON fixtures
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Standings Policies (Allow all authenticated users to read)
CREATE POLICY "Authenticated users can view standings" ON standings
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Leagues Policies (Service role friendly)
CREATE POLICY "Service role can do everything on leagues" ON leagues
    FOR ALL USING (true);

-- League Memberships Policies (Service role friendly)
CREATE POLICY "Service role can do everything on league_memberships" ON league_memberships
    FOR ALL USING (true);

-- ==============================================
-- 8. GRANT PERMISSIONS TO SERVICE ROLE
-- ==============================================
GRANT ALL ON user_profiles TO service_role;
GRANT ALL ON fixtures TO service_role;
GRANT ALL ON standings TO service_role;
GRANT ALL ON leagues TO service_role;
GRANT ALL ON league_memberships TO service_role;
GRANT USAGE ON SCHEMA public TO service_role;

-- ==============================================
-- 9. CREATE FUNCTIONS
-- ==============================================

-- Function to generate unique league code
CREATE OR REPLACE FUNCTION generate_league_code()
RETURNS TEXT AS $$
DECLARE
    new_code TEXT;
    code_exists BOOLEAN;
BEGIN
    LOOP
        -- Generate 8-character alphanumeric code
        new_code := upper(substring(md5(random()::text) from 1 for 8));
        
        -- Check if code already exists
        SELECT EXISTS(SELECT 1 FROM leagues WHERE leagues.code = new_code) INTO code_exists;
        
        -- If code doesn't exist, return it
        IF NOT code_exists THEN
            RETURN new_code;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to automatically create league membership for creator
CREATE OR REPLACE FUNCTION create_league_owner_membership()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert the creator as owner
    INSERT INTO league_memberships (league_id, user_id, role)
    VALUES (NEW.id, NEW.created_by, 'owner');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- 10. CREATE TRIGGERS
-- ==============================================

-- Trigger to automatically create owner membership when league is created
CREATE TRIGGER trigger_create_league_owner_membership
    AFTER INSERT ON leagues
    FOR EACH ROW
    EXECUTE FUNCTION create_league_owner_membership();

-- ==============================================
-- 11. INSERT SAMPLE DATA (Optional)
-- ==============================================

-- You can uncomment these lines to insert sample data for testing
-- INSERT INTO user_profiles (user_id, email, display_name) VALUES 
-- ('00000000-0000-0000-0000-000000000000', 'test@example.com', 'Test User');

-- ==============================================
-- COMPLETE!
-- ==============================================
-- Your database is now ready with:
-- ✅ User profiles with predictions
-- ✅ Fixtures and standings
-- ✅ League system with memberships
-- ✅ Proper RLS policies
-- ✅ Service role permissions
-- ✅ Functions and triggers
