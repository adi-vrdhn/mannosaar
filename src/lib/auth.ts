import NextAuth, { type NextAuthConfig } from 'next-auth';
import Google from 'next-auth/providers/google';
import { createClient } from '@supabase/supabase-js';
import type {} from 'next-auth/jwt';
import { sendWelcomeEmail } from '@/lib/email';
import { fetchWithNetworkRetry } from '@/lib/supabase/retry-fetch';

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
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: fetchWithNetworkRetry },
  }
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
    async signIn() {
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
        } catch {
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
            } else if (selectError) {
              console.error('❌ [Session] Query error:', selectError);
              // A failed lookup is not evidence that the user is missing. Avoid
              // attempting an insert during a transient database/network outage.
              session.user.role = (token.role as string) || 'user';
              return session;
            }

            // If user not found, create them
            if (!supabaseUserId) {
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
                await sendWelcomeEmail(
                  newUser.email,
                  newUser.name || 'there',
                  new URL('/profile', process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').toString()
                );
              }
            }

            // CRITICAL: Always set the Supabase user ID
            if (supabaseUserId) {
              session.user.id = supabaseUserId;
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
