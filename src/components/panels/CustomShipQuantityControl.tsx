import { Minus, Plus } from 'lucide-react';
interface CustomShipQuantityControlProps {
  ariaLabel: string;
  clamp: (value: number) => number;
  max: number;
  min: number;
  onChange: (value: number) => void;
  value: number;
}

export function CustomShipQuantityControl({
  ariaLabel,
  clamp,
  max,
  min,
  onChange,
  value,
}: CustomShipQuantityControlProps) {
  return (
    <div className="fleet-custom-qty-row">
      <button
        className="fleet-custom-qty-btn"
        onClick={() => onChange(clamp(value - 1))}
        disabled={value <= min}
        title="Decrease quantity"
      >
        <Minus size={10} strokeWidth={2.5} aria-hidden="true" />
      </button>
      <input
        type="number"
        min={min}
        max={max}
        step={1}
        value={value}
        onChange={(e) => onChange(clamp(Number(e.target.value)))}
        className="holo-input fleet-custom-qty-input"
        aria-label={ariaLabel}
      />
      <button
        className="fleet-custom-qty-btn"
        onClick={() => onChange(clamp(value + 1))}
        disabled={value >= max}
        title="Increase quantity"
      >
        <Plus size={10} strokeWidth={2.5} aria-hidden="true" />
      </button>
    </div>
  );
}
