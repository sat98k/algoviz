import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { HuffmanNode } from '../../algorithms/huffman';
import {
  generateEncodingSteps,
  generateDecodingSteps,
  CodecStep,
  TreeTraversalOverride,
} from '../../utils/huffmanCodec';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  Binary,
  FileText,
  CheckCircle2,
  ArrowUp,
  Layers,
  Sparkles,
  ArrowRight,
  Copy,
  Check,
} from 'lucide-react';

interface HuffmanCodecVisualizerProps {
  treeRoot: HuffmanNode;
  inputText: string;
  codeTable: Record<string, string>;
  encodedBits: string;
  onTraversalChange: (override: TreeTraversalOverride | null) => void;
}

export const HuffmanCodecVisualizer: React.FC<HuffmanCodecVisualizerProps> = ({
  treeRoot,
  inputText,
  codeTable,
  encodedBits,
  onTraversalChange,
}) => {
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');
  const [stepIndex, setStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(1);
  const [copied, setCopied] = useState<boolean>(false);
  const timerRef = useRef<number | null>(null);

  // Generate steps based on existing tree and inputs
  const encodeSteps = useMemo(() => {
    return generateEncodingSteps(treeRoot, inputText, codeTable);
  }, [treeRoot, inputText, codeTable]);

  const decodeSteps = useMemo(() => {
    return generateDecodingSteps(treeRoot, encodedBits, inputText);
  }, [treeRoot, encodedBits, inputText]);

  const activeSteps = mode === 'encode' ? encodeSteps : decodeSteps;
  const maxSteps = activeSteps.length;
  const currentStep: CodecStep = activeSteps[Math.min(stepIndex, maxSteps - 1)] || activeSteps[0];

  // Sync tree traversal highlights to parent TreeVisualizer
  useEffect(() => {
    if (currentStep) {
      onTraversalChange({
        activeNodeId: currentStep.activeNodeId,
        activeEdge: currentStep.activeEdge,
        visitedNodeIds: currentStep.visitedNodeIds,
        visitedEdgeIds: currentStep.visitedEdgeIds,
        treeRootOverride: treeRoot,
        explanationOverride: `[${mode.toUpperCase()}] ${currentStep.explanation}`,
      });
    }
  }, [currentStep, treeRoot, mode, onTraversalChange]);

  // Switch modes: reset step index and paused state
  const handleSwitchMode = (newMode: 'encode' | 'decode') => {
    setIsPlaying(false);
    setMode(newMode);
    setStepIndex(0);
  };

  const handleStepForward = useCallback(() => {
    setStepIndex((prev) => {
      if (prev < maxSteps - 1) {
        return prev + 1;
      } else {
        setIsPlaying(false);
        return prev;
      }
    });
  }, [maxSteps]);

  const handleStepBackward = useCallback(() => {
    setStepIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const handleReset = useCallback(() => {
    setIsPlaying(false);
    setStepIndex(0);
  }, []);

  // Playback loop
  useEffect(() => {
    if (isPlaying) {
      const intervalMs = Math.max(200, 1000 / speed);
      timerRef.current = window.setInterval(() => {
        handleStepForward();
      }, intervalMs);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isPlaying, speed, handleStepForward]);

  const handleCopyBits = () => {
    navigator.clipboard.writeText(encodedBits);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const scrollToTree = () => {
    window.scrollTo({ top: 180, behavior: 'smooth' });
  };

  const progressPercent = maxSteps > 1 ? Math.round((stepIndex / (maxSteps - 1)) * 100) : 0;

  return (
    <section className="flex flex-col gap-6 p-6 sm:p-8 bg-obsidian-950 border border-hairline transition-all">
      {/* Header & Mode Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-hairline gap-4">
        <div>
          <div className="flex items-center gap-2 font-mono text-xs text-amber uppercase tracking-wider font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interactive Tree Traversal Phase</span>
          </div>
          <h2 className="font-display font-bold text-2xl sm:text-3xl text-chalk-100 mt-1">
            HUFFMAN ENCODING & DECODING
          </h2>
          <p className="text-xs sm:text-sm text-chalk-400 font-sans mt-1">
            Watch real-time traversal down the constructed Huffman tree above for binary encoding and bitstream decoding.
          </p>
        </div>

        {/* Mode Selector Buttons */}
        <div className="flex items-center gap-2 p-1.5 bg-obsidian-900 border border-hairline self-start md:self-auto">
          <button
            type="button"
            onClick={() => handleSwitchMode('encode')}
            className={`flex items-center gap-2 px-4 py-2 font-mono text-xs uppercase tracking-wider transition-all ${
              mode === 'encode'
                ? 'bg-amber text-obsidian-950 font-bold shadow-md'
                : 'text-chalk-400 hover:text-chalk-100 hover:bg-obsidian-850'
            }`}
          >
            <Binary className="w-3.5 h-3.5" />
            <span>Encode String</span>
          </button>

          <button
            type="button"
            onClick={() => handleSwitchMode('decode')}
            className={`flex items-center gap-2 px-4 py-2 font-mono text-xs uppercase tracking-wider transition-all ${
              mode === 'decode'
                ? 'bg-acid-500 text-obsidian-950 font-bold shadow-md'
                : 'text-chalk-400 hover:text-chalk-100 hover:bg-obsidian-850'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Decode Bits</span>
          </button>
        </div>
      </div>

      {/* Tree Sync Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-obsidian-900 border border-hairline font-mono text-xs">
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-amber animate-pulse"></span>
          <span className="text-chalk-300">
            Active on Tree: <strong className="text-amber-glow">{currentStep.currentNodeLabel}</strong>
          </span>
          {currentStep.activeEdge && (
            <span className="text-chalk-500 hidden sm:inline">
              (Traversing branch: <strong className="text-amber">{currentStep.activeEdge.label}</strong>)
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={scrollToTree}
          className="flex items-center gap-1.5 px-2.5 py-1 bg-obsidian-950 hover:bg-obsidian-850 text-chalk-400 hover:text-amber text-[11px] border border-hairline transition-colors"
        >
          <ArrowUp className="w-3 h-3" />
          <span>View Tree Above</span>
        </button>
      </div>

      {/* Playback Controls Toolbar */}
      <div className="flex flex-col gap-4 p-4 bg-obsidian-900 border border-hairline">
        {/* Scrubber & Meta Info */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-hairline">
          <div className="flex items-baseline gap-2 font-mono">
            <span className="text-xs uppercase tracking-wider text-chalk-500">STEP</span>
            <span className="font-display font-bold text-xl text-chalk-100 tabular-nums">
              {String(stepIndex + 1).padStart(2, '0')}
            </span>
            <span className="text-xs text-chalk-500">/ {String(maxSteps).padStart(2, '0')}</span>
            <span className="text-xs text-amber font-medium ml-3 hidden sm:inline">
              {currentStep.title}
            </span>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs text-amber-glow tabular-nums">
            <span>PROGRESS</span>
            <span className="font-bold bg-obsidian-950 px-2 py-0.5 border border-hairline">
              {progressPercent}%
            </span>
          </div>
        </div>

        {/* Range Scrubber */}
        <input
          type="range"
          min={0}
          max={Math.max(0, maxSteps - 1)}
          value={stepIndex}
          onChange={(e) => setStepIndex(parseInt(e.target.value, 10))}
          className="w-full h-1 bg-obsidian-700 appearance-none cursor-pointer accent-amber"
        />

        {/* Playback Buttons & Speed Control */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-1 font-mono text-xs">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleReset}
              className="p-2 bg-obsidian-950 hover:bg-obsidian-850 text-chalk-400 hover:text-chalk-100 border border-hairline transition-colors"
              title="Reset to Beginning"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleStepBackward}
              disabled={stepIndex === 0}
              className="p-2 bg-obsidian-950 hover:bg-obsidian-850 disabled:opacity-40 text-chalk-400 hover:text-chalk-100 border border-hairline transition-colors"
              title="Step Backward"
            >
              <SkipBack className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              className="px-4 py-2 bg-amber hover:bg-amber-glow text-obsidian-950 font-bold flex items-center gap-1.5 transition-colors shadow-sm"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
              <span>{isPlaying ? 'PAUSE' : 'PLAY'}</span>
            </button>
            <button
              type="button"
              onClick={handleStepForward}
              disabled={stepIndex >= maxSteps - 1}
              className="p-2 bg-obsidian-950 hover:bg-obsidian-850 disabled:opacity-40 text-chalk-400 hover:text-chalk-100 border border-hairline transition-colors"
              title="Step Forward"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          {/* Speed Presets */}
          <div className="flex items-center gap-1">
            <span className="text-chalk-500 mr-1 text-[11px]">SPEED:</span>
            {[0.5, 1, 2, 4].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSpeed(s)}
                className={`px-2 py-1 text-[11px] border transition-colors ${
                  speed === s
                    ? 'bg-obsidian-800 text-amber font-bold border-amber/40'
                    : 'bg-obsidian-950 text-chalk-400 border-hairline hover:bg-obsidian-850'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODE 1: ENCODING INFORMATION PANE                                         */}
      {/* ========================================================================= */}
      {mode === 'encode' && (
        <div className="flex flex-col gap-6">
          {/* Character Stream Strip */}
          <div className="flex flex-col gap-2 p-4 bg-obsidian-900 border border-hairline">
            <div className="flex items-center justify-between font-mono text-[11px] text-chalk-500">
              <span className="uppercase tracking-wider">INPUT STRING CHARACTERS ({inputText.length})</span>
              <span>Active Target: {currentStep.currentChar ? `'${currentStep.currentChar}'` : 'None'}</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 py-2 overflow-x-auto">
              {inputText.split('').map((ch, idx) => {
                const isCurrent = currentStep.charIndex === idx;
                const isCompleted =
                  currentStep.charIndex !== undefined && idx < currentStep.charIndex;

                return (
                  <div
                    key={idx}
                    className={`flex flex-col items-center justify-center w-10 h-12 border font-mono text-sm transition-all ${
                      isCurrent
                        ? 'bg-amber/20 border-amber text-amber-glow font-bold scale-105 shadow-md shadow-amber/10'
                        : isCompleted
                        ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-400'
                        : 'bg-obsidian-950 border-hairline text-chalk-400'
                    }`}
                  >
                    <span>{ch}</span>
                    <span className="text-[9px] text-chalk-500 mt-0.5">{idx + 1}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Telemetry Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
            {/* Current Character Card */}
            <div className="p-4 bg-obsidian-900 border border-hairline flex flex-col justify-between gap-1">
              <span className="text-[10px] uppercase tracking-wider text-chalk-500 flex items-center gap-1.5">
                <FileText className="w-3 h-3 text-amber" /> CURRENT CHARACTER
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-display font-bold text-2xl text-amber-glow">
                  {currentStep.currentChar ? `'${currentStep.currentChar}'` : '—'}
                </span>
                {currentStep.charIndex !== undefined && (
                  <span className="text-chalk-500 text-[11px]">
                    (Pos {currentStep.charIndex + 1}/{currentStep.totalChars})
                  </span>
                )}
              </div>
            </div>

            {/* Current Node Card */}
            <div className="p-4 bg-obsidian-900 border border-hairline flex flex-col justify-between gap-1">
              <span className="text-[10px] uppercase tracking-wider text-chalk-500 flex items-center gap-1.5">
                <Layers className="w-3 h-3 text-acid-500" /> ACTIVE TREE NODE
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-mono font-bold text-xl text-acid-500">
                  {currentStep.currentNodeLabel}
                </span>
              </div>
            </div>

            {/* Traversal Direction */}
            <div className="p-4 bg-obsidian-900 border border-hairline flex flex-col justify-between gap-1">
              <span className="text-[10px] uppercase tracking-wider text-chalk-500 flex items-center gap-1.5">
                <ArrowRight className="w-3 h-3 text-cyan-400" /> DIRECTION / DECISION
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-mono font-bold text-base text-cyan-300">
                  {currentStep.currentDirection}
                </span>
              </div>
            </div>

            {/* Prefix Code For Character */}
            <div className="p-4 bg-obsidian-900 border border-hairline flex flex-col justify-between gap-1">
              <span className="text-[10px] uppercase tracking-wider text-chalk-500 flex items-center gap-1.5">
                <Binary className="w-3 h-3 text-rose-400" /> GENERATED CODE
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-mono font-bold text-xl text-chalk-100">
                  {currentStep.currentCodeBits || '—'}
                </span>
                {currentStep.expectedCode && (
                  <span className="text-chalk-500 text-[11px]">
                    (Full: {currentStep.expectedCode})
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Accumulated Encoded Bits Output */}
          <div className="flex flex-col gap-2 p-4 bg-obsidian-900 border border-hairline">
            <div className="flex items-center justify-between font-mono text-[11px] text-chalk-500">
              <span className="uppercase tracking-wider">
                ACCUMULATED ENCODED BITS ({currentStep.accumulatedBits.length} bits)
              </span>
              <button
                type="button"
                onClick={handleCopyBits}
                className="flex items-center gap-1 px-2 py-0.5 bg-obsidian-950 hover:bg-obsidian-850 text-chalk-300 border border-hairline text-[10px] transition-colors"
              >
                {copied ? <Check className="w-3 h-3 text-acid-500" /> : <Copy className="w-3 h-3 text-chalk-400" />}
                <span>{copied ? 'COPIED' : 'COPY BITS'}</span>
              </button>
            </div>
            <div className="p-3 bg-obsidian-950 border border-hairline font-mono text-xs text-amber-glow break-all leading-relaxed max-h-24 overflow-y-auto">
              {currentStep.accumulatedBits || (
                <span className="text-chalk-600 italic">No bits generated yet. Press Step Forward or Play.</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: DECODING INFORMATION PANE                                         */}
      {/* ========================================================================= */}
      {mode === 'decode' && (
        <div className="flex flex-col gap-6">
          {/* Encoded Bit Stream Ribbon with Active Indicator */}
          <div className="flex flex-col gap-2 p-4 bg-obsidian-900 border border-hairline">
            <div className="flex items-center justify-between font-mono text-[11px] text-chalk-500">
              <span className="uppercase tracking-wider">
                ENCODED BITSTREAM ({encodedBits.length} BITS)
              </span>
              <span>
                Active Bit:{' '}
                {currentStep.bitIndex !== undefined
                  ? `${currentStep.bitIndex + 1}/${encodedBits.length}`
                  : 'Start'}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1 py-2 font-mono text-xs overflow-x-auto max-h-32">
              {encodedBits.split('').map((b, idx) => {
                const isCurrent = currentStep.bitIndex === idx;
                const isProcessed =
                  currentStep.bitIndex !== undefined && idx < currentStep.bitIndex;

                return (
                  <span
                    key={idx}
                    className={`px-2 py-1 border transition-all ${
                      isCurrent
                        ? 'bg-amber text-obsidian-950 font-bold border-amber scale-110 shadow-md'
                        : isProcessed
                        ? 'bg-obsidian-950 text-emerald-400 border-emerald-500/20'
                        : 'bg-obsidian-950 text-chalk-500 border-hairline'
                    }`}
                  >
                    {b}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Telemetry Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
            {/* Current Bit */}
            <div className="p-4 bg-obsidian-900 border border-hairline flex flex-col justify-between gap-1">
              <span className="text-[10px] uppercase tracking-wider text-chalk-500 flex items-center gap-1.5">
                <Binary className="w-3 h-3 text-amber" /> CURRENT BIT
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-display font-bold text-2xl text-amber-glow">
                  {currentStep.currentBit !== undefined ? `'${currentStep.currentBit}'` : '—'}
                </span>
                {currentStep.bitIndex !== undefined && (
                  <span className="text-chalk-500 text-[11px]">
                    (Index {currentStep.bitIndex + 1}/{encodedBits.length})
                  </span>
                )}
              </div>
            </div>

            {/* Current Node */}
            <div className="p-4 bg-obsidian-900 border border-hairline flex flex-col justify-between gap-1">
              <span className="text-[10px] uppercase tracking-wider text-chalk-500 flex items-center gap-1.5">
                <Layers className="w-3 h-3 text-acid-500" /> CURRENT TREE NODE
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-mono font-bold text-xl text-acid-500">
                  {currentStep.currentNodeLabel}
                </span>
              </div>
            </div>

            {/* Traversal Direction */}
            <div className="p-4 bg-obsidian-900 border border-hairline flex flex-col justify-between gap-1">
              <span className="text-[10px] uppercase tracking-wider text-chalk-500 flex items-center gap-1.5">
                <ArrowRight className="w-3 h-3 text-cyan-400" /> DIRECTION / ACTION
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-mono font-bold text-base text-cyan-300 truncate">
                  {currentStep.currentDirection}
                </span>
              </div>
            </div>

            {/* Emitted Character */}
            <div className="p-4 bg-obsidian-900 border border-hairline flex flex-col justify-between gap-1">
              <span className="text-[10px] uppercase tracking-wider text-chalk-500 flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" /> DECODED CHARACTER
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-display font-bold text-2xl text-emerald-400">
                  {currentStep.currentChar ? `'${currentStep.currentChar}'` : '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Decoded Output String */}
          <div className="flex flex-col gap-2 p-4 bg-obsidian-900 border border-hairline">
            <div className="flex items-center justify-between font-mono text-[11px] text-chalk-500">
              <span className="uppercase tracking-wider">
                DECODED STRING OUTPUT ({currentStep.accumulatedText.length} / {inputText.length} chars)
              </span>
              {currentStep.accumulatedText === inputText && (
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <Check className="w-3 h-3" /> MATCHES INPUT
                </span>
              )}
            </div>
            <div className="p-4 bg-obsidian-950 border border-hairline font-mono text-lg text-chalk-100 font-bold tracking-widest break-all">
              {currentStep.accumulatedText || (
                <span className="text-chalk-600 text-xs italic font-normal">
                  Awaiting bit decoding...
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
