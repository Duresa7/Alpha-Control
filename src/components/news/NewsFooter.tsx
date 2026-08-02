import type { ReactNode } from 'react';
import { Link } from 'react-router';

type FooterLink = {
  to: string;
  label: string;
};

type FooterColumn = {
  title: string;
  links: FooterLink[];
};

type SocialLink = {
  href: string;
  label: string;
  ariaLabel: string;
  icon: ReactNode;
};

const FOOTER_COLUMNS: FooterColumn[] = [
  {
    title: 'Platform',
    links: [
      { to: '/news', label: 'News' },
      { to: '/blog', label: 'Blog' },
      { to: '/services', label: 'Services' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { to: '/privacy', label: 'Privacy Policy' },
      { to: '/terms', label: 'Terms of Service' },
      { to: '/credits', label: 'Credits' },
    ],
  },
  {
    title: 'Feedback',
    links: [{ to: '/feedback', label: 'Submit Feedback' }],
  },
];

const SOCIAL_LINKS: SocialLink[] = [
  {
    href: 'https://github.com/Duresa7',
    label: 'GitHub',
    ariaLabel: 'GitHub profile',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path
          fill="currentColor"
          d="M12 .5C5.65.5.5 5.67.5 12.05c0 5.11 3.3 9.44 7.88 10.97.58.1.8-.25.8-.56 0-.28-.02-1.2-.02-2.16-2.88.53-3.62-.7-3.84-1.34-.12-.33-.62-1.34-1.06-1.61-.36-.2-.86-.7-.01-.72.8-.02 1.38.73 1.57 1.03.91 1.53 2.36 1.09 2.94.83.09-.67.36-1.1.64-1.35-2.55-.29-5.21-1.28-5.21-5.67 0-1.25.44-2.28 1.17-3.09-.12-.29-.51-1.48.11-3.08 0 0 .95-.3 3.12 1.18a10.73 10.73 0 0 1 5.68 0c2.17-1.49 3.12-1.18 3.12-1.18.62 1.6.23 2.79.11 3.08.73.81 1.17 1.83 1.17 3.09 0 4.4-2.67 5.38-5.22 5.67.41.36.77 1.05.77 2.12 0 1.53-.01 2.76-.01 3.14 0 .31.22.67.8.56a11.56 11.56 0 0 0 7.88-10.97C23.5 5.67 18.35.5 12 .5Z"
        />
      </svg>
    ),
  },
  {
    href: 'https://x.com/AlphaFLy_TV',
    label: 'X',
    ariaLabel: 'X profile',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path
          fill="currentColor"
          d="M18.92 2H22l-6.73 7.7L23.2 22h-6.23l-4.87-7.03L5.95 22H2.87l7.2-8.23L.8 2h6.37l4.4 6.4L18.92 2Zm-1.09 18h1.73L6.22 3.88H4.37L17.83 20Z"
        />
      </svg>
    ),
  },
  {
    href: 'https://www.instagram.com/_bigdogd_/',
    label: 'Instagram',
    ariaLabel: 'Instagram profile',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path
          fill="currentColor"
          d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12c0 3.259.014 3.668.072 4.948.132 1.278.333 2.148.63 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.63C8.333 23.988 8.74 24 12 24c3.259 0 3.668-.014 4.948-.072 1.277-.132 2.148-.333 2.913-.63.788-.306 1.459-.717 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.63-2.913.058-1.28.072-1.689.072-4.948 0-3.26-.014-3.667-.072-4.947-.131-1.278-.334-2.148-.63-2.913-.305-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.63C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z"
        />
      </svg>
    ),
  },
  {
    href: 'https://www.linkedin.com/in/duresa-k-630039329',
    label: 'LinkedIn',
    ariaLabel: 'LinkedIn profile',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path
          fill="currentColor"
          d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"
        />
      </svg>
    ),
  },
  {
    href: 'https://www.paypal.com/donate/?hosted_button_id=ECEV6VL4Q8F8C',
    label: 'PayPal',
    ariaLabel: 'PayPal',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path
          fill="currentColor"
          d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.563.563 0 0 0-.556.479l-1.187 7.527h-.506l-.24 1.516a.56.56 0 0 0 .554.647h3.882c.46 0 .85-.334.922-.788.06-.26.76-4.852.816-5.09a.932.932 0 0 1 .923-.788h.58c3.76 0 6.705-1.528 7.565-5.946.36-1.847.174-3.388-.777-4.471z"
        />
      </svg>
    ),
  },
];

export function NewsFooter() {
  return (
    <footer className="news-footer">
      <div className="news-footer__inner">
        <div className="news-footer__top">
          <div className="news-footer__brand">
            <p className="news-footer__logo">AlphaSec United</p>
            <p className="news-footer__tagline">Tech. Nonsense. Community.</p>
          </div>

          <div className="news-footer__columns">
            {FOOTER_COLUMNS.map((column) => (
              <div key={column.title} className="news-footer__column">
                <h4 className="news-footer__column-title">{column.title}</h4>
                {column.links.map((link) => (
                  <Link key={link.to} to={link.to} className="news-footer__link">
                    {link.label}
                  </Link>
                ))}
              </div>
            ))}

            <div className="news-footer__column">
              <h4 className="news-footer__column-title">Connect</h4>
              <div className="news-footer__social-icons">
                {SOCIAL_LINKS.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="news-footer__social-icon"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={link.ariaLabel}
                  >
                    {link.icon}
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="news-footer__bottom">
          <p>&copy; {new Date().getFullYear()} AlphaSec United. All rights reserved.</p>
          <p>Made by Duresa Kadi</p>
        </div>
      </div>
    </footer>
  );
}
