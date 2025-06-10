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
import { textCategories } from './textSamples';
import { terminalThemes } from './terminalThemes';

const App = () => {
  const [selectedType, setSelectedType] = useState('30s');
  const [selectedCategory, setSelectedCategory] = useState('shakespeare');
  const [selectedLength, setSelectedLength] = useState('short');
  const [userInput, setUserInput] = useState('');
  const [currentText, setCurrentText] = useState(() => {
    const category = textCategories[selectedLength][selectedCategory];
    if (!category) return '';
    return category[Math.floor(Math.random() * category.length)];
  });
  const [time, setTime] = useState(() => {
    const timeValue = parseInt(selectedType);
    return timeValue;
  });
  const [isRunning, setIsRunning] = useState(false);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [useCustomText, setUseCustomText] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showNameInput, setShowNameInput] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [leaderboard, setLeaderboard] = useState(() => {
    const saved = localStorage.getItem('leaderboard');
    return saved ? JSON.parse(saved) : [];
  });
  const [theme, setTheme] = useState('Default Dark');
  const inputRef = useRef(null);
  const startTimeRef = useRef(null);
  const [pendingScore, setPendingScore] = useState(null);

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
      time: parseInt(selectedType),
      date: new Date().toLocaleDateString(),
      category: selectedCategory,
      type: selectedType
    };
    
    // Store the score in state for later use
    setPendingScore(newScore);
  }, [currentText, userInput, selectedCategory, selectedType, calculateWPM, calculateAccuracy]);

  // Core timer logic
  useEffect(() => {
    let timerInterval;
    
    if (isRunning) {
      const initialTime = parseInt(selectedType);
      
      timerInterval = setInterval(() => {
        const elapsedTime = Math.floor((Date.now() - startTimeRef.current) / 1000);
        const remainingTime = Math.max(0, initialTime - elapsedTime);
        
        setTime(remainingTime);
        
        if (remainingTime <= 0) {
          handleTestComplete();
        }
      }, 100); // Update more frequently for smoother countdown
    }

    return () => {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
    };
  }, [isRunning, selectedType, handleTestComplete]);

  // Handle input changes and test progress
  const handleInputChange = useCallback((e) => {
    const newInput = e.target.value;
    setUserInput(newInput);

    // Start timer on first keystroke
    if (newInput.length === 1 && !isRunning) {
      startTimeRef.current = Date.now();
      setIsRunning(true);
    }

    // Reset stats if input is cleared
    if (newInput.length === 0) {
      setTime(parseInt(selectedType));
      setWpm(0);
      setAccuracy(100);
      setIsRunning(false);
      startTimeRef.current = null;
      return;
    }

    // Calculate current stats
    const elapsedTime = startTimeRef.current ? Math.floor((Date.now() - startTimeRef.current) / 1000) : 0;
    const currentWpm = calculateWPM(currentText, newInput, elapsedTime);
    const currentAccuracy = calculateAccuracy(currentText, newInput);
    setWpm(currentWpm);
    setAccuracy(currentAccuracy);

    // Check for test completion
    if (newInput === currentText) {
      handleTestComplete();
    }
  }, [isRunning, currentText, selectedType, handleTestComplete, calculateWPM, calculateAccuracy]);

  // Save leaderboard to localStorage
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

  // Get random text function
  const getRandomText = useCallback(() => {
    if (useCustomText) {
      return currentText;
    }
    const category = textCategories[selectedLength][selectedCategory];
    if (!category) return '';
    return category[Math.floor(Math.random() * category.length)];
  }, [selectedLength, selectedCategory, useCustomText, currentText]);

  // Update text function
  const updateText = useCallback(() => {
    const newText = getRandomText();
    setCurrentText(newText);
  }, [getRandomText]);

  // Initial text setup
  useEffect(() => {
    updateText();
  }, [updateText]);

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
            placeholder="Enter your name"
            maxLength={20}
          />
          <button onClick={handleNameSubmit}>Submit</button>
        </div>
      ) : (
        <button onClick={() => setShowNameInput(true)}>Save Score</button>
      )}
      <button onClick={handleReset}>Try Again</button>
    </div>
  );

  const renderLeaderboard = () => (
    <div className="leaderboard">
      <h2>Top Scores</h2>
      {leaderboard.length > 0 ? (
        <div className="leaderboard-entries">
          {leaderboard.map((entry, index) => (
            <div key={index} className="leaderboard-entry">
              <div className="rank">#{index + 1}</div>
              <div className="name">{entry.name || 'Anonymous'}</div>
              <div className="score">
                <span>{entry.wpm || 0} WPM</span>
                <span>{entry.accuracy || 0}%</span>
                <span>{entry.time || 0}s</span>
              </div>
              <div className="details">
                {entry.category || 'Custom'} - {entry.type || 'Custom'}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-scores">No scores yet. Be the first to set a record!</div>
      )}
    </div>
  );

  // Handle test reset
  const handleReset = useCallback(() => {
    setUserInput('');
    setTime(parseInt(selectedType));
    setIsRunning(false);
    setWpm(0);
    setAccuracy(100);
    setShowSummary(false);
    setShowNameInput(false);
    setPlayerName('');
    startTimeRef.current = null;
    updateText();
  }, [selectedType, updateText]);

  // Handle name submission
  const handleNameSubmit = useCallback(() => {
    if (playerName.trim()) {
      // Add the name to the pending score and update leaderboard
      const scoreWithName = {
        ...pendingScore,
        name: playerName.trim()
      };
      
      setLeaderboard(prev => {
        const newLeaderboard = [...prev, scoreWithName]
          .sort((a, b) => b.wpm - a.wpm)
          .slice(0, 10);
        return newLeaderboard;
      });
      
      setShowNameInput(false);
      handleReset();
    }
  }, [playerName, pendingScore, handleReset]);

  // Handle mode changes
  const handleModeChange = useCallback((type) => {
    setSelectedType(type);
    setTime(parseInt(type));
    setIsRunning(false);
    setUserInput('');
    setWpm(0);
    setAccuracy(100);
    setShowSummary(false);
    setShowNameInput(false);
    setPlayerName('');
    updateText();
  }, [updateText]);

  const handleCategoryChange = useCallback((category) => {
    setSelectedCategory(category);
    setTime(parseInt(selectedType));
    setIsRunning(false);
    setUserInput('');
    setWpm(0);
    setAccuracy(100);
    setShowSummary(false);
    setShowNameInput(false);
    setPlayerName('');
    updateText();
  }, [selectedType, updateText]);

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
    updateText();
  }, [selectedType, updateText]);

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
              value={selectedCategory} 
              onChange={(e) => handleCategoryChange(e.target.value)}
              disabled={useCustomText}
              className={useCustomText ? 'disabled' : ''}
            >
              <option value="shakespeare">Shakespeare</option>
              <option value="anime">Anime</option>
              <option value="aesop">Aesop's Fables</option>
            </select>
          </div>

          <div className="control-group">
            <label>Text Length:</label>
            <select 
              value={selectedLength} 
              onChange={(e) => handleLengthChange(e.target.value)}
              disabled={useCustomText}
              className={useCustomText ? 'disabled' : ''}
            >
              <option value="short">Short</option>
              <option value="medium">Medium</option>
              <option value="long">Long</option>
            </select>
          </div>

          <div className="control-group">
            <label>Time Mode:</label>
            <select 
              value={selectedType} 
              onChange={(e) => handleModeChange(e.target.value)}
            >
              <option value="30s">30 seconds</option>
              <option value="60s">60 seconds</option>
              <option value="90s">90 seconds</option>
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

        <div className="custom-text-toggle">
          <label>
            <input
              type="checkbox"
              checked={useCustomText}
              onChange={(e) => setUseCustomText(e.target.checked)}
            />
            Use Custom Text
          </label>
        </div>

        {useCustomText ? (
          <textarea
            value={currentText}
            onChange={(e) => setCurrentText(e.target.value)}
            placeholder="Enter your custom text here..."
            className="text-display"
          />
        ) : (
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
        )}

        {!showSummary && (
          <textarea
            ref={inputRef}
            value={userInput}
            onChange={handleInputChange}
            placeholder="Start typing..."
            disabled={!currentText || useCustomText}
            className="typing-input"
          />
        )}

        {showSummary ? (
          renderSummary()
        ) : (
          <div className="stats">
            <div className="stat">
              <div>Time</div>
              <div>{time}s</div>
            </div>
            <div className="stat">
              <div>WPM</div>
              <div>{wpm}</div>
            </div>
            <div className="stat">
              <div>Accuracy</div>
              <div>{accuracy}%</div>
            </div>
          </div>
        )}

        {!showSummary && (
          <button className="reset-button" onClick={handleReset}>
            Reset
          </button>
        )}

        {renderLeaderboard()}
      </div>
    </div>
  );
}

export default App;