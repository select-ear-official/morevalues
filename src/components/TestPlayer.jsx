import React, { useState, useEffect } from 'react';
import { calculateTestResults } from '../utils/testEngine';
import { HexColorPicker, HexColorInput } from 'react-colorful';
import { ValueIcon } from './ValueIcon';

function InnerTestPlayer({ test, onComplete, onEditInStudio, onViewProfile }) {
  // view state: 'home' | 'instructions' | 'playing'
  const [viewState, setViewState] = useState('home');
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});

  useEffect(() => {
    if (test && test.id && test.id !== '8values-classic') {
      fetch(`/api/tests/${test.id}/view`, { method: 'POST' }).catch(() => {});
    }
  }, [test?.id]);

  if (!test || !test.questions || test.questions.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <h2>No questions found in this test!</h2>
        <p style={{ margin: '1rem 0' }}>
          Open the Creator to add questions to your test.
        </p>
        <button className="menu-btn" onClick={onEditInStudio}>
          Open Creator
        </button>
      </div>
    );
  }

  // 1. Home Screen
  if (viewState === 'home') {
    return (
      <div>
        <h1>{test.title}</h1>
        <hr />

        <div className="center">
          <div className="quadcolumn-headers">
            {test.axes.map((axis) => (
              <div key={axis.id} className="axis_name quadcolumn">
                <span className="axis-text">{axis.name}</span>
              </div>
            ))}
          </div>

          <div className="quadcolumn-row">
            {test.axes.map((axis) => (
              <a href="#anchor" key={`${axis.id}-left`} className="quadcolumn clickable">
                <ValueIcon
                  name={axis.left.name}
                  color={axis.left.color}
                  iconSrc={axis.left.icon || '/raw_icons/equality.svg'}
                  style={{ width: '100%', height: '100%' }}
                />
              </a>
            ))}
          </div>

          <div className="quadcolumn-row">
            {test.axes.map((axis) => (
              <a href="#anchor" key={`${axis.id}-right`} className="quadcolumn clickable">
                <ValueIcon
                  name={axis.right.name}
                  color={axis.right.color}
                  iconSrc={axis.right.icon || '/raw_icons/markets.svg'}
                  style={{ width: '100%', height: '100%' }}
                />
              </a>
            ))}
          </div>
        </div>
        <br />

        <button className="button" style={{ fontSize: '36pt' }} onClick={() => {
          if (test && test.id && test.id !== '8values-classic') {
            fetch(`/api/tests/${test.id}/play`, { method: 'POST' }).catch(() => {});
          }
          setViewState('instructions');
        }}>
          Click here to start!
        </button>
        <br />

        <hr />

        <h2>What is {test.title}?</h2>
        <p>
          {test.description} You will be presented with a statement, and then you will answer with your opinion on the statement, from <b>Strongly Agree</b> to <b>Strongly Disagree</b>, with each answer slightly affecting your scores. At the end of the test, your answers will be compared to the maximum possible for each value. Answer honestly!<br /><br />
          There are <b><u><span>{test.questions.length}</span></u></b> questions in the test.
        </p>

        <h2><a id="anchor" style={{ color: 'inherit', textDecoration: 'none' }}>What are the values?</a></h2>
        <p>There are independent axes, and each has two opposing values assigned to them:</p>

        <div className="explanation_bg">
          {test.axes.map((axis) => (
            <div key={axis.id} className="spacer">
              <div className="explanation_blurb_left">
                <p className="value"><b style={{ color: axis.left.color }}>{axis.left.name.toUpperCase()}</b></p>
                <p className="blurb-text">
                  High {axis.left.name} scores indicate alignment towards the {axis.left.name} value spectrum.
                </p>
              </div>

              <div className="explanation_axis">
                <p className="axis_name">{axis.name}</p>
                <img className="arrow" src="/double_arrow.svg" alt="Double Arrow" />
              </div>

              <div className="explanation_blurb_right">
                <p className="value"><b style={{ color: axis.right.color }}>{axis.right.name.toUpperCase()}</b></p>
                <p className="blurb-text">
                  High {axis.right.name} scores indicate alignment towards the {axis.right.name} value spectrum.
                </p>
              </div>
            </div>
          ))}
        </div>

        <h2 style={{ marginTop: '17pt' }}>What's the "Closest Match" mean at the bottom of the results?</h2>
        {/* <p> */}
          <span>In addition to matching you to the eight values, the quiz also attempts to match you to a political ideology. This is a work in progress and is much less accurate than the values and axes, so don't take it too seriously. If you disagree with your assigned ideology, you can try contacting </span>
          {test.ownerUsername ? (
            <span 
              onClick={() => onViewProfile?.(test.ownerUsername)}
              onMouseOver = {(e) => { if (onViewProfile){ e.target.style.textDecoration = 'underline'; e.target.style.cursor = 'pointer';}}}
              onMouseOut = {(e) => { if (onViewProfile) e.target.style.textDecoration = 'none';}}
            >
              {test.ownerUsername}
            </span>
          ) : (
            <span>the creator</span>
          )}
          <span> on their social media accounts and they might adjust the test accordingly.</span>
        {/* </p> */}

        <h2>I don't like my scores!</h2>
        <p>
          ¯\_(ツ)_/¯<br />
          If you have any suggestions or constructive criticism, feel free to fork this test or make your own in the creator!
        </p>
      </div>
    );
  }

  // 2. Instructions Screen
  if (viewState === 'instructions') {
    return (
      <div>
        <h1>{test.title}</h1>
        <hr />
        <h2 style={{ textAlign: 'center' }}>Instructions</h2>
        <p className="question">
          You will be presented with a series of statements. For each one, click the button with your opinion on it.
        </p>
        <button className="button" onClick={() => setViewState('playing')}>
          Got it!
        </button> <br />
        <button className="button disagree" onClick={() => setViewState('home')}>
          Wait, nevermind!
        </button> <br />
      </div>
    );
  }

  // 3. Test Player Screen
  const currentQuestion = test.questions[currentIdx];
  const totalQuestions = test.questions.length;

  const handleAnswer = (multiplier) => {
    const updatedAnswers = { ...answers, [currentQuestion.id]: multiplier };
    setAnswers(updatedAnswers);

    if (currentIdx + 1 < totalQuestions) {
      setCurrentIdx(currentIdx + 1);
    } else {
      const results = calculateTestResults(test, updatedAnswers);
      onComplete(results);
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx(currentIdx - 1);
    } else {
      setViewState('instructions');
    }
  };

  return (
    <div>
      <h1>{test.title}</h1>
      <hr />
      <h2 style={{ textAlign: 'center' }}>
        Question {currentIdx + 1} of {totalQuestions}
      </h2>

      <p className="question">
        {currentQuestion.text}
      </p>

      <div style={{ textAlign: 'center' }}>
        <button className="button stronglyAgree" onClick={() => handleAnswer(1.0)}>Strongly Agree</button> <br />
        <button className="button agree" onClick={() => handleAnswer(0.5)}>Agree</button> <br />
        <button className="button neutral" onClick={() => handleAnswer(0.0)}>Neutral/Unsure</button> <br />
        <button className="button disagree" onClick={() => handleAnswer(-0.5)}>Disagree</button> <br />
        <button className="button stronglyDisagree" onClick={() => handleAnswer(-1.0)}>Strongly Disagree</button> <br />

        <div style={{ marginTop: '1rem' }}>
          <button className="small_button" onClick={handlePrev}>Back</button>
          <button className="small_button" onClick={() => setViewState('home')}>Quit</button>
        </div>
      </div>
    </div>
  );
}

