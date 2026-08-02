import { useState, type ComponentType } from 'react';
import { Link, useLocation } from 'react-router';
import { useAuth } from '@/hooks/useAuth';
import { useParticleBackground } from '@/hooks/useParticleBackground';
import { AuthModal } from '@/components/auth/AuthModal';
import { NotificationBell } from '@/components/NotificationBell';
import { Footer } from '@/components/Footer';
import { getUserIdentity } from '@/utils/getUserIdentity';

type SocialLink = {
  href: string;
  ariaLabel: string;
  Icon: ComponentType;
  hoverLabel?: string;
};

function PayPalIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M7.08 20.77h3.1a.85.85 0 0 0 .84-.7l.03-.16.59-3.75.04-.2a.85.85 0 0 1 .84-.71h.53c3.42 0 6.1-1.4 6.88-5.44.32-1.69.15-3.1-.73-4.1-.97-1.1-2.7-1.57-4.91-1.57h-6.7a.93.93 0 0 0-.92.78L3.9 19.84a.56.56 0 0 0 .55.66h4.13l1.03-6.52-.03.2a.85.85 0 0 1 .83-.7h1.73c3.41 0 6.08-1.39 6.86-5.4.03-.17.06-.33.08-.49.1-.63.1-1.2 0-1.7-.88 4.03-3.55 5.42-6.96 5.42H10.4a.85.85 0 0 0-.83.7l-.04.2-1.02 6.56-.29 1.8a.47.47 0 0 0 .46.56Z"
      />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M12 .5C5.65.5.5 5.67.5 12.05c0 5.11 3.3 9.44 7.88 10.97.58.1.8-.25.8-.56 0-.28-.02-1.2-.02-2.16-2.88.53-3.62-.7-3.84-1.34-.12-.33-.62-1.34-1.06-1.61-.36-.2-.86-.7-.01-.72.8-.02 1.38.73 1.57 1.03.91 1.53 2.36 1.09 2.94.83.09-.67.36-1.1.64-1.35-2.55-.29-5.21-1.28-5.21-5.67 0-1.25.44-2.28 1.17-3.09-.12-.29-.51-1.48.11-3.08 0 0 .95-.3 3.12 1.18a10.73 10.73 0 0 1 5.68 0c2.17-1.49 3.12-1.18 3.12-1.18.62 1.6.23 2.79.11 3.08.73.81 1.17 1.83 1.17 3.09 0 4.4-2.67 5.38-5.22 5.67.41.36.77 1.05.77 2.12 0 1.53-.01 2.76-.01 3.14 0 .31.22.67.8.56a11.56 11.56 0 0 0 7.88-10.97C23.5 5.67 18.35.5 12 .5Z"
      />
    </svg>
  );
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M18.92 2H22l-6.73 7.7L23.2 22h-6.23l-4.87-7.03L5.95 22H2.87l7.2-8.23L.8 2h6.37l4.4 6.4L18.92 2Zm-1.09 18h1.73L6.22 3.88H4.37L17.83 20Z"
      />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M7.5 2.5h9A5 5 0 0 1 21.5 7.5v9a5 5 0 0 1-5 5h-9a5 5 0 0 1-5-5v-9a5 5 0 0 1 5-5Zm9 1.5h-9A3.5 3.5 0 0 0 4 7.5v9A3.5 3.5 0 0 0 7.5 20h9a3.5 3.5 0 0 0 3.5-3.5v-9A3.5 3.5 0 0 0 16.5 4Zm-4.5 3.2a5.3 5.3 0 1 1 0 10.6 5.3 5.3 0 0 1 0-10.6Zm0 1.5a3.8 3.8 0 1 0 0 7.6 3.8 3.8 0 0 0 0-7.6Zm5.35-2.35a1.15 1.15 0 1 1 0 2.3 1.15 1.15 0 0 1 0-2.3Z"
      />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"
      />
    </svg>
  );
}

function BlogIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2Zm-1.5 3a.75.75 0 0 1 0 1.5h-11a.75.75 0 0 1 0-1.5h11Zm0 4a.75.75 0 0 1 0 1.5h-11a.75.75 0 0 1 0-1.5h11Zm-4 4a.75.75 0 0 1 0 1.5h-7a.75.75 0 0 1 0-1.5h7Z"
      />
    </svg>
  );
}

