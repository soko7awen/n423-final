import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Platform, useWindowDimensions } from 'react-native';

const DeviceContext = createContext({ isDesktopWeb: false });

export const DeviceProvider = ({ children }) => {
  const { width } = useWindowDimensions();
  const [isDesktopWeb, setIsDesktopWeb] = useState(Platform.OS === 'web' && width >= 768);

  useEffect(() => {
    setIsDesktopWeb(Platform.OS === 'web' && width >= 768);
  }, [width]);

  const value = useMemo(() => ({ isDesktopWeb }), [isDesktopWeb]);

  return <DeviceContext.Provider value={value}>{children}</DeviceContext.Provider>;
};

export const useDevice = () => useContext(DeviceContext);

// Default export to satisfy Expo Router page discovery; renders nothing.
export default function DeviceContextPlaceholder() {
  return null;
}
