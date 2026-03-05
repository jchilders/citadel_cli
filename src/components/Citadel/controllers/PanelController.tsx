import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useCitadelConfig } from '../config/hooks';
import { useCitadelState } from '../hooks/useCitadelState';
import { useGlobalShortcut } from '../hooks/useGlobalShortcut';
import { useSlideAnimation } from '../hooks/useSlideAnimation';
import { CitadelTty } from '../components/CitadelTty';

const OUTPUT_PANE_HIDDEN_MIN_HEIGHT = '128px';
const DEFAULT_MIN_HEIGHT = '200px';
const DEFAULT_MAX_HEIGHT = '80vh';

const toCssLength = (value?: string): string | undefined => {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return /^\d+(\.\d+)?$/.test(trimmed) ? `${trimmed}px` : trimmed;
};

const toPixels = (value: string | undefined, fallbackPx: number): number => {
  if (!value) return fallbackPx;
  const trimmed = value.trim();
  if (!trimmed) return fallbackPx;

  if (trimmed.endsWith('vh')) {
    const vhValue = Number.parseFloat(trimmed);
    return Number.isFinite(vhValue)
      ? (window.innerHeight * vhValue) / 100
      : fallbackPx;
  }

  const numericValue = Number.parseFloat(trimmed);
  return Number.isFinite(numericValue) ? numericValue : fallbackPx;
};

export const PanelController: React.FC = () => {
  const config = useCitadelConfig();
  const showOutputPane = config.showOutputPane ?? true;
  const configuredMinHeight = toCssLength(config.minHeight) ?? DEFAULT_MIN_HEIGHT;
  const maxHeight = toCssLength(config.maxHeight) ?? DEFAULT_MAX_HEIGHT;
  const effectiveMinHeight = showOutputPane ? configuredMinHeight : OUTPUT_PANE_HIDDEN_MIN_HEIGHT;
  const collapsedMinHeightPx = Number.parseFloat(OUTPUT_PANE_HIDDEN_MIN_HEIGHT);
  const [height, setHeight] = useState<string | null>(() => {
    const initialHeight = toCssLength(config.initialHeight);
    return showOutputPane ? (initialHeight ?? null) : OUTPUT_PANE_HIDDEN_MIN_HEIGHT;
  });
  const [isVisible, setIsVisible] = useState(() => config.showOnLoad ?? false);
  const [isClosing, setIsClosing] = useState(false);
  const outputRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const startYRef = useRef(0);
  const startHeightRef = useRef(0);
  const expandedHeightRef = useRef<string | null>(null);
  const heightRef = useRef<string | null>(height);
  const wasShowingOutputPaneRef = useRef(showOutputPane);
  const { state, actions } = useCitadelState();

  const handleOpen = useCallback(() => {
    setIsClosing(false);
    setIsVisible(true);
  }, []);

  const handleClose = useCallback(() => {
    setIsClosing(true);
  }, []);

  useGlobalShortcut({
    onOpen: handleOpen,
    onClose: handleClose,
    isVisible: isVisible && !isClosing,
    showCitadelKey: config.showCitadelKey || '.',
    closeOnEscape: config.closeOnEscape ?? true
  });

  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!isDraggingRef.current) return;

    const delta = event.clientY - startYRef.current;
    const maxHeightValue = toPixels(maxHeight, (window.innerHeight * 80) / 100);
    const minHeightValue = toPixels(effectiveMinHeight, collapsedMinHeightPx);

    const newHeight = Math.min(
      Math.max(startHeightRef.current - delta, minHeightValue),
      maxHeightValue
    );

    if (containerRef.current) {
      containerRef.current.style.height = `${newHeight}px`;
      containerRef.current.style.bottom = '0';
      setHeight(`${newHeight}px`);
    }
  }, [collapsedMinHeightPx, effectiveMinHeight, maxHeight]);

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

  useEffect(() => {
    heightRef.current = height;
  }, [height]);

  useEffect(() => {
    if (!showOutputPane) {
      if (wasShowingOutputPaneRef.current) {
        expandedHeightRef.current =
          heightRef.current ?? (containerRef.current ? `${containerRef.current.offsetHeight}px` : null);
      }

      wasShowingOutputPaneRef.current = false;
      setHeight(OUTPUT_PANE_HIDDEN_MIN_HEIGHT);
      return;
    }

    wasShowingOutputPaneRef.current = true;
    if (expandedHeightRef.current) {
      setHeight(expandedHeightRef.current);
      expandedHeightRef.current = null;
    }
  }, [showOutputPane]);

  const handleAnimationComplete = useCallback(() => {
    if (isClosing) {
      setIsVisible(false);
      setIsClosing(false);
    }
  }, [isClosing]);

  const { animationClass } = useSlideAnimation({
    isVisible,
    isClosing,
    onAnimationComplete: handleAnimationComplete
  });

  const panelStyle = useMemo(
    () => ({
      ...(height ? { height } : {}),
      minHeight: effectiveMinHeight,
      maxHeight
    }),
    [effectiveMinHeight, height, maxHeight]
  );

  if (!isVisible) return null;

  return (
    <div
      ref={containerRef}
      className={`panelContainer ${animationClass}`.trim()}
      style={panelStyle}
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
