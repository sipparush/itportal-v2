import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const { username, password } = await request.json();

        // Mock validation - Replace with real database check later
        // Hardcoded credentials for MVP
        if (username === 'admin' && password === 'password') {

            // Simulate creating a session token
            const token = 'mock-jwt-token-12345';

            return NextResponse.json({
                success: true,
                message: 'Login successful',
                token,
                user: {
                    id: 1,
                    name: 'IT Admin',
                    role: 'admin'
                }
            });
        }

        return NextResponse.json(
            { success: false, message: 'Invalid username or password' },
            { status: 401 }
        );

    } catch (error) {
        return NextResponse.json(
            { success: false, message: 'An error occurred during login' },
            { status: 500 }
        );
    }
}
