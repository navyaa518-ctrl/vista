// ==============================================================================
// ASHWA MOVIE PROPERTY RENTALS - SUPER ADMIN USER MANAGEMENT EDGE FUNCTION
// Path: supabase/functions/manage-users/index.ts
// Handles secure administrative auth operations using Supabase Service Role Key.
// ==============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

serve(async (req: Request) => {
  // 1. Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Server configuration error: missing Supabase environment keys' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Initialize Supabase Admin Client with Service Role Key
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // 3. Verify Calling User Authorization (Strict Super Admin Clearance)
    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user: callerUser }, error: tokenErr } = await supabaseAdmin.auth.getUser(token);
      
      if (!tokenErr && callerUser) {
        // Query caller role from profiles table
        const { data: callerProfile } = await supabaseAdmin
          .from('profiles')
          .select('role')
          .eq('id', callerUser.id)
          .maybeSingle();

        const role = callerProfile?.role || callerUser.user_metadata?.role;
        // In production, strictly reject non-super_admins
        if (role && role !== 'super_admin' && role !== 'admin') {
          return new Response(
            JSON.stringify({ success: false, error: 'Forbidden: Super Admin clearance required' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    const body = await req.json().catch(() => ({}));
    const { action } = body;

    // -------------------------------------------------------------------------
    // ACTION: list - Combine Auth Users & Profiles with Metadata
    // -------------------------------------------------------------------------
    if (action === 'list') {
      const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.listUsers({
        perPage: 1000,
      });

      if (authErr) {
        return new Response(
          JSON.stringify({ success: false, error: authErr.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
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

      return new Response(
        JSON.stringify({ success: true, users: usersList }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // -------------------------------------------------------------------------
    // ACTION: createUser - Create user in auth.users & upsert into profiles
    // -------------------------------------------------------------------------
    if (action === 'createUser') {
      const { email, password, full_name, phone, role, department } = body;

      if (!email || !password || !full_name) {
        return new Response(
          JSON.stringify({ success: false, error: 'Email, initial password, and full name are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
        return new Response(
          JSON.stringify({ success: false, error: createErr?.message || 'Failed to create user in auth directory' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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

      return new Response(
        JSON.stringify({
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
        }),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // -------------------------------------------------------------------------
    // ACTION: updateUser - Update Name, Phone, Role, and Department
    // -------------------------------------------------------------------------
    if (action === 'updateUser') {
      const { userId, full_name, phone, role, department } = body;
      if (!userId) {
        return new Response(
          JSON.stringify({ success: false, error: 'User ID is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
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
        return new Response(
          JSON.stringify({ success: false, error: authUpdateErr.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
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

      return new Response(
        JSON.stringify({ success: true, message: 'User profile updated successfully' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // -------------------------------------------------------------------------
    // ACTION: resetPassword - Direct Password Reset by Super Admin
    // -------------------------------------------------------------------------
    if (action === 'resetPassword') {
      const { userId, newPassword, sendEmail, email } = body;

      if (!userId && !email) {
        return new Response(
          JSON.stringify({ success: false, error: 'User ID or Email is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (newPassword) {
        // Direct password reset by Super Admin
        const { error: resetErr } = await supabaseAdmin.auth.admin.updateUserById(userId, {
          password: newPassword,
        });

        if (resetErr) {
          return new Response(
            JSON.stringify({ success: false, error: resetErr.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, message: 'Password reset successfully. The user can now log in.' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (sendEmail && email) {
        // Send reset email via Supabase Auth
        const { error: emailErr } = await supabaseAdmin.auth.resetPasswordForEmail(email);
        if (emailErr) {
          return new Response(
            JSON.stringify({ success: false, error: emailErr.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, message: `Password reset email dispatched to ${email}` }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: false, error: 'Provide newPassword or specify sendEmail: true' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // -------------------------------------------------------------------------
    // ACTION: toggleStatus - Suspend vs Activate Account
    // -------------------------------------------------------------------------
    if (action === 'toggleStatus') {
      const { userId, status } = body; // 'ACTIVE' or 'SUSPENDED'

      if (!userId || !status) {
        return new Response(
          JSON.stringify({ success: false, error: 'User ID and Target Status are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const isSuspending = status === 'SUSPENDED';

      if (isSuspending) {
        // 1. Immediately revoke all active sessions across devices
        try {
          await supabaseAdmin.auth.admin.signOut(userId, 'all');
        } catch (signOutErr) {
          console.warn('SignOut error during suspension:', signOutErr);
        }

        // 2. Set ban duration (876000 hours = ~100 years) & metadata
        const { error: banErr } = await supabaseAdmin.auth.admin.updateUserById(userId, {
          ban_duration: '876000h',
          user_metadata: { status: 'SUSPENDED' },
        });

        if (banErr) {
          return new Response(
            JSON.stringify({ success: false, error: banErr.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // 3. Update profiles table status
        try {
          await supabaseAdmin.from('profiles').update({ status: 'SUSPENDED' }).eq('id', userId);
        } catch {}

        return new Response(
          JSON.stringify({ success: true, message: 'Account suspended and active sessions terminated', status: 'SUSPENDED' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        // 1. Lift ban duration
        const { error: liftErr } = await supabaseAdmin.auth.admin.updateUserById(userId, {
          ban_duration: 'none',
          user_metadata: { status: 'ACTIVE' },
        });

        if (liftErr) {
          return new Response(
            JSON.stringify({ success: false, error: liftErr.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // 2. Update profiles table status
        try {
          await supabaseAdmin.from('profiles').update({ status: 'ACTIVE' }).eq('id', userId);
        } catch {}

        return new Response(
          JSON.stringify({ success: true, message: 'Account re-activated successfully', status: 'ACTIVE' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // -------------------------------------------------------------------------
    // ACTION: deleteUser - Permanent Hard Delete or Safe Soft Delete
    // -------------------------------------------------------------------------
    if (action === 'deleteUser') {
      const { userId, hardDelete } = body;

      if (!userId) {
        return new Response(
          JSON.stringify({ success: false, error: 'User ID is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (hardDelete) {
        // 1. Revoke sessions
        try {
          await supabaseAdmin.auth.admin.signOut(userId, 'all');
        } catch {}

        // 2. Hard delete from auth.users directory
        const { error: deleteErr } = await supabaseAdmin.auth.admin.deleteUser(userId);
        if (deleteErr) {
          return new Response(
            JSON.stringify({ success: false, error: deleteErr.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // 3. Delete or mark deleted in profiles
        try {
          await supabaseAdmin.from('profiles').delete().eq('id', userId);
        } catch {
          await supabaseAdmin.from('profiles').update({ is_deleted: true, status: 'DELETED' }).eq('id', userId);
        }

        return new Response(
          JSON.stringify({ success: true, message: 'User permanently deleted from authentication directory' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        // Soft delete: revoke sessions, ban permanently, mark deleted
        try {
          await supabaseAdmin.auth.admin.signOut(userId, 'all');
        } catch {}

        await supabaseAdmin.auth.admin.updateUserById(userId, {
          ban_duration: '876000h',
          user_metadata: { is_deleted: true, status: 'SUSPENDED' },
        });

        try {
          await supabaseAdmin.from('profiles').update({ is_deleted: true, status: 'SUSPENDED' }).eq('id', userId);
        } catch {}

        return new Response(
          JSON.stringify({ success: true, message: 'User account deactivated and flagged as deleted' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response(
      JSON.stringify({ success: false, error: `Invalid action specified: ${action}` }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err.message || 'Internal Edge Function Error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
