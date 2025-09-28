export type TemplateCategory = 'drink' | 'dessert' | 'savory';

export interface Template {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  accent: string;
  background: string;
  thumbnail: string;
}

export const templates: Template[] = [
  {
    id: 'kopi-signature',
    name: 'Signature Coffee',
    description: 'Layout hangat dengan motif batik untuk kedai kopi modern.',
    category: 'drink',
    accent: '#C99A5A',
    background: 'linear-gradient(135deg,#2F2A28,#5C3A21)',
    thumbnail: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=400&q=60'
  },
  {
    id: 'es-teh-premium',
    name: 'Es Teh Premium',
    description: 'Komposisi sejuk dengan highlight emas untuk produk teh eksklusif.',
    category: 'drink',
    accent: '#B68945',
    background: 'linear-gradient(135deg,#F4E3C2,#D7A86E)',
    thumbnail: 'https://images.unsplash.com/photo-1513639776629-7b61b0ac49cb?auto=format&fit=crop&w=400&q=60'
  },
  {
    id: 'jajanan-pasar',
    name: 'Jajanan Pasar',
    description: 'Grid modular untuk highlight paket jajanan tradisional.',
    category: 'dessert',
    accent: '#D36A2A',
    background: 'linear-gradient(135deg,#FFF2D7,#F0C38E)',
    thumbnail: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=60'
  },
  {
    id: 'sambal-homemade',
    name: 'Sambal Homemade',
    description: 'Tipografi tegas dengan tekstur kain lurik untuk produk pedas.',
    category: 'savory',
    accent: '#E0592A',
    background: 'linear-gradient(135deg,#2C0A05,#701A17)',
    thumbnail: 'https://images.unsplash.com/photo-1534939561126-855b8675edd7?auto=format&fit=crop&w=400&q=60'
  },
  {
    id: 'kue-lapis-legit',
    name: 'Kue Lapis Legit',
    description: 'Elemen geometrik mewah dengan garis emas untuk premium dessert.',
    category: 'dessert',
    accent: '#AF8A45',
    background: 'linear-gradient(135deg,#3D2A1E,#D1B28A)',
    thumbnail: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=400&q=60'
  }
];
