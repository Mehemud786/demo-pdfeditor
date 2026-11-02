export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-950">
      <h1 className="text-2xl font-bold mb-6 text-white">Portal PDF Viewer</h1>
      
      <a 
        href="/api/fetch-pdf" 
        target="_blank"
        rel="noopener noreferrer"
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
      >
        Open Secure PDF
      </a>
    </main>
  );
}