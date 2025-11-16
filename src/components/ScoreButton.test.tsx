import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ScoreButton from './ScoreButton';

describe('ScoreButton Component', () => {
  test('renders with provided label', () => {
    render(
      <ScoreButton 
        label="Test Button" 
        value={5} 
        onClick={() => {}} 
      />
    );
    
    const button = screen.getByRole('button', { name: /Test Button/i });
    expect(button).toBeInTheDocument();
  });
  
  test('calls onClick handler with correct value when clicked', () => {
    const mockOnClick = vi.fn();
    const testValue = 10;
    
    render(
      <ScoreButton 
        label="Score 10" 
        value={testValue} 
        onClick={mockOnClick} 
      />
    );
    
    const button = screen.getByRole('button', { name: /Score 10/i });
    fireEvent.click(button);
    
    expect(mockOnClick).toHaveBeenCalledTimes(1);
    expect(mockOnClick).toHaveBeenCalledWith(testValue);
  });
  
  test('applies any custom className that is provided', () => {
    const customClass = 'custom-score-button';
    
    render(
      <ScoreButton 
        label="Green Button" 
        value={5} 
        onClick={() => {}} 
        className={customClass}
      />
    );
    
    const button = screen.getByRole('button', { name: /Green Button/i });
    expect(button).toHaveClass(customClass);
  });
  
  test('sets type button to avoid unintended form submissions', () => {
    render(
      <ScoreButton 
        label="Form Safe" 
        value={1} 
        onClick={() => {}} 
      />
    );
    const button = screen.getByRole('button', { name: /Form Safe/i });
    expect(button).toHaveAttribute('type', 'button');
  });
});
