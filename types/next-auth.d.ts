import 'next-auth';

declare module 'next-auth' {
  interface Session {
    googleEmail?: string;
    googleName?: string;
    googleImage?: string;
    provider?: string;
  }
}
