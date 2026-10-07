import React from 'react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  badge?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  breadcrumbs,
  actions,
  badge,
}) => {
  return (
    <div className="flex flex-col gap-4 border-b border-[#2A2A2A] pb-6">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center space-x-2 text-xs text-[#A1A1AA] flex-wrap">
          {breadcrumbs.map((item, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return (
              <React.Fragment key={idx}>
                {idx > 0 && <span className="text-zinc-600">/</span>}
                {item.href && !isLast ? (
                  <a
                    href={item.href}
                    className="hover:text-[#D4AF37] transition-colors"
                  >
                    {item.label}
                  </a>
                ) : (
                  <span className={isLast ? 'text-white font-medium' : ''}>
                    {item.label}
                  </span>
                )}
              </React.Fragment>
            );
          })}
        </nav>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1.5 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white truncate">
              {title}
            </h1>
            {badge && <div>{badge}</div>}
          </div>
          {description && (
            <p className="text-sm text-[#A1A1AA] max-w-3xl leading-relaxed">
              {description}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex items-center gap-2.5 flex-shrink-0 flex-wrap sm:self-center">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

export default PageHeader;

