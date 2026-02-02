import "../styles/globals.css";

export const metadata = {
  title: "Espacio por el Buen Vivir",
  description: "Sistema interno de gestión",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
