export default function AuthCodeError() {
  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>Authentication Error</h1>
      <p>Could not exchange the authentication code for a session.</p>
      <p>
        Please try signing in again. If the problem persists, contact support.
      </p>
      <a href="/">Go to Home Page</a>
    </div>
  );
}
