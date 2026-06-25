import { useState, useEffect } from 'react';
import { useSegmentStack } from '../config/hooks';

export const useSegmentStackVersion = () => {
  const segmentStack = useSegmentStack();
  const [stackVersion, setStackVersion] = useState(0);
  
  useEffect(() => {
    const observer = {
      update: () => {
        setStackVersion(v => v + 1);
      }
    };
    
    segmentStack.subscribe(observer);
    return () => {
      segmentStack.unsubscribe(observer);
    };
  }, [segmentStack]);

  return stackVersion;
};
