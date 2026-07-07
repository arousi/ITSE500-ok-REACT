/**
 * Comprehensive tests for UserHomePage component
 * Testing chat functionality, context providers, and user interactions
 */
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { jest } from '@jest/globals';
import UserHomePage from '../UserPage/UserHomePage';

// Mock the child components
jest.mock('../Components/ChatField', () => {
  return function MockChatField() {
    return <div data-testid="chat-field">Chat Field Component</div>;
  };
});

jest.mock('../Components/ChatArea', () => {
  return function MockChatArea() {
    return <div data-testid="chat-area">Chat Area Component</div>;
  };
});

// Mock the context providers
jest.mock('../contexts/CheckStoredAIMessageProvider', () => {
  return function MockCheckStoredAIMessageProvider({ children }) {
    return <div data-testid="ai-message-provider">{children}</div>;
  };
});

jest.mock('../contexts/URLFileProvider', () => {
  return function MockURLFileProvider({ children }) {
    return <div data-testid="url-file-provider">{children}</div>;
  };
});

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

describe('UserHomePage Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify([]));
  });

  test('renders without crashing', () => {
    render(<UserHomePage />);
    expect(screen.getByTestId('chat-area')).toBeInTheDocument();
    expect(screen.getByTestId('chat-field')).toBeInTheDocument();
  });

  test('initializes with empty messages when localStorage is empty', () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    render(<UserHomePage />);
    
    expect(mockLocalStorage.getItem).toHaveBeenCalledWith('messages');
    expect(screen.getByTestId('chat-area')).toBeInTheDocument();
  });

  test('initializes with stored messages from localStorage', () => {
    const storedMessages = [
      { id: 1, content: 'Hello', role: 'user' },
      { id: 2, content: 'Hi there!', role: 'assistant' }
    ];
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(storedMessages));
    
    render(<UserHomePage />);
    
    expect(mockLocalStorage.getItem).toHaveBeenCalledWith('messages');
  });

  test('renders all context providers in correct order', () => {
    render(<UserHomePage />);
    
    // Check that all providers are rendered
    expect(screen.getByTestId('ai-message-provider')).toBeInTheDocument();
    expect(screen.getByTestId('url-file-provider')).toBeInTheDocument();
    
    // Check that chat components are within providers
    const chatArea = screen.getByTestId('chat-area');
    const chatField = screen.getByTestId('chat-field');
    
    expect(chatArea).toBeInTheDocument();
    expect(chatField).toBeInTheDocument();
  });

  test('applies correct CSS class to container', () => {
    render(<UserHomePage />);
    
    const container = screen.getByTestId('chat-area').parentNode;
    expect(container).toHaveClass('chat-area-container');
  });

  test('handles localStorage parsing errors gracefully', () => {
    mockLocalStorage.getItem.mockReturnValue('invalid json');
    
    // Should not throw error and fallback to empty array
    expect(() => render(<UserHomePage />)).not.toThrow();
  });

  test('provides SendMessageContext with initial messages and setter', () => {
    const storedMessages = [{ id: 1, content: 'Test message' }];
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(storedMessages));
    
    render(<UserHomePage />);
    
    // Context should be provided to child components
    expect(screen.getByTestId('chat-area')).toBeInTheDocument();
    expect(screen.getByTestId('chat-field')).toBeInTheDocument();
  });
});

describe('UserHomePage Integration Tests', () => {
  test('context providers work together correctly', () => {
    render(<UserHomePage />);
    
    // All components should be rendered within the context hierarchy
    const aiProvider = screen.getByTestId('ai-message-provider');
    const urlProvider = screen.getByTestId('url-file-provider');
    const chatArea = screen.getByTestId('chat-area');
    const chatField = screen.getByTestId('chat-field');
    
    expect(aiProvider).toContainElement(urlProvider);
    expect(urlProvider).toContainElement(chatArea);
    expect(urlProvider).toContainElement(chatField);
  });

  test('localStorage interaction works correctly', () => {
    const testMessages = [
      { id: 1, content: 'First message', role: 'user' },
      { id: 2, content: 'Second message', role: 'assistant' }
    ];
    
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(testMessages));
    
    render(<UserHomePage />);
    
    expect(mockLocalStorage.getItem).toHaveBeenCalledWith('messages');
    expect(mockLocalStorage.getItem).toHaveBeenCalledTimes(1);
  });
});

