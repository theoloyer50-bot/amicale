import { Menu, X, User, LogOut } from 'lucide-react';
import { useState } from 'react';

interface HeaderProps {
  user: { email: string } | null;
  onLoginClick: () => void;
  onLogout: () => void;
}

export function Header({ user, onLoginClick, onLogout }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-red-700 text-white sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" className="w-10 h-10">
                <path d="M12 2L3 9v11a2 2 0 002 2h14a2 2 0 002-2V9l-9-7z" fill="#DC2626" stroke="#DC2626" strokeWidth="1"/>
                <path d="M12 2v20M12 8h6M12 12h6M12 16h6M6 8h6M6 12h6M6 16h6" stroke="white" strokeWidth="1.5"/>
              </svg>
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl">Amicale des Sapeurs Pompiers</h1>
              <p className="text-sm text-red-100">Tourlaville - Manche</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* User menu */}
            {user ? (
              <div className="hidden md:flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <User className="w-5 h-5" />
                  <span className="text-sm">{user.email}</span>
                </div>
                <button
                  onClick={onLogout}
                  className="flex items-center space-x-1 bg-red-800 hover:bg-red-900 px-3 py-2 rounded transition"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Déconnexion</span>
                </button>
              </div>
            ) : (
              <button
                onClick={onLoginClick}
                className="hidden md:flex items-center space-x-2 bg-white text-red-700 px-4 py-2 rounded hover:bg-red-50 transition"
              >
                <User className="w-4 h-4" />
                <span>Connexion</span>
              </button>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="md:hidden pb-4 space-y-2">
            <div className="border-t border-red-600 pt-2">
              {user ? (
                <>
                  <div className="flex items-center space-x-2 py-2">
                    <User className="w-5 h-5" />
                    <span className="text-sm">{user.email}</span>
                  </div>
                  <button
                    onClick={onLogout}
                    className="flex items-center space-x-2 w-full py-2 hover:text-red-200 transition"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Déconnexion</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    onLoginClick();
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center space-x-2 w-full py-2 hover:text-red-200 transition"
                >
                  <User className="w-4 h-4" />
                  <span>Connexion</span>
                </button>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}