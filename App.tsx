import React, { useEffect, useMemo, useState } from 'react';
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import MapPage from './components/MapPage';
import { LibraryCard } from './components/LibraryCard';
import { SearchInput } from './components/SearchInput';
import { fetchRegistryCatalogs } from './services/libraryService';
import { Catalog, LibraryDisplay } from './types';

const EDUCATION_KEYWORDS = ['school', 'college', 'university', 'universities'];

function isEducationLibrary(lib: LibraryDisplay, catalog?: Catalog): boolean {
  const text = `${lib.name} ${lib.description}`.toLowerCase();
  const hasEducationKeyword = EDUCATION_KEYWORDS.some((word) => text.includes(word));

  const alternateLinks = (catalog?.links ?? []).filter((link) => link.rel === 'alternate');
  const hasEduAlternateUrl = alternateLinks.some((link) => {
    if (!link.href) return false;
    return /(^|\.)edu([/:]|$)/i.test(link.href);
  });

  return hasEducationKeyword || hasEduAlternateUrl;
}

const MapPageWrapper: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const geoJson = (location.state as { geoJson?: unknown } | null)?.geoJson;

  return <MapPage geoJson={geoJson} onBack={() => navigate('/')} />;
};

const LibraryListPage: React.FC = () => {
  const navigate = useNavigate();
  const [libraries, setLibraries] = useState<LibraryDisplay[]>([]);
  const [catalogs, setCatalogs] = useState<Catalog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedState, setSelectedState] = useState<string>('');
  const [eduFilter, setEduFilter] = useState<'all' | 'edu' | 'public'>('all');
  const [groupByState, setGroupByState] = useState<boolean>(false);

  const [isDarkMode] = useState<boolean>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('theme') === 'dark';
  });
  const palaceLogoUrl = new URL('palace-logo.png', document.baseURI).toString();

  const handleShowMap = async (catalog: Catalog) => {
    const focusLink = catalog.links.find(
      (link) => link.rel === 'http://librarysimplified.org/rel/registry/focus' && link.type === 'application/geo+json'
    );

    if (!focusLink) {
      return;
    }

    const { fetchGeoJson } = await import('./services/geoJsonService');
    const geoJson = await fetchGeoJson(focusLink.href);

    if (geoJson) {
      navigate('/map', { state: { geoJson } });
    }
  };

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const registryCatalogs = await fetchRegistryCatalogs();
        if (!mounted) {
          return;
        }

        setCatalogs(registryCatalogs);
        setLibraries(
          registryCatalogs.map((catalog) => {
            const authLink = catalog.links.find((link) => link.rel === 'http://opds-spec.org/auth/document')
              || catalog.links.find((link) => link.rel === 'self');
            const imageLink = catalog.images?.find((image) => image.href)
              || catalog.links.find((link) => link.rel === 'icon' || link.rel?.includes('thumbnail'));
            const catalogLink = catalog.links.find((link) => link.rel === 'http://opds-spec.org/catalog');

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
          })
        );
      } catch (loadError: any) {
        setError(loadError.message || 'Failed to load libraries');
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, []);

  const filteredLibraries = useMemo(() => {
    return libraries.filter((lib) => {
      const matchesSearch =
        !searchQuery
        || lib.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
        || lib.description.toLowerCase().includes(searchQuery.toLowerCase().trim());

      const matchesState = !selectedState || lib.state === selectedState;

      const catalog = catalogs.find((c) => c.metadata.id === lib.id);
      let matchesType = true;
      if (eduFilter === 'edu') {
        matchesType = isEducationLibrary(lib, catalog);
      } else if (eduFilter === 'public') {
        matchesType = !isEducationLibrary(lib, catalog);
      }

      return matchesSearch && matchesState && matchesType;
    });
  }, [libraries, catalogs, searchQuery, selectedState, eduFilter]);

  const availableStates = useMemo(() => {
    const states = new Set<string>();
    libraries.forEach((lib) => {
      if (lib.state) {
        states.add(lib.state);
      }
    });
    return Array.from(states).sort();
  }, [libraries]);

  const sortedLibraries = useMemo(() => {
    return [...filteredLibraries].sort((a, b) => {
      if (!a.state && b.state) return 1;
      if (a.state && !b.state) return -1;
      if (a.state && b.state && a.state !== b.state) {
        return a.state.localeCompare(b.state);
      }
      return a.name.localeCompare(b.name);
    });
  }, [filteredLibraries]);

  const groupedLibraries = useMemo(() => {
    const groups: Record<string, LibraryDisplay[]> = {};
    sortedLibraries.forEach((lib) => {
      const key = lib.state || 'Other';
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(lib);
    });
    return groups;
  }, [sortedLibraries]);

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-gray-50 dark:bg-dark text-gray-900 dark:text-gray-100 transition-colors duration-300">
        <header className="sticky top-0 z-10 bg-white/90 dark:bg-darkSurface/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="max-w-3xl mx-auto px-4 py-4">
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <img
                    src={palaceLogoUrl}
                    alt="Palace Project Logo"
                    className="w-8 h-8 object-contain flex-shrink-0"
                  />
                  <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                    Find Your Library
                  </h1>
                </div>
                {isDarkMode && (
                  <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 font-medium">
                    Dark Mode
                  </span>
                )}
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <SearchInput
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder="Search by library name..."
                  />
                </div>
                {availableStates.length > 0 && (
                  <div className="w-32 flex-shrink-0">
                    <select
                      value={selectedState}
                      onChange={(e) => setSelectedState(e.target.value)}
                      className="block w-full h-[46px] pl-3 pr-8 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-darkSurface dark:border-gray-600 dark:text-white"
                      aria-label="Filter results by state"
                    >
                      <option value="">All States</option>
                      {availableStates.map((state) => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="w-56 flex-shrink-0">
                  <select
                    value={eduFilter}
                    onChange={(e) => setEduFilter(e.target.value as 'all' | 'edu' | 'public')}
                    className="block w-full h-[46px] pl-3 pr-8 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-darkSurface dark:border-gray-600 dark:text-white"
                    aria-label="Filter by library type"
                  >
                    <option value="all">All Libraries</option>
                    <option value="edu">Colleges, Schools, Universities, or .edu</option>
                    <option value="public">Public Libraries (not .edu or education)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-4 py-6">
          {loading && (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-500 dark:text-gray-400 animate-pulse">Loading libraries...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-center">
              <p className="text-red-600 dark:text-red-400 font-medium">Unable to load libraries</p>
              <p className="text-sm text-red-500 dark:text-red-300 mt-1">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-100 text-sm font-medium rounded hover:bg-red-200 dark:hover:bg-red-700 transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          {!loading && !error && (
            <>
              <div className="flex justify-between items-end mb-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Showing {filteredLibraries.length} {filteredLibraries.length === 1 ? 'library' : 'libraries'}
                  {selectedState && ` in ${selectedState}`}
                </p>
                <button
                  className="px-3 py-1 text-xs rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  onClick={() => setGroupByState((grouped) => !grouped)}
                  aria-label="Toggle group by state"
                >
                  {groupByState ? 'Show Sorted List' : 'Group by State'}
                </button>
              </div>

              {filteredLibraries.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-darkSurface rounded-lg border border-gray-100 dark:border-gray-700">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No libraries found</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Try adjusting your search or filters.</p>
                </div>
              ) : groupByState ? (
                <div className="flex flex-col gap-6">
                  {Object.entries(groupedLibraries).map(([state, libs]) => (
                    <div key={state}>
                      <h4 className="text-md font-semibold text-gray-700 dark:text-gray-200 mb-2">{state}</h4>
                      <div className="flex flex-col gap-4">
                        {libs.map((lib) => {
                          const catalog = catalogs.find((c) => c.metadata.id === lib.id);
                          return (
                            <LibraryCard
                              key={lib.id}
                              library={lib}
                              catalog={catalog}
                              onShowMap={catalog ? () => handleShowMap(catalog) : undefined}
                            />
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {sortedLibraries.map((lib) => {
                    const catalog = catalogs.find((c) => c.metadata.id === lib.id);
                    return (
                      <LibraryCard
                        key={lib.id}
                        library={lib}
                        catalog={catalog}
                        onShowMap={catalog ? () => handleShowMap(catalog) : undefined}
                      />
                    );
                  })}
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<LibraryListPage />} />
      <Route path="/map" element={<MapPageWrapper />} />
      <Route path="*" element={<LibraryListPage />} />
    </Routes>
  );
};

export default App;
