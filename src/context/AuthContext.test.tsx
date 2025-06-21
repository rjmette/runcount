import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import { SupabaseClient } from '@supabase/supabase-js';

// Mock Supabase client
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(),
}));

// Create a test component that uses the auth context
const TestComponent = () => {
  const { user, loading, signOut } = useAuth();
  
  return (
    <div>
      <div data-testid="loading-state">{loading ? 'Loading' : 'Not Loading'}</div>
      <div data-testid="user-state">{user ? 'User is logged in' : 'User is not logged in'}</div>
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
};

describe('AuthContext', () => {
  // Create mock implementation of Supabase client
  const mockSignOut = vi.fn(() => Promise.resolve({ error: null }));
  const mockGetSession = vi.fn();
  const mockRefreshSession = vi.fn();
  const mockOnAuthStateChange = vi.fn();
  
  const mockSupabase = {
    auth: {
      getSession: mockGetSession,
      refreshSession: mockRefreshSession,
      signOut: mockSignOut,
      onAuthStateChange: mockOnAuthStateChange,
    },
  } as unknown as SupabaseClient;
  
  const mockUnsubscribe = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mocked responses
    mockGetSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });
    
    mockOnAuthStateChange.mockReturnValue({
      data: {
        subscription: {
          unsubscribe: mockUnsubscribe,
        },
      },
    });
  });
  
  test('provides loading state and handles initial session loading', async () => {
    // Setup mock to delay resolution to test loading state
    mockGetSession.mockImplementation(
      () => new Promise(resolve => 
        setTimeout(() => resolve({ data: { session: null }, error: null }), 100)
      )
    );
    
    render(
      <AuthProvider supabase={mockSupabase}>
        <TestComponent />
      </AuthProvider>
    );
    
    // Initially should be in loading state
    expect(screen.getByTestId('loading-state')).toHaveTextContent('Loading');
    
    // After session resolves, loading should be false
    await waitFor(() => {
      expect(screen.getByTestId('loading-state')).toHaveTextContent('Not Loading');
    });
    
    // Should have called getSession
    expect(mockGetSession).toHaveBeenCalledTimes(1);
  });
  
  test('provides user when session exists', async () => {
    // Setup mock to return a user session
    const mockUser = { id: '123', email: 'test@example.com' };
    mockGetSession.mockResolvedValue({
      data: { 
        session: { 
          user: mockUser 
        } 
      },
      error: null,
    });
    
    render(
      <AuthProvider supabase={mockSupabase}>
        <TestComponent />
      </AuthProvider>
    );
    
    // Wait for session to be loaded and user to be set
    await waitFor(() => {
      expect(screen.getByTestId('user-state')).toHaveTextContent('User is logged in');
    });
  });
  
  test('handles sign out', async () => {
    // Setup mock with user logged in
    mockGetSession.mockResolvedValue({
      data: { 
        session: { 
          user: { id: '123', email: 'test@example.com' } 
        } 
      },
      error: null,
    });
    
    render(
      <AuthProvider supabase={mockSupabase}>
        <TestComponent />
      </AuthProvider>
    );
    
    // Wait for session to load
    await waitFor(() => {
      expect(screen.getByTestId('user-state')).toHaveTextContent('User is logged in');
    });
    
    // Click sign out button
    const signOutButton = screen.getByText('Sign Out');
    await act(async () => {
      signOutButton.click();
    });
    
    // Should have called signOut
    expect(mockSignOut).toHaveBeenCalledTimes(1);
  });
  
  test('sets up and cleans up auth listener', async () => {
    const { unmount } = render(
      <AuthProvider supabase={mockSupabase}>
        <TestComponent />
      </AuthProvider>
    );
    
    // Should have set up listener
    expect(mockOnAuthStateChange).toHaveBeenCalledTimes(1);
    
    // Unmount component
    await act(async () => {
      unmount();
    });
    
    // Should have unsubscribed
    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
  });
});