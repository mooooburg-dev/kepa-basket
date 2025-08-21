import { NextResponse } from 'next/server';
import { checkDatabaseHealth } from '@/lib/database';

export async function GET() {
  try {
    const dbHealth = await checkDatabaseHealth();

    return NextResponse.json({
      status: 'ok',
      database: dbHealth,
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Health check error:', error);

    return NextResponse.json(
      {
        status: 'error',
        database: {
          success: false,
          error: 'Database connection failed',
        },
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
