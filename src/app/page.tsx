import { UserButton } from "@clerk/nextjs";
import Link from "next/link";

const apps = [
  {
    name: "Providers",
    href: "/providers",
    icon: "🏪",
    color: "bg-blue-500",
    description: "Manage your suppliers",
  },
  {
    name: "Products",
    href: "/products",
    icon: "📦",
    color: "bg-green-500",
    description: "Track inventory items",
  },
  {
    name: "Services",
    href: "/services",
    icon: "💡",
    color: "bg-yellow-500",
    description: "Utilities and bills",
  },
  {
    name: "House",
    href: "/house-expenses",
    icon: "🏠",
    color: "bg-orange-500",
    description: "Home expenses",
  },
  {
    name: "Employees",
    href: "/employees",
    icon: "👥",
    color: "bg-purple-500",
    description: "Staff management",
  },
  {
    name: "Recipes",
    href: "/recipes",
    icon: "📖",
    color: "bg-pink-500",
    description: "Your recipes",
  },
  {
    name: "Menu",
    href: "/menu",
    icon: "🍽️",
    color: "bg-red-500",
    description: "Menu items",
  },
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-800">Walter OS</h1>
        <UserButton
          appearance={{
            elements: {
              avatarBox: "w-12 h-12",
            },
          }}
        />
      </header>

      {/* App Grid */}
      <main className="flex-1 px-4 py-6">
        <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:gap-6">
          {apps.map((app) => (
            <Link
              key={app.name}
              href={app.href}
              className="group flex flex-col items-center gap-2 rounded-2xl p-4 transition-all active:scale-95"
            >
              {/* App Icon */}
              <div
                className={`flex h-16 w-16 items-center justify-center rounded-2xl ${app.color} text-3xl shadow-lg transition-transform group-hover:scale-105 sm:h-20 sm:w-20 sm:text-4xl`}
              >
                {app.icon}
              </div>
              {/* App Name */}
              <span className="text-center text-sm font-medium text-gray-700 sm:text-base">
                {app.name}
              </span>
            </Link>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-4 text-center text-sm text-gray-500">
        Tap an app to get started
      </footer>
    </div>
  );
}