export function TestPlayer(props) {
  const { isThemeEditMode, onUpdateTheme, test } = props;
  const [activePicker, setActivePicker] = useState(null);
  const [pickerPos, setPickerPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!isThemeEditMode) {
      setActivePicker(null);
      return;
    }

    const handleGlobalClick = (e) => {
      // Ignore clicks inside the color picker itself
      if (e.target.closest('.color-picker-popover')) {
        return;
      }

      const el = e.target;
      let targetKey = null;

      if (el.tagName === 'HTML') targetKey = 'htmlBg';
      else if (el.tagName === 'BODY') targetKey = 'border';
      else if (el.tagName === 'HR') targetKey = 'lines';
      else if (el.closest('h1, h2, .question, p.axis_name, .axis-text')) targetKey = 'headings';
      else if (el.closest('p')) targetKey = 'text';
      else if (el.closest('.center')) targetKey = 'centerBg';
      else if (el.closest('.explanation_bg, .quadcolumn-headers, .quadcolumn-row, .top-nav')) targetKey = 'containerBg';
      else targetKey = 'background'; // Fallback to background

      setActivePicker(targetKey);
      setPickerPos({ x: e.clientX, y: e.clientY });
      e.stopPropagation();
      e.preventDefault();
    };

    window.addEventListener('pointerdown', handleGlobalClick, { capture: true });
    
    // Set crosshair cursor on the whole document
    document.documentElement.style.cursor = 'crosshair';
    document.body.style.cursor = 'crosshair';

    return () => {
      window.removeEventListener('pointerdown', handleGlobalClick, { capture: true });
      document.documentElement.style.cursor = '';
      document.body.style.cursor = '';
    };
  }, [isThemeEditMode]);

  return (
    <div className={isThemeEditMode ? 'theme-edit-mode' : ''}>
      {/* Theme edit mode banner removed as requested */}
      
      {isThemeEditMode && activePicker && (
        <div 
          className="color-picker-popover" 
          style={{ 
            position: 'fixed', 
            top: pickerPos.y + 10, 
            left: pickerPos.x + 10, 
            zIndex: 9999, 
            background: 'white', 
            padding: '12px', 
            borderRadius: '8px', 
            border: '1px solid #ccc'
          }}
        >
          <select 
            value={activePicker} 
            onChange={(e) => setActivePicker(e.target.value)}
            style={{ marginBottom: '10px', fontWeight: 'bold', color: '#333', fontSize: '0.9rem', width: '100%', padding: '4px', borderRadius: '4px', border: '1px solid #ccc' }}
          >
            <option value="htmlBg">Outer Page Background</option>
            <option value="border">Page Border (Vertical Lines)</option>
            <option value="background">Inner Background</option>
            <option value="centerBg">Center Area Box</option>
            <option value="containerBg">Other Container Boxes</option>
            <option value="headings">Headings & Titles</option>
            <option value="text">Paragraph Text</option>
            <option value="lines">Horizontal Lines</option>
            <option value="resultsBarBg">Results Bar Background</option>
            <option value="resultsBarBorder">Results Bar Border</option>
          </select>
          <HexColorPicker 
            color={test.theme?.[activePicker] || '#cccccc'} 
            onChange={(color) => onUpdateTheme?.(activePicker, color)} 
          />
          <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: '#666', fontWeight: 'bold' }}>HEX:</span>
            <HexColorInput 
              color={test.theme?.[activePicker] || '#cccccc'} 
              onChange={(color) => onUpdateTheme?.(activePicker, color)} 
              prefixed
              style={{ width: '100%', padding: '4px', border: '1px solid #ccc', borderRadius: '4px', fontFamily: 'monospace' }}
            />
          </div>
        </div>
      )}

      <InnerTestPlayer {...props} />
    </div>
  );
}
