export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="max-w-2xl text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight text-white">
          Welcome to Z365
        </h1>
        <p className="text-slate-400 text-lg">
          Frontend client powered by Next.js. Connects to the Spring Boot modular monolith core backend and AI Agent service.
        </p>
      </div>
    </main>
  );
}
