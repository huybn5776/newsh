import * as R from 'ramda';

import { getUserCountry } from '@api/geolocaiton-api';
import { getRegionList } from '@api/google-news-api';
import { RegionItem } from '@interfaces/region-item';
import { SelectionItem } from '@interfaces/selection-item';

export async function getRegionSelections(): Promise<SelectionItem[]> {
  const [userCountry, regions] = await Promise.all([getUserCountry(), await getRegionList()]);

  const country = userCountry.toLowerCase();
  if (country) {
    const [suggestedRegions, otherRegions] = R.partition(
      (region) => region.languageAndRegion.toLowerCase().includes(country),
      regions || [],
    );

    return [
      { key: 'suggested', label: 'Suggested', type: 'separator' },
      ...suggestedRegions.map(mapRegionToSelection),
      { key: 'all', label: 'All language & regions', type: 'separator' },
      ...otherRegions.map(mapRegionToSelection),
    ];
  }

  return regions.map(mapRegionToSelection) || [];
}

function mapRegionToSelection(region: RegionItem): SelectionItem {
  return { key: region.languageAndRegion, label: region.label };
}
