import { auth } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function DELETE(request: Request) {
  const session = await auth();

  // Check if user is authenticated and is admin
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get user role
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('email', session.user.email)
      .single();

    if (userData?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get all booked slot IDs
    const { data: bookings } = await supabase
      .from('bookings')
      .select('slot_id')
      .eq('status', 'confirmed');

    const bookedSlotIds = new Set((bookings || []).map(b => b.slot_id));

    // Get all slots
    const { data: allSlots, error: fetchError } = await supabase
      .from('therapy_slots')
      .select('id');

    if (fetchError) {
      return NextResponse.json(
        { error: 'Failed to fetch slots' },
        { status: 500 }
      );
    }

    // Separate unbooked slots
    const unbookedSlotIds = (allSlots || [])
      .filter((slot: any) => !bookedSlotIds.has(slot.id))
      .map((slot: any) => slot.id);

    console.log(`📊 Total slots: ${allSlots?.length}, Booked: ${bookedSlotIds.size}, Unbooked: ${unbookedSlotIds.length}`);

    // Delete only unbooked slots
    if (unbookedSlotIds.length > 0) {
      const { error: deleteError } = await supabase
        .from('therapy_slots')
        .delete()
        .in('id', unbookedSlotIds);

      if (deleteError) {
        console.error('Error deleting slots:', deleteError);
        return NextResponse.json(
          { error: 'Failed to delete slots' },
          { status: 500 }
        );
      }

      console.log(`✅ Deleted ${unbookedSlotIds.length} unbooked slots`);
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully deleted all unbooked slots',
      deletedCount: unbookedSlotIds.length,
      bookedCount: bookedSlotIds.size,
    });
  } catch (error) {
    console.error('❌ Delete all slots error:', error);
    return NextResponse.json(
      { error: 'Failed to delete slots' },
      { status: 500 }
    );
  }
}
