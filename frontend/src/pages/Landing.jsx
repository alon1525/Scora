import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { useState } from 'react';
import ScoraLogo from '../assets/Scora_Logo.png';

const Landing = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  return (
    <div className="landing-page">
      {/* Header */}
      <header className="landing-header">
        <div className="landing-nav">
          <div className="landing-logo">
            <img src={ScoraLogo} alt="Scora" className="logo-image" />
          </div>
          <nav className="landing-nav-links">
            <a href="#about" className="landing-nav-link" onClick={(e) => {
              e.preventDefault();
              const element = document.getElementById('about');
              if (element) {
                const offset = 80;
                const elementPosition = element.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - offset;
                window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
              }
            }}>About</a>
            <a href="#features" className="landing-nav-link" onClick={(e) => {
              e.preventDefault();
              const element = document.getElementById('features');
              if (element) {
                const offset = 80;
                const elementPosition = element.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - offset;
                window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
              }
            }}>Features</a>
            <a href="#scoring" className="landing-nav-link" onClick={(e) => {
              e.preventDefault();
              const element = document.getElementById('scoring');
              if (element) {
                const offset = 80;
                const elementPosition = element.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - offset;
                window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
              }
            }}>How It Works</a>
            <Link to="/auth?tab=signin" className="landing-nav-link landing-nav-link-secondary">Sign In</Link>
            <Link to="/auth?tab=signup" className="landing-nav-link landing-nav-link-primary">
              <span>Sign Up</span>
              <span className="material-symbols-outlined">arrow_forward</span>
            </Link>
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
                onClick={(e) => {
                  e.preventDefault();
                  setMobileMenuOpen(false);
                  const element = document.getElementById('about');
                  if (element) {
                    const offset = 80;
                    const elementPosition = element.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - offset;
                    window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
                  }
                }}
              >
                About
              </a>
              <a 
                href="#features" 
                className="landing-mobile-link"
                onClick={(e) => {
                  e.preventDefault();
                  setMobileMenuOpen(false);
                  const element = document.getElementById('features');
                  if (element) {
                    const offset = 80;
                    const elementPosition = element.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - offset;
                    window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
                  }
                }}
              >
                Features
              </a>
              <a 
                href="#scoring" 
                className="landing-mobile-link"
                onClick={(e) => {
                  e.preventDefault();
                  setMobileMenuOpen(false);
                  const element = document.getElementById('scoring');
                  if (element) {
                    const offset = 80;
                    const elementPosition = element.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - offset;
                    window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
                  }
                }}
              >
                How It Works
              </a>
              <Link 
                to="/auth?tab=signin" 
                className="landing-mobile-link landing-mobile-link-secondary"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign In
              </Link>
              <Link 
                to="/auth?tab=signup" 
                className="landing-mobile-link landing-mobile-link-primary-mobile"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span>Sign Up</span>
                <span className="material-symbols-outlined">arrow_forward</span>
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <main className="landing-hero">
        <div className="landing-hero-background">
          <div className="landing-hero-gradient"></div>
          <div className="landing-hero-pattern"></div>
        </div>
        <div className="landing-hero-content">
          <div className="landing-hero-text">
            <div className="landing-hero-badge">
              <span className="material-symbols-outlined">sports_soccer</span>
              <span>The Ultimate Premier League Prediction Platform</span>
            </div>
            <h1 className="landing-title">
              Predict. Compete.<br />
              <span className="landing-title-accent">Dominate.</span>
            </h1>
            <p className="landing-description">
              Test your football knowledge against friends and fans worldwide. 
              Make match predictions, forecast the final table, and climb the leaderboard 
              to prove you're the ultimate Premier League expert.
            </p>
            <div className="landing-hero-stats">
              <div className="landing-hero-stat">
                <div className="landing-hero-stat-value">3</div>
                <div className="landing-hero-stat-label">Points for Exact</div>
              </div>
              <div className="landing-hero-stat">
                <div className="landing-hero-stat-value">20</div>
                <div className="landing-hero-stat-label">Max Table Points</div>
              </div>
              <div className="landing-hero-stat">
                <div className="landing-hero-stat-value">∞</div>
                <div className="landing-hero-stat-label">Competition</div>
              </div>
            </div>
            <div className="landing-hero-actions">
              <Link to="/auth?tab=signup">
                <Button className="btn btn-primary landing-hero-cta">
                  <span>Get Started Free</span>
                  <span className="material-symbols-outlined">arrow_forward</span>
                </Button>
              </Link>
              <Link to="/auth?tab=signin">
                <Button className="btn btn-secondary">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
          <div className="landing-hero-visual">
            <div className="landing-hero-card">
              <div className="landing-hero-card-header">
                <div className="landing-hero-card-dots">
                  <span></span><span></span><span></span>
                </div>
                <span className="landing-hero-card-title">Matchday 12</span>
              </div>
              <div className="landing-hero-card-content">
                <div className="landing-hero-match">
                  <div className="landing-hero-team">
                    <div className="landing-hero-team-logo"></div>
                    <span>Arsenal</span>
                  </div>
                  <div className="landing-hero-score">2 - 1</div>
                  <div className="landing-hero-team">
                    <div className="landing-hero-team-logo"></div>
                    <span>Chelsea</span>
                  </div>
                </div>
                <div className="landing-hero-prediction-bar">
                  <div className="landing-hero-bar-segment" style={{ width: '45%', background: 'var(--primary-green)' }}></div>
                  <div className="landing-hero-bar-segment" style={{ width: '30%', background: 'var(--accent-gold)' }}></div>
                  <div className="landing-hero-bar-segment" style={{ width: '25%', background: 'var(--text-muted)' }}></div>
                </div>
                <div className="landing-hero-match-stats">
                  <span>45% Home</span>
                  <span>30% Draw</span>
                  <span>25% Away</span>
                </div>
              </div>
            </div>
            <div className="landing-hero-floating-elements">
              <div className="landing-hero-floating-card floating-1">
                <span className="material-symbols-outlined">emoji_events</span>
                <span>Top Player</span>
              </div>
              <div className="landing-hero-floating-card floating-2">
                <span className="material-symbols-outlined">trending_up</span>
                <span>+127 pts</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* About Section */}
      <section id="about" className="landing-about">
        <div className="landing-about-content">
          <div className="landing-about-header">
            <h2 className="landing-about-title">Why Football Fans Love Scora</h2>
            <p className="landing-about-subtitle">
              The most engaging way to test your Premier League knowledge
            </p>
          </div>
          <div className="landing-about-grid">
            <div className="landing-about-card">
              <div className="landing-about-card-icon">
                <span className="material-symbols-outlined">groups</span>
              </div>
              <h3 className="landing-about-card-title">Compete with Friends</h3>
              <p className="landing-about-card-text">
                Create private leagues and challenge your friends. See who has the best football knowledge and climb the leaderboard together.
              </p>
            </div>
            <div className="landing-about-card">
              <div className="landing-about-card-icon">
                <span className="material-symbols-outlined">target</span>
              </div>
              <h3 className="landing-about-card-title">Test Your Skills</h3>
              <p className="landing-about-card-text">
                Make predictions on every match and the final table. Track your accuracy and see how you compare to other football experts.
              </p>
            </div>
            <div className="landing-about-card">
              <div className="landing-about-card-icon">
                <span className="material-symbols-outlined">bar_chart</span>
              </div>
              <h3 className="landing-about-card-title">Real-Time Updates</h3>
              <p className="landing-about-card-text">
                Watch your points update in real-time as matches finish. See your ranking change and celebrate your exact predictions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="landing-features">
        <div className="landing-features-background">
          <div className="landing-features-gradient"></div>
        </div>
        <div className="landing-features-content">
          <div className="landing-features-header">
            <h2 className="landing-features-title">Two Ways to Predict</h2>
            <p className="landing-features-subtitle">
              Master both prediction types to dominate the leaderboard
            </p>
          </div>
          <div className="landing-predictions-split">
            <div className="landing-prediction-card landing-prediction-left">
              <div className="landing-prediction-bg-pattern"></div>
              <div className="landing-prediction-content">
                <div className="landing-prediction-icon-wrapper">
                  <div className="landing-prediction-icon-circle">
                    <span className="material-symbols-outlined">sports_soccer</span>
                  </div>
                  <div className="landing-prediction-icon-ring"></div>
                </div>
                <h3 className="landing-prediction-title">
                  Predict<br />Game Scores
                </h3>
                <div className="landing-prediction-highlight">
                  <span className="landing-prediction-number">3</span>
                  <span className="landing-prediction-label">Points for Exact</span>
                </div>
                <div className="landing-prediction-highlight">
                  <span className="landing-prediction-number">1</span>
                  <span className="landing-prediction-label">Point for Result</span>
                </div>
              </div>
            </div>
            
            <div className="landing-prediction-card landing-prediction-right">
              <div className="landing-prediction-bg-pattern"></div>
              <div className="landing-prediction-content">
                <div className="landing-prediction-icon-wrapper">
                  <div className="landing-prediction-icon-circle">
                    <span className="material-symbols-outlined">table_chart</span>
                  </div>
                  <div className="landing-prediction-icon-ring"></div>
                </div>
                <h3 className="landing-prediction-title">
                  Predict<br />the Final Table
                </h3>
                <div className="landing-prediction-highlight">
                  <span className="landing-prediction-number">20</span>
                  <span className="landing-prediction-label">Points Max</span>
                </div>
                <div className="landing-prediction-highlight">
                  <span className="landing-prediction-number">-1</span>
                  <span className="landing-prediction-label">Per Position Off</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Scoring Section */}
      <section id="scoring" className="landing-scoring">
        <div className="landing-scoring-background">
          <div className="landing-scoring-gradient"></div>
          <div className="landing-scoring-pattern"></div>
        </div>
        <div className="landing-scoring-content">
          <div className="landing-scoring-header">
            <h2 className="landing-scoring-title">How Scoring Works</h2>
            <p className="landing-scoring-subtitle">
              Master the scoring system and maximize your points
            </p>
          </div>
          
          <div className="landing-scoring-grid">
            <div className="landing-scoring-card">
              <div className="landing-scoring-card-icon">
                <span className="material-symbols-outlined">sports_soccer</span>
              </div>
              <div className="landing-scoring-card-header">
                <h3>Fixture Predictions</h3>
              </div>
              <p className="landing-scoring-description">
                Predict the outcome of individual matches and earn points based on accuracy.
              </p>
              <div className="landing-scoring-points">
                <div className="landing-scoring-point">
                  <div className="point-value-wrapper">
                    <span className="point-value">3</span>
                    <span className="point-label">Exact Match</span>
                  </div>
                  <span className="point-desc">Correct score</span>
                </div>
                <div className="landing-scoring-point">
                  <div className="point-value-wrapper">
                    <span className="point-value">1</span>
                    <span className="point-label">Result Match</span>
                  </div>
                  <span className="point-desc">Correct outcome</span>
                </div>
                <div className="landing-scoring-point">
                  <div className="point-value-wrapper">
                    <span className="point-value">0</span>
                    <span className="point-label">No Match</span>
                  </div>
                  <span className="point-desc">Wrong outcome</span>
                </div>
              </div>
            </div>

            <div className="landing-scoring-card">
              <div className="landing-scoring-card-icon">
                <span className="material-symbols-outlined">table_chart</span>
              </div>
              <div className="landing-scoring-card-header">
                <h3>Table Predictions</h3>
              </div>
              <p className="landing-scoring-description">
                You get 20 points for each team, minus 1 point for each position off.
              </p>
              <div className="landing-scoring-points">
                <div className="landing-scoring-point">
                  <div className="point-value-wrapper">
                    <span className="point-value">20</span>
                    <span className="point-label">Exact Position</span>
                  </div>
                  <span className="point-desc">Perfect prediction</span>
                </div>
                <div className="landing-scoring-point">
                  <div className="point-value-wrapper">
                    <span className="point-value">17</span>
                    <span className="point-label">3 Positions Off</span>
                  </div>
                  <span className="point-desc">20 - 3 = 17 points</span>
                </div>
                <div className="landing-scoring-point">
                  <div className="point-value-wrapper">
                    <span className="point-value">0</span>
                    <span className="point-label">20+ Positions Off</span>
                  </div>
                  <span className="point-desc">Minimum 0 points</span>
                </div>
              </div>
            </div>

            <div className="landing-scoring-card">
              <div className="landing-scoring-card-icon">
                <span className="material-symbols-outlined">calculate</span>
              </div>
              <div className="landing-scoring-card-header">
                <h3>Total Score</h3>
              </div>
              <p className="landing-scoring-description">
                Your total score combines both fixture and table prediction points.
              </p>
              <div className="landing-scoring-formula">
                <div className="formula-line">
                  <span className="material-symbols-outlined formula-icon">sports_soccer</span>
                  <span>Fixture Points = (Exact × 3) + (Result × 1)</span>
                </div>
                <div className="formula-line">
                  <span className="material-symbols-outlined formula-icon">table_chart</span>
                  <span>Table Points = (20 × 20 teams) - Total Position Differences</span>
                </div>
                <div className="formula-total">
                  <span className="material-symbols-outlined formula-icon">emoji_events</span>
                  <span>Total Score = Fixture + Table Points</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-footer-background">
          <div className="landing-footer-gradient"></div>
        </div>
        <div className="landing-footer-content">
          <div className="landing-footer-section">
            <div className="landing-footer-logo">
              <img src={ScoraLogo} alt="Scora" className="footer-logo-image" />
              <h4 className="landing-footer-title">Scora</h4>
            </div>
            <p className="landing-footer-text">
              The ultimate platform for football fans to test their knowledge, make predictions, and compete with friends.
            </p>
          </div>
          <div className="landing-footer-section">
            <h4 className="landing-footer-title">Quick Links</h4>
            <div className="landing-footer-links">
              <a href="#about" className="landing-footer-link">
                <span className="material-symbols-outlined">info</span>
                <span>About</span>
              </a>
              <a href="#features" className="landing-footer-link">
                <span className="material-symbols-outlined">star</span>
                <span>Features</span>
              </a>
              <a href="#scoring" className="landing-footer-link">
                <span className="material-symbols-outlined">calculate</span>
                <span>How It Works</span>
              </a>
              <Link to="/auth?tab=signin" className="landing-footer-link">
                <span className="material-symbols-outlined">login</span>
                <span>Sign In</span>
              </Link>
              <Link to="/auth?tab=signup" className="landing-footer-link">
                <span className="material-symbols-outlined">person_add</span>
                <span>Sign Up</span>
              </Link>
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
