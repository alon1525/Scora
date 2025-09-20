import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { useState } from 'react';

const Landing = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  return (
    <div className="landing-page">
      {/* Header */}
      <header className="landing-header">
        <div className="landing-nav">
          <div className="landing-logo">
            <h1>Scora</h1>
          </div>
          <nav className="landing-nav-links">
            <a href="#about" className="landing-nav-link">About</a>
            <a href="#features" className="landing-nav-link">Features</a>
            <a href="#scoring" className="landing-nav-link">How It Works</a>
            <Link to="/auth?tab=signin" className="landing-nav-link">Sign In</Link>
            <Link to="/auth?tab=signup" className="landing-nav-link">Sign Up</Link>
          </nav>
          <button 
            className="landing-mobile-toggle" 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
        </div>
        
        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className={`landing-mobile-menu ${mobileMenuOpen ? 'show' : ''}`}>
            <div className="landing-mobile-links">
              <a 
                href="#about" 
                className="landing-mobile-link"
                onClick={() => setMobileMenuOpen(false)}
              >
                About
              </a>
              <a 
                href="#features" 
                className="landing-mobile-link"
                onClick={() => setMobileMenuOpen(false)}
              >
                Features
              </a>
              <a 
                href="#scoring" 
                className="landing-mobile-link"
                onClick={() => setMobileMenuOpen(false)}
              >
                How It Works
              </a>
              <Link 
                to="/auth?tab=signin" 
                className="landing-mobile-link"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign In
              </Link>
              <Link 
                to="/auth?tab=signup" 
                className="landing-mobile-link"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign Up
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <main className="landing-hero">
        <div className="landing-hero-content">
          <div className="landing-hero-text">
            <h1 className="landing-title">
              Predict Premier League Scores.<br />
              Challenge Your Friends!
            </h1>
            <p className="landing-description">
              Join the ultimate Premier League prediction game where strategy meets passion. 
              Create your league table predictions, make match score predictions, and compete 
              with friends to see who truly knows the beautiful game.
            </p>
            <div className="landing-hero-actions">
              <Link to="/auth?tab=signup">
                <Button className="btn btn-primary">
                  Sign Up
                </Button>
              </Link>
              <Link to="/auth?tab=signin">
                <Button className="btn btn-secondary">
                  Log In
                </Button>
              </Link>
            </div>
          </div>
          <div className="landing-hero-visual">
            <div className="football-animation">
              <div className="football"></div>
              <div className="pitch-lines"></div>
            </div>
          </div>
        </div>
      </main>

      {/* About Section */}
      <section id="about" className="landing-about">
        <div className="landing-about-content">
          <h2 className="landing-about-title">About Scora</h2>
          <div className="landing-about-text">
            <p className="landing-about-description">
              Welcome to the ultimate Premier League prediction experience! Our platform lets you bet on how the final league table will end, 
              make weekly predictions on individual game results, and create private leagues to compete with your friends.
            </p>
            <p className="landing-about-description">
              Whether you're a casual fan or a football expert, our prediction system challenges your knowledge of the beautiful game. 
              Make your predictions, track your accuracy, and see how you stack up against other football enthusiasts.
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="landing-features">
        <div className="landing-features-content">
          <h2 className="landing-features-title">Why Choose Our Platform?</h2>
          <div className="landing-features-grid">
            <div className="landing-feature">
              <div className="landing-feature-icon">🏆</div>
              <h3 className="landing-feature-title">Compete with Friends</h3>
              <p className="landing-feature-description">
                Create private leagues and challenge your friends to see who has the best football knowledge.
              </p>
            </div>
            <div className="landing-feature">
              <div className="landing-feature-icon">⚽</div>
              <h3 className="landing-feature-title">Live Predictions</h3>
              <p className="landing-feature-description">
                Make real-time predictions for upcoming matches and track your accuracy over time.
              </p>
            </div>
            <div className="landing-feature">
              <div className="landing-feature-icon">📊</div>
              <h3 className="landing-feature-title">Detailed Analytics</h3>
              <p className="landing-feature-description">
                Get insights into your prediction patterns and see how you stack up against others.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Scoring Section */}
      <section id="scoring" className="landing-scoring">
        <div className="landing-scoring-content">
          <h2 className="landing-scoring-title">How Scoring Works</h2>
          <p className="landing-scoring-subtitle">Understand how points are calculated in Scora</p>
          
          <div className="landing-scoring-grid">
            <div className="landing-scoring-card">
              <div className="landing-scoring-card-header">
                <span className="material-symbols-outlined">sports_soccer</span>
                <h3>Fixture Predictions</h3>
              </div>
              <p className="landing-scoring-description">
                Predict the outcome of individual matches and earn points based on accuracy.
              </p>
              <div className="landing-scoring-points">
                <div className="landing-scoring-point">
                  <span className="point-value">3</span>
                  <span className="point-label">Exact Match</span>
                  <span className="point-desc">Correct score</span>
                </div>
                <div className="landing-scoring-point">
                  <span className="point-value">1</span>
                  <span className="point-label">Result Match</span>
                  <span className="point-desc">Correct outcome</span>
                </div>
                <div className="landing-scoring-point">
                  <span className="point-value">0</span>
                  <span className="point-label">No Match</span>
                  <span className="point-desc">Wrong outcome</span>
                </div>
              </div>
            </div>

            <div className="landing-scoring-card">
              <div className="landing-scoring-card-header">
                <span className="material-symbols-outlined">table_chart</span>
                <h3>Table Predictions</h3>
              </div>
              <p className="landing-scoring-description">
                Predict the final league table positions. You get 20 points for each team, minus 1 point for each position off.
              </p>
              <div className="landing-scoring-points">
                <div className="landing-scoring-point">
                  <span className="point-value">20</span>
                  <span className="point-label">Exact Position</span>
                  <span className="point-desc">Perfect prediction</span>
                </div>
                <div className="landing-scoring-point">
                  <span className="point-value">17</span>
                  <span className="point-label">3 Positions Off</span>
                  <span className="point-desc">20 - 3 = 17 points</span>
                </div>
                <div className="landing-scoring-point">
                  <span className="point-value">0</span>
                  <span className="point-label">20+ Positions Off</span>
                  <span className="point-desc">Minimum 0 points</span>
                </div>
              </div>
            </div>

            <div className="landing-scoring-card">
              <div className="landing-scoring-card-header">
                <span className="material-symbols-outlined">calculate</span>
                <h3>Total Score</h3>
              </div>
              <p className="landing-scoring-description">
                Your total score combines both fixture and table prediction points.
              </p>
              <div className="landing-scoring-formula">
                <div className="formula-line">
                  <span>Fixture Points = (Exact × 3) + (Result × 1)</span>
                </div>
                <div className="formula-line">
                  <span>Table Points = (20 × 20 teams) - Total Position Differences</span>
                </div>
                <div className="formula-total">
                  <span>Total Score = Fixture + Table Points</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-footer-content">
          <div className="landing-footer-section">
            <h4 className="landing-footer-title">Scora</h4>
            <p className="landing-footer-text">
              The ultimate platform for football fans to test their knowledge, make predictions, and compete with friends.
            </p>
          </div>
          <div className="landing-footer-section">
            <h4 className="landing-footer-title">Quick Links</h4>
            <div className="landing-footer-links">
              <a href="#about" className="landing-footer-link">About</a>
              <a href="#features" className="landing-footer-link">Features</a>
              <a href="#scoring" className="landing-footer-link">How It Works</a>
              <Link to="/auth?tab=signin" className="landing-footer-link">Sign In</Link>
              <Link to="/auth?tab=signup" className="landing-footer-link">Sign Up</Link>
            </div>
          </div>
        </div>
        <div className="landing-footer-bottom">
          <p className="landing-footer-copyright">
            © 2024 Scora. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
