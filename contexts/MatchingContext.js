import React, {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

const MatchingContext = createContext(null);

// How long the simulated search runs before a "match" is found.
const FIND_DELAY = 5000;

// Mock match — replace with a real result from your matching backend.
const MOCK_MATCH = {
  id: 'p1',
  name: 'Thiha',
  avatar: 'boy3',
  reason: 'Also looking for Casual Chat',
};

/**
 * Shares the friend-matching state across the chat tab so the MatchingScreen
 * and the chat-list FAB stay in sync.
 *  - status: 'idle' | 'searching' | 'matched'
 * The search continues in the background if the user navigates away from the
 * MatchingScreen, so the FAB can reflect "finding" / "matched".
 */
export function MatchingProvider({ children }) {
  const [status, setStatus] = useState('idle');
  const [match, setMatch] = useState(null);
  const timerRef = useRef(null);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const runSearch = useCallback(() => {
    clearTimer();
    setMatch(null);
    setStatus('searching');
    // TODO: replace this simulation with a real matching API call.
    timerRef.current = setTimeout(() => {
      setStatus('matched');
      setMatch(MOCK_MATCH);
    }, FIND_DELAY);
  }, []);

  const reset = useCallback(() => {
    clearTimer();
    setStatus('idle');
    setMatch(null);
  }, []);

  const keepSearching = useCallback(() => runSearch(), [runSearch]);

  useEffect(() => clearTimer, []);

  return (
    <MatchingContext.Provider
      value={{ status, match, startMatching: runSearch, reset, keepSearching }}
    >
      {children}
    </MatchingContext.Provider>
  );
}

export const useMatching = () => {
  const ctx = useContext(MatchingContext);
  if (!ctx) throw new Error('useMatching must be used within MatchingProvider');
  return ctx;
};
