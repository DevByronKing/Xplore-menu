import React from 'react';
import { DEMO_RESTAURANT, getMenuDataByTenantSlug } from '@/data/mockMenuData';
import { SocialMenuClient } from '@/components/menu/SocialMenuClient';

interface RootCustomerPageProps {
  searchParams?: {
    source?: string | string[];
    location?: string | string[];
  };
}

/**
 * Root Route (/) goes directly to the Customer Social Menu experience
 * with zero intermediate screens or admin links.
 */
export default function CustomerMenuHomePage({
  searchParams,
}: RootCustomerPageProps) {
  const { restaurant, categories, items, touchpoints } =
    getMenuDataByTenantSlug(DEMO_RESTAURANT.slug);

  const rawSource = Array.isArray(searchParams?.source)
    ? searchParams?.source[0]
    : searchParams?.source;
  const rawLocation = Array.isArray(searchParams?.location)
    ? searchParams?.location[0]
    : searchParams?.location;

  return (
    <SocialMenuClient
      restaurant={restaurant}
      categories={categories}
      items={items}
      touchpoints={touchpoints}
      initialSourceParam={rawSource ?? 'nfc'}
      initialLocationParam={rawLocation ?? 'mesa_04'}
    />
  );
}
