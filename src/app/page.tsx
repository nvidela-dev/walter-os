import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import {
  TruckIcon,
  WrenchScrewdriverIcon,
  CreditCardIcon,
  HomeIcon,
  UserGroupIcon,
  BookOpenIcon,
  ClipboardDocumentListIcon,
} from "@heroicons/react/24/outline";

const apps = [
  {
    name: "Proveedores",
    href: "/providers",
    icon: TruckIcon,
    description: "Productos y precios",
  },
  {
    name: "Servicios",
    href: "/services",
    icon: WrenchScrewdriverIcon,
    description: "Catálogo de servicios",
  },
  {
    name: "Pagos",
    href: "/service-payments",
    icon: CreditCardIcon,
    description: "Pagos de servicios",
  },
  {
    name: "Hogar",
    href: "/house-expenses",
    icon: HomeIcon,
    description: "Gastos del hogar",
  },
  {
    name: "Equipo",
    href: "/employees",
    icon: UserGroupIcon,
    description: "Personal y sueldos",
  },
  {
    name: "Recetas",
    href: "/recipes",
    icon: BookOpenIcon,
    description: "Tus recetas",
  },
  {
    name: "Menú",
    href: "/menu",
    icon: ClipboardDocumentListIcon,
    description: "Platos y precios",
  },
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-[#faf8f5]">
      {/* Header */}
      <header className="flex items-center justify-end px-6 py-6">
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
              <app.icon className="h-10 w-10 text-[#8b7355]" />
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
    </div>
  );
}
