import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { action } = body;

    // -------------------------------------------------------------------------
    // ACTION: list - Combine Auth Users & Profiles with Metadata
    // -------------------------------------------------------------------------
    if (action === 'list') {
      const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.listUsers({
        perPage: 1000,
      });

      if (authErr) {
        return NextResponse.json({ success: false, error: authErr.message }, { status: 400 });
      }

      // Fetch profiles
      const { data: profilesData } = await supabaseAdmin
        .from('profiles')
        .select('*');

      const profilesMap = new Map();
      (profilesData || []).forEach((p: any) => {
        if (p.id) profilesMap.set(p.id, p);
        if (p.email) profilesMap.set(p.email.toLowerCase(), p);
      });

      // Merge records
      const usersList = authData.users.map((u: any) => {
        const prof = profilesMap.get(u.id) || profilesMap.get(u.email?.toLowerCase()) || {};
        const meta = u.user_metadata || {};

        const isBanned = !!u.banned_until && new Date(u.banned_until) > new Date();
        const status = isBanned ? 'SUSPENDED' : (prof.status || meta.status || 'ACTIVE');

        return {
          id: u.id,
          email: u.email,
          full_name: prof.full_name || meta.full_name || u.email?.split('@')[0],
          phone: prof.phone || meta.phone || u.phone || '',
          role: prof.role || meta.role || 'crew_member',
          department: prof.department || meta.department || 'General Operations',
          status,
          created_at: u.created_at,
          last_sign_in_at: u.last_sign_in_at,
          is_banned: isBanned,
          is_deleted: !!prof.is_deleted || !!meta.is_deleted,
        };
      });

      return NextResponse.json({ success: true, users: usersList });
    }

    // -------------------------------------------------------------------------
    // ACTION: createUser - Create user in auth.users & upsert into profiles
    // -------------------------------------------------------------------------
    if (action === 'createUser') {
      const { email, password, full_name, phone, role, department } = body;

      if (!email || !password || !full_name) {
        return NextResponse.json(
          { success: false, error: 'Email, initial password, and full name are required' },
          { status: 400 }
        );
      }

      const cleanEmail = email.trim().toLowerCase();
      const userRole = role || 'crew_member';
      const userDept = department || 'General Operations';

      // 1. Create in auth.users
      const { data: newAuth, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email: cleanEmail,
        password: password,
        email_confirm: true,
        user_metadata: {
          full_name,
          phone: phone || '',
          role: userRole,
          department: userDept,
          status: 'ACTIVE',
        },
      });

      if (createErr || !newAuth?.user) {
        return NextResponse.json(
          { success: false, error: createErr?.message || 'Failed to create user in auth directory' },
          { status: 400 }
        );
      }

      const newUserId = newAuth.user.id;

      // 2. Upsert profile into public.profiles
      try {
        await supabaseAdmin.from('profiles').upsert({
          id: newUserId,
          email: cleanEmail,
          full_name,
          phone: phone || '',
          role: userRole,
          updated_at: new Date().toISOString(),
        });
      } catch (profErr) {
        console.warn('Profile upsert warning:', profErr);
      }

      return NextResponse.json(
        {
          success: true,
          message: 'User account created successfully with active credentials',
          user: {
            id: newUserId,
            email: cleanEmail,
            full_name,
            phone,
            role: userRole,
            department: userDept,
            status: 'ACTIVE',
            created_at: newAuth.user.created_at,
          },
        },
        { status: 201 }
      );
    }

    // -------------------------------------------------------------------------
    // ACTION: updateUser - Update Name, Phone, Role, and Department
    // -------------------------------------------------------------------------
    if (action === 'updateUser') {
      const { userId, full_name, phone, role, department } = body;
      if (!userId) {
        return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
      }

      // Update auth user metadata
      const { error: authUpdateErr } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: {
          full_name,
          phone: phone || '',
          role,
          department,
        },
      });

      if (authUpdateErr) {
        return NextResponse.json({ success: false, error: authUpdateErr.message }, { status: 400 });
      }

      // Update public.profiles
      try {
        await supabaseAdmin
          .from('profiles')
          .update({
            full_name,
            phone: phone || '',
            role,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);
      } catch (profErr) {
        console.warn('Profile update warning:', profErr);
      }

      return NextResponse.json({ success: true, message: 'User profile updated successfully' });
    }

    // -------------------------------------------------------------------------
    // ACTION: resetPassword - Direct Password Reset by Super Admin
    // -------------------------------------------------------------------------
    if (action === 'resetPassword') {
      const { userId, newPassword, sendEmail, email } = body;

      if (!userId && !email) {
        return NextResponse.json({ success: false, error: 'User ID or Email is required' }, { status: 400 });
      }

      if (newPassword) {
        // Direct password reset by Super Admin
        const { error: resetErr } = await supabaseAdmin.auth.admin.updateUserById(userId, {
          password: newPassword,
        });

        if (resetErr) {
          return NextResponse.json({ success: false, error: resetErr.message }, { status: 400 });
        }

        return NextResponse.json({
          success: true,
          message: 'Password reset successfully. The user can now log in.',
        });
      }

      if (sendEmail && email) {
        const { error: emailErr } = await supabaseAdmin.auth.resetPasswordForEmail(email);
        if (emailErr) {
          return NextResponse.json({ success: false, error: emailErr.message }, { status: 400 });
        }

        return NextResponse.json({
          success: true,
          message: `Password reset email dispatched to ${email}`,
        });
      }

      return NextResponse.json(
        { success: false, error: 'Provide newPassword or specify sendEmail: true' },
        { status: 400 }
      );
    }

    // -------------------------------------------------------------------------
    // ACTION: toggleStatus - Suspend vs Activate Account
    // -------------------------------------------------------------------------
    if (action === 'toggleStatus') {
      const { userId, status } = body; // 'ACTIVE' or 'SUSPENDED'

      if (!userId || !status) {
        return NextResponse.json(
          { success: false, error: 'User ID and Target Status are required' },
          { status: 400 }
        );
      }

      const isSuspending = status === 'SUSPENDED';

      if (isSuspending) {
        // 1. Revoke active sessions across all devices
        try {
          await supabaseAdmin.auth.admin.signOut(userId, 'global');
        } catch (signOutErr) {
          console.warn('SignOut error during suspension:', signOutErr);
        }

        // 2. Set ban duration (876000 hours = ~100 years) & metadata
        const { error: banErr } = await supabaseAdmin.auth.admin.updateUserById(userId, {
          ban_duration: '876000h',
          user_metadata: { status: 'SUSPENDED' },
        });

        if (banErr) {
          return NextResponse.json({ success: false, error: banErr.message }, { status: 400 });
        }

        // 3. Update profiles table status
        try {
          await supabaseAdmin.from('profiles').update({ status: 'SUSPENDED' }).eq('id', userId);
        } catch {}

        return NextResponse.json({
          success: true,
          message: 'Account suspended and active sessions terminated',
          status: 'SUSPENDED',
        });
      } else {
        // 1. Lift ban duration
        const { error: liftErr } = await supabaseAdmin.auth.admin.updateUserById(userId, {
          ban_duration: 'none',
          user_metadata: { status: 'ACTIVE' },
        });

        if (liftErr) {
          return NextResponse.json({ success: false, error: liftErr.message }, { status: 400 });
        }

        // 2. Update profiles table status
        try {
          await supabaseAdmin.from('profiles').update({ status: 'ACTIVE' }).eq('id', userId);
        } catch {}

        return NextResponse.json({
          success: true,
          message: 'Account re-activated successfully',
          status: 'ACTIVE',
        });
      }
    }

    // -------------------------------------------------------------------------
    // ACTION: deleteUser - Permanent Hard Delete or Safe Soft Delete
    // -------------------------------------------------------------------------
    if (action === 'deleteUser') {
      const { userId, hardDelete } = body;

      if (!userId) {
        return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
      }

      if (hardDelete) {
        // 1. Revoke sessions
        try {
          await supabaseAdmin.auth.admin.signOut(userId, 'global');
        } catch {}

        // 2. Hard delete from auth.users directory
        const { error: deleteErr } = await supabaseAdmin.auth.admin.deleteUser(userId);
        if (deleteErr) {
          return NextResponse.json({ success: false, error: deleteErr.message }, { status: 400 });
        }

        // 3. Delete or mark deleted in profiles
        try {
          await supabaseAdmin.from('profiles').delete().eq('id', userId);
        } catch {
          await supabaseAdmin.from('profiles').update({ is_deleted: true, status: 'DELETED' }).eq('id', userId);
        }

        return NextResponse.json({
          success: true,
          message: 'User permanently deleted from authentication directory',
        });
      } else {
        // Soft delete: revoke sessions, ban permanently, mark deleted
        try {
          await supabaseAdmin.auth.admin.signOut(userId, 'global');
        } catch {}

        await supabaseAdmin.auth.admin.updateUserById(userId, {
          ban_duration: '876000h',
          user_metadata: { is_deleted: true, status: 'SUSPENDED' },
        });

        try {
          await supabaseAdmin.from('profiles').update({ is_deleted: true, status: 'SUSPENDED' }).eq('id', userId);
        } catch {}

        return NextResponse.json({
          success: true,
          message: 'User account deactivated and flagged as deleted',
        });
      }
    }

    return NextResponse.json({ success: false, error: `Invalid action specified: ${action}` }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Internal API Error' },
      { status: 500 }
    );
  }
}
