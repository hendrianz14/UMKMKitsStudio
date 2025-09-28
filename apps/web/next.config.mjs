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
  }
};

export default withIntl(config);
