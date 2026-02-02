export type ProgramMember = {
  name: string;
  role: string;
};

export type ProgramInfo = {
  slug: string;
  name: string;
  contact: string;
  description: string;
  coordinator: ProgramMember;
  team: ProgramMember[];
};

export const programs: ProgramInfo[] = [
  {
    slug: "direccion-gestion-riesgo",
    name: "Dirección de gestión de riesgo",
    contact: "224407300",
    description:
      "Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat.",
    coordinator: { name: "Nombre", role: "Coordinador programa" },
    team: [{ name: "Nombres", role: "Cargo/Profesión" }],
  },
  {
    slug: "oficina-local-ninez",
    name: "Oficina local de la niñez",
    contact: "224407300",
    description:
      "Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat.",
    coordinator: { name: "Nombre", role: "Coordinador programa" },
    team: [{ name: "Nombres", role: "Cargo/Profesión" }],
  },
  {
    slug: "discapacidad-inclusion",
    name: "Discapacidad e inclusión social",
    contact: "224407300",
    description:
      "Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat.",
    coordinator: { name: "Nombre", role: "Coordinador programa" },
    team: [{ name: "Nombres", role: "Cargo/Profesión" }],
  },
  {
    slug: "plantas-medicinales",
    name: "Plantas medicinales",
    contact: "224407300",
    description:
      "Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat.",
    coordinator: { name: "Nombre", role: "Coordinador programa" },
    team: [{ name: "Nombres", role: "Cargo/Profesión" }],
  },
  {
    slug: "arte-terapia",
    name: "Arte terapia",
    contact: "224407300",
    description:
      "Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat.",
    coordinator: { name: "Nombre", role: "Coordinador programa" },
    team: [{ name: "Nombres", role: "Cargo/Profesión" }],
  },
  {
    slug: "otec",
    name: "OTEC",
    contact: "224407300",
    description:
      "Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat.",
    coordinator: { name: "Nombre", role: "Coordinador programa" },
    team: [{ name: "Nombres", role: "Cargo/Profesión" }],
  },
  {
    slug: "prelac",
    name: "PRELAC",
    contact: "224407300",
    description:
      "Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat.",
    coordinator: { name: "Nombre", role: "Coordinador programa" },
    team: [{ name: "Nombres", role: "Cargo/Profesión" }],
  },
];

export const programRows: string[][] = [
  ["direccion-gestion-riesgo", "oficina-local-ninez", "discapacidad-inclusion"],
  ["plantas-medicinales", "arte-terapia", "otec", "prelac"],
];

export function getProgramBySlug(slug: string) {
  return programs.find((program) => program.slug === slug);
}
