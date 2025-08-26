import React, { useState } from 'react';
import './App.css';

function App() {
  const [user, setUser] = useState(null);

  if (!user) {
    return <LoginPage setUser={setUser} />;
  }

  return <Dashboard user={user} setUser={setUser} />;
}

function LoginPage({ setUser }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    // Simple demo login
    setUser({ email, name: 'Demo User' });
  };

  return (
    <div className="login-container">
      <div className="login-form">
        <h1>📦 Inventory System</h1>
        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="อีเมล"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="รหัสผ่าน"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit">เข้าสู่ระบบ</button>
        </form>
      </div>
    </div>
  );
}

function Dashboard({ user, setUser }) {
  return (
    <div className="dashboard">
      <header>
        <h1>📦 Inventory Management System</h1>
        <div>
          <span>สวัสดี {user.name}</span>
          <button onClick={() => setUser(null)}>ออกจากระบบ</button>
        </div>
      </header>
      
      <main>
        <div className="stats-grid">
          <div className="stat-card">
            <h3>สินค้าทั้งหมด</h3>
            <p className="stat-number">0</p>
          </div>
          <div className="stat-card">
            <h3>สินค้าใกล้หมด</h3>
            <p className="stat-number">0</p>
          </div>
          <div className="stat-card">
            <h3>ธุรกรรมวันนี้</h3>
            <p className="stat-number">0</p>
          </div>
        </div>
        
        <div className="info-section">
          <h2>ระบบ Inventory Management</h2>
          <p>พร้อมใช้งาน! ระบบนี้จะเชื่อมต่อกับ Supabase ในขั้นตอนถัดไป</p>
          <ul>
            <li>✅ Authentication System</li>
            <li>✅ Dashboard Interface</li>
            <li>🔄 Supabase Integration (Coming Soon)</li>
            <li>🔄 Inventory Management (Coming Soon)</li>
          </ul>
        </div>
      </main>
    </div>
  );
}

export default App;
