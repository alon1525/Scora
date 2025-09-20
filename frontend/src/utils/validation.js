// Input sanitization and validation utilities

// Profanity filter - basic list of common profanity
const PROFANITY_WORDS = [
  'fuck', 'shit', 'damn', 'bitch', 'ass', 'hell', 'crap', 'piss', 'dick', 'cock',
  'pussy', 'fag', 'nigger', 'nigga', 'retard', 'stupid', 'idiot', 'moron',
  'bastard', 'whore', 'slut', 'cunt', 'fucking', 'shitty', 'damned'
];

// Sanitize username - no spaces, no special chars, no profanity
export const sanitizeUsername = (input) => {
  if (!input) return '';
  
  // Remove all special characters except letters and numbers
  let sanitized = input.replace(/[^a-zA-Z0-9]/g, '');
  
  // Check for profanity
  const lowerInput = sanitized.toLowerCase();
  const hasProfanity = PROFANITY_WORDS.some(word => lowerInput.includes(word));
  
  return {
    sanitized,
    hasProfanity,
    isValid: sanitized.length >= 4 && sanitized.length <= 12 && !hasProfanity
  };
};

// Sanitize league name - allow spaces but no special chars, no profanity
export const sanitizeLeagueName = (input) => {
  if (!input) return '';
  
  // Remove special characters except letters, numbers, and spaces
  let sanitized = input.replace(/[^a-zA-Z0-9\s]/g, '');
  
  // Trim extra spaces
  sanitized = sanitized.replace(/\s+/g, ' ').trim();
  
  // Check for profanity
  const lowerInput = sanitized.toLowerCase();
  const hasProfanity = PROFANITY_WORDS.some(word => lowerInput.includes(word));
  
  return {
    sanitized,
    hasProfanity,
    isValid: sanitized.length >= 1 && sanitized.length <= 12 && !hasProfanity
  };
};

// Validate email format
export const validateEmail = (email) => {
  if (!email) return { isValid: false, message: 'Email is required' };
  
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const isValid = emailRegex.test(email);
  
  return {
    isValid,
    message: isValid ? 'Valid email' : 'Please enter a valid email address'
  };
};

// Rate limiting utility
class RateLimiter {
  constructor() {
    this.requests = new Map();
  }
  
  isAllowed(key, maxRequests = 5, windowMs = 60000) {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    if (!this.requests.has(key)) {
      this.requests.set(key, []);
    }
    
    const userRequests = this.requests.get(key);
    
    // Remove old requests outside the window
    const recentRequests = userRequests.filter(time => time > windowStart);
    this.requests.set(key, recentRequests);
    
    if (recentRequests.length >= maxRequests) {
      return false;
    }
    
    // Add current request
    recentRequests.push(now);
    this.requests.set(key, recentRequests);
    
    return true;
  }
  
  getRemainingTime(key, maxRequests = 5, windowMs = 60000) {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    if (!this.requests.has(key)) {
      return 0;
    }
    
    const userRequests = this.requests.get(key);
    const recentRequests = userRequests.filter(time => time > windowStart);
    
    if (recentRequests.length < maxRequests) {
      return 0;
    }
    
    const oldestRequest = Math.min(...recentRequests);
    return Math.ceil((oldestRequest + windowMs - now) / 1000);
  }
}

export const rateLimiter = new RateLimiter();

// Form submission rate limiting
export const checkFormSubmissionLimit = (formType, userId) => {
  const key = `${formType}-${userId}`;
  const maxSubmissions = 3; // Max 3 submissions per minute
  const windowMs = 60000; // 1 minute
  
  return rateLimiter.isAllowed(key, maxSubmissions, windowMs);
};

// API call rate limiting
export const checkApiRateLimit = (endpoint, userId) => {
  const key = `${endpoint}-${userId}`;
  const maxRequests = 20; // Max 20 requests per minute
  const windowMs = 60000; // 1 minute
  
  return rateLimiter.isAllowed(key, maxRequests, windowMs);
};
