import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { DEMO_ACCOUNTS } from '@/lib/constants/auth';

export async function POST(request: Request) {
  try {
    const { roleKey } = await request.json();
    const cred = DEMO_ACCOUNTS[roleKey];

    if (!cred) {
      return NextResponse.json(
        { success: false, error: `Invalid demo role: ${roleKey}` },
        { status: 400 }
      );
    }

    // Authenticate on server using supabaseAdmin
    let user: any = null;
    let session: any = null;

    try {
      const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
        email: cred.email,
        password: cred.password,
      });

      if (!authError && authData?.user) {
        user = authData.user;
        session = authData.session;
      }
    } catch (authErr) {
      console.warn('Server auth signInWithPassword warning:', authErr);
    }

    // Fetch or construct profile
    let profile: any = null;
    try {
      const { data: profData } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('email', cred.email)
        .maybeSingle();
      if (profData) profile = profData;
    } catch (profErr) {
      console.warn('Profile fetch warning:', profErr);
    }

    if (!profile) {
      profile = {
        id: user?.id || `demo-${roleKey}`,
        email: cred.email,
        full_name: cred.label,
        role: cred.role,
        phone: '+91 98200 44556',
        production_company: cred.role === 'client' ? 'Paramount Telugu Studios' : 'Ashwa Studios Ltd',
      };
    }

    if (!user) {
      user = {
        id: profile.id,
        email: cred.email,
        user_metadata: {
          full_name: profile.full_name,
          role: cred.role,
        },
      };
    }

    return NextResponse.json({
      success: true,
      user,
      session,
      profile,
      role: cred.role,
      route: cred.route,
    });
  } catch (err: any) {
    console.error('Demo route error:', err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Demo sign-in server error',
      },
      { status: 500 }
    );
  }
}
