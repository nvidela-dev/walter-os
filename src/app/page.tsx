import { UserButton } from "@clerk/nextjs";
import Link from "next/link";

const apps = [
  {
    name: "Providers",
    href: "/providers",
    icon: "🪷",
    description: "Suppliers & products",
  },
  {
    name: "Services",
    href: "/services",
    icon: "✨",
    description: "Utilities & bills",
  },
  {
    name: "House",
    href: "/house-expenses",
    icon: "🏡",
    description: "Home expenses",
  },
  {
    name: "Team",
    href: "/employees",
    icon: "🙏",
    description: "Staff & payroll",
  },
  {
    name: "Recipes",
    href: "/recipes",
    icon: "📿",
    description: "Your recipes",
  },
  {
    name: "Menu",
    href: "/menu",
    icon: "☕",
    description: "Items & pricing",
  },
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-[#faf8f5]">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-6">
        <div>
          <h1 className="text-2xl font-light tracking-wide text-[#3d3530]">
            walter
          </h1>
          <p className="text-sm text-[#8b7355]">mindful management</p>
        </div>
        <UserButton
          appearance={{
            elements: {
              avatarBox: "w-12 h-12 ring-2 ring-[#e8e0d4]",
            },
          }}
        />
      </header>

      {/* App Grid */}
      <main className="flex-1 px-6 py-4">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {apps.map((app) => (
            <Link
              key={app.name}
              href={app.href}
              className="group flex flex-col items-center gap-3 rounded-3xl bg-[#f5f0e8] p-6 transition-all hover:bg-[#e8e0d4] active:scale-[0.98]"
            >
              <span className="text-4xl">{app.icon}</span>
              <div className="text-center">
                <span className="block text-base font-medium text-[#3d3530]">
                  {app.name}
                </span>
                <span className="text-xs text-[#8b7355]">{app.description}</span>
              </div>
            </Link>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-6 text-center">
        <p className="text-sm text-[#c4a77d]">breathe · organize · flow</p>
      </footer>
    </div>
  );
}
