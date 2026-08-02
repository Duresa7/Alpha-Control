import type { ChangeEventHandler, FormEventHandler } from 'react';

export type SettingsMessage = {
  type: 'success' | 'error';
  text: string;
} | null;

interface AccountSettingsSectionProps {
  currentEmail: string | null | undefined;
  googleOnlyAccount: boolean;
  displayName: string;
  onDisplayNameChange: ChangeEventHandler<HTMLInputElement>;
  onDisplayNameSubmit: FormEventHandler<HTMLFormElement>;
  displayNameSaving: boolean;
  displayNameMsg: SettingsMessage;
  newEmail: string;
  onNewEmailChange: ChangeEventHandler<HTMLInputElement>;
  onEmailSubmit: FormEventHandler<HTMLFormElement>;
  emailSaving: boolean;
  emailMsg: SettingsMessage;
  newPassword: string;
  confirmPassword: string;
  onNewPasswordChange: ChangeEventHandler<HTMLInputElement>;
  onConfirmPasswordChange: ChangeEventHandler<HTMLInputElement>;
  onPasswordSubmit: FormEventHandler<HTMLFormElement>;
  passwordSaving: boolean;
  passwordMsg: SettingsMessage;
  passwordStrength: number;
  passwordRulesCount: number;
  deleteConfirm: string;
  onDeleteConfirmChange: ChangeEventHandler<HTMLInputElement>;
  onDeleteAccount: () => void;
  deleting: boolean;
  deleteMsg: SettingsMessage;
}

function MessageBanner({ message }: { message: SettingsMessage }) {
  if (!message) {
    return null;
  }

  return (
    <div className={`settings-page__msg settings-page__msg--${message.type}`}>{message.text}</div>
  );
}

export function AccountSettingsSection({
  currentEmail,
  googleOnlyAccount,
  displayName,
  onDisplayNameChange,
  onDisplayNameSubmit,
  displayNameSaving,
  displayNameMsg,
  newEmail,
  onNewEmailChange,
  onEmailSubmit,
  emailSaving,
  emailMsg,
  newPassword,
  confirmPassword,
  onNewPasswordChange,
  onConfirmPasswordChange,
  onPasswordSubmit,
  passwordSaving,
  passwordMsg,
  passwordStrength,
  passwordRulesCount,
  deleteConfirm,
  onDeleteConfirmChange,
  onDeleteAccount,
  deleting,
  deleteMsg,
}: AccountSettingsSectionProps) {
  const passwordStrengthPercent = (passwordStrength / passwordRulesCount) * 100;
  const passwordStrengthColor =
    passwordStrength <= 2 ? '#dc3545' : passwordStrength <= 4 ? '#f0ad4e' : '#5cb85c';
  const passwordStrengthLabel =
    passwordStrength <= 2 ? 'Weak' : passwordStrength <= 4 ? 'Fair' : 'Strong';

  return (
    <section id="settings-panel-account" className="settings-page__group" role="tabpanel">
      <div className="settings-page__group-header">
        <p className="settings-page__group-kicker">Account</p>
        <h2 className="settings-page__group-title">Account Settings</h2>
      </div>

      <div className="settings-page__section">
        <h3 className="settings-page__section-title">Display Name</h3>
        <MessageBanner message={displayNameMsg} />
        <form onSubmit={onDisplayNameSubmit} className="settings-page__form">
          <div className="settings-page__field">
            <input
              type="text"
              value={displayName}
              onChange={onDisplayNameChange}
              className="settings-page__input"
              placeholder="Your display name"
              maxLength={40}
              required
            />
          </div>
          <button type="submit" disabled={displayNameSaving} className="settings-page__submit">
            {displayNameSaving ? 'Saving...' : 'Save Name'}
          </button>
        </form>
      </div>

      <div className="settings-page__section">
        <h3 className="settings-page__section-title">Change Email</h3>
        <p className="settings-page__hint">Current: {currentEmail ?? 'Unknown'}</p>
        <MessageBanner message={emailMsg} />
        <form onSubmit={onEmailSubmit} className="settings-page__form">
          <div className="settings-page__field">
            <label className="settings-page__label">New Email</label>
            <input
              type="email"
              value={newEmail}
              onChange={onNewEmailChange}
              className="settings-page__input"
              placeholder="new@example.com"
              required
            />
          </div>
          <button type="submit" disabled={emailSaving} className="settings-page__submit">
            {emailSaving ? 'Updating...' : 'Update Email'}
          </button>
        </form>
      </div>

      {!googleOnlyAccount && (
        <div className="settings-page__section">
          <h3 className="settings-page__section-title">Change Password</h3>
          <MessageBanner message={passwordMsg} />
          <form onSubmit={onPasswordSubmit} className="settings-page__form">
            <div className="settings-page__field">
              <label className="settings-page__label">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={onNewPasswordChange}
                className="settings-page__input"
                placeholder="Min 8 chars, mixed case, digit, special"
                required
              />
              {newPassword.length > 0 && (
                <div className="settings-page__strength">
                  <div className="settings-page__strength-bar">
                    <div
                      className="settings-page__strength-fill"
                      style={{
                        width: `${passwordStrengthPercent}%`,
                        background: passwordStrengthColor,
                      }}
                    />
                  </div>
                  <span className="settings-page__strength-label">{passwordStrengthLabel}</span>
                </div>
              )}
            </div>
            <div className="settings-page__field">
              <label className="settings-page__label">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={onConfirmPasswordChange}
                className="settings-page__input"
                placeholder="Re-enter new password"
                required
              />
            </div>
            <button type="submit" disabled={passwordSaving} className="settings-page__submit">
              {passwordSaving ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      )}

      <div className="settings-page__section settings-page__section--danger">
        <h3 className="settings-page__section-title settings-page__section-title--danger">
          Delete Account
        </h3>
        <p className="settings-page__danger-text">
          Permanently delete your account and all associated data. This action cannot be undone.
        </p>
        <MessageBanner message={deleteMsg} />
        <div className="settings-page__field">
          <label className="settings-page__label">
            Type <strong>DELETE</strong> to confirm
          </label>
          <input
            type="text"
            value={deleteConfirm}
            onChange={onDeleteConfirmChange}
            className="settings-page__input settings-page__input--danger"
            placeholder="DELETE"
          />
        </div>
        <button
          onClick={onDeleteAccount}
          disabled={deleteConfirm !== 'DELETE' || deleting}
          className="settings-page__submit settings-page__submit--danger settings-page__danger-action"
        >
          {deleting ? 'Deleting...' : 'Delete My Account'}
        </button>
      </div>
    </section>
  );
}
