import { RegistryResponse, LibraryDisplay, Catalog } from '../types';

const mapCatalogToLibrary = (catalog: Catalog): LibraryDisplay => {
  // Try to find a relevant authentication or self link
  const authLink = catalog.links.find(l => l.rel === 'http://opds-spec.org/auth/document')
    || catalog.links.find(l => l.rel === 'self');

  // Find a logo from the images array or fallback to links with icon/thumbnail rel
  const imageLink = catalog.images?.find(i => i.href)
    || catalog.links.find(l => l.rel === 'icon' || l.rel?.includes('thumbnail'));

  // Find the specific catalog link for the "Add Library" button
  const catalogLink = catalog.links.find(l => l.rel === 'http://opds-spec.org/catalog');

  // Extract state from description
  let state: string | undefined;
  if (catalog.metadata.description) {
    const stateMatch = catalog.metadata.description.match(/,\s*([A-Z]{2})\b/);
    if (stateMatch) {
      state = stateMatch[1];
    }
  }

  return {
    id: catalog.metadata.id || Math.random().toString(36).substring(7),
    name: catalog.metadata.title || 'Unknown Library',
    description: catalog.metadata.description || '',
    link: authLink?.href || catalog.href || '#',
    logoUrl: imageLink?.href,
    catalogUrl: catalogLink?.href,
    state
  };
};

export const fetchRegistryCatalogs = async (): Promise<Catalog[]> => {
  try {
    // The Palace Project registry API does not support CORS for browser-based fetch requests.
    // Use a local proxy server to bypass CORS in development.
    const proxyUrl = '/api/libraries';

    const response = await fetch(proxyUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch libraries: ${response.status} ${response.statusText}`);
    }

    const data: RegistryResponse = await response.json();

    if (!data.catalogs || !Array.isArray(data.catalogs)) {
      throw new Error('Invalid registry format: "catalogs" array missing');
    }

    return data.catalogs;
  } catch (error) {
    console.error('Error fetching libraries:', error);
    throw error;
  }
};

export const fetchLibraries = async (): Promise<LibraryDisplay[]> => {
  const catalogs = await fetchRegistryCatalogs();
  return catalogs.map(mapCatalogToLibrary);
};
