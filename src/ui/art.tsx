import type { ReactNode } from 'react';

/** Small flat 80s-poster illustrations. All decorative (aria-hidden) — data never sits on them. */
const frame = (children: ReactNode, size = 64) => (
  <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true" focusable="false" className="art">
    {children}
  </svg>
);

const O = { stroke: '#16E6DD', strokeWidth: 2.5, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };

export function RecipeIcon({ id, size = 64 }: { id: string; size?: number }) {
  switch (id) {
    case 'classic_sourdough':
      return frame(<>
        <path d="M8 40 C8 22 20 14 32 14 C44 14 56 22 56 40 C56 48 50 52 32 52 C14 52 8 48 8 40Z" fill="#FFD232" {...O} />
        <path d="M22 22 L28 34 M32 20 L36 34 M42 23 L44 33" stroke="#09111B" strokeWidth="3" strokeLinecap="round" fill="none" />
      </>, size);
    case 'poolish_pizza':
      return frame(<>
        <path d="M10 12 Q32 2 54 12 L32 56 Z" fill="#FFD232" {...O} />
        <path d="M10 12 Q32 2 54 12" fill="none" stroke="#FF5868" strokeWidth="5" strokeLinecap="round" />
        <circle cx="26" cy="22" r="4.5" fill="#FF5868" /><circle cx="38" cy="25" r="4" fill="#FF2E96" /><circle cx="32" cy="38" r="3.8" fill="#FF5868" />
      </>, size);
    case 'bens_focaccia':
      return frame(<>
        <rect x="8" y="16" width="48" height="32" rx="6" fill="#FFD232" {...O} />
        <circle cx="20" cy="26" r="3.5" fill="#22D8C1" /><circle cx="34" cy="24" r="3" fill="#FF5868" /><circle cx="46" cy="30" r="3.5" fill="#22D8C1" />
        <circle cx="26" cy="38" r="3" fill="#FF5868" /><circle cx="40" cy="40" r="3" fill="#22D8C1" />
      </>, size);
    case 'bens_raisin_bread':
      return frame(<>
        <path d="M10 24 Q10 12 24 12 L40 12 Q54 12 54 24 L54 50 L10 50Z" fill="#FFD232" {...O} />
        <circle cx="22" cy="28" r="3" fill="#FF2E96" /><circle cx="36" cy="25" r="3" fill="#FF2E96" /><circle cx="44" cy="36" r="3" fill="#FF2E96" /><circle cx="26" cy="40" r="3" fill="#FF2E96" />
      </>, size);
    case 'hot_cross_buns':
      return frame(<>
        <circle cx="32" cy="34" r="22" fill="#FFD232" {...O} />
        <path d="M32 18 V50 M16 34 H48" stroke="#FF5868" strokeWidth="5" strokeLinecap="round" />
      </>, size);
    case 'croissant_classic':
    case 'croissant_red': {
      const red = id === 'croissant_red';
      return frame(<>
        <path d="M6 40 C10 22 22 14 32 14 C42 14 54 22 58 40 C52 38 48 40 44 46 C40 40 24 40 20 46 C16 40 12 38 6 40Z" fill={red ? '#FF5868' : '#FFD232'} {...O} />
        <path d="M24 18 L26 38 M32 15 V38 M40 18 L38 38" stroke="#09111B" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.7" />
      </>, size);
    }
    case 'classic_risotto':
      return frame(<>
        <path d="M8 30 H56 C56 46 46 54 32 54 C18 54 8 46 8 30Z" fill="#FFD232" {...O} />
        <path d="M18 24 Q22 16 26 24 M32 22 Q36 12 40 22 M42 24 Q46 18 50 24" fill="none" stroke="#FF2E96" strokeWidth="3" strokeLinecap="round" />
      </>, size);
    default:
      return frame(<circle cx="32" cy="32" r="20" fill="#FFD232" {...O} />, size);
  }
}

/** Big hero pizza-slice mascot. */
export function HeroSlice() {
  return (
    <svg viewBox="0 0 120 120" className="hero-slice" aria-hidden="true" focusable="false">
      <path d="M14 20 Q60 0 106 20 L60 112 Z" fill="#FFD232" stroke="#16E6DD" strokeWidth="4" strokeLinejoin="round" />
      <path d="M14 20 Q60 0 106 20" fill="none" stroke="#FF5868" strokeWidth="9" strokeLinecap="round" />
      <circle cx="46" cy="42" r="8" fill="#FF5868" /><circle cx="72" cy="48" r="7" fill="#FF2E96" /><circle cx="58" cy="76" r="6.5" fill="#FF5868" />
      <circle cx="49" cy="40" r="2" fill="#FFF0D6" /><circle cx="74" cy="46" r="1.8" fill="#FFF0D6" />
      <path d="M52 56 q4 -7 8 0" stroke="#09111B" strokeWidth="3" fill="none" strokeLinecap="round" />
      <circle cx="50" cy="52" r="2" fill="#09111B" /><circle cx="68" cy="52" r="2" fill="#09111B" />
    </svg>
  );
}

export function Starburst({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`starburst ${className}`} aria-hidden="true" focusable="false">
      <path d="M12 0 L14 9 L24 12 L14 15 L12 24 L10 15 L0 12 L10 9Z" fill="currentColor" />
    </svg>
  );
}

export function Logo() {
  return (
    <span className="logo" aria-label="Hay's Crust and Crumb">
      <span className="logo-top">Hay’s</span>
      <span className="logo-main">Crust <i>&amp;</i> Crumb</span>
    </span>
  );
}
