'use client';

import { motion } from 'framer-motion';
import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider';

const comparisons = [
  {
    before: 'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?auto=format&fit=crop&w=900&q=60',
    after: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=900&q=60',
    label: 'Es kopi susu signature'
  },
  {
    before: 'https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?auto=format&fit=crop&w=900&q=60',
    after: 'https://images.unsplash.com/photo-1534704681669-5297ef7cce6f?auto=format&fit=crop&w=900&q=60',
    label: 'Bakso bakar premium'
  },
  {
    before: 'https://images.unsplash.com/photo-1525755662778-989d0524087e?auto=format&fit=crop&w=900&q=60',
    after: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=60',
    label: 'Hampers jajan pasar'
  }
];

export function BeforeAfter() {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {comparisons.map((item, idx) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.24, delay: idx * 0.05, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-2xl border border-white/10 bg-surface/70 p-4"
        >
          <div className="overflow-hidden rounded-xl ring-1 ring-white/10">
            <ReactCompareSlider
              className="h-[280px]"
              itemOne={<ReactCompareSliderImage src={item.before} alt={`${item.label} sebelum`} />} 
              itemTwo={<ReactCompareSliderImage src={item.after} alt={`${item.label} sesudah`} />} 
            />
          </div>
          <p className="mt-4 text-sm font-medium text-white">{item.label}</p>
          <p className="text-xs text-[var(--text-muted)]">Enhance AI + Color grading sinematik</p>
        </motion.div>
      ))}
    </div>
  );
}