const SOCIAL_LINKS: SocialLink[] = [
  {
    href: 'https://www.paypal.com/donate/?hosted_button_id=ECEV6VL4Q8F8C',
    ariaLabel: 'Donate via PayPal',
    Icon: PayPalIcon,
    hoverLabel: 'Donate here!',
  },
  {
    href: 'https://github.com/Duresa7',
    ariaLabel: 'GitHub profile',
    Icon: GitHubIcon,
  },
  {
    href: 'https://x.com/AlphaFLy_TV',
    ariaLabel: 'X profile',
    Icon: XIcon,
  },
  {
    href: 'https://www.instagram.com/_bigdogd_/',
    ariaLabel: 'Instagram profile',
    Icon: InstagramIcon,
  },
  {
    href: 'https://www.linkedin.com/in/duresa-k-630039329',
    ariaLabel: 'LinkedIn profile',
    Icon: LinkedInIcon,
  },
];

export function LandingPage() {
  const particleCanvasRef = useParticleBackground();
  const { session, profile, signOut } = useAuth();
  const location = useLocation();
  const locationState = location.state as { showAuthModal?: boolean } | null;
  const [showAuthModal, setShowAuthModal] = useState(locationState?.showAuthModal ?? false);

  const { displayName } = getUserIdentity(session, profile, 'Signed In');

  const renderSocialLinks = () =>
    SOCIAL_LINKS.map(({ href, ariaLabel, Icon, hoverLabel }) => (
      <a
        key={href}
        className="portfolio-hero__social-link"
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={ariaLabel}
        data-hover-label={hoverLabel}
      >
        <Icon />
      </a>
    ));

  return (
    <section className="portfolio-hero" aria-label="Portfolio homepage">
      <canvas
        ref={particleCanvasRef}
        className="portfolio-hero__layer portfolio-hero__particle-canvas"
        aria-hidden="true"
      />

      <div className="portfolio-hero__content portfolio-hero__content--base">
        <div className="portfolio-hero__name-block portfolio-hero__parallax">
          <p className="portfolio-hero__name-line">AlphaSec</p>
          <p className="portfolio-hero__name-line">United</p>
        </div>

        <div className="portfolio-hero__nav-block portfolio-hero__parallax">
          <div className="portfolio-hero__nav-actions">
            {session ? (
              <Link
                className="portfolio-hero__nav-link portfolio-hero__nav-link--icon"
                to="/map-loading"
                aria-label="Interactive Galaxy Map"
                data-hover-label="Interactive Galaxy Map"
              >
                <img
                  src={`${import.meta.env.BASE_URL}icons/codex-planets.png`}
                  alt=""
                  className="portfolio-hero__nav-icon-img"
                />
              </Link>
            ) : (
              <button
                className="portfolio-hero__nav-link portfolio-hero__nav-link--icon"
                onClick={() => setShowAuthModal(true)}
                aria-label="Interactive Galaxy Map"
                data-hover-label="Interactive Galaxy Map"
              >
                <img
                  src={`${import.meta.env.BASE_URL}icons/codex-planets.png`}
                  alt=""
                  className="portfolio-hero__nav-icon-img"
                />
              </button>
            )}
            <Link
              className="portfolio-hero__nav-link portfolio-hero__nav-link--icon"
              to="/news"
              aria-label="AlphaSec News"
              data-hover-label="AlphaSec News"
            >
              <BlogIcon />
            </Link>
            <span
              className="portfolio-hero__nav-link portfolio-hero__nav-link--icon portfolio-hero__nav-link--disabled"
              aria-label="TNIO: Codex of Planets Coming Soon"
              data-hover-label="TNIO: Codex of Planets Coming Soon"
            >
              <img
                src={`${import.meta.env.BASE_URL}icons/codex-icon.png`}
                alt=""
                className="portfolio-hero__nav-icon-img"
              />
            </span>
          </div>
        </div>

        <div className="portfolio-hero__social-block portfolio-hero__parallax">
          {renderSocialLinks()}
        </div>
      </div>

      <div className="portfolio-hero__auth-block">
        {session ? (
          <>
            <span className="portfolio-hero__auth-name">{displayName}</span>
            <Link
              to="/settings"
              className="portfolio-hero__settings-icon"
              aria-label="Account settings"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </Link>
            <NotificationBell variant="landing" />
            <button onClick={() => signOut()} className="portfolio-hero__auth-pill">
              Sign Out
            </button>
          </>
        ) : (
          <button onClick={() => setShowAuthModal(true)} className="portfolio-hero__auth-pill">
            Sign In
          </button>
        )}
      </div>

      <AuthModal open={showAuthModal} onClose={() => setShowAuthModal(false)} />

      <Footer />
    </section>
  );
}
