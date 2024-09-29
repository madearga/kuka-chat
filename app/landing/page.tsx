import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-4">Landing Page</h1>
      <p className="mb-6">Welcome to our landing page!</p>
      <div className="space-x-4">
        <Link href="/" className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded">
          Home
        </Link>
      </div>
    </div>
  )
}