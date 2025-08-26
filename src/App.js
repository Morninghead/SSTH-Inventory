import React from 'react';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>🏭 Inventory Management System</h1>
        <div className="status-grid">
          <div className="status-card">
            <h3>✅ React Working</h3>
            <p>createRoot() successful</p>
          </div>
          <div className="status-card">
            <h3>🔒 Security Enabled</h3>
            <p>CSP blocking malicious scripts</p>
          </div>
          <div className="status-card">
            <h3>🚀 Ready for Development</h3>
            <p>Add Supabase & components</p>
          </div>
        </div>
      </header>
    </div>
  );
}

export default App;
