import { colors } from './theme';

export const LOCATIONS = [
  { id: 'dispensa', label: 'Dispensa', icon: 'file-tray-stacked-outline', color: colors.pillGreen, soft: colors.pillGreenSoft },
  { id: 'frigo', label: 'Frigo', icon: 'nutrition-outline', color: colors.pillRed, soft: colors.pillRedSoft },
  { id: 'freezer', label: 'Freezer', icon: 'snow-outline', color: colors.pillBlue, soft: colors.pillBlueSoft },
  { id: 'casa', label: 'Casa', icon: 'home-outline', color: colors.pillAmber, soft: colors.pillAmberSoft },
];

export const LOCATIONS_WITH_ALL = [
  { id: 'tutti', label: 'Tutti', icon: 'apps-outline', color: colors.tealDark, soft: colors.tealSoft },
  ...LOCATIONS,
];

export function getLocation(id) {
  return LOCATIONS.find((l) => l.id === id) || LOCATIONS[0];
}
