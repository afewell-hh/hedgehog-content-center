import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
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

// GET /api/kb-entries/[id]
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const entry = await prisma.kb_entries.findUnique({
      where: { id: parseInt(params.id) },
    });

    if (!entry) {
      return NextResponse.json(
        { error: 'KB entry not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(entry);
  } catch (error) {
    console.error('Failed to fetch KB entry:', error);
    return NextResponse.json(
      { error: 'Failed to fetch KB entry' },
      { status: 500 }
    );
  }
}

// PATCH /api/kb-entries/[id]
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validatedData = kbEntrySchema.partial().parse(body);

    // Update Hubspot status based on internal_status and visibility
    if (validatedData.internal_status || validatedData.visibility) {
      const entry = await prisma.kb_entries.findUnique({
        where: { id: parseInt(params.id) },
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
      where: { id: parseInt(params.id) },
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

// DELETE /api/kb-entries/[id]
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.kb_entries.delete({
      where: { id: parseInt(params.id) },
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
