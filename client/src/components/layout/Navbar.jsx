import { useState } from "react";
import { NavLink } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import { useAuth } from "../../context/AuthContext";

export function Navbar() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const links = [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/repos", label: "Repos" },
    { to: "/weak-areas", label: "Weak Areas" },
    { to: "/resume", label: "Resume" },
    { to: "/settings", label: "Settings" },
  ];

  return (
    <nav className="relative flex h-16 items-center justify-between border-b bg-white px-4 md:px-6">
      {/* Logo */}
      <span className="text-lg font-semibold text-slate-900 md:text-xl">
        Dev Portfolio Analytics
      </span>

      {/* Desktop */}
      <div className="hidden items-center gap-4 md:flex">
        <span className="text-sm font-medium text-slate-600">
          {user?.name}
        </span>

        <Separator orientation="vertical" className="h-6" />

        <Button variant="outline" onClick={logout}>
          Logout
        </Button>
      </div>

      {/* Mobile */}
      <div className="flex items-center gap-2 md:hidden">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label="Toggle navigation menu"
          aria-expanded={menuOpen}
        >
          {menuOpen ? "×" : "☰"}
        </Button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="absolute left-0 right-0 top-16 z-50 border-b bg-white p-4 shadow-md md:hidden">
          <nav className="flex flex-col gap-1">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}

            <Separator className="my-2" />

            <div className="px-3 py-2 text-sm font-medium text-slate-600">
              {user?.name}
            </div>

            <Button
              variant="outline"
              onClick={logout}
              className="mt-1 w-full"
            >
              Logout
            </Button>
          </nav>
        </div>
      )}
    </nav>
  );
}