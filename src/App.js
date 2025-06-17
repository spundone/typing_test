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
import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
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

  // Calculate WPM based on elapsed time
  const calculateWPM = useCallback((text, input, elapsedTime) => {
    if (!text || !input || elapsedTime <= 0) return 0;
    
    const words = text.trim().split(/\s+/).length;
    const timeInMinutes = elapsedTime / 60;
    const wpm = Math.round((words / timeInMinutes) * (input.length / text.length));
    
    return isFinite(wpm) ? wpm : 0;
  }, []);

  const calculateAccuracy = useCallback((text, input) => {
    if (!text || !input) return 100;
    
    let correct = 0;
    const minLength = Math.min(text.length, input.length);
    
    for (let i = 0; i < minLength; i++) {
      if (text[i] === input[i]) correct++;
    }
    
    return Math.round((correct / input.length) * 100);
  }, []);

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

  // Handle input changes and test progress
  const handleInputChange = useCallback((e) => {
    const newInput = e.target.value;
    setUserInput(newInput);

    // Start timer on first keystroke
    if (newInput.length === 1 && !isRunning) {
      startTimeRef.current = Date.now();
      setElapsedTime(0);
      setTotalWords(0);
      setTotalChars(0);
      setIsRunning(true);
    }

    // Reset stats if input is cleared
    if (newInput.length === 0) {
      setElapsedTime(0);
      setWpm(0);
      setAccuracy(100);
      setTotalWords(0);
      setTotalChars(0);
      setIsRunning(false);
      return;
    }

    // Calculate current stats
    const words = newInput.trim().split(/\s+/).length;
    setTotalWords(words);
    setTotalChars(newInput.length);
    const currentAccuracy = calculateAccuracy(currentText, newInput);
    setAccuracy(currentAccuracy);

    if (selectedType === 'no-limit') {
      const elapsedTime = startTimeRef.current ? Math.floor((Date.now() - startTimeRef.current) / 1000) : 0;
      const timeInMinutes = elapsedTime / 60;
      const currentWpm = Math.round(words / timeInMinutes);
      setWpm(currentWpm);
    } else {
      const elapsedTime = startTimeRef.current ? Math.floor((Date.now() - startTimeRef.current) / 1000) : 0;
      const currentWpm = calculateWPM(currentText, newInput, elapsedTime);
      setWpm(currentWpm);
    }

    // Check for test completion
    if (newInput === currentText) {
      handleTestComplete();
    }
  }, [isRunning, currentText, selectedType, handleTestComplete, calculateWPM, calculateAccuracy]);

  // Core timer logic
  useEffect(() => {
    let timerInterval;
    
    if (isRunning) {
      timerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setElapsedTime(elapsed);
        
        if (selectedType !== 'no-limit') {
          const remainingTime = Math.max(0, parseInt(selectedType) - elapsed);
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
  }, [isRunning, selectedType, handleTestComplete]);

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

  // Add easter egg functions
  const handleCloseClick = () => {
    const messages = [
      "Are you sure you want to close? Your progress will be lost!",
      "Don't close me! I'm having fun!",
      "You can't close me! I'm a React app!",
      "Nice try, but I'm not going anywhere!",
      "Closing is not an option in the world of typing tests!"
    ];
    alert(messages[Math.floor(Math.random() * messages.length)]);
  };

  const handleMinimizeClick = () => {
    const messages = [
      "I'm already as small as I can be!",
      "Minimizing a web app? That's a new one!",
      "You can't minimize me, I'm not a real window!",
      "I'm already running in your browser tab!",
      "Try using your browser's minimize button instead!"
    ];
    alert(messages[Math.floor(Math.random() * messages.length)]);
  };

  const handleMaximizeClick = () => {
    const messages = [
      "I'm already at maximum typing power!",
      "Maximum typing speed achieved!",
      "You've unlocked the secret typing dimension!",
      "The terminal is now at maximum capacity!",
      "Be careful, too much typing power might break the internet!"
    ];
    alert(messages[Math.floor(Math.random() * messages.length)]);
  };

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
  }, [playerName, pendingScore, selectedType, elapsedTime, leaderboard, totalChars]);

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

  const handlePaste = useCallback((event) => {
    const pastedText = event.clipboardData.getData('text');
    if (pastedText) {
      setCurrentText(pastedText);
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
              <span className="mode">{score?.mode || 'N/A'}</span>
              <span className="date">{score?.date || 'N/A'}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="App terminal-theme" style={{
      '--background-color': selectedTheme?.background || '#1a1a1a',
      '--text-color': selectedTheme?.text || '#ffffff',
      '--accent-color': selectedTheme?.accent || '#2563eb',
      '--correct-color': selectedTheme?.correct || '#2563eb',
      '--incorrect-color': selectedTheme?.incorrect || '#ff0000',
      '--header-color': selectedTheme?.header || '#2a2a2a',
      '--border-color': selectedTheme?.border || '#3a3a3a'
    }}>
      <div className="terminal-header">
        <div className="terminal-controls">
          <div className="terminal-control close" onClick={handleCloseClick}></div>
          <div className="terminal-control minimize" onClick={handleMinimizeClick}></div>
          <div className="terminal-control maximize" onClick={handleMaximizeClick}></div>
        </div>
        <div className="terminal-title">Hyperwebster: Inf-Typer</div>
      </div>

      <div className="container">
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
            <label>Theme:</label>
            <select value={theme} onChange={(e) => setTheme(e.target.value)}>
              {Object.keys(terminalThemes).map(themeName => (
                <option key={themeName} value={themeName}>{themeName}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="main-content">
          {showSummary ? (
            renderSummary()
          ) : (
            <>
              <div className="text-display">
                {currentText.split('').map((char, index) => {
                  let className = '';
                  if (index < userInput.length) {
                    className = userInput[index] === char ? 'correct' : 'incorrect';
                  }
                  return (
                    <span key={index} className={className}>
                      {char}
                    </span>
                  );
                })}
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
            </>
          )}
        </div>

        {renderLeaderboard()}
      </div>
    </div>
  );
}

export default App;