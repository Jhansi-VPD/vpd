"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from 'react';

function formatLabel(segment: string) {
  return segment
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export default function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" itemScope itemType="https://schema.org/BreadcrumbList">
      <ol className="flex items-center gap-2 text-body-sm text-white/70">
        <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
          <Link href="/" itemProp="item" className="hover:text-accent-cyan transition-colors">
            <span itemProp="name">Home</span>
          </Link>
          <meta itemProp="position" content="1" />
        </li>
        {segments.map((segment, index) => {
          const isLast = index === segments.length - 1;
          const href = '/' + segments.slice(0, index + 1).join('/');
          const position = index + 2;
          return (
            <li key={segment} className="flex items-center gap-2" itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
              <span className="text-white/40">&gt;</span>
              {isLast ? (
                <span itemProp="name" className="text-white font-semibold">{formatLabel(segment)}</span>
              ) : (
                <Link href={href} itemProp="item" className="hover:text-accent-cyan transition-colors">
                  <span itemProp="name">{formatLabel(segment)}</span>
                </Link>
              )}
              <meta itemProp="position" content={String(position)} />
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
