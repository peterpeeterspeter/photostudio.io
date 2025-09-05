import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: any) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  // Get session with better error handling
  let session = null;
  let error = null;
  
  try {
    const result = await supabase.auth.getSession();
    session = result.data.session;
    error = result.error;
  } catch (err) {
    console.error('Middleware: Failed to get session:', err);
    error = err;
  }

  const { pathname } = request.nextUrl;
  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/signup');


  // Only redirect authenticated users away from auth pages
  // (Client-side protection handles protected routes more reliably)
  if (session && isAuthPage) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/account';
    return NextResponse.redirect(redirectUrl);
  }

  // Log any auth errors for debugging
  if (error) {
    console.error('Middleware auth error:', error);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes
     */
    '/((?!_next/static|_next/image|favicon.ico|public|api).*)',
  ],
};
