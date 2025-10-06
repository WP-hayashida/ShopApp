import Link from 'next/link';

export default function AuthCodeError() {
  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>Authentication Error</h1>
      <p>Could not exchange the authentication code for a session.</p>
      <p>
        Please try signing in again. If the problem persists, contact support.
      </p>
      <Link href="/" className="text-blue-600 hover:underline">Go to Home Page</Link>
    </div>
  );
}
