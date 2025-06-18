// import logo from './logo.svg';
// import './App.css';

// function App() {
//   return (
//     <div className="App">
//       <header className="App-header">
//         <img src={logo} className="App-logo" alt="logo" />
//         <p>
//           Edit <code>src/App.js</code> and save to reload.
//         </p>
//         <a
//           className="App-link"
//           href="https://reactjs.org"
//           target="_blank"
//           rel="noopener noreferrer"
//         >
//           Learn React
//         </a>
//       </header>
//     </div>
//   );
// }

// export default App;



// Filename - App.js
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import './App.css';
import { terminalThemes } from './terminalThemes';
import { textCategories } from './textCategories';

const App = () => {
  const [selectedType, setSelectedType] = useState('30s');
  const [selectedCategory, setSelectedCategory] = useState('shakespeare');
  const [selectedLength, setSelectedLength] = useState('short');
  const [userInput, setUserInput] = useState('');
  const [currentText, setCurrentText] = useState(() => {
    try {
      const category = textCategories[selectedLength]?.[selectedCategory];
      if (!category || !Array.isArray(category) || category.length === 0) {
        return '';
      }
      return category[Math.floor(Math.random() * category.length)];
    } catch (error) {
      console.error('Error initializing text:', error);
      return '';
    }
  });
  const [time, setTime] = useState(() => {
    const timeValue = parseInt(selectedType);
    return timeValue;
  });
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(true);
  const [isClosed, setIsClosed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [showSummary, setShowSummary] = useState(false);
  const [showNameInput, setShowNameInput] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [totalWords, setTotalWords] = useState(0);
  const [totalChars, setTotalChars] = useState(0);
  const [leaderboard, setLeaderboard] = useState(() => {
    const saved = localStorage.getItem('leaderboard');
    return saved ? JSON.parse(saved) : [];
  });
  const [theme, setTheme] = useState('Default Dark');
  const inputRef = useRef(null);
  const startTimeRef = useRef(null);
  const [pendingScore, setPendingScore] = useState(null);
  const [isNoLimit, setIsNoLimit] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [accuracyMode, setAccuracyMode] = useState('word'); // 'word' or 'letter'
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [pauseMessage, setPauseMessage] = useState('');
  const [minimizePuzzle, setMinimizePuzzle] = useState('');
  const [showPuzzle, setShowPuzzle] = useState(false);
  const [puzzleAttempts, setPuzzleAttempts] = useState(0);

  // Puzzle answers and hints
  const puzzles = useMemo(() => [
    {
      question: "What do you call a typing test that's been minimized?",
      answer: "minimized",
      hint: "It's a state of being...",
      messages: [
        "A minimized typing test!",
        "You found the secret!",
        "The window was just playing hide and seek!",
        "You're too smart for this puzzle!",
        "The window was just taking a nap!"
      ]
    },
    {
      question: "What's the opposite of maximize?",
      answer: "minimize",
      hint: "Think small...",
      messages: [
        "You solved the puzzle!",
        "The window was just being shy!",
        "You found the secret word!",
        "The window was playing peek-a-boo!",
        "You're a puzzle master!"
      ]
    },
    {
      question: "What do you call a window that's not at full size?",
      answer: "small",
      hint: "It's a size...",
      messages: [
        "You got it!",
        "The window was just feeling small!",
        "You found the magic word!",
        "The window was just being compact!",
        "You're a word wizard!"
      ]
    }
  ], []);

  // Calculate WPM based on elapsed time
  const calculateWPM = useCallback((text, input, elapsedTime) => {
    if (!text || !input || elapsedTime <= 0) return 0;
    
    // Count words typed (not words in original text)
    const wordsTyped = input.trim().split(/\s+/).length;
    const timeInMinutes = elapsedTime / 60;
    const wpm = Math.round(wordsTyped / timeInMinutes);
    
    return isFinite(wpm) ? wpm : 0;
  }, []);

  const calculateAccuracy = useCallback((text, input) => {
    if (!text || !input) return 100;
    
    if (accuracyMode === 'word') {
      const textWords = text.trim().split(/\s+/);
      const inputWords = input.trim().split(/\s+/);
      let correctWords = 0;
      let totalWordsTyped = inputWords.length;
      
      // Only count words that have been typed
      for (let i = 0; i < Math.min(textWords.length, inputWords.length); i++) {
        if (textWords[i] === inputWords[i]) {
          correctWords++;
        }
      }
      
      // Don't penalize for words not yet typed
      return totalWordsTyped > 0 ? Math.round((correctWords / totalWordsTyped) * 100) : 100;
    } else {
      // Letter perfect mode
      let correct = 0;
      const minLength = Math.min(text.length, input.length);
      
      for (let i = 0; i < minLength; i++) {
        if (text[i] === input[i]) correct++;
      }
      
      return input.length > 0 ? Math.round((correct / input.length) * 100) : 100;
    }
  }, [accuracyMode]);

  // Handle test completion
  const handleTestComplete = useCallback(() => {
    setIsRunning(false);
    setShowSummary(true);
    setShowNameInput(true);
    
    // Calculate final stats
    const elapsedTime = startTimeRef.current ? Math.floor((Date.now() - startTimeRef.current) / 1000) : 0;
    const finalWpm = calculateWPM(currentText, userInput, elapsedTime);
    const finalAccuracy = calculateAccuracy(currentText, userInput);
    
    // Store the score temporarily
    const newScore = {
      wpm: finalWpm,
      accuracy: finalAccuracy,
      time: selectedType === 'no-limit' ? elapsedTime : parseInt(selectedType),
      date: new Date().toLocaleDateString(),
      category: selectedCategory,
      type: selectedType,
      words: totalWords,
      chars: totalChars
    };
    
    // Store the score in state for later use
    setPendingScore(newScore);
  }, [currentText, userInput, selectedCategory, selectedType, calculateWPM, calculateAccuracy, totalWords, totalChars]);

  // Window management handlers
  const handleMouseDown = useCallback((e) => {
    if (e.target.closest('.terminal-controls')) return;
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  }, [position]);

  const handleMouseMove = useCallback((e) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      });
    }
  }, [isDragging, dragOffset]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMinimizeClick = useCallback(() => {
    if (!isMinimized) {
      setIsMinimized(true);
      if (isMaximized) setIsMaximized(false);
      
      // Start puzzle easter egg
      const randomPuzzle = puzzles[Math.floor(Math.random() * puzzles.length)];
      setMinimizePuzzle(randomPuzzle);
      setShowPuzzle(true);
      setPuzzleAttempts(0);
    }
  }, [isMinimized, isMaximized, puzzles]);

  const handleMaximizeClick = useCallback(() => {
    setIsMaximized(!isMaximized);
    if (isMinimized) setIsMinimized(false);
  }, [isMaximized, isMinimized]);

  const handleCloseClick = useCallback(() => {
    if (isMinimized) {
      // If minimized, just restore the window
      setIsMinimized(false);
      return;
    }
    setIsClosed(true);
  }, [isMinimized]);

  // Pause/Resume functionality
  const handlePauseClick = useCallback(() => {
    if (isRunning) {
      setIsPaused(!isPaused);
      if (!isPaused) {
        // Pause the timer
        if (startTimeRef.current) {
          clearInterval(startTimeRef.current);
          startTimeRef.current = null;
        }
      } else {
        // Resume the timer
        startTimeRef.current = Date.now();
      }
    }
  }, [isRunning, isPaused]);

  // Update handleInputChange to respect pause state
  const handleInputChange = useCallback((e) => {
    if (!isRunning && !isPaused) {
      setIsRunning(true);
      startTimeRef.current = Date.now();
      setElapsedTime(0);
      setTotalWords(0);
      setTotalChars(0);
    }
    
    if (isPaused) return; // Don't process input while paused
    
    const value = e.target.value;
    setUserInput(value);
    
    // Calculate WPM properly
    const words = value.trim().split(/\s+/).length;
    const currentElapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
    const minutes = currentElapsed / 60; // Convert seconds to minutes
    const newWpm = minutes > 0 ? Math.round(words / minutes) : 0;
    setWpm(newWpm);
    
    // Calculate accuracy
    const newAccuracy = calculateAccuracy(currentText, value);
    setAccuracy(newAccuracy);
    
    // Calculate total characters
    const newTotalChars = value.length;
    setTotalChars(newTotalChars);
    
    // Check if test is complete
    if (value.length >= currentText.length) {
      handleTestComplete();
    }
  }, [isRunning, isPaused, currentText, calculateAccuracy, handleTestComplete]);

  // Core timer logic
  useEffect(() => {
    let timerInterval;
    
    if (isRunning && !isPaused) {
      timerInterval = setInterval(() => {
        const currentElapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setElapsedTime(currentElapsed);
        
        if (selectedType !== 'no-limit') {
          const remainingTime = Math.max(0, parseInt(selectedType) - currentElapsed);
          setTime(remainingTime);
          
          if (remainingTime <= 0) {
            handleTestComplete();
          }
        }
      }, 100); // Update more frequently for smoother display
    }

    return () => {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
    };
  }, [isRunning, isPaused, selectedType, handleTestComplete]);

  // Save leaderboards to localStorage
  useEffect(() => {
    localStorage.setItem('leaderboard', JSON.stringify(leaderboard));
  }, [leaderboard]);

  // System theme detection
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const isDark = mediaQuery.matches;
    setTheme(isDark ? 'Default Dark' : 'Default Light');

    const handleThemeChange = (e) => {
      setTheme(e.matches ? 'Default Dark' : 'Default Light');
    };

    mediaQuery.addEventListener('change', handleThemeChange);
    return () => mediaQuery.removeEventListener('change', handleThemeChange);
  }, []);

  // Get random text from selected category
  const getRandomText = useCallback(() => {
    try {
      const category = textCategories[selectedLength]?.[selectedCategory];
      if (!category || !Array.isArray(category) || category.length === 0) {
        console.error('Invalid category or empty category array');
        return '';
      }
      return category[Math.floor(Math.random() * category.length)];
    } catch (error) {
      console.error('Error getting random text:', error);
      return '';
    }
  }, [selectedLength, selectedCategory]);

  // Update text when category or length changes
  useEffect(() => {
    const newText = getRandomText();
    if (newText) {
      setCurrentText(newText);
      setUserInput('');
      setWpm(0);
      setAccuracy(100);
      setElapsedTime(0);
      setTotalWords(0);
      setTotalChars(0);
      setIsRunning(false);
      setShowSummary(false);
      setShowNameInput(false);
      setPendingScore(null);
      setIsComplete(false);
    }
  }, [selectedCategory, selectedLength, getRandomText]);

  const selectedTheme = terminalThemes[theme];

  // Add fun easter egg for typing speed
  useEffect(() => {
    if (wpm > 100) {
      const messages = [
        "Wow! You're typing at lightning speed! ⚡",
        "100+ WPM! Are you a robot? 🤖",
        "Incredible speed! Your keyboard is on fire! 🔥",
        "You're typing faster than I can think!",
        "100+ WPM! The keyboard is your dance floor! 💃"
      ];
      const randomMessage = messages[Math.floor(Math.random() * messages.length)];
      console.log(randomMessage);
    }
  }, [wpm]);

  // Add fun easter egg for accuracy
  useEffect(() => {
    if (accuracy === 100 && totalChars > 50) {
      const messages = [
        "Perfect accuracy! You're a typing ninja! 🥷",
        "100% accuracy! Not a single mistake! 🎯",
        "Flawless typing! Your keyboard is proud! ⌨️",
        "Perfect score! Are you even human? 👽",
        "100% accuracy! The keyboard bows to you! 🙇"
      ];
      const randomMessage = messages[Math.floor(Math.random() * messages.length)];
      console.log(randomMessage);
    }
  }, [accuracy, totalChars]);

  // Add fun easter egg for consecutive tests
  useEffect(() => {
    const testCount = localStorage.getItem('testCount') || 0;
    if (testCount > 5) {
      const messages = [
        "You're really getting into this! 🎮",
        "5+ tests! You're a typing machine! 🤖",
        "Keep going! You're on fire! 🔥",
        "Your keyboard is getting a workout! 💪",
        "You're becoming one with the keyboard! ⌨️"
      ];
      const randomMessage = messages[Math.floor(Math.random() * messages.length)];
      console.log(randomMessage);
    }
    localStorage.setItem('testCount', Number(testCount) + 1);
  }, [showSummary]);

  // Handle window focus/blur
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isRunning && !isPaused) {
        setIsPaused(true);
        if (startTimeRef.current) {
          clearInterval(startTimeRef.current);
          startTimeRef.current = null;
        }
        
        // Easter egg: Random fun message when pausing
        const messages = [
          "Hey! Where are you going? 🏃",
          "Don't leave me hanging! 🤔",
          "The keyboard misses you already! ⌨️",
          "Your fingers are getting cold! 🥶",
          "The words are waiting for you! 📝",
          "Paused for a coffee break? ☕",
          "Taking a typing vacation? 🏖️",
          "The keyboard is getting lonely! 😢",
          "Your typing skills are too good to pause! 💪",
          "The words are getting impatient! ⏰"
        ];
        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        setPauseMessage(randomMessage);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isRunning, isPaused]);

  const renderSummary = () => (
    <div className="summary-screen">
      <h2>Test Complete!</h2>
      <div className="summary-stats">
        <div className="stat">
          <span className="stat-label">WPM</span>
          <span className="stat-value">{wpm}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Accuracy</span>
          <span className="stat-value">{accuracy}%</span>
        </div>
        <div className="stat">
          <span className="stat-label">Time</span>
          <span className="stat-value">{selectedType}</span>
        </div>
      </div>
      {showNameInput ? (
        <div className="name-input">
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Enter your name (optional)"
            maxLength={20}
          />
          <button onClick={handleNameSubmit}>Save Score</button>
        </div>
      ) : (
        <button onClick={() => setShowNameInput(true)}>Save Score</button>
      )}
      <button onClick={handleReset}>Try Again</button>
      
      {/* Show leaderboard in summary */}
      {renderLeaderboard()}
    </div>
  );

  // Handle test reset
  const handleReset = useCallback(() => {
    setIsRunning(false);
    setUserInput('');
    setWpm(0);
    setAccuracy(100);
    setShowSummary(false);
    setShowNameInput(false);
    setPlayerName('');
    setElapsedTime(0);
    setTotalWords(0);
    setTotalChars(0);
    getRandomText();
  }, [getRandomText]);

  // Handle name submission
  const handleNameSubmit = useCallback(() => {
    if (!pendingScore) return;

    const newScore = {
      name: playerName.trim() || 'Anonymous',
      wpm: pendingScore.wpm || 0,
      accuracy: pendingScore.accuracy || 0,
      mode: selectedType,
      accuracyMode: accuracyMode,
      date: new Date().toLocaleDateString(),
      time: selectedType === 'no-limit' ? elapsedTime : null,
      chars: totalChars || 0
    };
    
    const updatedLeaderboard = [...(leaderboard || []), newScore]
      .sort((a, b) => (b.wpm || 0) - (a.wpm || 0))
      .slice(0, 10);
    
    setLeaderboard(updatedLeaderboard);
    localStorage.setItem('leaderboard', JSON.stringify(updatedLeaderboard));
    setShowNameInput(false);
    setPendingScore(null);
    
    // Show success message
    alert(`Score saved! Your ${newScore.wpm} WPM with ${newScore.accuracy}% accuracy has been added to the leaderboard.`);
  }, [playerName, pendingScore, selectedType, accuracyMode, elapsedTime, leaderboard, totalChars]);

  // Handle mode changes
  const handleModeChange = (newMode) => {
    setSelectedType(newMode);
    setTime(parseInt(newMode) || 0);
    handleReset();
  };

  const handleCategoryChange = (newCategory) => {
    if (newCategory === 'custom') {
      setSelectedCategory('custom');
    } else {
      setSelectedCategory(newCategory);
    }
    handleReset();
  };

  // Handle length change
  const handleLengthChange = useCallback((length) => {
    setSelectedLength(length);
    setTime(parseInt(selectedType));
    setIsRunning(false);
    setUserInput('');
    setWpm(0);
    setAccuracy(100);
    setShowSummary(false);
    setShowNameInput(false);
    setPlayerName('');
    getRandomText();
  }, [selectedType, getRandomText]);

  const handleFileUpload = useCallback((event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target.result;
        setCurrentText(text);
      };
      reader.readAsText(file);
    }
  }, []);

  // Format time for display
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours > 0 ? `${hours}:` : ''}${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Render leaderboard
  const renderLeaderboard = () => {
    if (!leaderboard || leaderboard.length === 0) {
      return (
        <div className="leaderboard">
          <h3>Leaderboard</h3>
          <div className="leaderboard-list">
            <div className="no-scores">No scores yet. Complete a test to see your results here!</div>
          </div>
        </div>
      );
    }

    return (
      <div className="leaderboard">
        <h3>Leaderboard</h3>
        <div className="leaderboard-list">
          {leaderboard.map((score, index) => (
            <div key={index} className="leaderboard-item">
              <span className="rank">{index + 1}</span>
              <span className="name">{score?.name || 'Anonymous'}</span>
              <span className="score">
                {score?.wpm || 0} WPM ({score?.accuracy || 0}%)
                {score?.mode === 'no-limit' && score?.time && (
                  <span className="time-taken"> - Time: {formatTime(score.time)}</span>
                )}
                <span className="chars"> - {score?.chars || 0} chars</span>
              </span>
              <span className="mode">
                {score?.mode || 'N/A'} ({score?.accuracyMode === 'word' ? 'Word Perfect' : 'Letter Perfect'})
              </span>
              <span className="date">{score?.date || 'N/A'}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render text with appropriate highlighting
  const renderText = useCallback(() => {
    if (accuracyMode === 'word') {
      const textWords = currentText.split(/\s+/);
      const inputWords = userInput.split(/\s+/);
      
      return textWords.map((word, wordIndex) => {
        const isWordCorrect = wordIndex < inputWords.length && word === inputWords[wordIndex];
        const isWordIncorrect = wordIndex < inputWords.length && word !== inputWords[wordIndex];
        
        return (
          <span key={wordIndex} className={`word ${isWordCorrect ? 'correct' : isWordIncorrect ? 'incorrect' : ''}`}>
            {word.split('').map((char, charIndex) => (
              <span key={charIndex}>{char}</span>
            ))}
            {wordIndex < textWords.length - 1 && <span className="space"> </span>}
          </span>
        );
      });
    } else {
      // Letter perfect mode
      return currentText.split('').map((char, index) => {
        let className = '';
        if (index < userInput.length) {
          className = userInput[index] === char ? 'correct' : 'incorrect';
        }
        return (
          <span key={index} className={className}>
            {char}
          </span>
        );
      });
    }
  }, [currentText, userInput, accuracyMode]);

  // Add keyboard shortcut for pause (Esc key)
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'Escape' && isRunning) {
        handlePauseClick();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isRunning, handlePauseClick]);

  // Render pause screen
  const renderPauseScreen = () => (
    <div className="pause-screen">
      <div className="pause-content">
        <h2>Paused</h2>
        <p className="pause-message">{pauseMessage}</p>
        <div className="pause-stats">
          <div className="stat">
            <span className="stat-label">Current WPM</span>
            <span className="stat-value">{wpm}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Accuracy</span>
            <span className="stat-value">{accuracy}%</span>
          </div>
          <div className="stat">
            <span className="stat-label">Time</span>
            <span className="stat-value">{formatTime(elapsedTime)}</span>
          </div>
        </div>
        <button 
          className="resume-button"
          onClick={() => {
            setIsPaused(false);
            startTimeRef.current = Date.now();
          }}
        >
          Resume Typing
        </button>
      </div>
    </div>
  );

  const handlePuzzleSubmit = useCallback((e) => {
    e.preventDefault();
    setPuzzleAttempts(prev => prev + 1);
    
    if (e.target.puzzleAnswer.value.toLowerCase() === minimizePuzzle.answer) {
      // Correct answer
      const randomMessage = minimizePuzzle.messages[Math.floor(Math.random() * minimizePuzzle.messages.length)];
      alert(randomMessage);
      setIsMinimized(false);
      setShowPuzzle(false);
    } else {
      // Wrong answer
      if (puzzleAttempts >= 2) {
        alert(`Hint: ${minimizePuzzle.hint}`);
      } else {
        alert("That's not quite right. Try again!");
      }
    }
    e.target.puzzleAnswer.value = '';
  }, [minimizePuzzle, puzzleAttempts]);

  // Render minimized state with puzzle
  const renderMinimizedState = () => (
    <div className="minimized-state">
      <div className="minimized-content">
        <h3>Window Minimized</h3>
        {showPuzzle && (
          <div className="puzzle-container">
            <p className="puzzle-question">{minimizePuzzle.question}</p>
            <form onSubmit={handlePuzzleSubmit} className="puzzle-form">
              <input
                type="text"
                name="puzzleAnswer"
                placeholder="Type your answer..."
                className="puzzle-input"
                autoComplete="off"
              />
              <button type="submit" className="puzzle-submit">
                Submit
              </button>
            </form>
            <p className="puzzle-attempts">
              Attempts: {puzzleAttempts}
              {puzzleAttempts >= 2 && (
                <span className="puzzle-hint">Hint: {minimizePuzzle.hint}</span>
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div 
      className={`App terminal-theme ${isMinimized ? 'minimized' : ''} ${isMaximized ? 'maximized' : ''}`}
      style={{
        '--background-color': selectedTheme?.background || '#1a1a1a',
        '--text-color': selectedTheme?.text || '#ffffff',
        '--accent-color': selectedTheme?.accent || '#2563eb',
        '--correct-color': selectedTheme?.correct || '#2563eb',
        '--incorrect-color': selectedTheme?.incorrect || '#ff0000',
        '--header-color': selectedTheme?.header || '#2a2a2a',
        '--border-color': selectedTheme?.border || '#3a3a3a',
        transform: isDragging && !isMinimized ? 'none' : `translate(${position.x}px, ${position.y}px)`,
        cursor: isDragging ? 'grabbing' : 'default'
      }}
    >
      <div 
        className="terminal-header"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div className="terminal-controls">
          <div className="terminal-control close" onClick={handleCloseClick}></div>
          <div className="terminal-control minimize" onClick={handleMinimizeClick}></div>
          <div className="terminal-control maximize" onClick={handleMaximizeClick}></div>
          {isRunning && (
            <div className="terminal-control pause" onClick={handlePauseClick}>
              {isPaused ? '▶' : '⏸'}
            </div>
          )}
        </div>
        <div className="terminal-title">Hyperwebster: Inf-Typer</div>
      </div>

      {!isClosed && (
        <div className="container">
          {isMinimized ? (
            renderMinimizedState()
          ) : showSummary ? (
            renderSummary()
          ) : isPaused ? (
            renderPauseScreen()
          ) : (
            <>
              <div className="controls">
                <div className="control-group">
                  <label>Category:</label>
                  <select 
                    value={selectedCategory === 'custom' ? 'custom' : selectedCategory} 
                    onChange={(e) => handleCategoryChange(e.target.value)}
                  >
                    <option value="shakespeare">Shakespeare</option>
                    <option value="anime">Anime</option>
                    <option value="aesop">Aesop's Fables</option>
                    <option value="custom">Custom Text</option>
                  </select>
                </div>

                {selectedCategory !== 'custom' ? (
                  <div className="control-group">
                    <label>Text Length:</label>
                    <select 
                      value={selectedLength} 
                      onChange={(e) => handleLengthChange(e.target.value)}
                    >
                      <option value="short">Short</option>
                      <option value="medium">Medium</option>
                      <option value="long">Long</option>
                    </select>
                  </div>
                ) : (
                  <div className="control-group">
                    <label>Upload Text:</label>
                    <label className="file-upload-label">
                      <input
                        type="file"
                        accept=".txt,.md,.doc,.docx"
                        onChange={handleFileUpload}
                        disabled={isRunning}
                      />
                      Choose File
                    </label>
                  </div>
                )}

                <div className="control-group">
                  <label>Time Mode:</label>
                  <select 
                    value={selectedType} 
                    onChange={(e) => handleModeChange(e.target.value)}
                  >
                    <option value="30s">30 seconds</option>
                    <option value="60s">60 seconds</option>
                    <option value="90s">90 seconds</option>
                    <option value="no-limit">No Limit</option>
                  </select>
                </div>

                <div className="control-group">
                  <label>Accuracy Mode:</label>
                  <select 
                    value={accuracyMode} 
                    onChange={(e) => setAccuracyMode(e.target.value)}
                  >
                    <option value="word">Word Perfect</option>
                    <option value="letter">Letter Perfect</option>
                  </select>
                </div>

                <div className="control-group">
                  <label>Theme:</label>
                  <select value={theme} onChange={(e) => setTheme(e.target.value)}>
                    {Object.keys(terminalThemes).map(themeName => (
                      <option key={themeName} value={themeName}>{themeName}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="main-content">
                <div className="text-display" style={{ color: 'var(--text-color)' }}>
                  {renderText()}
                </div>

                <textarea
                  ref={inputRef}
                  value={userInput}
                  onChange={handleInputChange}
                  placeholder="Start typing..."
                  disabled={isRunning && selectedType !== 'no-limit' && time <= 0}
                  className="typing-input"
                />

                <div className="stats">
                  <div className="stat">
                    <span className="stat-label">WPM</span>
                    <span className="stat-value">{wpm}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Accuracy</span>
                    <span className="stat-value">{accuracy}%</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Time</span>
                    <span className="stat-value">
                      {selectedType === 'no-limit' ? formatTime(elapsedTime) : time}
                    </span>
                  </div>
                </div>
              </div>

              {renderLeaderboard()}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default App;