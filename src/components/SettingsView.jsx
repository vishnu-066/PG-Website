import React, { useState } from 'react';
import { useAdmin } from './AdminContext';

export default function SettingsView() {
  const { 
    adminProfile, 
    updateProfile, 
    changePassword, 
    backupData, 
    restoreData 
  } = useAdmin();

  // Profile Form States
  const [name, setName] = useState(adminProfile.name);
  const [username, setUsername] = useState(adminProfile.username);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // Password Form States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState('');
  const [pwdError, setPwdError] = useState('');

  // Backup & Restore States
  const [restoreSuccess, setRestoreSuccess] = useState('');
  const [restoreError, setRestoreError] = useState('');

  // Handle Profile Update
  const handleProfileSubmit = (e) => {
    e.preventDefault();
    setProfileSuccess('');
    setProfileError('');

    if (!name.trim() || !username.trim()) {
      setProfileError('Fields cannot be empty');
      return;
    }

    updateProfile(name, username);
    setProfileSuccess('Profile updated successfully!');
  };

  // Handle Password Update
  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    setPwdSuccess('');
    setPwdError('');

    if (newPassword !== confirmPassword) {
      setPwdError('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setPwdError('Password must be at least 6 characters long');
      return;
    }

    const res = changePassword(currentPassword, newPassword);
    if (res.success) {
      setPwdSuccess('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setPwdError(res.message || 'Incorrect current password');
    }
  };

  // Trigger Backup Download
  const handleDownloadBackup = () => {
    const backupStr = backupData();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(backupStr);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `svpg_db_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);
  };

  // Trigger Restore Upload
  const handleRestoreUpload = (e) => {
    setRestoreSuccess('');
    setRestoreError('');
    
    const fileReader = new FileReader();
    const files = e.target.files;
    
    if (files.length === 0) return;
    
    fileReader.onload = (event) => {
      const jsonContent = event.target.result;
      const res = restoreData(jsonContent);
      if (res.success) {
        setRestoreSuccess('Database restored successfully! Reloading...');
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        setRestoreError(res.message || 'Restoration failed. Please check the backup file structure.');
      }
    };
    
    fileReader.readAsText(files[0]);
  };

  return (
    <div className="admin-view-container">
      <div className="view-header">
        <div>
          <h1>System Settings</h1>
          <p>Manage credentials, configure profile preferences, and run data backups.</p>
        </div>
      </div>

      <div className="settings-panels-grid">
        {/* Profile Card */}
        <div className="settings-card glass-card">
          <h3>Admin Profile Settings</h3>
          <p className="card-desc-muted">Manage your admin display name and login username.</p>
          
          {profileSuccess && <div className="settings-alert-success">{profileSuccess}</div>}
          {profileError && <div className="settings-alert-error">{profileError}</div>}

          <form onSubmit={handleProfileSubmit} className="settings-form">
            <div className="form-group-flat">
              <label>Manager Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="form-group-flat">
              <label>Login Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="primary">Update Profile</button>
          </form>
        </div>

        {/* Change Password Card */}
        <div className="settings-card glass-card">
          <h3>Change Security Password</h3>
          <p className="card-desc-muted">Change your current owner portal login password.</p>

          {pwdSuccess && <div className="settings-alert-success">{pwdSuccess}</div>}
          {pwdError && <div className="settings-alert-error">{pwdError}</div>}

          <form onSubmit={handlePasswordSubmit} className="settings-form">
            <div className="form-group-flat">
              <label>Current Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>
            <div className="form-group-flat">
              <label>New Password</label>
              <input
                type="password"
                placeholder="Min 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            <div className="form-group-flat">
              <label>Confirm New Password</label>
              <input
                type="password"
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="primary">Change Password</button>
          </form>
        </div>

        {/* Backup & Disaster Recovery */}
        <div className="settings-card glass-card full-width">
          <h3>Backup & Disaster Recovery</h3>
          <p className="card-desc-muted">Download your entire property ledger and room configuration database state as a JSON backup file, or upload a backup file to restore records.</p>
          
          {restoreSuccess && <div className="settings-alert-success">{restoreSuccess}</div>}
          {restoreError && <div className="settings-alert-error">{restoreError}</div>}

          <div className="backup-restore-action-row">
            <div className="backup-segment">
              <h4>Download Database Backup</h4>
              <p>Generates a complete snapshot of all rooms, beds, active tenants, and transaction logs.</p>
              <button className="primary" onClick={handleDownloadBackup} style={{ marginTop: '16px' }}>
                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                <span>Backup JSON Database</span>
              </button>
            </div>
            
            <div className="divider-vert"></div>
            
            <div className="restore-segment">
              <h4>Restore Database Snapshot</h4>
              <p>Upload a previously generated `.json` backup file. WARNING: This will overwrite all active database states.</p>
              <div className="restore-upload-btn-wrapper" style={{ marginTop: '16px' }}>
                <input
                  type="file"
                  id="restore-file-upload"
                  accept=".json"
                  onChange={handleRestoreUpload}
                  style={{ display: 'none' }}
                />
                <label htmlFor="restore-file-upload" className="primary" style={{ cursor: 'pointer', display: 'inline-flex' }}>
                  <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  <span>Upload & Restore Database</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
