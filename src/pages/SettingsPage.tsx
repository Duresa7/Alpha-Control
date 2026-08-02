import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';

import '@/styles/settings.css';

import { NewsShell } from '@/components/news/NewsShell';
import {
  AccountSettingsSection,
  type SettingsMessage,
} from '@/components/news/settings/AccountSettingsSection';
import {
  SettingsSectionNav,
  type SettingsSectionKey,
} from '@/components/news/settings/SettingsSectionNav';
import { ThemeSettingsSection } from '@/components/news/settings/ThemeSettingsSection';
import { useNewsThemeContext } from '@/components/news/theme/newsTheme';
import { updateDisplayName, logAction } from '@/data/supabaseStorage';
import { useAuth } from '@/hooks/useAuth';
import { PASSWORD_RULES } from '@/hooks/useAuthForm';
import { getUserIdentity } from '@/utils/getUserIdentity';
import { isGoogleOnlyAccount } from '@/utils/googleAuth';

function SettingsPageContent() {
  const navigate = useNavigate();
  const { session, profile, refreshProfile, updateEmail, updatePassword, deleteAccount } =
    useAuth();
  const googleOnlyAccount = isGoogleOnlyAccount(session);
  const { theme, setTheme } = useNewsThemeContext();
  const { displayName: identityDisplayName } = getUserIdentity(session, profile, 'Signed In');
  const [activeSection, setActiveSection] = useState<SettingsSectionKey>('account');

  const [displayName, setDisplayName] = useState(profile?.display_name ?? '');
  const [displayNameSaving, setDisplayNameSaving] = useState(false);
  const [displayNameMsg, setDisplayNameMsg] = useState<SettingsMessage>(null);

  const [newEmail, setNewEmail] = useState('');
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailMsg, setEmailMsg] = useState<SettingsMessage>(null);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<SettingsMessage>(null);

  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteMsg, setDeleteMsg] = useState<SettingsMessage>(null);

  const handleDisplayNameSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setDisplayNameMsg(null);
    const trimmed = displayName.trim();
    if (!trimmed) {
      setDisplayNameMsg({
        type: 'error',
        text: 'Display name cannot be empty.',
      });
      return;
    }
    if (!session?.user?.id) return;
    setDisplayNameSaving(true);
    const { error } = await updateDisplayName(session.user.id, trimmed);
    if (error) {
      setDisplayNameMsg({ type: 'error', text: error });
    } else {
      await logAction('display_name_changed', 'user', session.user.id, trimmed, {
        previous: profile?.display_name,
      });
      await refreshProfile();
      setDisplayNameMsg({ type: 'success', text: 'Display name updated.' });
    }
    setDisplayNameSaving(false);
  };

  const handleEmailSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setEmailMsg(null);
    const trimmedEmail = newEmail.trim();
    if (!trimmedEmail) {
      setEmailMsg({ type: 'error', text: 'Please enter a new email address.' });
      return;
    }
    setEmailSaving(true);
    const { error } = await updateEmail(trimmedEmail);
    if (error) {
      setEmailMsg({ type: 'error', text: error });
    } else {
      if (session?.user?.id) {
        await logAction('email_changed', 'user', session.user.id, profile?.display_name ?? '', {
          newEmail: trimmedEmail,
        });
      }
      setEmailMsg({
        type: 'success',
        text: 'Check your new email for a confirmation link.',
      });
      setNewEmail('');
    }
    setEmailSaving(false);
  };

  const handlePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);
    const failedRules = PASSWORD_RULES.filter((rule) => !rule.test(newPassword));
    if (failedRules.length > 0) {
      setPasswordMsg({
        type: 'error',
        text: `Password requires: ${failedRules.map((rule) => rule.label).join(', ')}`,
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'Passwords do not match.' });
      return;
    }
    setPasswordSaving(true);
    const { error } = await updatePassword(newPassword);
    if (error) {
      setPasswordMsg({ type: 'error', text: error });
    } else {
      if (session?.user?.id) {
        await logAction('password_changed', 'user', session.user.id, profile?.display_name ?? '');
      }
      setPasswordMsg({
        type: 'success',
        text: 'Password updated successfully.',
      });
      setNewPassword('');
      setConfirmPassword('');
    }
    setPasswordSaving(false);
  };

  const handleDeleteAccount = async () => {
    setDeleteMsg(null);
    setDeleting(true);
    const { error } = await deleteAccount();
    if (error) {
      setDeleteMsg({ type: 'error', text: error });
      setDeleting(false);
    } else {
      navigate('/', { replace: true });
    }
  };

  return (
    <div className="settings-page">
      <div className="settings-page__hero">
        <p className="settings-page__kicker">Account</p>
        <h1 className="settings-page__name">Settings</h1>
        {session && <p className="settings-page__subtitle">Signed in as {identityDisplayName}</p>}
      </div>

      <div className="settings-page__layout">
        <SettingsSectionNav activeSection={activeSection} onSectionChange={setActiveSection} />

        <div className="settings-page__panel">
          {activeSection === 'account' && (
            <AccountSettingsSection
              currentEmail={session?.user?.email}
              googleOnlyAccount={googleOnlyAccount}
              displayName={displayName}
              onDisplayNameChange={(e) => setDisplayName(e.target.value)}
              onDisplayNameSubmit={handleDisplayNameSubmit}
              displayNameSaving={displayNameSaving}
              displayNameMsg={displayNameMsg}
              newEmail={newEmail}
              onNewEmailChange={(e) => setNewEmail(e.target.value)}
              onEmailSubmit={handleEmailSubmit}
              emailSaving={emailSaving}
              emailMsg={emailMsg}
              newPassword={newPassword}
              confirmPassword={confirmPassword}
              onNewPasswordChange={(e) => setNewPassword(e.target.value)}
              onConfirmPasswordChange={(e) => setConfirmPassword(e.target.value)}
              onPasswordSubmit={handlePasswordSubmit}
              passwordSaving={passwordSaving}
              passwordMsg={passwordMsg}
              passwordStrength={PASSWORD_RULES.filter((rule) => rule.test(newPassword)).length}
              passwordRulesCount={PASSWORD_RULES.length}
              deleteConfirm={deleteConfirm}
              onDeleteConfirmChange={(e) => setDeleteConfirm(e.target.value)}
              onDeleteAccount={handleDeleteAccount}
              deleting={deleting}
              deleteMsg={deleteMsg}
            />
          )}

          {activeSection === 'theme' && <ThemeSettingsSection theme={theme} setTheme={setTheme} />}
        </div>
      </div>
    </div>
  );
}

export function SettingsPage() {
  return (
    <NewsShell>
      <SettingsPageContent />
    </NewsShell>
  );
}
