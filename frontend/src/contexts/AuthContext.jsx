import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../integrations/supabase/client';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';

const AuthContext = createContext(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email, password, username) => {
    console.log('Starting signup with:', { email, username });
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: username ? { username } : undefined,
      }
    });

    console.log('Supabase auth signup response:', { data, error });

    // If signup was successful, create the user profile via backend
    if (!error && data.user) {
      console.log('Signup successful, creating user profile via backend...');
      try {
        const response = await axios.post(API_ENDPOINTS.CREATE_PROFILE, {
          user_id: data.user.id,
          email: email,
          display_name: username || email
        }, {
          headers: {
            'Content-Type': 'application/json',
          }
        });

        const result = response.data;
        
        if (result.success) {
          console.log('User profile created successfully via backend');
        } else {
          console.error('Error creating user profile via backend:', result.error);
        }
      } catch (profileError) {
        console.error('Error creating user profile via backend:', profileError);
      }
    }

    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
