'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

// Define the shape of the data that will be stored during registration
interface RegistrationData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  otp: string;
}

// Define the shape of the context
interface RegistrationContextType {
  registrationData: RegistrationData | null;
  setRegistrationData: (data: RegistrationData | null) => void;
}

// Create the context with a default undefined value
const RegistrationContext = createContext<RegistrationContextType | undefined>(undefined);

// Define the props for the provider component
interface RegistrationProviderProps {
  children: ReactNode;
}

/**
 * Provider component that wraps the app and makes the registration data available
 * to any child component that calls useRegistration().
 */
export const RegistrationProvider = ({ children }: RegistrationProviderProps) => {
  const [registrationData, setRegistrationData] = useState<RegistrationData | null>(null);

  return (
    <RegistrationContext.Provider value={{ registrationData, setRegistrationData }}>
      {children}
    </RegistrationContext.Provider>
  );
};

/**
 * Custom hook that allows components to access the registration context.
 * Throws an error if used outside of a RegistrationProvider.
 */
export const useRegistration = () => {
  const context = useContext(RegistrationContext);
  if (context === undefined) {
    throw new Error('useRegistration must be used within a RegistrationProvider');
  }
  return context;
};
