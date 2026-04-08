import { useState, useEffect } from "react";

export function useIsMac() {
  const [isMac, setIsMac] = useState<boolean | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsMac(navigator.platform.toUpperCase().indexOf("MAC") >= 0);
    }
  }, []);

  return isMac;
}
