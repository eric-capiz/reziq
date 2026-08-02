"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function navClass(active: boolean) {
  return active
    ? "inline-flex h-7 items-center rounded-full bg-[#7CFFB2] px-3 text-[0.8rem] font-medium text-[#0B0F14]"
    : "inline-flex h-7 items-center rounded-full bg-white/10 px-3 text-[0.8rem] font-medium transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#7CFFB2] hover:text-[#0B0F14]";
}

export function AppNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();

  const links = [
    { href: "/dashboard", label: "Rez Desk", match: (path: string) => path.startsWith("/dashboard") },
    { href: "/profile", label: "Profile", match: (path: string) => path.startsWith("/profile") },
    ...(isAdmin
      ? [
          {
            href: "/admin",
            label: "Admin",
            match: (path: string) => path.startsWith("/admin"),
          },
        ]
      : []),
  ];

  return (
    <nav aria-label="Main" className="flex flex-wrap items-center justify-end gap-2">
      {links.map((link) => {
        const active = link.match(pathname);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={navClass(active)}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
