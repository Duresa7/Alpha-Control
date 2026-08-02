const FILTER_COLOR_MAP: Record<string, string> = {
  blue: '#64B5F6',
  yellow: '#C8AA6E',
  red: '#DC143C',
  orange: '#FFA726',
  gray: '#9E9E9E',
  purple: '#AB47BC',
  cyan: '#00F0FF',
  olive: '#8B9A46',
};

interface FilterBoxProps {
  active: boolean;
  onClick: () => void;
  label: string;
  color?: 'blue' | 'yellow' | 'red' | 'orange' | 'gray' | 'purple' | 'cyan' | 'olive';
  hexColor?: string;
}

export function FilterBox({ active, onClick, label, color = 'blue', hexColor }: FilterBoxProps) {
  const activeColor = hexColor || FILTER_COLOR_MAP[color];

  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center p-3.5 border transition-all duration-250 cursor-pointer"
      style={{
        background: active
          ? `linear-gradient(160deg, rgba(255, 255, 255, 0.08) 0%, transparent 70%), rgba(200, 170, 110, 0.08)`
          : 'linear-gradient(160deg, rgba(255, 255, 255, 0.04) 0%, transparent 70%), rgba(5, 6, 10, 0.4)',
        borderColor: active ? `${activeColor}55` : 'rgba(255, 255, 255, 0.08)',
        borderRadius: '12px',
        boxShadow: active
          ? 'inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 4px 14px -6px rgba(0, 0, 0, 0.5)'
          : 'inset 0 1px 0 rgba(255, 255, 255, 0.05)',
      }}
    >
      <span
        className="text-[12px] font-medium tracking-wider uppercase holo-label-orbitron"
        style={{
          color: active ? activeColor : 'rgba(200, 170, 110, 0.3)',
        }}
      >
        {label}
      </span>
    </button>
  );
}