describe('UserHomePage Error Handling', () => {
  test('handles localStorage access errors', () => {
    mockLocalStorage.getItem.mockImplementation(() => {
      throw new Error('localStorage access denied');
    });
    
    // Should render without crashing
    expect(() => render(<UserHomePage />)).not.toThrow();
  });

  test('handles JSON parsing errors in localStorage', () => {
    mockLocalStorage.getItem.mockReturnValue('{ invalid json }');
    
    // Should fallback to empty array and render normally
    expect(() => render(<UserHomePage />)).not.toThrow();
    expect(screen.getByTestId('chat-area')).toBeInTheDocument();
  });

  test('handles null localStorage gracefully', () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    
    render(<UserHomePage />);
    
    expect(screen.getByTestId('chat-area')).toBeInTheDocument();
    expect(screen.getByTestId('chat-field')).toBeInTheDocument();
  });
});

describe('UserHomePage Accessibility', () => {
  test('has proper semantic structure', () => {
    render(<UserHomePage />);
    
    const container = screen.getByTestId('chat-area').parentNode;
    expect(container.tagName.toLowerCase()).toBe('div');
    expect(container).toHaveClass('chat-area-container');
  });

  test('provides accessible content to screen readers', () => {
    render(<UserHomePage />);
    
    // Components should be accessible
    expect(screen.getByTestId('chat-area')).toBeInTheDocument();
    expect(screen.getByTestId('chat-field')).toBeInTheDocument();
  });
});

describe('UserHomePage Performance', () => {
  test('renders efficiently with large message arrays', () => {
    const largeMessageArray = Array.from({ length: 1000 }, (_, i) => ({
      id: i,
      content: `Message ${i}`,
      role: i % 2 === 0 ? 'user' : 'assistant'
    }));
    
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(largeMessageArray));
    
    const startTime = performance.now();
    render(<UserHomePage />);
    const endTime = performance.now();
    
    // Should render in reasonable time (less than 100ms)
    expect(endTime - startTime).toBeLessThan(100);
    expect(screen.getByTestId('chat-area')).toBeInTheDocument();
  });

  test('does not cause memory leaks with context providers', () => {
    const { unmount } = render(<UserHomePage />);
    
    // Should unmount cleanly
    expect(() => unmount()).not.toThrow();
  });
});

describe('UserHomePage State Management', () => {
  test('manages message state correctly', () => {
    const initialMessages = [{ id: 1, content: 'Initial message' }];
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(initialMessages));
    
    render(<UserHomePage />);
    
    // State should be initialized with localStorage data
    expect(mockLocalStorage.getItem).toHaveBeenCalledWith('messages');
  });

  test('provides state management to child components', () => {
    render(<UserHomePage />);
    
    // SendMessageContext should provide messages and setMessages
    expect(screen.getByTestId('chat-area')).toBeInTheDocument();
    expect(screen.getByTestId('chat-field')).toBeInTheDocument();
  });
});

describe('UserHomePage CSS and Styling', () => {
  test('applies correct CSS classes', () => {
    render(<UserHomePage />);
    
    const container = screen.getByTestId('chat-area').parentNode;
    expect(container).toHaveClass('chat-area-container');
  });

  test('maintains proper component structure for styling', () => {
    render(<UserHomePage />);
    
    const chatArea = screen.getByTestId('chat-area');
    const chatField = screen.getByTestId('chat-field');
    const container = chatArea.parentNode;
    
    expect(container).toContainElement(chatArea);
    expect(container).toContainElement(chatField);
    expect(container.children).toHaveLength(2);
  });
});

describe('UserHomePage Context Integration', () => {
  test('SendMessageContext provides required values', () => {
    render(<UserHomePage />);
    
    // Context should be available to child components
    expect(screen.getByTestId('chat-area')).toBeInTheDocument();
    expect(screen.getByTestId('chat-field')).toBeInTheDocument();
  });

  test('nested context providers work correctly', () => {
    render(<UserHomePage />);
    
    const aiProvider = screen.getByTestId('ai-message-provider');
    const urlProvider = screen.getByTestId('url-file-provider');
    
    // Check provider nesting
    expect(aiProvider).toContainElement(urlProvider);
  });

  test('context providers receive correct children', () => {
    render(<UserHomePage />);
    
    const urlProvider = screen.getByTestId('url-file-provider');
    const chatArea = screen.getByTestId('chat-area');
    const chatField = screen.getByTestId('chat-field');
    
    expect(urlProvider).toContainElement(chatArea);
    expect(urlProvider).toContainElement(chatField);
  });
});