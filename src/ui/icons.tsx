/** One authored line-icon set: 24px grid, 1.5px stroke, round caps. Decorative unless labelled. */
const PATHS = {
  arrow: 'M5 12h14M13 6l6 6-6 6',
  chevron: 'M9 6l6 6-6 6',
  back: 'M19 12H5M11 6l-6 6 6 6',
  print: 'M7 9V4h10v5M7 17H5a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-2M7 14h10v6H7z',
  edit: 'M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4',
  reset: 'M4 12a8 8 0 1 0 2.4-5.7M4 4v4h4',
  close: 'M6 6l12 12M18 6L6 18',
  copy: 'M9 9h10v10H9zM5 15V5h10',
  trash: 'M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13',
  download: 'M12 4v11M7 10l5 5 5-5M5 20h14',
  upload: 'M12 20V9M7 14l5-5 5 5M5 4h14',
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 18, label }: { name: IconName; size?: number; label?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="icon"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      <path d={PATHS[name]} />
    </svg>
  );
}

export function Logo() {
  return (
    <span className="logo">
      <span className="logo-script">Hay’s</span>
      <span className="logo-word">Crust &amp; Crumb</span>
    </span>
  );
}
