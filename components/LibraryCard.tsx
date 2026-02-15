import React, { useState } from 'react';
import Modal from './Modal';
import { Catalog, LibraryDisplay, Link } from '../types';

const palaceWebSlugs: Record<string, string> = {
  'California Digital Library': 'cdl',
  'Central Connecticut State University': 'ct-ccsu',
  'Charter Oak State College': 'ct-cosc',
  'Columbia University Libraries': 'columbia',
  'Columbia University Libraries (test/qa)': 'columbia-qa',
  'Connecticut State Community College': 'ct-cscc',
  'Cornell University': 'cornell',
  'Eastern Connecticut State University': 'ct-ecsu',
  'NYU Libraries': 'nyu',
  'Southern Connecticut State University': 'ct-scsu',
  'University of Baltimore': 'md-university-of-baltimore',
  'University of California, Davis Library': 'ucdavis',
  'Western Connecticut State University': 'ct-wcsu'
};

function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

function getPalaceSlug(displayName?: string): string | undefined {
  if (!displayName) {
    return undefined;
  }

  const normalized = normalizeName(displayName);
  const entry = Object.entries(palaceWebSlugs).find(([key]) => normalizeName(key) === normalized);
  return entry ? entry[1] : undefined;
}

function getPalaceWebCatalogUrl(catalog: Catalog | undefined, library: LibraryDisplay): string | null {
  const title = catalog?.metadata?.title;
  const slug = getPalaceSlug(title);
  if (slug) {
    return `https://patron-academic.thepalaceproject.org/${slug}`;
  }

  const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(library.id);
  if (isUuid) {
    return `https://patron-pub.staging.palaceproject.io/urn:uuid:${library.id}`;
  }

  return null;
}

function getLinkLabel(link: Link): string {
  const rel = typeof link.rel === 'string' ? link.rel : '';
  if (link.type === 'application/vnd.opds.authentication.v1.0+json') return 'Authentication document';
  if (rel.includes('auth/document')) return 'Authentication';
  if (rel.includes('register')) return 'Registration';
  if (rel.includes('self')) return 'Self';
  if (rel.includes('focus')) return 'Map Focus';
  if (rel.includes('catalog')) return 'Catalog';
  if (rel.includes('icon') || rel.includes('thumbnail')) return 'Logo';
  return link.type || 'Link';
}

function renderLinkBadge(link: Link): React.ReactNode {
  if (!link.type) {
    return null;
  }

  return (
    <span className="text-xs rounded bg-gray-100 dark:bg-gray-700 px-2 py-0.5 text-gray-600 dark:text-gray-200">
      {link.type}
    </span>
  );
}

function renderLinkIcon(link: Link): React.ReactNode {
  const rel = typeof link.rel === 'string' ? link.rel : '';
  const type = typeof link.type === 'string' ? link.type : '';

    if (rel === 'alternate') {
      return <i className="fa-solid fa-house text-blue-600 dark:text-blue-400 w-4 text-center" aria-hidden="true"></i>;
    }
    if (type === 'application/vnd.opds.authentication.v1.0+json') {
      return <i className="fa-solid fa-sign-in text-blue-600 dark:text-blue-400 w-4 text-center" aria-hidden="true"></i>;
    }
    // Help link: life ring icon
    if (rel.includes('help')) {
      return <i className="fa-solid fa-life-ring text-blue-600 dark:text-blue-400 w-4 text-center" aria-hidden="true"></i>;
    }
    // Copyright agent link: email icon
    if (rel.includes('copyright_agent')) {
      return <i className="fa-solid fa-envelope text-blue-600 dark:text-blue-400 w-4 text-center" aria-hidden="true"></i>;
    }
  if (type === 'application/geo+json') {
    return <i className="fa-solid fa-map text-blue-600 dark:text-blue-400 w-4 text-center" aria-hidden="true"></i>;
  }
  if (rel.includes('auth')) {
    return <i className="fa-solid fa-lock text-blue-600 dark:text-blue-400 w-4 text-center" aria-hidden="true"></i>;
  }
  if (rel.includes('catalog')) {
    return <i className="fa-solid fa-book-open text-blue-600 dark:text-blue-400 w-4 text-center" aria-hidden="true"></i>;
  }
  if (rel.includes('focus')) {
    return <i className="fa-solid fa-map-location-dot text-blue-600 dark:text-blue-400 w-4 text-center" aria-hidden="true"></i>;
  }

  return <i className="fa-solid fa-link text-blue-600 dark:text-blue-400 w-4 text-center" aria-hidden="true"></i>;
}

