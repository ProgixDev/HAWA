import React, {createContext, useCallback, useContext, useMemo, useState} from 'react';

type JournalSheetContextValue = {
  visible: boolean;
  open: () => void;
  close: () => void;
};

const JournalSheetContext = createContext<JournalSheetContextValue | undefined>(undefined);

export function JournalSheetProvider({children}: {children: React.ReactNode}): React.JSX.Element {
  const [visible, setVisible] = useState(false);
  const open = useCallback(() => setVisible(true), []);
  const close = useCallback(() => setVisible(false), []);
  const value = useMemo(() => ({visible, open, close}), [visible, open, close]);

  return <JournalSheetContext.Provider value={value}>{children}</JournalSheetContext.Provider>;
}

export function useJournalSheet(): JournalSheetContextValue {
  const context = useContext(JournalSheetContext);
  if (!context) {
    throw new Error('useJournalSheet must be used within a JournalSheetProvider');
  }
  return context;
}
