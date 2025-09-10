import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';

const Landing = () => {
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
            <Link to="/auth?tab=signin" className="landing-nav-link">Sign In</Link>
            <Link to="/auth?tab=signup" className="landing-nav-link">Sign Up</Link>
          </nav>
        </div>
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