interface LibraryCardProps {
  library: LibraryDisplay;
  catalog?: Catalog;
  onShowMap?: () => void;
}

export const LibraryCard: React.FC<LibraryCardProps> = ({
  library,
  catalog,
  onShowMap
}) => {
  const [showModal, setShowModal] = useState(false);
  const palaceWebCatalogUrl = getPalaceWebCatalogUrl(catalog, library);

  const getFocusLink = () => {
    if (!catalog || !catalog.links) {
      return null;
    }

    return catalog.links.find(
      (link) => link.rel === 'http://librarysimplified.org/rel/registry/focus' && link.type === 'application/geo+json'
    );
  };

  return (
    <>
      <div className="bg-white dark:bg-darkSurface rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 p-4 border border-gray-100 dark:border-gray-700 flex flex-col h-full">
        <div className="flex items-start gap-4">
          {library.logoUrl && (
            <div className="flex-shrink-0">
              <img
                src={library.logoUrl}
                alt={`${library.name} Logo`}
                loading="lazy"
                className="w-16 h-16 object-contain bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 leading-tight">
              {library.name}
            </h3>
            {library.description ? (
              <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                {library.description}
              </p>
            ) : (
              <p className="text-sm text-gray-400 italic">No description available</p>
            )}
          </div>
          <div className="mt-2 flex justify-end">
            <button
              className="text-blue-600 hover:underline text-sm font-medium"
              onClick={() => setShowModal(true)}
            >
              View More
            </button>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex flex-wrap justify-end gap-2">
          {getFocusLink() && onShowMap && (
            <button
              className="inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
              title="View library location on map"
              onClick={onShowMap}
            >
              View on Map
            </button>
          )}

          {library.catalogUrl ? (
            <a
              href={library.catalogUrl.replace(/^https?:\/\//, 'opds://')}
              className="inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-sky-400 hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-colors"
              title={`Open ${library.name} in Thorium Desktop`}
              aria-label={`Open ${library.name} in Thorium Desktop`}
            >
              Thorium
            </a>
          ) : (
            <span className="text-sm text-gray-400 italic">Catalog unavailable</span>
          )}

          {palaceWebCatalogUrl && (
            <a
              href={palaceWebCatalogUrl}
              className="inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-500 hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              title={`Open ${catalog?.metadata.title || library.name} in Palace Web Catalog`}
              aria-label={`Open ${catalog?.metadata.title || library.name} in Palace Web Catalog`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Palace Web Catalog
            </a>
          )}
        </div>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
        <h2 className="text-lg font-bold mb-2">{library.name}</h2>
        <p className="mb-2">{library.description}</p>
        {catalog?.metadata.updated && (
          <div className="text-xs text-gray-500 mb-2">
            Last updated: {new Date(catalog.metadata.updated).toLocaleString()}
          </div>
        )}
        {catalog && catalog.links && catalog.links.length > 0 && (
          <div className="mt-4">
            <h3 className="font-semibold mb-2 text-sm text-gray-700 dark:text-gray-200">Links</h3>
            <ul className="space-y-2">
              {catalog.links.map((link, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  {renderLinkIcon(link)}
                  <a
                    href={link.href || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-blue-700 dark:text-blue-300"
                  >
                    {getLinkLabel(link)}
                  </a>
                  {renderLinkBadge(link)}
                  <span className="text-xs text-gray-500">{typeof link.rel === 'string' ? link.rel : 'unknown'}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Modal>
    </>
  );
};
