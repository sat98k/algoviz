import React, { useEffect, useState, useRef } from 'react';
import { AlgorithmStep } from '../../types/algorithm';

interface CallFlowOverlayProps {
  step: AlgorithmStep;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

interface ArrowCoordinates {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  type: 'call' | 'return';
  stepKey: string;
}

export const CallFlowOverlay: React.FC<CallFlowOverlayProps> = ({ step, containerRef }) => {
  const [arrow, setArrow] = useState<ArrowCoordinates | null>(null);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const fadeTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (fadeTimeoutRef.current) {
      clearTimeout(fadeTimeoutRef.current);
      fadeTimeoutRef.current = null;
    }

    if (!step.callFlow || !containerRef.current) {
      setArrow(null);
      setIsVisible(false);
      return;
    }

    const computeCoordinates = () => {
      if (!containerRef.current || !step.callFlow) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const nodeId = step.callFlow.nodeId;
      const codeLine = Array.isArray(step.codeLine) ? step.codeLine[0] : step.codeLine;

      const nodeEl =
        document.getElementById(`tree-node-${nodeId}`) ||
        document.querySelector(`[data-tree-node-id="${nodeId}"]`);
      const codeEl = codeLine ? document.getElementById(`pseudocode-line-${codeLine}`) : null;

      if (!nodeEl || !codeEl) {
        setArrow(null);
        setIsVisible(false);
        return;
      }

      const nodeRect = nodeEl.getBoundingClientRect();
      const codeRect = codeEl.getBoundingClientRect();

      // Determine attachment points relative to container
      // If code is to the right of node (split mode): code attach at left edge, node attach at right edge
      // If code is below node (stacked mode): code attach at top edge, node attach at bottom edge
      let nodeX = nodeRect.left + nodeRect.width / 2 - containerRect.left;
      let nodeY = nodeRect.top + nodeRect.height / 2 - containerRect.top;

      let codeX = codeRect.left + 10 - containerRect.left;
      let codeY = codeRect.top + codeRect.height / 2 - containerRect.top;

      if (codeRect.left > nodeRect.right) {
        // Code is to the right
        nodeX = nodeRect.right - containerRect.left;
        codeX = codeRect.left - containerRect.left;
      } else if (nodeRect.left > codeRect.right) {
        // Node is to the right
        nodeX = nodeRect.left - containerRect.left;
        codeX = codeRect.right - containerRect.left;
      }

      const isCall = step.callFlow.type === 'call';

      const x1 = isCall ? codeX : nodeX;
      const y1 = isCall ? codeY : nodeY;
      const x2 = isCall ? nodeX : codeX;
      const y2 = isCall ? nodeY : codeY;

      setArrow({
        x1,
        y1,
        x2,
        y2,
        type: step.callFlow.type,
        stepKey: `${step.stepIndex}-${step.callFlow.nodeId}-${step.callFlow.type}`,
      });
      setIsVisible(true);

      // Fade out after 1200ms
      fadeTimeoutRef.current = window.setTimeout(() => {
        setIsVisible(false);
      }, 1200);
    };

    // Small delay to allow DOM positions to settle after step state render
    const frameId = requestAnimationFrame(() => {
      computeCoordinates();
    });

    window.addEventListener('resize', computeCoordinates);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', computeCoordinates);
      if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);
    };
  }, [step.stepIndex, step.callFlow, containerRef]);

  if (!arrow || !isVisible) return null;

  const dx = (arrow.x2 - arrow.x1) * 0.45;
  const pathD = `M ${arrow.x1} ${arrow.y1} C ${arrow.x1 + dx} ${arrow.y1}, ${arrow.x2 - dx} ${arrow.y2}, ${arrow.x2} ${arrow.y2}`;

  const isCall = arrow.type === 'call';
  const color = isCall ? '#F59E0B' : '#10B981'; // Amber for calls, Emerald for return values
  const markerId = isCall ? 'arrow-call-head' : 'arrow-return-head';

  return (
    <svg
      key={arrow.stepKey}
      className="absolute inset-0 w-full h-full pointer-events-none z-30 transition-opacity duration-300"
      style={{ opacity: isVisible ? 1 : 0 }}
    >
      <defs>
        {/* Glow filter */}
        <filter id="flow-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>

        {/* Arrowhead marker for recursive call */}
        <marker
          id="arrow-call-head"
          markerWidth="8"
          markerHeight="8"
          refX="6"
          refY="3"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M0,0 L0,6 L6,3 z" fill="#F59E0B" />
        </marker>

        {/* Arrowhead marker for return flow */}
        <marker
          id="arrow-return-head"
          markerWidth="8"
          markerHeight="8"
          refX="6"
          refY="3"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M0,0 L0,6 L6,3 z" fill="#10B981" />
        </marker>
      </defs>

      {/* Shadow / background stroke */}
      <path
        d={pathD}
        fill="none"
        stroke="#0F172A"
        strokeWidth={5}
        strokeLinecap="round"
      />

      {/* Main glowing animated arrow */}
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth={2.6}
        strokeLinecap="round"
        strokeDasharray="8 4"
        className="animate-flow-dash"
        markerEnd={`url(#${markerId})`}
        filter="url(#flow-glow)"
      />

      {/* Start circle indicator */}
      <circle
        cx={arrow.x1}
        cy={arrow.y1}
        r={4}
        fill={color}
        className="animate-ping"
      />
      <circle
        cx={arrow.x1}
        cy={arrow.y1}
        r={3}
        fill="#0F172A"
        stroke={color}
        strokeWidth={1.5}
      />
    </svg>
  );
};
