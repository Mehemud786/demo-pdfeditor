import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default function DashboardPage() {
  const cookieStore = cookies();
  const sessionToken = cookieStore.get('session_token');

  // Protect the route: if no token exists, redirect back to login
  if (!sessionToken) {
    redirect('/');
  }

  return (
    <div style={{ maxWidth: '600px', margin: '100px auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Dashboard</h1>
      <p>Authentication successful. You are currently logged in.</p>
      
      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '5px', border: '1px solid #ddd' }}>
        <h2 style={{ fontSize: '16px', margin: '0 0 10px 0' }}>Your Active Session Token:</h2>
        <code style={{ wordBreak: 'break-all', color: '#d63200', fontSize: '14px' }}>
          {sessionToken.value}
        </code>
      </div>

      <form action={async () => {
        'use server';
        cookies().delete('session_token');
        redirect('/');
      }}>
        <button type="submit" style={{ marginTop: '20px', padding: '10px 15px', backgroundColor: '#333', color: '#fff', border: 'none', cursor: 'pointer' }}>
          Logout
        </button>
      </form>
    </div>
  );
}