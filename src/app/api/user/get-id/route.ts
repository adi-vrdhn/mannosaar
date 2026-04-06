import { auth } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // First try to get existing user
    let { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('email', session.user.email)
      .single();

    // If user doesn't exist, create them
    if (error && error.code === 'PGRST116') {
      console.log('User not found, creating new user...');
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert([
          {
            email: session.user.email,
            name: session.user.name,
            role: 'user',
          },
        ])
        .select('id')
        .single();

      if (createError) {
        console.error('Error creating user:', createError);
        return NextResponse.json({ error: 'Failed to create user' }, { status: 400 });
      }

      data = newUser;
    } else if (error) {
      console.error('Error fetching user:', error);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Failed to get user' }, { status: 400 });
    }

    return NextResponse.json({ userId: data.id });
  } catch (error) {
    console.error('Get user ID error:', error);
    return NextResponse.json(
      { error: 'Failed to get user ID' },
      { status: 500 }
    );
  }
}
