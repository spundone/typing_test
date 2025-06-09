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
import { textCategories, timeModes } from './textSamples';
import { terminalThemes } from './terminalThemes';

function App() {
  const [currentText, setCurrentText] = useState('');
  const [userInput, setUserInput] = useState('');
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [selectedCategory, setSelectedCategory] = useState('shakespeare');
  const [selectedType, setSelectedType] = useState('short');
  const [timeMode, setTimeMode] = useState('words');
  const [theme, setTheme] = useState('Default Dark');
  const [customText, setCustomText] = useState('');
  const [useCustomText, setUseCustomText] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showNameInput, setShowNameInput] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [finalScore, setFinalScore] = useState(null);
  const [leaderboard, setLeaderboard] = useState(() => {
    const saved = localStorage.getItem('leaderboard');
    return saved ? JSON.parse(saved) : [];
  });
  const timerRef = useRef(null);
  const inputRef = useRef(null);

  // Save leaderboard to localStorage when it changes
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

  const getRandomText = useCallback(() => {
    if (useCustomText && customText.trim()) {
      return customText.trim();
    }
    const texts = textCategories[selectedType][selectedCategory];
    const randomIndex = Math.floor(Math.random() * texts.length);
    return texts[randomIndex];
  }, [selectedType, selectedCategory, useCustomText, customText]);

  // Only update text when explicitly requested
  const updateText = useCallback(() => {
    setCurrentText(getRandomText());
  }, [getRandomText]);

  useEffect(() => {
    updateText();
  }, [updateText]);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTime(prevTime => {
          const newTime = prevTime + 1;
          if (timeMode === '30s' && newTime >= 30) {
            handleTestComplete();
          } else if (timeMode === '60s' && newTime >= 60) {
            handleTestComplete();
          } else if (timeMode === '90s' && newTime >= 90) {
            handleTestComplete();
          }
          return newTime;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isRunning, timeMode]);

  const handleTestComplete = () => {
    setIsRunning(false);
    setShowSummary(true);
    const finalWpm = wpm;
    const finalAccuracy = accuracy;
    setFinalScore({ wpm: finalWpm, accuracy: finalAccuracy, time: time });
  };

  const handleNameSubmit = () => {
    if (playerName.trim()) {
      const newScore = {
        name: playerName,
        wpm: finalScore.wpm,
        accuracy: finalScore.accuracy,
        time: finalScore.time,
        date: new Date().toLocaleDateString(),
        category: selectedCategory,
        type: selectedType
      };
      setLeaderboard(prev => {
        const newLeaderboard = [...prev, newScore]
          .sort((a, b) => b.wpm - a.wpm)
          .slice(0, 10);
        return newLeaderboard;
      });
      setShowNameInput(false);
      handleReset();
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setUserInput(value);
    
    if (!isRunning && value.length > 0) {
      setIsRunning(true);
    }

    if (value.length === currentText.length) {
      handleTestComplete();
    }

    // Calculate accuracy
    let correct = 0;
    for (let i = 0; i < value.length; i++) {
      if (value[i] === currentText[i]) {
        correct++;
      }
    }
    const newAccuracy = (correct / value.length) * 100;
    setAccuracy(Math.round(newAccuracy));

    // Calculate WPM
    const words = value.trim().split(/\s+/).length;
    const minutes = time / 60;
    const newWpm = Math.round(words / minutes) || 0;
    setWpm(newWpm);
  };

  const handleReset = () => {
    setUserInput('');
    setTime(0);
    setIsRunning(false);
    setWpm(0);
    setAccuracy(100);
    setShowSummary(false);
    setShowNameInput(false);
    setPlayerName('');
    setFinalScore(null);
    updateText();
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleTimeModeChange = (e) => {
    setTimeMode(e.target.value);
    setUserInput(''); // Clear input when changing time mode
    setTime(0);
    setIsRunning(false);
    setWpm(0);
    setAccuracy(100);
    updateText();
  };

  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
    setUserInput(''); // Clear input when changing category
    setTime(0);
    setIsRunning(false);
    setWpm(0);
    setAccuracy(100);
    updateText();
  };

  const handleTypeChange = (e) => {
    setSelectedType(e.target.value);
    setUserInput(''); // Clear input when changing type
    setTime(0);
    setIsRunning(false);
    setWpm(0);
    setAccuracy(100);
    updateText();
  };

  const handleThemeChange = (e) => {
    setTheme(e.target.value);
  };

  const handleCustomTextChange = (e) => {
    setCustomText(e.target.value);
    if (e.target.value.trim()) {
      setUseCustomText(true);
    }
  };

  const handleCustomTextToggle = (e) => {
    setUseCustomText(e.target.checked);
    if (!e.target.checked) {
      setCustomText('');
      updateText();
    }
  };

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
          <span className="stat-value">{finalScore.wpm}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Accuracy</span>
          <span className="stat-value">{finalScore.accuracy}%</span>
        </div>
        <div className="stat">
          <span className="stat-label">Time</span>
          <span className="stat-value">{finalScore.time}s</span>
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
          <button onClick={handleNameSubmit}>Save Score</button>
        </div>
      ) : (
        <button onClick={() => setShowNameInput(true)}>Save Score</button>
      )}
      <button onClick={handleReset}>Try Again</button>
    </div>
  );

  const renderLeaderboard = () => (
    <div className="leaderboard">
      <h3>Top Scores</h3>
      <div className="leaderboard-list">
        {leaderboard.map((entry, index) => (
          <div key={entry.date} className="leaderboard-entry">
            <div className="rank">#{index + 1}</div>
            <div className="name">{entry.name}</div>
            <div className="score">{entry.wpm} WPM</div>
            <div className="details">
              {entry.accuracy}% • {entry.time}s • {entry.category}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="App terminal-theme" style={{
      '--background-color': selectedTheme.background,
      '--text-color': selectedTheme.text,
      '--accent-color': selectedTheme.accent,
      '--correct-color': selectedTheme.correct,
      '--incorrect-color': selectedTheme.incorrect,
      '--header-color': selectedTheme.header,
      '--border-color': selectedTheme.border
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
              onChange={handleCategoryChange}
              disabled={useCustomText}
              className={useCustomText ? 'disabled' : ''}
            >
              <option value="shakespeare">Shakespeare</option>
              <option value="anime">Anime</option>
              <option value="aesop">Aesop's Fables</option>
            </select>
          </div>

          <div className="control-group">
            <label>Length:</label>
            <select 
              value={selectedType} 
              onChange={handleTypeChange}
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
            <select value={timeMode} onChange={handleTimeModeChange}>
              <option value="words">Words</option>
              <option value="30s">Time (30s)</option>
              <option value="60s">Time (60s)</option>
              <option value="90s">Time (90s)</option>
            </select>
          </div>

          <div className="control-group">
            <label>Theme:</label>
            <select value={theme} onChange={handleThemeChange}>
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
              onChange={handleCustomTextToggle}
            />
            Use Custom Text
          </label>
        </div>

        {useCustomText ? (
          <textarea
            value={customText}
            onChange={handleCustomTextChange}
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