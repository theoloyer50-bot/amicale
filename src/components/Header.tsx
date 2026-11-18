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
            <img
              src="/PHOTO-2026-02-06-09-47-45.jpg"
              alt="Centre de Secours de Tourlaville"
              className="h-16 w-12 sm:h-[4.5rem] sm:w-[3.375rem] object-contain rounded bg-white shadow-sm"
            />
            <div>
              <h1 className="text-xl sm:text-2xl">Amicale SP Tourlaville</h1>
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