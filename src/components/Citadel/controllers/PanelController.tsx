import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useCitadelConfig } from '../config/hooks';
import { useCitadelState } from '../hooks/useCitadelState';
import { useGlobalShortcut } from '../hooks/useGlobalShortcut';
import { useSlideAnimation } from '../hooks/useSlideAnimation';
import { CitadelTty } from '../components/CitadelTty';

export const PanelController: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const config = useCitadelConfig();
  const [height, setHeight] = useState<string | null>(() => config.initialHeight || null);
  const outputRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const startYRef = useRef(0);
  const startHeightRef = useRef(0);
  const { state, actions } = useCitadelState();

  useGlobalShortcut({
    onOpen: () => setIsVisible(true),
    onClose: () => setIsClosing(true),
    isVisible,
    showCitadelKey: config.showCitadelKey || '.'
  });

  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!isDraggingRef.current) return;

    const delta = event.clientY - startYRef.current;
    const maxHeightValue = config.maxHeight?.endsWith('vh')
      ? (window.innerHeight * parseInt(config.maxHeight, 10)) / 100
      : parseInt(config.maxHeight || '80vh', 10);

    const newHeight = Math.min(
      Math.max(startHeightRef.current - delta, parseInt(config.minHeight || '200', 10)),
      maxHeightValue
    );

    if (containerRef.current) {
      containerRef.current.style.height = `${newHeight}px`;
      containerRef.current.style.bottom = '0';
      setHeight(`${newHeight}px`);
    }
  }, [config.maxHeight, config.minHeight]);

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false;
    document.documentElement.style.userSelect = '';
    document.documentElement.style.webkitUserSelect = '';
    // @ts-expect-error: Vendor prefixed property
    document.documentElement.style.mozUserSelect = '';
    // @ts-expect-error: Vendor prefixed property
    document.documentElement.style.msUserSelect = '';
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseMove]);

  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    if (containerRef.current) {
      isDraggingRef.current = true;
      startYRef.current = event.clientY;
      startHeightRef.current = containerRef.current.offsetHeight;
      document.documentElement.style.userSelect = 'none';
      document.documentElement.style.webkitUserSelect = 'none';
      // @ts-expect-error: Vendor prefixed property
      document.documentElement.style.mozUserSelect = 'none';
      // @ts-expect-error: Vendor prefixed property
      document.documentElement.style.msUserSelect = 'none';
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
  }, [handleMouseMove, handleMouseUp]);

  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  const handleAnimationComplete = useCallback(() => {
    if (isClosing) {
      setIsVisible(false);
      setIsClosing(false);
    }
  }, [isClosing]);

  useSlideAnimation({
    isVisible,
    isClosing,
    onAnimationComplete: handleAnimationComplete
  });

  if (!isVisible) return null;

  return (
    <div
      ref={containerRef}
      className={`panelContainer ${isVisible ? 'citadel_slideUp' : ''} ${isClosing ? 'citadel_slideDown' : ''}`}
      style={{
        ...height ? { height } : undefined,
        maxHeight: config.maxHeight
      }}
    >
      <div className="resizeHandle" onMouseDown={handleMouseDown} />
      <CitadelTty
        state={state}
        actions={actions}
        outputRef={outputRef}
      />
    </div>
  );
};
