import "./breadcrumbs.style.scss";

import * as React from "react";

import { Link } from "react-router";

import { ArrowLeft, ChevronRight } from "lucide-react";

import { cn } from "#/components/utils";

// ──────────────────────────────────────────────────────────────
// Breadcrumbs Component
// ──────────────────────────────────────────────────────────────

/** Individual breadcrumb item */
export interface BreadcrumbItem {
  label: string;
  href?: string;
}

/** Breadcrumb navigation with optional back button */
interface BreadcrumbsProps extends React.HTMLAttributes<HTMLElement> {
  items: BreadcrumbItem[];
  /** Optional back button href */
  backHref?: string;
}

const Breadcrumbs = React.forwardRef<HTMLDivElement, BreadcrumbsProps>(
  ({ className, items, backHref, ...props }, ref) => {
    return (
      <div className={cn("breadcrumbs", className)} aria-label="Breadcrumb" ref={ref} {...props}>
        <div className="breadcrumbs__container">
          {backHref && (
            <Link to={backHref} className="breadcrumbs__back" aria-label="Go back">
              <ArrowLeft className="breadcrumbs__icon" />
            </Link>
          )}

          <ol className="breadcrumbs__list">
            {items.map((item, index) => {
              const isLast = index === items.length - 1;

              return (
                <li key={index} className="breadcrumbs__item">
                  {index > 0 && <ChevronRight className="breadcrumbs__separator" />}

                  {item.href && !isLast ? (
                    <Link to={item.href} className="breadcrumbs__link">
                      {item.label}
                    </Link>
                  ) : (
                    <span
                      className={cn("breadcrumbs__link", "breadcrumbs__link--active")}
                      aria-current="page"
                    >
                      {item.label}
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    );
  },
);
Breadcrumbs.displayName = "Breadcrumbs";

export { Breadcrumbs };
