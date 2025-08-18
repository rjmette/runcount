import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import PlayerScoreCard from './PlayerScoreCard';
import { Player } from '../types/game';

// No longer need helper function - use semantic queries instead

// Mock the ScoreButton component to simplify testing
vi.mock('./ScoreButton', () => ({
  default: function MockScoreButton(props: any) {
    // Handle both string and non-string labels safely
    let labelStr: string;
    if (typeof props.label === 'string') {
      labelStr = props.label;
    } else if (React.isValidElement(props.label)) {
      // For complex React elements like the Rack button, extract text content
      labelStr = 'rack'; // Default to 'rack' for the complex button
    } else {
      labelStr = String(props.label);
    }
    const testId = `score-button-${labelStr.toLowerCase().replace(/\s+/g, '-')}`;
    
    return (
      <button 
        onClick={() => props.onClick(props.value)}
        data-testid={testId}
      >
        {props.label}
      </button>
    );
  },
}));

describe('PlayerScoreCard Component', () => {
  // Sample player data for testing
  const mockPlayer: Player = {
    id: 1,
    name: 'Test Player',
    score: 25,
    innings: 5,
    highRun: 8,
    fouls: 2,
    consecutiveFouls: 0,
    safeties: 1,
    missedShots: 3,
    targetScore: 75
  };
  
  const mockHandlers = {
    onAddScore: vi.fn(),
    onAddFoul: vi.fn(),
    onAddSafety: vi.fn(),
    onAddMiss: vi.fn(),
    onShowHistory: vi.fn(),
    onRegularShot: vi.fn()
  };
  
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  test('renders player information correctly', () => {
    render(
      <PlayerScoreCard 
        player={mockPlayer}
        isActive={false}
        onAddScore={mockHandlers.onAddScore}
        onAddFoul={mockHandlers.onAddFoul}
        onAddSafety={mockHandlers.onAddSafety}
        onAddMiss={mockHandlers.onAddMiss}
        targetScore={75}
      />
    );
    
    // Check player name is displayed
    expect(screen.getByText('Test Player')).toBeInTheDocument();
    
    // Check score is displayed
    expect(screen.getByText('25')).toBeInTheDocument();
    
    // Check other stats are displayed
    expect(screen.getByText('5')).toBeInTheDocument(); // Innings
    expect(screen.getByText('8')).toBeInTheDocument(); // High Run
    expect(screen.getByText('5.00')).toBeInTheDocument(); // BPI (25/5 = 5.00)
    
    // Check counters are shown
    expect(screen.getByText('2')).toBeInTheDocument(); // Fouls
    expect(screen.getByText('1')).toBeInTheDocument(); // Safeties
    expect(screen.getByText('3')).toBeInTheDocument(); // Misses
    
    // Check progress percentage (25/75 = 33%) using semantic queries
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '33');
    expect(progressBar).toHaveAttribute('aria-label', 'Score progress: 25 of 75 points (33%)');
  });
  
  test('displays trophy icon when player reaches target score', () => {
    const winningPlayer = {
      ...mockPlayer,
      score: 75, // Equal to target score
      consecutiveFouls: 0
    };
    
    render(
      <PlayerScoreCard 
        player={winningPlayer}
        isActive={false}
        onAddScore={mockHandlers.onAddScore}
        onAddFoul={mockHandlers.onAddFoul}
        onAddSafety={mockHandlers.onAddSafety}
        onAddMiss={mockHandlers.onAddMiss}
        targetScore={75}
      />
    );
    
    // Look for trophy emoji
    expect(screen.getByText('🏆')).toBeInTheDocument();
    
    // Check progress bar is at 100% using semantic queries
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '100');
    expect(progressBar).toHaveAttribute('aria-label', 'Score progress: 75 of 75 points (100%)');
  });
  
  test('shows active styling when isActive is true', () => {
    render(
      <PlayerScoreCard 
        player={mockPlayer}
        isActive={true}
        onAddScore={mockHandlers.onAddScore}
        onAddFoul={mockHandlers.onAddFoul}
        onAddSafety={mockHandlers.onAddSafety}
        onAddMiss={mockHandlers.onAddMiss}
        targetScore={75}
      />
    );
    
    // Check for active indicator
    expect(screen.getByText('Active')).toBeInTheDocument();
    
    // Score buttons should be visible when active (using the mock test IDs)
    expect(screen.getByTestId('score-button-miss')).toBeInTheDocument();
    expect(screen.getByTestId('score-button-foul')).toBeInTheDocument();
    expect(screen.getByTestId('score-button-safety')).toBeInTheDocument();
    expect(screen.getByTestId('score-button-rack')).toBeInTheDocument();
  });
  
  test('does not show score buttons when not active', () => {
    render(
      <PlayerScoreCard 
        player={mockPlayer}
        isActive={false}
        onAddScore={mockHandlers.onAddScore}
        onAddFoul={mockHandlers.onAddFoul}
        onAddSafety={mockHandlers.onAddSafety}
        onAddMiss={mockHandlers.onAddMiss}
        targetScore={75}
      />
    );
    
    // No active indicator
    expect(screen.queryByText('Active')).not.toBeInTheDocument();
    
    // Score buttons should not be visible when inactive
    expect(screen.queryByTestId('score-button-miss')).not.toBeInTheDocument();
    expect(screen.queryByTestId('score-button-foul-(-1)')).not.toBeInTheDocument();
    // etc.
  });
  
  test('calls the appropriate functions when buttons are clicked', () => {
    render(
      <PlayerScoreCard 
        player={mockPlayer}
        isActive={true}
        onAddScore={mockHandlers.onAddScore}
        onAddFoul={mockHandlers.onAddFoul}
        onAddSafety={mockHandlers.onAddSafety}
        onAddMiss={mockHandlers.onAddMiss}
        onShowHistory={mockHandlers.onShowHistory}
        targetScore={75}
      />
    );
    
    // Click on Miss button - the component calls onAddMiss() without parameters
    fireEvent.click(screen.getByTestId('score-button-miss'));
    expect(mockHandlers.onAddMiss).toHaveBeenCalledTimes(1);
    
    // Click on Foul button - the component calls onAddFoul() without parameters  
    fireEvent.click(screen.getByTestId('score-button-foul'));
    expect(mockHandlers.onAddFoul).toHaveBeenCalledTimes(1);
    
    // Click on Safety button - the component calls onAddSafety() without parameters
    fireEvent.click(screen.getByTestId('score-button-safety'));
    expect(mockHandlers.onAddSafety).toHaveBeenCalledTimes(1);
    
    // Click on Rack button - the component calls onAddScore(1)
    fireEvent.click(screen.getByTestId('score-button-rack'));
    expect(mockHandlers.onAddScore).toHaveBeenCalledWith(1);
  });
  
  test('handles zero innings case correctly for BPI calculation', () => {
    const newPlayer = {
      ...mockPlayer,
      innings: 0,
      consecutiveFouls: 0
    };
    
    render(
      <PlayerScoreCard 
        player={newPlayer}
        isActive={false}
        onAddScore={mockHandlers.onAddScore}
        onAddFoul={mockHandlers.onAddFoul}
        onAddSafety={mockHandlers.onAddSafety}
        onAddMiss={mockHandlers.onAddMiss}
        targetScore={75}
      />
    );
    
    // Check for BPI (should be 0.00 when innings is 0)
    expect(screen.getByText('0.00')).toBeInTheDocument();
  });
});