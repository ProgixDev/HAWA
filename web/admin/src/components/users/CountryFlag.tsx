import React from 'react';
import type { Country } from '@/types';

const FLAG_ART: Partial<Record<Country, React.ReactNode>> = {
  FR: (
    <>
      <rect width="8" height="16" fill="#0055A4" />
      <rect x="8" width="8" height="16" fill="#FFFFFF" />
      <rect x="16" width="8" height="16" fill="#EF4135" />
    </>
  ),
  MA: (
    <>
      <rect width="24" height="16" fill="#C1272D" />
      <path
        d="m12 4.1 1.02 3.14h3.3l-2.67 1.94 1.02 3.14L12 10.38l-2.67 1.94 1.02-3.14-2.67-1.94h3.3L12 4.1Z"
        fill="none"
        stroke="#006233"
        strokeWidth="0.85"
        strokeLinejoin="round"
      />
    </>
  ),
  DZ: (
    <>
      <rect width="12" height="16" fill="#006233" />
      <rect x="12" width="12" height="16" fill="#FFFFFF" />
      <circle cx="12.15" cy="8" r="3.25" fill="#D21034" />
      <circle cx="13.25" cy="7.35" r="2.65" fill="#FFFFFF" />
      <path
        d="m14.25 6.35.55 1.14 1.24.18-.9.87.21 1.24-1.1-.58-1.1.58.21-1.24-.9-.87 1.24-.18.55-1.14Z"
        fill="#D21034"
      />
    </>
  ),
  TN: (
    <>
      <rect width="24" height="16" fill="#E70013" />
      <circle cx="12" cy="8" r="4.25" fill="#FFFFFF" />
      <circle cx="11.45" cy="8" r="2.45" fill="#E70013" />
      <circle cx="12.25" cy="7.55" r="1.95" fill="#FFFFFF" />
      <path
        d="m13.8 6.1.48 1 .99.14-.72.7.17 1-.92-.48-.88.48.17-1-.72-.7.99-.14.44-1Z"
        fill="#E70013"
      />
    </>
  ),
  CA: (
    <>
      <rect width="5.5" height="16" fill="#D52B1E" />
      <rect x="5.5" width="13" height="16" fill="#FFFFFF" />
      <rect x="18.5" width="5.5" height="16" fill="#D52B1E" />
      <path
        d="m12 2.7.7 1.55 1.35-.72-.43 2.16 1.45-.12-1.05 1.35 1.05.56-2.42 2 .38 1.35-1.03-.22-1.03.22.38-1.35-2.42-2 1.05-.56-1.05-1.35 1.45.12-.43-2.16 1.35.72L12 2.7Z"
        fill="#D52B1E"
      />
      <rect x="11.7" y="10.3" width="0.6" height="2.7" fill="#D52B1E" />
    </>
  ),
  BE: (
    <>
      <rect width="8" height="16" fill="#1A171B" />
      <rect x="8" width="8" height="16" fill="#FFD90C" />
      <rect x="16" width="8" height="16" fill="#EF3340" />
    </>
  ),
  CH: (
    <>
      <rect width="24" height="16" fill="#D52B1E" />
      <path d="M10.25 3.5h3.5v2.75H17v3.5h-3.25v2.75h-3.5V9.75H7v-3.5h3.25V3.5Z" fill="#FFFFFF" />
    </>
  ),
};

export default function CountryFlag({ code, label }: { code: Country; label: string }) {
  const artwork = FLAG_ART[code];
  if (!artwork) {
    return (
      <span
        aria-hidden="true"
        className="inline-flex h-[14px] w-[20px] shrink-0 items-center justify-center rounded-[2px] border border-black/10 bg-[#f2f0ec] text-[9px] text-[#777078]"
      >
        &#9678;
      </span>
    );
  }

  return (
    <span
      aria-label={`Drapeau ${label}`}
      className="inline-flex h-[14px] w-[20px] shrink-0 overflow-hidden rounded-[2px] border border-black/10 shadow-[0_1px_2px_rgba(45,35,48,0.08)]"
      role="img"
    >
      <svg aria-hidden="true" className="h-full w-full" viewBox="0 0 24 16">
        {artwork}
      </svg>
    </span>
  );
}
