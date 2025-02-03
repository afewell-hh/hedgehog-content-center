import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

// GET /api/kb-entries/export
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const article_url = searchParams.get('article_url');

    const where: any = {};
    
    // For export, only get PUBLISHED entries (Approved + Public)
    if (status === 'PUBLISHED') {
      where.internal_status = 'Approved';
      where.visibility = 'Public';
    } else if (status) {
      where.internal_status = status;
    }

    if (category && category !== 'all') {
      where.category = category;
    }

    if (article_url) {
      where.article_url = article_url;
    }

    const entries = await prisma.kb_entries.findMany({
      where,
      orderBy: { updated_at: 'desc' },
    });

    if (entries.length === 0) {
      return NextResponse.json(
        { error: 'No entries found matching the criteria' },
        { status: 404 }
      );
    }

    return NextResponse.json(entries);
  } catch (error) {
    console.error('Failed to fetch KB entries for export:', error);
    return NextResponse.json(
      { error: 'Failed to fetch KB entries for export' },
      { status: 500 }
    );
  }
}
