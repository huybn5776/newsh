import * as R from 'ramda';

import { getUserCountry } from '@/api/geolocaiton-api';
import { getRegionList } from '@/api/google-news-api';
import { RegionItem } from '@/interfaces/region-item';
import { SelectionItem } from '@/interfaces/selection-item';

export async function getRegionSelections(): Promise<{
  selections: SelectionItem[];
  suggestedRegions?: SelectionItem[];
  otherRegions?: SelectionItem[];
}> {
  const [userCountry, regions] = await Promise.all([getUserCountry(), await getRegionList()]);

  const country = userCountry.toLowerCase();
  if (country) {
    const [suggestedRegions, otherRegions] = R.partition(
      (region) => region.languageAndRegion.toLowerCase().includes(country),
      regions || [],
    );

    const suggestedRegionSelections = suggestedRegions.map(mapRegionToSelection);
    const otherRegionSelections = otherRegions.map(mapRegionToSelection);
    return {
      selections: [
        { key: 'suggested', label: 'Suggested', type: 'separator' },
        ...suggestedRegionSelections,
        { key: 'all', label: 'All language & regions', type: 'separator' },
        ...otherRegionSelections,
      ],
      suggestedRegions: suggestedRegionSelections,
      otherRegions: otherRegionSelections,
    };
  }

  return { selections: regions.map(mapRegionToSelection) };
}

function mapRegionToSelection(region: RegionItem): SelectionItem {
  return { key: region.languageAndRegion, label: region.label };
}
