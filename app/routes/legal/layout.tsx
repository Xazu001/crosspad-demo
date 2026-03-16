import { type CSSProperties } from "react";

import { Link, Outlet, useLocation } from "react-router";

import {
  AsideMenu,
  AsideMenuContent,
  AsideMenuFooter,
  AsideMenuItem,
  AsideMenuPanel,
  AsideMenuTrigger,
} from "#/components/ui/aside-menu";
import { Button } from "#/components/ui/button";
import { Icon } from "#/components/ui/icon";

import layoutStyles from "./layout.style.scss?url";

// ──────────────────────────────────────────────────────────────

export const links = () => [
  {
    rel: "preload",
    href: layoutStyles,
    as: "style",
  },
  {
    rel: "stylesheet",
    href: layoutStyles,
    precedence: "high",
  },
];

export default function LegalLayout() {
  return (
    <AsideMenu>
      <AsideMenuPanel variant="glass-popover" hideAbove="desktop">
        <AsideMenuContent>
          <AsideMenuItem asChild>
            <Link to="/landing#about">About</Link>
          </AsideMenuItem>
          <AsideMenuItem asChild>
            <Link to="/landing#faq">FAQ</Link>
          </AsideMenuItem>
          <AsideMenuItem asChild>
            <Link to="/changelog">Changelog</Link>
          </AsideMenuItem>
          <AsideMenuItem asChild>
            <Link to="/blog">Blog</Link>
          </AsideMenuItem>
        </AsideMenuContent>
        <AsideMenuFooter>
          <Button variant="outline" size="md" to="/login">
            Login
          </Button>
          <Button variant="primary" size="md" to="/">
            Start
          </Button>
        </AsideMenuFooter>
      </AsideMenuPanel>
      <LegalNav />
      <Outlet />
      <Footer />
    </AsideMenu>
  );
}

const LegalNav = () => {
  return (
    <nav className="legal-nav">
      <div className="legal-nav__container">
        <Link to="/landing" className="legal-nav__logo">
          <img src="/assets/logo-full.png" alt="Crosspad logo" />
        </Link>

        <div className="legal-nav__links">
          <Link to="/landing#about" className="legal-nav__link">
            About
          </Link>
          <Link to="/landing#faq" className="legal-nav__link">
            FAQ
          </Link>
          <Link to="/changelog" className="legal-nav__link">
            Changelog
          </Link>
          <Link to="/blog" className="legal-nav__link">
            Blog
          </Link>
        </div>

        <div className="legal-nav__actions">
          <Button variant="outline" size="md" to="/login">
            Login
          </Button>
          <Button variant="primary" size="md" to="/">
            Start
          </Button>
        </div>

        <AsideMenuTrigger className="legal-nav__menu-trigger">
          <Icon.Menu size="md" />
        </AsideMenuTrigger>
      </div>
    </nav>
  );
};

export const Footer = () => {
  const { pathname } = useLocation();

  return (
    <footer
      className="legal-footer"
      style={
        {
          "--color-footer-background":
            pathname.endsWith("landing") === true
              ? "#000"
              : "var(--color-footer-background-default)",
        } as CSSProperties
      }
    >
      <div className="legal-footer__content">
        <div className="legal-footer__top">
          <div className="legal-footer__brand">
            <img src="/assets/logo-full.png" alt="Crosspad logo" className="logo" />
          </div>

          <div className="legal-footer__nav">
            <div className="legal-footer__nav-column">
              <h4>Legal</h4>
              <ul>
                <li>
                  <Link to="/legal/terms">Terms of Service</Link>
                </li>
                <li>
                  <Link to="/legal/privacy">Privacy Policy</Link>
                </li>
                <li>
                  <Link to="/legal/cookies">Cookie Policy</Link>
                </li>
                <li>
                  <Link to="/legal/account-rules">Account Rules</Link>
                </li>
                <li>
                  <Link to="/contact">Contact</Link>
                </li>
              </ul>
            </div>

            <div className="legal-footer__nav-column">
              <h4>Product</h4>
              <ul>
                <li>
                  <Link to="/landing">Landing</Link>
                </li>
                <li>
                  <Link to="/changelog">Changelog</Link>
                </li>
                <li>
                  <Link to="/blog">Blog</Link>
                </li>
                <li>
                  <Link to="/midi-test">MIDI Test</Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="legal-footer__marquee">
        <div className="legal-footer__marquee-content">
          <div className="legal-footer__marquee-group">
            <span>Follow Crosspad </span>
            <span>Follow Crosspad </span>
            <span>Follow Crosspad </span>
            <span>Follow Crosspad </span>
            <span>Follow Crosspad </span>
            <span>Follow Crosspad </span>
            <span>Follow Crosspad </span>
            <span>Follow Crosspad </span>
          </div>
          <div className="legal-footer__marquee-group" aria-hidden="true">
            <span>Follow Crosspad </span>
            <span>Follow Crosspad </span>
            <span>Follow Crosspad </span>
            <span>Follow Crosspad </span>
            <span>Follow Crosspad </span>
            <span>Follow Crosspad </span>
            <span>Follow Crosspad </span>
            <span>Follow Crosspad </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
