import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  pages: {
    signIn: '/', // redirect to home page (modal-based auth)
    error: '/',
  },
  callbacks: {
    async jwt({ token, account, profile }) {
      // On initial Google sign-in, pass the profile info to the token
      if (account?.provider === 'google' && profile) {
        token.googleEmail = profile.email;
        token.googleName = profile.name;
        token.googleImage = profile.picture;
        token.provider = 'google';
      }
      return token;
    },
    async session({ session, token }) {
      // Pass google info to the session so the client can use it
      if (token.provider === 'google') {
        session.googleEmail = token.googleEmail as string;
        session.googleName = token.googleName as string;
        session.googleImage = token.googleImage as string;
        session.provider = 'google';
      }
      return session;
    },
  },
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET,
});
