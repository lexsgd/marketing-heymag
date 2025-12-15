import { NextResponse } from 'next/server'
import { config } from '@/lib/config'

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    version: config.version,
    internalBuild: config.internalBuild,
    appName: config.appName,
    timestamp: new Date().toISOString(),
  })
}
