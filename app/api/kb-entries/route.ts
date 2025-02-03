import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// Schema for validating KB entry data
const kbEntrySchema = z.object({
  article_title: z.string().min(1),
  article_subtitle: z.string().optional(),
  article_body: z.string().min(1),
  category: z.enum(['Glossary', 'FAQs', 'Getting started', 'Troubleshooting', 'General', 'Reports', 'Integrations']),
  subcategory: z.string().optional(),
  keywords: z.string().optional(),
  internal_status: z.enum(['Draft', 'Review', 'Approved', 'Archived']),
  visibility: z.enum(['Public', 'Private']),
  notes: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

// GET /api/kb-entries
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const visibility = searchParams.get('visibility');
    const query = searchParams.get('q');

    const where: any = {};
    
    if (category) where.category = category;
    if (status) where.internal_status = status;
    if (visibility) where.visibility = visibility;
    if (query) {
      where.OR = [
        { article_title: { contains: query, mode: 'insensitive' } },
        { article_body: { contains: query, mode: 'insensitive' } },
        { keywords: { contains: query, mode: 'insensitive' } },
      ];
    }

    const entries = await prisma.kb_entries.findMany({
      where,
      orderBy: { updated_at: 'desc' },
    });

    return NextResponse.json(entries);
  } catch (error) {
    console.error('Failed to fetch KB entries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch KB entries' },
      { status: 500 }
    );
  }
}

// POST /api/kb-entries
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = kbEntrySchema.parse(body);

    // Generate a unique URL based on the title
    const article_url = `kb/${validatedData.category.toLowerCase()}/${validatedData.article_title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')}`;

    const entry = await prisma.kb_entries.create({
      data: {
        ...validatedData,
        article_url,
        status: validatedData.internal_status === 'Approved' && validatedData.visibility === 'Public' ? 'PUBLISHED' : 'DRAFT',
      },
    });

    return NextResponse.json(entry);
  } catch (error) {
    console.error('Failed to create KB entry:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create KB entry' },
      { status: 500 }
    );
  }
}

// PATCH /api/kb-entries
export async function PATCH(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Missing ID parameter' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = kbEntrySchema.partial().parse(body);

    // Update Hubspot status based on internal_status and visibility
    if (validatedData.internal_status || validatedData.visibility) {
      const entry = await prisma.kb_entries.findUnique({
        where: { id: parseInt(id) },
      });

      if (!entry) {
        return NextResponse.json(
          { error: 'KB entry not found' },
          { status: 404 }
        );
      }

      const newInternalStatus = validatedData.internal_status || entry.internal_status;
      const newVisibility = validatedData.visibility || entry.visibility;
      
      validatedData.status = newInternalStatus === 'Approved' && newVisibility === 'Public' ? 'PUBLISHED' : 'DRAFT';
    }

    const updatedEntry = await prisma.kb_entries.update({
      where: { id: parseInt(id) },
      data: validatedData,
    });

    return NextResponse.json(updatedEntry);
  } catch (error) {
    console.error('Failed to update KB entry:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update KB entry' },
      { status: 500 }
    );
  }
}

// DELETE /api/kb-entries
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Missing ID parameter' },
        { status: 400 }
      );
    }

    await prisma.kb_entries.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete KB entry:', error);
    return NextResponse.json(
      { error: 'Failed to delete KB entry' },
      { status: 500 }
    );
  }
}
