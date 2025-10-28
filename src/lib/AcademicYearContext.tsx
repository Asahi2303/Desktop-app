import React, { createContext, useContext, useState } from 'react';

type AcademicYearContextType = {
  year: string;
  setYear: (y: string) => void;
};

const AcademicYearContext = createContext<AcademicYearContextType | undefined>(undefined);

export const AcademicYearProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Default could be computed based on current date
  const [year, setYear] = useState<string>('2024-2025');
  return (
    <AcademicYearContext.Provider value={{ year, setYear }}>
      {children}
    </AcademicYearContext.Provider>
  );
};

export function useAcademicYear() {
  const ctx = useContext(AcademicYearContext);
  if (!ctx) throw new Error('useAcademicYear must be used within AcademicYearProvider');
  return ctx;
}
