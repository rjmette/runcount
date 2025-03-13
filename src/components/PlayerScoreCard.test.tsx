import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import PlayerScoreCard from './PlayerScoreCard';
import { Player } from '../types/game';

// We need to explicitly add a "getByClassName" method to make our tests work
import { getByText, getByRole } from '@testing-library/dom';
import { within } from '@testing-library/react';

// Mock the Screen object to add getByClassName method
const originalScreen = { ...screen };
screen.getByClassName = (className: string) => {
  const elements = document.getElementsByClassName(className);
  if (!elements || elements.length === 0) {
    throw new Error(`No elements found with class: ${className}`);
  }
  return elements[0] as HTMLElement;
};

// Mock the ScoreButton component to simplify testing
jest.mock('./ScoreButton', () => {
  return function MockScoreButton(props: any) {
    return (
      <button 
        onClick={() => props.onClick(props.value)}
        data-testid={`score-button-${props.label.toLowerCase().replace(/\s+/g, '-')}`}
      >
        {props.label}
      </button>
    );
  };
});

describe('PlayerScoreCard Component', () => {
  // Sample player data for testing
  const mockPlayer: Player = {
    id: 1,
    name: 'Test Player',
    score: 25,
    innings: 5,
    highRun: 8,
    fouls: 2,
    safeties: 1,
    missedShots: 3,
    targetScore: 75
  };
  
  const mockHandlers = {
    onAddScore: jest.fn(),
    onAddFoul: jest.fn(),
    onAddSafety: jest.fn(),
    onAddMiss: jest.fn(),
    onShowHistory: jest.fn(),
    onRegularShot: jest.fn()
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
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
    
    // Check progress percentage (25/75 = 33%)
    const progressBar = screen.getByClassName('bg-blue-600');
    expect(progressBar).toHaveStyle('width: 33%');
  });
  
  test('displays trophy icon when player reaches target score', () => {
    const winningPlayer = {
      ...mockPlayer,
      score: 75 // Equal to target score
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
    
    // Check progress bar is at 100%
    const progressBar = screen.getByClassName('bg-green-600');
    expect(progressBar).toHaveStyle('width: 100%');
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
    
    // Score buttons should be visible when active
    expect(screen.getByTestId('score-button-miss')).toBeInTheDocument();
    expect(screen.getByTestId('score-button-foul-(-1)')).toBeInTheDocument();
    expect(screen.getByTestId('score-button-safety')).toBeInTheDocument();
    expect(screen.getByTestId('score-button-new-rack')).toBeInTheDocument();
    expect(screen.getByTestId('score-button-history')).toBeInTheDocument();
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
    
    // Click on Miss button
    fireEvent.click(screen.getByTestId('score-button-miss'));
    expect(mockHandlers.onAddMiss).toHaveBeenCalledTimes(1);
    
    // Click on Foul button
    fireEvent.click(screen.getByTestId('score-button-foul-(-1)'));
    expect(mockHandlers.onAddFoul).toHaveBeenCalledTimes(1);
    
    // Click on Safety button
    fireEvent.click(screen.getByTestId('score-button-safety'));
    expect(mockHandlers.onAddSafety).toHaveBeenCalledTimes(1);
    
    // Click on New Rack button
    fireEvent.click(screen.getByTestId('score-button-new-rack'));
    expect(mockHandlers.onAddScore).toHaveBeenCalledWith(1);
    
    // Click on History button
    fireEvent.click(screen.getByTestId('score-button-history'));
    expect(mockHandlers.onShowHistory).toHaveBeenCalledTimes(1);
  });
  
  test('handles zero innings case correctly for BPI calculation', () => {
    const newPlayer = {
      ...mockPlayer,
      innings: 0
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