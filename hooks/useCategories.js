import { useState, useEffect, useMemo } from 'react';
import { getCategories } from '../services/shopService';

// Shown instantly (and kept if the fetch fails) so the UI never has empty
// chips or missing icons. The DB overrides this on a successful load.
const BASE_FALLBACK = [
  { id: 'food', label: 'Food & Dining', icon: 'restaurant' },
  { id: 'retail', label: 'Retail & Groceries', icon: 'storefront' },
  { id: 'health', label: 'Healthcare & Wellness', icon: 'medkit' },
  { id: 'services', label: 'Professional Services', icon: 'briefcase' },
  { id: 'community', label: 'Community & Culture', icon: 'people' },
];

const ALL_CHIP = { id: 'all', label: 'All', icon: 'apps' };

/**
 * Loads shop categories from Supabase (cached in the service) and returns:
 *  - categories: the chip list, with an 'All' pseudo-category prepended
 *  - typeIcon:   { [type]: iconName } lookup for markers/cards
 */
export function useCategories() {
  const [categories, setCategories] = useState(BASE_FALLBACK);

  useEffect(() => {
    let active = true;
    getCategories()
      .then((data) => {
        if (active && data.length) setCategories(data);
      })
      .catch((err) => console.error('Failed to load categories:', err));
    return () => {
      active = false;
    };
  }, []);

  const chipCategories = useMemo(
    () => [ALL_CHIP, ...categories],
    [categories]
  );

  const typeIcon = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c.icon])),
    [categories]
  );

  return { categories: chipCategories, typeIcon };
}
