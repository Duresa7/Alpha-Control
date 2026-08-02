import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router";

import { useAuth } from "@/hooks/useAuth";
import { getUserIdentity } from "@/utils/getUserIdentity";

export function NewsProfileMenu() {
  const { pathname } = useLocation();
  const { session, profile, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const { displayName, email } = getUserIdentity(session, profile);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleSignOut = async () => {
    setIsOpen(false);
    await signOut();
  };

  return (
    <div className="news-profile-menu" ref={menuRef}>
      <button
        className={`news-nav__icon-btn${isOpen ? " news-nav__icon-btn--active" : ""}`}
        aria-label="Profile menu"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls="news-profile-menu-panel"
        type="button"
        onClick={() => setIsOpen((open) => !open)}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      </button>

      {isOpen && (
        <div
          id="news-profile-menu-panel"
          className="news-profile-menu__panel"
          role="menu"
          aria-label="Profile options"
        >
          <div className="news-profile-menu__header">
            <p className="news-profile-menu__label">Signed in as</p>
            <p className="news-profile-menu__identity">{displayName}</p>
            {email && email !== displayName && (
              <p className="news-profile-menu__meta">{email}</p>
            )}
          </div>

          <div className="news-profile-menu__items">
            <Link
              to="/settings"
              className="news-profile-menu__item"
              role="menuitem"
              onClick={() => setIsOpen(false)}
            >
              Settings
            </Link>
            {session && (
              <button
                type="button"
                className="news-profile-menu__item news-profile-menu__item--danger"
                role="menuitem"
                onClick={() => void handleSignOut()}
              >
                Sign out
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
