import { auth } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, phone_number, whatsapp_number } = body;

    if (!phone_number || !name) {
      return NextResponse.json(
        { error: 'Name and phone number are required' },
        { status: 400 }
      );
    }

    // Validate WhatsApp number format if provided (basic validation)
    if (whatsapp_number && !/^\+?[1-9]\d{1,14}$/.test(whatsapp_number.replace(/\D/g, ''))) {
      return NextResponse.json(
        { error: 'Invalid WhatsApp number format. Use E.164 format (e.g., +1234567890)' },
        { status: 400 }
      );
    }

    // Validate phone number (basic validation)
    if (phone_number.replace(/\D/g, '').length < 10) {
      return NextResponse.json(
        { error: 'Phone number must have at least 10 digits' },
        { status: 400 }
      );
    }

    // Update user profile
    const { data, error } = await supabase
      .from('users')
      .update({
        name,
        phone_number,
        updated_at: new Date().toISOString(),
      })
      .eq('email', session.user.email)
      .select('id, name, email, phone_number')
      .single();

    // Update profile table with whatsapp_number if provided
    let whatsappError = null;
    if (whatsapp_number) {
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert(
          {
            id: data?.id || session.user.email,
            whatsapp_number,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        );
      if (profileError) {
        console.log('Note: WhatsApp number could not be saved to profiles table');
        whatsappError = profileError;
      }
    }

    // If phone_number column doesn't exist, retry without it
    if (error?.code === '42703' || error?.message?.includes('phone_number')) {
      console.log('Retrying without phone_number column...');
      const { data: updatedUser, error: retryError } = await supabase
        .from('users')
        .update({
          name,
          updated_at: new Date().toISOString(),
        })
        .eq('email', session.user.email)
        .select('id, name, email')
        .single();

      if (retryError) {
        console.error('Error updating profile:', retryError);
        return NextResponse.json(
          { error: 'Failed to update profile' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        user: updatedUser ? { ...updatedUser, phone_number, whatsapp_number: whatsapp_number || null } : { email: session.user.email, name, phone_number, whatsapp_number: whatsapp_number || null },
      });
    }

    if (error) {
      console.error('Error updating profile:', error);
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      user: data ? { ...data, whatsapp_number: whatsapp_number || null } : { email: session.user.email, name, phone_number, whatsapp_number: whatsapp_number || null },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Try to get existing user
    let { data, error } = await supabase
      .from('users')
      .select('id, name, email, phone_number')
      .eq('email', session.user.email)
      .maybeSingle();

    // If phone_number column doesn't exist, try without it
    if (error?.code === '42703') {
      console.log('phone_number column not found, trying without it');
      const { data: userData, error: retryError } = await supabase
        .from('users')
        .select('id, name, email')
        .eq('email', session.user.email)
        .maybeSingle();
      
      if (retryError) {
        console.error('Error fetching profile:', retryError);
        return NextResponse.json(
          { error: 'Failed to fetch profile' },
          { status: 500 }
        );
      }
      
      data = userData ? { ...userData, phone_number: null } : null;
      error = null;
    }

    // If user doesn't exist, create them
    if (!data && !error) {
      console.log('Creating user:', session.user.email);
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert([
          {
            email: session.user.email,
            name: session.user.name || '',
            role: 'user',
            phone_number: null,
          },
        ])
        .select('id, name, email, phone_number')
        .single();

      // If creation failed due to phone_number column not existing, retry without it
      if (createError && (createError.code === '42703' || createError.message?.includes('phone_number'))) {
        console.log('Retrying user creation without phone_number...');
        const { data: minimalUser, error: retryError } = await supabase
          .from('users')
          .insert([
            {
              email: session.user.email,
              name: session.user.name || '',
              role: 'user',
            },
          ])
          .select('id, name, email')
          .single();

        if (retryError) {
          console.error('Error creating user:', retryError);
          return NextResponse.json(
            { error: 'Failed to create user profile' },
            { status: 500 }
          );
        }

        data = minimalUser ? { ...minimalUser, phone_number: null } : null;
      } else if (createError) {
        console.error('Error creating user:', createError);
        return NextResponse.json(
          { error: 'Failed to create user profile' },
          { status: 500 }
        );
      } else {
        data = newUser;
      }
    }

    if (error) {
      console.error('Error fetching profile:', error);
      return NextResponse.json(
        { error: 'Failed to fetch profile' },
        { status: 500 }
      );
    }

    // Fetch WhatsApp number from profiles table if user exists
    let whatsappNumber = null;
    if (data?.id) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('whatsapp_number')
        .eq('id', data.id)
        .maybeSingle();
      
      whatsappNumber = profileData?.whatsapp_number || null;
    }

    return NextResponse.json({ ...data, whatsapp_number: whatsappNumber });
  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
