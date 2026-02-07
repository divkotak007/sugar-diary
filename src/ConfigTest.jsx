/**
 * Test Component to Verify Admin Config Sync
 * Add this temporarily to your main app to test if config is syncing
 */

import React from 'react';
import { useConfig } from './hooks/useConfig';

export default function ConfigTest() {
    const { config, loading, error } = useConfig();

    if (loading) return <div style={{ padding: '20px', background: '#f0f0f0' }}>Loading config...</div>;
    if (error) return <div style={{ padding: '20px', background: '#fee', color: 'red' }}>Error: {error}</div>;

    return (
        <div style={{ padding: '20px', background: '#e8f5e9', margin: '20px', borderRadius: '8px' }}>
            <h3>🔄 Admin Config Sync Test</h3>
            <p><strong>Status:</strong> ✅ Connected!</p>

            <div style={{ marginTop: '20px', background: 'white', padding: '15px', borderRadius: '4px' }}>
                <h4>Current Config Values:</h4>
                <ul>
                    <li><strong>AI Enabled:</strong> {config?.ai?.enabled ? '✅ YES' : '❌ NO'}</li>
                    <li><strong>Primary Color:</strong> <span style={{
                        background: config?.ui?.colors?.light?.primary,
                        padding: '2px 10px',
                        color: 'white',
                        borderRadius: '4px'
                    }}>{config?.ui?.colors?.light?.primary}</span></li>
                    <li><strong>Font Family:</strong> {config?.ui?.typography?.fontFamily}</li>
                    <li><strong>Animations:</strong> {config?.ui?.animations?.enabled ? 'ON' : 'OFF'}</li>
                </ul>
            </div>

            <div style={{ marginTop: '15px', padding: '10px', background: '#fff3cd', borderRadius: '4px' }}>
                <small>
                    💡 <strong>Test:</strong> Go to admin app, change a value, and watch this update in real-time!
                </small>
            </div>

            <details style={{ marginTop: '15px' }}>
                <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>View Full Config (Debug)</summary>
                <pre style={{
                    background: '#f5f5f5',
                    padding: '10px',
                    borderRadius: '4px',
                    overflow: 'auto',
                    maxHeight: '300px',
                    fontSize: '12px'
                }}>
                    {JSON.stringify(config, null, 2)}
                </pre>
            </details>
        </div>
    );
}

/**
 * HOW TO USE:
 * 
 * 1. Add this component to your main App.jsx:
 * 
 *    import ConfigTest from './ConfigTest';
 * 
 *    function App() {
 *      return (
 *        <div>
 *          <ConfigTest />  // Add this at the top
 *          // ... rest of your app
 *        </div>
 *      );
 *    }
 * 
 * 2. Open your main app in browser
 * 3. Open admin app in another tab
 * 4. Change a value in admin app and click "Save Changes"
 * 5. Watch the ConfigTest component update in real-time!
 * 
 * If it updates → ✅ Sync is working!
 * If it doesn't → Check Firebase config and console for errors
 */
