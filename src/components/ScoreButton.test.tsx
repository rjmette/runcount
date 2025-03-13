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
    const mockOnClick = jest.fn();
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
  
  test('applies custom className when provided', () => {
    const customClass = 'bg-green-500';
    
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
  
  test('includes default classes even when custom class is provided', () => {
    const customClass = 'bg-red-500';
    
    render(
      <ScoreButton 
        label="Red Button" 
        value={5} 
        onClick={() => {}} 
        className={customClass}
      />
    );
    
    const button = screen.getByRole('button', { name: /Red Button/i });
    
    // Check that it has both custom class and some of the default classes
    expect(button).toHaveClass(customClass);
    expect(button).toHaveClass('rounded-md');
    expect(button).toHaveClass('text-white');
  });
});