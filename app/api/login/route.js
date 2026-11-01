import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { username, password } = await request.json();

    // In a real app, validate against a database. Here we accept any non-empty input.
    if (username && password) {
      // Generate a mock session token (e.g., a JWT or secure random string)
      const mockToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(username)}.${Date.now()}`;

      const response = NextResponse.json({ success: true }, { status: 200 });

      // Set the session token as a cookie
      response.cookies.set({
        name: 'session_token',
        value: mockToken,
        path: '/',
        httpOnly: true, // Security best practice: prevents client-side JS access
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24, // 1 day
      });

      return response;
    }

    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}