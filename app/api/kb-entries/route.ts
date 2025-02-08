import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { z } from 'zod';

// Schema for validating KB entry data
const kbEntrySchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  category: z.enum(['Glossary', 'FAQs', 'Getting started', 'Troubleshooting', 'General', 'Reports', 'Integrations']),
  article_url: z.string().min(1),
  last_modified_date: z.string().optional(),
  status: z.string().optional(),
  metadata: z.object({
    subtitle: z.string().optional(),
    language: z.string().optional(),
    subcategory: z.string().optional(),
    keywords: z.string().optional(),
    archived: z.boolean().optional(),
  }).optional(),
  internal_status: z.enum(['Draft', 'Review', 'Approved', 'Archived', 'Needs Work']),
  visibility: z.enum(['Public', 'Private']),
  notes: z.string().optional(),
});

// GET /api/kb-entries
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const visibility = searchParams.get('visibility');
    const query = searchParams.get('q');
    const article_url = searchParams.get('article_url');

    const where: any = {};
    
    if (category) where.category = category;
    if (status) where.internal_status = status;
    if (visibility) where.visibility = visibility;
    if (article_url) where.article_url = article_url;
    if (query) {
      where.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { body: { contains: query, mode: 'insensitive' } },
        { metadata: { path: ['keywords'], string_contains: query } },
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

    // Map the fields to match database schema
    const dbData = {
      article_title: body.title,
      article_body: body.body,
      category: body.category,
      article_url: body.article_url,
      last_modified_date: body.last_modified_date ? new Date(body.last_modified_date) : new Date(),
      status: body.status || 'DRAFT',
      article_subtitle: body.metadata?.subtitle,
      article_language: body.metadata?.language || 'English',
      subcategory: body.metadata?.subcategory,
      keywords: body.metadata?.keywords,
      archived: body.metadata?.archived || false,
      internal_status: body.internal_status || 'Draft',
      visibility: body.visibility || 'Private',
      notes: body.notes,
      metadata: body.metadata || {},
    };

    const entry = await prisma.kb_entries.create({
      data: dbData,
    });

    // Map the response back to the API format
    const response = {
      title: entry.article_title,
      body: entry.article_body,
      category: entry.category,
      article_url: entry.article_url,
      last_modified_date: entry.last_modified_date.toISOString(),
      status: entry.status,
      metadata: {
        subtitle: entry.article_subtitle,
        language: entry.article_language,
        subcategory: entry.subcategory,
        keywords: entry.keywords,
        archived: entry.archived,
      },
      internal_status: entry.internal_status,
      visibility: entry.visibility,
      notes: entry.notes,
    };

    return NextResponse.json(response);
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

    // Map the fields to match database schema
    const dbData = {
      article_title: body.title,
      article_body: body.body,
      category: body.category,
      article_url: body.article_url,
      last_modified_date: body.last_modified_date ? new Date(body.last_modified_date) : new Date(),
      status: body.status,
      article_subtitle: body.metadata?.subtitle,
      article_language: body.metadata?.language,
      subcategory: body.metadata?.subcategory,
      keywords: body.metadata?.keywords,
      archived: body.metadata?.archived,
      internal_status: body.internal_status,
      visibility: body.visibility,
      notes: body.notes,
      metadata: body.metadata,
    };

    // Only include defined fields in the update
    const updateData = Object.entries(dbData).reduce((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = value;
      }
      return acc;
    }, {} as any);

    const updatedEntry = await prisma.kb_entries.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    // Map the response back to the API format
    const response = {
      title: updatedEntry.article_title,
      body: updatedEntry.article_body,
      category: updatedEntry.category,
      article_url: updatedEntry.article_url,
      last_modified_date: updatedEntry.last_modified_date.toISOString(),
      status: updatedEntry.status,
      metadata: {
        subtitle: updatedEntry.article_subtitle,
        language: updatedEntry.article_language,
        subcategory: updatedEntry.subcategory,
        keywords: updatedEntry.keywords,
        archived: updatedEntry.archived,
      },
      internal_status: updatedEntry.internal_status,
      visibility: updatedEntry.visibility,
      notes: updatedEntry.notes,
    };

    return NextResponse.json(response);
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
