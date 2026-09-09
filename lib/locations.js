export const LOCATIONS = [
  { id: 'dispensa', label: 'Dispensa', icon: 'file-tray-stacked-outline', colorKey: 'pillGreen', softKey: 'pillGreenSoft' },
  { id: 'frigo', label: 'Frigo', icon: 'nutrition-outline', colorKey: 'pillRed', softKey: 'pillRedSoft' },
  { id: 'freezer', label: 'Freezer', icon: 'snow-outline', colorKey: 'pillBlue', softKey: 'pillBlueSoft' },
  { id: 'casa', label: 'Casa', icon: 'home-outline', colorKey: 'pillAmber', softKey: 'pillAmberSoft' },
];

export const LOCATIONS_WITH_ALL = [
  { id: 'tutti', label: 'Tutti', icon: 'apps-outline', colorKey: 'tealDark', softKey: 'tealSoft' },
  ...LOCATIONS,
];

export function getLocation(id) {
  return LOCATIONS.find((l) => l.id === id) || LOCATIONS[0];
}
