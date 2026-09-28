import { NavLink } from "react-router-dom";

export function Sidebar() {
  const links = [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/repos", label: "Repos" },
    { to: "/weak-areas", label: "Weak Areas" },
    { to: "/resume", label: "Resume" },
    { to: "/settings", label: "Settings" },
  ];

  return (
    <aside className="hidden min-h-[calc(100vh-4rem)] w-56 shrink-0 border-r bg-white p-4 md:block">
      <nav className="flex flex-col gap-1">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
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
      </nav>
    </aside>
  );
}