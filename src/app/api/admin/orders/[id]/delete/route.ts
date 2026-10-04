import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const orderId = resolvedParams.id;

    if (!orderId) {
      return NextResponse.json({ success: false, error: 'Order ID is required' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const { userId, userRole } = body;
    const normRole = (userRole || '').toLowerCase().trim();
    const isSuperAdmin = normRole === 'super_admin' || normRole === 'admin';

    // 1. Fetch order to verify permission
    const { data: order, error: fetchErr } = await supabaseAdmin
      .from('orders')
      .select('id, order_number, status, created_by')
      .eq('id', orderId)
      .maybeSingle();

    if (fetchErr) {
      console.warn('Supabase fetch order error in delete API:', fetchErr.message);
    }

    // If order exists in DB, enforce business rules
    if (order) {
      const normStatus = (order.status || '').toLowerCase().trim();
      const isEarlyStage = normStatus === 'draft' || normStatus === 'picking_in_progress';

      if (!isSuperAdmin) {
        if (!isEarlyStage) {
          return NextResponse.json(
            { success: false, error: 'Dispatched orders can only be deleted by a Super Admin' },
            { status: 403 }
          );
        }

        const isCreator =
          !order.created_by ||
          (userId && order.created_by === userId);

        if (!isCreator) {
          return NextResponse.json(
            { success: false, error: 'Only the order creator or a Super Admin can delete this order' },
            { status: 403 }
          );
        }
      }
    }

    // 2. Try calling RPC function first if installed in Supabase
    try {
      const { data: rpcData, error: rpcErr } = await supabaseAdmin.rpc('delete_order_completely', {
        target_order_id: orderId,
      });

      if (!rpcErr && rpcData?.success) {
        return NextResponse.json({
          success: true,
          deleted_order_id: orderId,
          method: 'rpc',
        });
      }
    } catch (e) {
      console.warn('RPC delete_order_completely call failed or not installed, using service_role cascade:', e);
    }

    // 3. Guaranteed Server-Side Cascade Deletion with Service Role (Bypasses RLS)
    // Step A: Find all serialized props linked to this order
    const { data: linkedItems } = await supabaseAdmin
      .from('order_items')
      .select('prop_serialized_item_id')
      .eq('order_id', orderId);

    const serializedIds: string[] = [];
    if (linkedItems && linkedItems.length > 0) {
      linkedItems.forEach((i: any) => {
        if (i.prop_serialized_item_id) serializedIds.push(i.prop_serialized_item_id);
      });
    }

    // Release serialized props directly linked by current_order_id
    await supabaseAdmin
      .from('prop_serialized_items')
      .update({ status: 'Available', current_order_id: null })
      .eq('current_order_id', orderId);

    // Release serialized props identified in order_items
    if (serializedIds.length > 0) {
      await supabaseAdmin
        .from('prop_serialized_items')
        .update({ status: 'Available', current_order_id: null })
        .in('id', serializedIds);
    }

    // Step B: Clean up child tables explicitly to satisfy any foreign keys without ON DELETE CASCADE
    await supabaseAdmin.from('order_items').delete().eq('order_id', orderId);
    await supabaseAdmin.from('order_assignments').delete().eq('order_id', orderId);
    await supabaseAdmin.from('prop_rental_history').delete().eq('order_id', orderId);

    // Step C: Delete the main order
    const { error: deleteOrderErr } = await supabaseAdmin.from('orders').delete().eq('id', orderId);

    if (deleteOrderErr) {
      console.error('Supabase parent order delete failed:', deleteOrderErr.message);
      return NextResponse.json(
        { success: false, error: deleteOrderErr.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      deleted_order_id: orderId,
      message: 'Order and associated operational items deleted successfully.',
    });
  } catch (error: any) {
    console.error('Unexpected error in delete order route:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
