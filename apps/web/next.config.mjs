import withNextIntl from 'next-intl/plugin';

const withIntl = withNextIntl('./src/lib/i18n.ts');

const config = {
  experimental: {
    typedRoutes: true
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'files.umkmkitsstudio.com' }
    ]
  },
  async redirects() {
    return [
      {
        source: '/:locale/auth/login',
        has: [{ type: 'host', value: '(.*)' }],
        destination: '/:locale/sign-in',
        permanent: true
      },
      {
        source: '/:locale/auth/signup',
        has: [{ type: 'host', value: '(.*)' }],
        destination: '/:locale/sign-up',
        permanent: true
      },
      {
        source: '/auth/login',
        destination: '/id/sign-in',
        permanent: true
      },
      {
        source: '/auth/signup',
        destination: '/id/sign-up',
        permanent: true
      }
    ];
  }
};

export default withIntl(config);
