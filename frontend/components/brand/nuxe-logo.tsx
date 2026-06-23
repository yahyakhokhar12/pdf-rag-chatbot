type NuxeLogoProps = {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
};

const sizeClasses = {
  sm: {
    mark: 'h-7 w-7 rounded-[10px]',
    text: 'text-sm',
    sub: 'text-[9px]',
  },
  md: {
    mark: 'h-9 w-9 rounded-xl',
    text: 'text-base',
    sub: 'text-[10px]',
  },
  lg: {
    mark: 'h-14 w-14 rounded-2xl',
    text: 'text-2xl',
    sub: 'text-xs',
  },
};

export function NuxeLogo({ size = 'md', showText = true, className = '' }: NuxeLogoProps) {
  const classes = sizeClasses[size];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`nuxe-logo-mark logo-glow grid shrink-0 place-items-center overflow-hidden ${classes.mark}`}>
        <span className="nuxe-logo-orbit" />
        <svg viewBox="0 0 64 64" aria-hidden="true" className="relative z-10 h-[72%] w-[72%]">
          <path
            d="M15 46V18h8.5l17 18.8V18H49v28h-8.2L23.5 26.9V46H15Z"
            className="nuxe-logo-glyph"
          />
          <path
            d="M16 17.5 48 46.5"
            className="nuxe-logo-stroke"
            pathLength="1"
          />
        </svg>
      </div>

      {showText && (
        <div className="min-w-0">
          <span className={`block font-black leading-none tracking-tight text-white ${classes.text}`}>
            nuxe<span className="nuxe-logo-ai">AI</span>
          </span>
          <span className={`mt-1 block font-semibold uppercase tracking-[0.26em] text-cyan-200/70 ${classes.sub}`}>
            Document mind
          </span>
        </div>
      )}
    </div>
  );
}
