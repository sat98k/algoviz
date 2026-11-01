import React, { useEffect, useState } from 'react';

interface NavbarProps {
  currentView: 'home' | 'module' | 'algorithm' | 'compare';
  onNavigate: (view: 'home' | 'compare') => void;
}

/** Bar colours for each chapter colour a page section can declare with data-chapter. */
const CHAPTER_BAR: Record<string, { bg: string; ink: string }> = {
  bone: { bg: '#e6e0d2', ink: '#1a1a1a' },
  // The algorithm pages' glow fields (PageGlow): the bar takes their warm white.
  glow: { bg: '#fffaf1', ink: '#1a1a1a' },
  coral: { bg: '#ed4b44', ink: '#0f0f0f' },
  ink: { bg: '#1a1a1a', ink: '#e6e0d2' },
  green: { bg: '#18bc42', ink: '#1a1a1a' },
  yellow: { bg: '#f2c21a', ink: '#1a1a1a' },
};

/**
 * A thin top bar (h-11 = 2.75rem; the player view and sticky panels are sized from it):
 * the wordmark and the catalog. On the home page it takes the colour of the chapter under it.
 * The site uses the light theme only.
 */
export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate }) => {
  const [chapter, setChapter] = useState(currentView === 'algorithm' ? 'glow' : 'bone');
  const inCatalog = currentView === 'home' || currentView === 'module';

  const barRef = React.useRef<HTMLElement>(null);

  useEffect(() => {
    let frame = 0;
    // The chapter whose box spans the bar's bottom edge. Rects share one coordinate space,
    // so this holds under the page zoom too.
    const update = () => {
      frame = 0;
      const edge = barRef.current?.getBoundingClientRect().bottom ?? 0;
      const under = [...document.querySelectorAll('[data-chapter]')].find((el) => {
        const r = el.getBoundingClientRect();
        return r.top <= edge && r.bottom > edge;
      });
      setChapter(under?.getAttribute('data-chapter') ?? (currentView === 'algorithm' ? 'glow' : 'bone'));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(frame);
    };
  }, [currentView]);

  const bar = CHAPTER_BAR[chapter] ?? CHAPTER_BAR.bone;

  return (
    <header
      ref={barRef}
      className="chrome-c glass-bar sticky top-0 z-50 w-full transition-colors duration-300"
      style={{ background: `color-mix(in srgb, ${bar.bg} 74%, transparent)`, color: bar.ink }}
    >
      <div className="hc-frame h-11 flex items-center justify-between">
        <button
          type="button"
          onClick={() => onNavigate('home')}
          className="hc-display text-[22px] leading-none min-h-[44px] transition-transform hover:-rotate-3 active:scale-[0.96]"
        >
          algoviz
        </button>
        <nav aria-label="Main">
          <button
            type="button"
            onClick={() => onNavigate('home')}
            aria-current={inCatalog ? 'page' : undefined}
            className="px-4 py-1.5 rounded-full text-[14px] font-bold transition-transform hover:scale-105 active:scale-[0.96]"
            style={{ background: bar.ink, color: bar.bg }}
          >
            CATALOG
          </button>
        </nav>
      </div>
    </header>
  );
};
