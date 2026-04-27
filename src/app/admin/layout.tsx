// This layout is now minimal and only applies to the /admin route itself.
// The main protected layout is in /(protected)/layout.tsx
// The login layout is in /login/layout.tsx



export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
    </>
  );
}
