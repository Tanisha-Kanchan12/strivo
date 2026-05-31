export default function FocusLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="-mx-4 -mt-6 sm:-mx-6">
      {children}
    </div>
  );
}
