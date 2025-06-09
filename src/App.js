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
import React, { useState, useEffect, useCallback } from 'react';
import './App.css';

const SAMPLE_TEXT = "The quick brown fox jumps over the lazy dog. Programming is the process of creating a set of instructions that tell a computer how to perform a task. Programming can be done using a variety of computer programming languages, such as JavaScript, Python, and C++.";

function App() {
  const [text, setText] = useState('');
  const [timeLeft, setTimeLeft] = useState(60);
  const [isActive, setIsActive] = useState(false);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [startTime, setStartTime] = useState(null);

  const calculateWPM = useCallback(() => {
    if (!startTime) return 0;
    const timeElapsed = (Date.now() - startTime) / 1000 / 60; // in minutes
    const words = text.trim().split(/\s+/).length;
    return Math.round(words / timeElapsed);
  }, [text, startTime]);

  const calculateAccuracy = useCallback(() => {
    if (!text) return 100;
    let correctChars = 0;
    for (let i = 0; i < text.length; i++) {
      if (text[i] === SAMPLE_TEXT[i]) {
        correctChars++;
      }
    }
    return Math.round((correctChars / text.length) * 100);
  }, [text]);

  useEffect(() => {
    let interval = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(timeLeft - 1);
        setWpm(calculateWPM());
        setAccuracy(calculateAccuracy());
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, calculateWPM, calculateAccuracy]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setText(value);
    
    if (!isActive && value.length === 1) {
      setIsActive(true);
      setStartTime(Date.now());
    }
  };

  const resetTest = () => {
    setText('');
    setTimeLeft(60);
    setIsActive(false);
    setWpm(0);
    setAccuracy(100);
    setStartTime(null);
  };

  return (
    <div className="App">
      <div className="container">
        <h1>Typing Test</h1>
        <div className="stats">
          <div className="stat">Time: {timeLeft}s</div>
          <div className="stat">WPM: {wpm}</div>
          <div className="stat">Accuracy: {accuracy}%</div>
        </div>
        <div className="text-display">
          {SAMPLE_TEXT.split('').map((char, index) => {
            let className = 'char';
            if (index < text.length) {
              className += text[index] === char ? ' correct' : ' incorrect';
            }
            return <span key={index} className={className}>{char}</span>;
          })}
        </div>
        <textarea
          value={text}
          onChange={handleInputChange}
          disabled={timeLeft === 0}
          placeholder="Start typing..."
        />
        <button onClick={resetTest} className="reset-button">
          Reset Test
        </button>
      </div>
    </div>
  );
}

export default App;