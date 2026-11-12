import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { requireSessionApi } from '@/lib/auth/api';

interface PreviousMatchRow {
  id: string;
  person1_email: string | null;
  person2_email: string | null;
  similarity_score: number | null;
  emoji: string | null;
  created_at: string;
}

/**
 * The signed-in person's past matches across every round.
 *
 * Looked up by email rather than response id: responses are deleted when a round
 * resets, so someone returning for a new round has a new id but the same email.
 * A partner whose response has since been deleted still appears, without details.
 */
export async function GET() {
  const auth = await requireSessionApi();
  if (auth instanceof NextResponse) return auth;

  const userEmail = (auth.email ?? '').trim().toLowerCase();
  if (!userEmail) {
    return NextResponse.json({ error: "Your account does not have an email address" }, { status: 400 });
  }

  try {
    const quoted = `"${userEmail.replace(/["\\]/g, '\\$&')}"`;
    const { data: rows, error: matchesError } = await supabase
      .from('previous_matches')
      .select('id, person1_email, person2_email, similarity_score, emoji, created_at')
      .or(`person1_email.eq.${quoted},person2_email.eq.${quoted}`)
      .order('created_at', { ascending: false });

    if (matchesError) {
      console.error('[User History API] Error fetching previous matches:', matchesError);
      return NextResponse.json({ error: "Failed to fetch previous matches" }, { status: 500 });
    }

    const history = (rows ?? []) as PreviousMatchRow[];
    if (history.length === 0) {
      return NextResponse.json({ matches: [], message: "No previous matches found" });
    }

    const partnerEmailOf = (row: PreviousMatchRow) =>
      ((row.person1_email ?? '').toLowerCase() === userEmail ? row.person2_email : row.person1_email) ?? '';

    const partnerEmails = Array.from(new Set(history.map(partnerEmailOf).filter(Boolean)));
    const { data: partners, error: partnersError } = await supabase
      .from('form_responses')
      .select('email, name, social_media_links, program, year')
      .in('email', partnerEmails);

    if (partnersError) {
      console.error('[User History API] Error fetching matched users:', partnersError);
      return NextResponse.json({ error: "Failed to fetch matched users" }, { status: 500 });
    }

    const partnerByEmail = new Map((partners ?? []).map((p) => [(p.email ?? '').toLowerCase(), p]));

    const matches = history.map((row) => {
      const partner = partnerByEmail.get(partnerEmailOf(row).toLowerCase());
      return {
        matchedUserId: row.id,
        name: partner?.name || 'Former participant',
        social_media_links: partner?.social_media_links || '',
        program: partner?.program || 'Unknown',
        year: partner?.year || 'Unknown',
        similarity_score: row.similarity_score ?? 0,
        emoji: row.emoji || '🤝',
      };
    });

    return NextResponse.json({ matches, message: "Previous matches retrieved successfully" });
  } catch (error) {
    console.error('[User History API] Error:', error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
