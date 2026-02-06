/**
 * Main Admin App
 * Entry point for the Sugar Diary Admin Control Panel
 */

import React, { useState, useEffect } from 'react';
import { signInWithGoogle, signOutAdmin, onAdminAuthStateChanged } from './auth/AdminAuth';
import { getConfig, saveConfig, getConfigHistory, rollbackToVersion, DEFAULT_CONFIG } from './config/ConfigStore';
import { logAction } from './audit/AuditLogger';
import FeatureFlagController from './modules/FeatureFlagController';
import UIControlPanel from './modules/UIControlPanel';
import UXEngine from './modules/UXEngine';
import SoundHapticStudio from './modules/SoundHapticStudio';
import MedicalRulesEngine from './modules/MedicalRulesEngine';
import AIControlCenter from './modules/AIControlCenter';
import MedDatabaseControl from './modules/MedDatabaseControl';
import LivePreview from './modules/LivePreview';
import {
  Settings, LogOut, History, RotateCcw, Save, Shield,
  Palette, Sliders, Volume2, Database, Brain, Pill, Eye
} from 'lucide-react';
import './App.css';
import './modules.css';
import './preview.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [activeModule, setActiveModule] = useState('features');
  const [configHistory, setConfigHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const unsubscribe = onAdminAuthStateChanged(async (authUser) => {
      setUser(authUser);
      if (authUser) {
        // Load current config
        const currentConfig = await getConfig();
        setConfig(currentConfig);

        // Load history
        const history = await getConfigHistory();
        setConfigHistory(history);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      alert(error.message);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutAdmin();
    } catch (error) {
      alert(error.message);
    }
  };

  const handleUpdateConfig = async (updates) => {
    try {
      setIsSaving(true);
      const newConfig = { ...config, ...updates };
      const changes = Object.keys(updates).map(key => `Updated ${key}`);

      await saveConfig(newConfig, user, changes);
      await logAction('config_update', { changes }, user);

      setConfig(newConfig);

      // Refresh history
      const history = await getConfigHistory();
      setConfigHistory(history);

      alert('Configuration saved successfully!');
    } catch (error) {
      alert('Error saving configuration: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRollback = async (versionId) => {
    if (!confirm('Are you sure you want to rollback to this version?')) return;

    try {
      await rollbackToVersion(versionId, user);
      await logAction('config_rollback', { versionId }, user);

      const currentConfig = await getConfig();
      setConfig(currentConfig);

      const history = await getConfigHistory();
      setConfigHistory(history);

      alert('Rollback successful!');
      setShowHistory(false);
    } catch (error) {
      alert('Error rolling back: ' + error.message);
    }
  };

  const modules = [
    { id: 'features', label: 'Feature Flags', icon: Shield, component: FeatureFlagController },
    { id: 'ui', label: 'UI Control', icon: Palette, component: UIControlPanel },
    { id: 'medical', label: 'Medical Rules', icon: Database, component: MedicalRulesEngine },
    { id: 'ai', label: 'AI Control', icon: Brain, component: AIControlCenter },
    { id: 'ux', label: 'UX Engine', icon: Sliders, component: UXEngine },
    { id: 'sound', label: 'Sound & Haptic', icon: Volume2, component: SoundHapticStudio },
    { id: 'meds', label: 'Medications', icon: Pill, component: MedDatabaseControl },
    { id: 'preview', label: 'Live Preview', icon: Eye, component: LivePreview }
  ];

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading Admin Panel...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="login-screen">
        <div className="login-card">
          <Shield size={64} className="login-icon" />
          <h1>Sugar Diary Admin</h1>
          <p>Sign in with your admin account to continue</p>
          <button onClick={handleSignIn} className="sign-in-btn">
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  const ActiveModuleComponent = modules.find(m => m.id === activeModule)?.component;

  return (
    <div className="admin-app">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <Shield size={32} />
          <h1>Admin Panel</h1>
        </div>

        <nav className="sidebar-nav">
          {modules.map(module => (
            <button
              key={module.id}
              className={`nav-item ${activeModule === module.id ? 'active' : ''} ${!module.component ? 'disabled' : ''}`}
              onClick={() => module.component && setActiveModule(module.id)}
              disabled={!module.component}
            >
              <module.icon size={20} />
              <span>{module.label}</span>
              {!module.component && <span className="badge">Soon</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button onClick={() => setShowHistory(!showHistory)} className="history-btn">
            <History size={20} />
            History
          </button>
          <div className="user-info">
            <span>{user.email}</span>
            <button onClick={handleSignOut} className="sign-out-btn">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {ActiveModuleComponent ? (
          <ActiveModuleComponent
            config={config}
            onUpdate={handleUpdateConfig}
            isSaving={isSaving}
          />
        ) : (
          <div className="coming-soon">
            <Settings size={64} />
            <h2>Coming Soon</h2>
            <p>This module is under development</p>
          </div>
        )}
      </main>

      {/* History Panel */}
      {showHistory && (
        <div className="history-panel">
          <div className="history-header">
            <h2>Configuration History</h2>
            <button onClick={() => setShowHistory(false)} className="close-btn">×</button>
          </div>
          <div className="history-list">
            {configHistory.map(item => (
              <div key={item.id} className="history-item">
                <div className="history-info">
                  <p className="history-date">
                    {item.timestamp?.toDate?.()?.toLocaleString() || 'Unknown date'}
                  </p>
                  <p className="history-author">{item.author}</p>
                  <ul className="history-changes">
                    {item.changes?.map((change, i) => (
                      <li key={i}>{change}</li>
                    ))}
                  </ul>
                </div>
                <button
                  onClick={() => handleRollback(item.id)}
                  className="rollback-btn"
                >
                  <RotateCcw size={16} />
                  Rollback
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
