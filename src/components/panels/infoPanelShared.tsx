import { useState } from 'react';
import { useFactionStore } from '@/store/factionStore';
import { readableOnDark } from '@/utils/color';

export interface EditableFieldProps {
  label: string;
  value: string;
  placeholder: string;
  editable?: boolean;
  editing: boolean;
  draft: string;
  onStartEdit: () => void;
  onDraftChange: (v: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

export function EditableInfoRow({
  label,
  value,
  placeholder,
  editable = true,
  editing,
  draft,
  onStartEdit,
  onDraftChange,
  onSave,
  onCancel,
}: EditableFieldProps) {
  return (
    <div className="flex justify-between items-center text-[14px]">
      <span className="holo-label-inline">{label}</span>
      {!editable ? (
        <span className="holo-value-inline">{value || placeholder}</span>
      ) : editing ? (
        <div className="flex items-center gap-1">
          <input
            type="text"
            value={draft}
            onChange={(e) => onDraftChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSave();
              if (e.key === 'Escape') onCancel();
            }}
            autoFocus
            className="holo-input holo-field-input w-28 text-right"
          />
          <button onClick={onSave} className="holo-edit-action holo-edit-action-save px-1">
            &#10003;
          </button>
        </div>
      ) : (
        <span
          onClick={onStartEdit}
          className="cursor-pointer hover:underline holo-value-inline holo-editable-text"
          title="Click to edit"
        >
          {value || placeholder}
        </span>
      )}
    </div>
  );
}

/**
 * One row of the planet spec sheet. Comma-separated values are split into chips
 * so a long list wraps within its column instead of stretching the panel.
 */
export function EditableSpecRow({
  label,
  value,
  placeholder,
  editable = true,
  editing,
  draft,
  onStartEdit,
  onDraftChange,
  onSave,
  onCancel,
}: EditableFieldProps) {
  const items = value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const interactive = editable ? ' is-editable' : '';
  const title = editable ? 'Click to edit' : undefined;

  return (
    <div className="holo-spec-row">
      <span className="holo-spec-label">{label}</span>
      {editing ? (
        <div className="holo-spec-edit">
          <input
            type="text"
            value={draft}
            onChange={(e) => onDraftChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSave();
              if (e.key === 'Escape') onCancel();
            }}
            autoFocus
            className="holo-input holo-field-input min-w-0 flex-1 text-left text-sm"
          />
          <button onClick={onSave} className="holo-edit-action holo-edit-action-save px-1">
            &#10003;
          </button>
        </div>
      ) : items.length > 0 ? (
        <div
          onClick={editable ? onStartEdit : undefined}
          className={`holo-spec-chips${interactive}`}
          title={title}
        >
          {items.map((item, i) => (
            <span key={i} className="holo-spec-chip">
              {item}
            </span>
          ))}
        </div>
      ) : (
        <span
          onClick={editable ? onStartEdit : undefined}
          className={`holo-spec-empty${interactive}`}
          title={title}
        >
          {placeholder}
        </span>
      )}
    </div>
  );
}

export function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-[14px]">
      <span className="holo-label-inline">{label}</span>
      <span className="holo-value-inline">{value}</span>
    </div>
  );
}

export function AddFactionControl({
  existingFactions,
  onAdd,
}: {
  existingFactions: string[];
  onAdd: (faction: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const factions = useFactionStore((s) => s.factions);
  const getFactionLabel = useFactionStore((s) => s.getFactionLabel);
  const getFactionBarColor = useFactionStore((s) => s.getFactionBarColor);

  const available = factions.filter((f) => !existingFactions.includes(f.id));
  if (available.length === 0) return null;

  return open ? (
    <div className="flex flex-wrap gap-1 mt-1">
      {available.map((f) => (
        <button
          key={f.id}
          onClick={() => {
            onAdd(f.id);
            setOpen(false);
          }}
          className="holo-badge text-[9px] cursor-pointer hover:bg-amber-500/10 transition-colors"
          style={{
            borderColor: getFactionBarColor(f.id),
            color: readableOnDark(getFactionBarColor(f.id)),
          }}
        >
          + {getFactionLabel(f.id)}
        </button>
      ))}
    </div>
  ) : (
    <button onClick={() => setOpen(true)} className="holo-inline-link mt-1">
      + Add Faction Influence
    </button>
  );
}
