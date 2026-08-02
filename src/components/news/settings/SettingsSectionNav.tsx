export type SettingsSectionKey = 'account' | 'theme';

const SECTIONS: Array<{ key: SettingsSectionKey; label: string }> = [
  { key: 'account', label: 'Account' },
  { key: 'theme', label: 'Theme' },
];

interface SettingsSectionNavProps {
  activeSection: SettingsSectionKey;
  onSectionChange: (section: SettingsSectionKey) => void;
}

export function SettingsSectionNav({ activeSection, onSectionChange }: SettingsSectionNavProps) {
  return (
    <aside className="settings-page__sidecard">
      <div className="settings-page__sidecard-nav" role="tablist" aria-label="Settings sections">
        {SECTIONS.map((section) => (
          <button
            key={section.key}
            type="button"
            role="tab"
            aria-selected={activeSection === section.key}
            aria-controls={`settings-panel-${section.key}`}
            className="settings-page__sidecard-btn"
            onClick={() => onSectionChange(section.key)}
          >
            <span className="settings-page__sidecard-btn-title">{section.label}</span>
          </button>
        ))}
      </div>
    </aside>
  );
}
