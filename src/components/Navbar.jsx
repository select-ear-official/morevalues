import React from 'react';
import { Compass, Edit3, Play, Moon, Sun, Download, Upload } from 'lucide-react';

export function Navbar({ activeTab, setActiveTab, user, onLoginClick, onLogoutClick, onViewProfile, onCreateTest }) {
  return (
    <header className="top-nav">
      <div className="top-brand" onClick={() => setActiveTab('explore')}>
        <span>MoreValues</span>
      </div>

      <nav className="top-menu">
        <button
          className={`menu-btn ${activeTab === 'explore' ? 'active' : ''}`}
          onClick={() => setActiveTab('explore')}
        >
          Browse Tests
        </button>

        <button
          className={`menu-btn ${activeTab === 'studio' ? 'active' : ''}`}
          onClick={onCreateTest || (() => setActiveTab('studio'))}
        >
          Create a Test
        </button>



        {user ? (
          <>
            <button 
              className={`menu-btn ${activeTab === 'profile' ? 'active' : ''}`} 
              onClick={onViewProfile}
            >
              Profile
            </button>
            <button className="menu-btn" onClick={onLogoutClick}>
              Log Out
            </button>
          </>
        ) : (
          <button className="menu-btn" onClick={onLoginClick}>
            Log In / Register
          </button>
        )}
      </nav>
    </header>
  );
}
