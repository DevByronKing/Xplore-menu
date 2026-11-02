import React from 'react';
import type { Metadata } from 'next';
import { getMenuDataByTenantSlug } from '@/data/mockMenuData';
import { SocialMenuClient } from '@/components/menu/SocialMenuClient';

interface TenantMenuPageProps {
  params: {
    tenantSlug: string;
  };
  searchParams: {
    source?: string | string[];
    location?: string | string[];
  };
}

export function generateMetadata({ params }: TenantMenuPageProps): Metadata {
  const { restaurant } = getMenuDataByTenantSlug(params.tenantSlug);
  return {
    title: `${restaurant.name} • Cardápio Interativo`,
    description: restaurant.tagline,
  };
}

export default function TenantSocialMenuPage({
  params,
  searchParams,
}: TenantMenuPageProps) {
  const { restaurant, categories, items, touchpoints } = getMenuDataByTenantSlug(
    params.tenantSlug
  );

  const rawSource = Array.isArray(searchParams.source)
    ? searchParams.source[0]
    : searchParams.source;
  const rawLocation = Array.isArray(searchParams.location)
    ? searchParams.location[0]
    : searchParams.location;

  return (
    <SocialMenuClient
      restaurant={restaurant}
      categories={categories}
      items={items}
      touchpoints={touchpoints}
      initialSourceParam={rawSource ?? null}
      initialLocationParam={rawLocation ?? null}
    />
  );
}
