import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';
import { sanitizeUsername, validateEmail, checkFormSubmissionLimit } from '../utils/validation';

const Auth = () => {
  const { user, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('signin');

  const handleTabChange = (value) => {
    setActiveTab(value);
    // Clear forms when switching tabs
    setSignInData({ email: '', password: '' });
    setSignUpData({ email: '', password: '', confirmPassword: '', username: '' });
  };

  // Set active tab based on URL parameter
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'signup' || tab === 'signin') {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const [signInData, setSignInData] = useState({
    email: '',
    password: '',
  });

  const [signUpData, setSignUpData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
  });

  const [validationErrors, setValidationErrors] = useState({
    username: '',
    email: '',
    password: ''
  });

  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await signIn(signInData.email, signInData.password);
      
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Invalid email or password. Please check your credentials.');
        } else if (error.message.includes('Email not confirmed')) {
          toast.error('Please check your email and click the confirmation link.');
        } else {
          toast.error(error.message || 'Sign in failed');
        }
      } else {
        toast.success('Welcome back!');
        navigate('/dashboard');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Validation functions
  const validateUsername = (username) => {
    const result = sanitizeUsername(username);
    if (!result.isValid) {
      if (result.hasProfanity) {
        return 'Username contains inappropriate content';
      }
      if (result.sanitized.length < 4) {
        return 'Username must be at least 4 characters';
      }
      if (result.sanitized.length > 12) {
        return 'Username must be 12 characters or less';
      }
      return 'Username can only contain letters and numbers';
    }
    return '';
  };

  const validateEmailInput = (email) => {
    const result = validateEmail(email);
    return result.isValid ? '' : result.message;
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    
    // Check rate limiting
    if (!checkFormSubmissionLimit('signup', 'anonymous')) {
      toast.error('Too many signup attempts. Please wait a moment.');
      return;
    }
    
    // Validate inputs
    const usernameError = validateUsername(signUpData.username);
    const emailError = validateEmailInput(signUpData.email);
    
    if (usernameError || emailError) {
      setValidationErrors({
        username: usernameError,
        email: emailError,
        password: ''
      });
      return;
    }
    
    if (signUpData.password !== signUpData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (signUpData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      console.log('Starting signup process...');
      const { data, error } = await signUp(
        signUpData.email, 
        signUpData.password, 
        signUpData.username
      );
      
      console.log('Signup response:', { data, error });
      
      if (error) {
        console.error('Signup error details:', {
          message: error.message,
          status: error.status,
          statusText: error.statusText,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        
        if (error.message.includes('User already registered')) {
          toast.error('An account with this email already exists. Please sign in instead.');
        } else if (error.message.includes('Invalid email')) {
          toast.error('Please enter a valid email address.');
        } else {
          toast.error(`Sign up failed: ${error.message || 'Unknown error'}`);
        }
      } else {
        console.log('Signup successful!');
        toast.success('Account created! Please check your email for verification.');
      }
    } catch (error) {
      console.error('Unexpected signup error:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title">Scora</h1>
          <p className="auth-subtitle">
            Join the ultimate prediction game
          </p>
        </div>
        <div className="auth-content">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="auth-tabs">
            <TabsList className="auth-tabs-list">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="auth-form">
                <div className="auth-form-group">
                  <Input
                    id="signin-email"
                    type="email"
                    required
                    value={signInData.email}
                    onChange={(e) => setSignInData({ ...signInData, email: e.target.value })}
                    placeholder=" "
                    className="auth-input"
                  />
                  <Label htmlFor="signin-email" className="auth-label">Email</Label>
                </div>
                <div className="auth-form-group">
                  <Input
                    id="signin-password"
                    type="password"
                    required
                    value={signInData.password}
                    onChange={(e) => setSignInData({ ...signInData, password: e.target.value })}
                    placeholder=" "
                    className="auth-input"
                  />
                  <Label htmlFor="signin-password" className="auth-label">Password</Label>
                </div>
                <Button type="submit" className="auth-button" disabled={loading}>
                  {loading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="auth-form">
                <div className="auth-form-group">
                  <Input
                    id="signup-username"
                    type="text"
                    value={signUpData.username}
                    onChange={(e) => {
                      const newUsername = e.target.value;
                      setSignUpData({ ...signUpData, username: newUsername });
                      setValidationErrors({
                        ...validationErrors,
                        username: validateUsername(newUsername)
                      });
                    }}
                    placeholder=" "
                    className={`auth-input ${validationErrors.username ? 'error' : ''}`}
                    maxLength={12}
                    minLength={4}
                  />
                  <Label htmlFor="signup-username" className="auth-label">
                    Username {signUpData.username && (
                      <span className={`username-length ${validationErrors.username ? 'invalid' : 'valid'}`}>
                        ({signUpData.username.length}/12)
                      </span>
                    )}
                  </Label>
                  {validationErrors.username && (
                    <div className="validation-error">{validationErrors.username}</div>
                  )}
                  <div className="validation-hint">
                    Username can only contain letters and numbers
                  </div>
                </div>
                <div className="auth-form-group">
                  <Input
                    id="signup-email"
                    type="email"
                    required
                    value={signUpData.email}
                    onChange={(e) => {
                      const newEmail = e.target.value;
                      setSignUpData({ ...signUpData, email: newEmail });
                      setValidationErrors({
                        ...validationErrors,
                        email: validateEmailInput(newEmail)
                      });
                    }}
                    placeholder=" "
                    className={`auth-input ${validationErrors.email ? 'error' : ''}`}
                  />
                  <Label htmlFor="signup-email" className="auth-label">Email</Label>
                  {validationErrors.email && (
                    <div className="validation-error">{validationErrors.email}</div>
                  )}
                </div>
                <div className="auth-form-group">
                  <Input
                    id="signup-password"
                    type="password"
                    required
                    value={signUpData.password}
                    onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
                    placeholder=" "
                    className="auth-input"
                  />
                  <Label htmlFor="signup-password" className="auth-label">Password</Label>
                </div>
                <div className="auth-form-group">
                  <Input
                    id="signup-confirm"
                    type="password"
                    required
                    value={signUpData.confirmPassword}
                    onChange={(e) => setSignUpData({ ...signUpData, confirmPassword: e.target.value })}
                    placeholder=" "
                    className="auth-input"
                  />
                  <Label htmlFor="signup-confirm" className="auth-label">Confirm Password</Label>
                </div>
                <Button type="submit" className="auth-button" disabled={loading}>
                  {loading ? 'Creating account...' : 'Sign Up'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Auth;
