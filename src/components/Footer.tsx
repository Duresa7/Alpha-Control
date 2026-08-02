import { Link } from "react-router";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__links">
          <Link to="/privacy" className="site-footer__link">
            Privacy Policy
          </Link>
          <span className="site-footer__sep" aria-hidden="true">
            /
          </span>
          <Link to="/terms" className="site-footer__link">
            Terms of Service
          </Link>
          <span className="site-footer__sep" aria-hidden="true">
            /
          </span>
          <Link to="/credits" className="site-footer__link">
            Credits
          </Link>
        </div>
        <p className="site-footer__copy">
          &copy; {new Date().getFullYear()} AlphaSec United. All rights
          reserved.
        </p>
        <p className="site-footer__copy">Made by Duresa Kadi</p>
      </div>
    </footer>
  );
}
