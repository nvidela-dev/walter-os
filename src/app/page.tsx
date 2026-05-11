import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import {
  TruckIcon,
  UserGroupIcon,
  BookOpenIcon,
  ClipboardDocumentListIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";

const apps = [
  {
    name: "Proveedores",
    href: "/providers",
    icon: TruckIcon,
    description: "Productos y precios",
    color: "text-amber-700",
    bg: "bg-amber-50",
  },
  {
    name: "Nueva Factura",
    href: "/facturas/new",
    icon: DocumentTextIcon,
    description: "Cargar factura",
    color: "text-stone-700",
    bg: "bg-stone-50",
  },
  {
    name: "Equipo",
    href: "/employees",
    icon: UserGroupIcon,
    description: "Personal y sueldos",
    color: "text-rose-700",
    bg: "bg-rose-50",
  },
  {
    name: "Recetas",
    href: "/recipes",
    icon: BookOpenIcon,
    description: "Tus recetas",
    color: "text-teal-700",
    bg: "bg-teal-50",
  },
  {
    name: "Menú",
    href: "/menu",
    icon: ClipboardDocumentListIcon,
    description: "Platos y precios",
    color: "text-violet-700",
    bg: "bg-violet-50",
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
              className={`group flex flex-col items-center gap-3 rounded-3xl ${app.bg} p-6 transition-all hover:scale-[1.02] active:scale-[0.98]`}
            >
              <app.icon className={`h-10 w-10 ${app.color}`} />
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
