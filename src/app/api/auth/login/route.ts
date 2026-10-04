import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { DEMO_ACCOUNTS, getTargetRoute } from '@/lib/constants/auth';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const trimmedEmail = email.trim().toLowerCase();

    // 1. Check if matches any demo account
    const matchedDemo = Object.values(DEMO_ACCOUNTS).find(
      (acc) => acc.email.toLowerCase() === trimmedEmail && acc.password === password
    );

    // 2. Try Supabase Auth via server
    let user: any = null;
    let session: any = null;
    let authErrorMsg = '';

    try {
      const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });

      if (authError) {
        if (
          authError.message.toLowerCase().includes('banned') ||
          authError.message.toLowerCase().includes('suspended')
        ) {
          return NextResponse.json(
            { success: false, error: 'Your account is temporarily suspended. Contact Super Admin.' },
            { status: 403 }
          );
        }
        authErrorMsg = authError.message;
      } else if (authData?.user) {
        user = authData.user;
        session = authData.session;
      }
    } catch (e: any) {
      authErrorMsg = e.message;
    }

    // If server Supabase auth failed but user matched a demo account, allow access!
    if (!user && matchedDemo) {
      user = {
        id: `demo-${matchedDemo.role}`,
        email: matchedDemo.email,
        user_metadata: {
          full_name: matchedDemo.label,
          role: matchedDemo.role,
        },
      };
    }

    if (!user) {
      return NextResponse.json(
        { success: false, error: authErrorMsg || 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Fetch profile
    let profile: any = null;
    try {
      const { data: profData } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('email', trimmedEmail)
        .maybeSingle();
      if (profData) profile = profData;
    } catch {
      // Ignore
    }

    if (!profile) {
      const role = matchedDemo?.role || (user.user_metadata?.role as any) || 'client';
      profile = {
        id: user.id,
        email: trimmedEmail,
        full_name: matchedDemo?.label || user.user_metadata?.full_name || trimmedEmail.split('@')[0],
        role,
        phone: '+91 98200 44556',
        production_company: role === 'client' ? 'Paramount Telugu Studios' : 'Ashwa Studios Ltd',
      };
    }

    // Check if user is suspended
    const isSuspended =
      (user.banned_until && new Date(user.banned_until) > new Date()) ||
      user.user_metadata?.status === 'SUSPENDED' ||
      profile?.status === 'SUSPENDED';

    if (isSuspended) {
      return NextResponse.json(
        { success: false, error: 'Your account is temporarily suspended. Contact Super Admin.' },
        { status: 403 }
      );
    }

    const role = profile.role || matchedDemo?.role || 'client';
    const targetRoute = getTargetRoute(role);

    return NextResponse.json({
      success: true,
      user,
      session,
      profile,
      role,
      route: targetRoute,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Authentication service error' },
      { status: 500 }
    );
  }
}
