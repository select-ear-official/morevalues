import { useState, useRef, useCallback } from 'react';

export function useTestHistory(initialState) {
  const [state, setState] = useState({
    history: [initialState],
    currentIndex: 0
  });
  
  const lastUpdateRef = useRef(Date.now());

  const setTest = useCallback((newTest) => {
    setState((prevState) => {
      const now = Date.now();
      const { history, currentIndex } = prevState;
      const currentState = history[currentIndex];
      
      const nextState = typeof newTest === 'function' ? newTest(currentState) : newTest;
      
      // If the state is functionally identical, do nothing
      if (JSON.stringify(currentState) === JSON.stringify(nextState)) {
        return prevState;
      }
      
      const isContinuousEdit = now - lastUpdateRef.current < 500;
      lastUpdateRef.current = now;

      if (isContinuousEdit && currentIndex > 0) {
        // Debounce: Replace the current history frame
        const newHistory = [...history];
        newHistory[currentIndex] = nextState;
        return {
          history: newHistory,
          currentIndex
        };
      } else {
        // Push a new frame, slicing off any "redo" futures
        let newHistory = history.slice(0, currentIndex + 1);
        newHistory.push(nextState);
        
        // Limit history size to 50 items
        if (newHistory.length > 50) {
          newHistory.shift();
        }
        
        return {
          history: newHistory,
          currentIndex: newHistory.length - 1
        };
      }
    });
  }, []);

  const undo = useCallback(() => {
    setState((prevState) => {
      if (prevState.currentIndex > 0) {
        return {
          ...prevState,
          currentIndex: prevState.currentIndex - 1
        };
      }
      return prevState;
    });
  }, []);

  const redo = useCallback(() => {
    setState((prevState) => {
      if (prevState.currentIndex < prevState.history.length - 1) {
        return {
          ...prevState,
          currentIndex: prevState.currentIndex + 1
        };
      }
      return prevState;
    });
  }, []);

  const resetHistory = useCallback((test) => {
    setState({
      history: [test],
      currentIndex: 0
    });
  }, []);

  return {
    test: state.history[state.currentIndex],
    setTest,
    undo,
    redo,
    canUndo: state.currentIndex > 0,
    canRedo: state.currentIndex < state.history.length - 1,
    resetHistory
  };
}
