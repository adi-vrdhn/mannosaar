import NextAuth, { type NextAuthConfig, type Session, type User } from 'next-auth';
import Google from 'next-auth/providers/google';
import { createClient } from '@supabase/supabase-js';
import { JWT } from 'next-auth/jwt';

// Extend the default NextAuth types
declare module 'next-auth' {
  interface Session {
    user: User & {
      role?: string;
    };
  }

  interface User {
    role?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    email?: string | null;
    name?: string | null;
    role?: string;
    accessToken?: string;
    refreshToken?: string;
  }
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const authConfig: NextAuthConfig = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
      authorization: {
        params: {
          prompt: 'select_account', // Force account selection every time
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Allow all signins - user creation happens in session callback
      return true;
    },

    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = user.role || 'user';
      }

      // Update role from database on every token refresh
      if (token.email) {
        try {
          const { data: dbUser, error } = await supabase
            .from('users')
            .select('role')
            .eq('email', token.email)
            .maybeSingle();

          if (!error && dbUser) {
            token.role = dbUser.role;
          }
        } catch (err) {
          // Keep existing role if database query fails
        }
      }

      // Store Google OAuth tokens
      if (account?.access_token) {
        token.accessToken = account.access_token;
      }
      if (account?.refresh_token) {
        token.refreshToken = account.refresh_token;
      }
      return token;
    },

    async session({ session, token }) {
      try {
        if (session.user && token.email) {
          session.user.email = (token.email as string) || '';
          session.user.name = (token.name as string) || '';

          console.log('🔐 [Session] Processing user:', token.email);

          // Ensure user exists in Supabase
          // CRITICAL: Must always resolve to a valid Supabase user ID
          let supabaseUserId = null;
          
          try {
            const { data: existingUser, error: selectError } = await supabase
              .from('users')
              .select('id, role, name, email, phone_number')
              .eq('email', token.email)
              .maybeSingle();

            if (!selectError && existingUser) {
              // User found in database
              supabaseUserId = existingUser.id;
              session.user.role = existingUser.role;
              console.log('✅ [Session] User found:', existingUser.id);
            } else if (selectError) {
              console.error('❌ [Session] Query error:', selectError);
              // Don't return early - try to create user instead
            }

            // If user not found, create them
            if (!supabaseUserId) {
              console.log('📝 [Session] Creating new user:', token.email);
              const { data: newUser, error: insertError } = await supabase
                .from('users')
                .insert([
                  {
                    email: token.email as string,
                    name: (token.name as string) || '',
                    role: 'user',
                    phone_number: null,
                  },
                ])
                .select('id, role, name, email, phone_number')
                .single();

              if (insertError) {
                console.error('❌ [Session] Insert error:', insertError);
                session.user.role = 'user';
                return session;
              }

              if (newUser) {
                supabaseUserId = newUser.id;
                session.user.role = newUser.role;
                console.log('✅ [Session] User created:', newUser.id);
              }
            }

            // CRITICAL: Always set the Supabase user ID
            if (supabaseUserId) {
              session.user.id = supabaseUserId;
              console.log('✅ [Session] Final user ID set:', supabaseUserId);
            } else {
              console.error('❌ [Session] Failed to resolve Supabase user ID');
              session.user.role = 'user';
            }
          } catch (dbError) {
            console.error('❌ [Session] Database error:', dbError);
            session.user.role = 'user'; // Default role
          }
        }
        return session;
      } catch (error) {
        console.error('❌ [Session] Fatal error:', error);
        // Don't throw, return what we have
        return session;
      }
    },

    async redirect({ url, baseUrl }) {
      // Allow same-origin redirects
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }
      // Default redirect after login
      return `${baseUrl}/appointment/type`;
    },
  },
  pages: {
    signIn: '/auth/login',
    error: '/api/auth/error',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  trustHost: true,
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
