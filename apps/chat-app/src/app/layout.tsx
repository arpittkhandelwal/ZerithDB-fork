export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <title>ZerithDB Chat</title>
      </head>
      <body>{children}</body>
    </html>
  );
}
