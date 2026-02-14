import React from 'react';
import { LibraryDisplay } from '../types';

interface LibraryCardProps {
  library: LibraryDisplay;
  isNativeApp?: boolean;
  onAddLibrary?: (libraryUrl: string, libraryName: string) => void;
}

export const LibraryCard: React.FC<LibraryCardProps> = ({ 
  library, 
  isNativeApp = false, 
  onAddLibrary 
}) => {
  const handleMeBooksClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (typeof window !== 'undefined' && (window as any).MeBooksIntegration) {
      const mebooks = new (window as any).MeBooksIntegration();
      await mebooks.importCatalog(library.catalogUrl!, library.name);
    } else {
      // Fallback to direct URL if integration library not loaded
      window.open(
        `https://jamesenglish1028.github.io/JamesEnglish1028-My-Ebook-Reader/?import=${encodeURIComponent(library.catalogUrl!)}&name=${encodeURIComponent(library.name)}`,
        '_blank',
        'noopener,noreferrer'
      );
    }
  };

  return (
    <div className="bg-white dark:bg-darkSurface rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 p-4 border border-gray-100 dark:border-gray-700 flex flex-col h-full">
      <div className="flex items-start gap-4">
        {library.logoUrl && (
          <div className="flex-shrink-0">
            <img 
              src={library.logoUrl} 
              alt={`${library.name} Logo`} 
              aria-label={`${library.name} Logo`}
              loading="lazy"
              className="w-16 h-16 object-contain bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700"
              onError={(e) => {
                // Hide image on error
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
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex flex-wrap justify-end gap-2">
        {library.catalogUrl ? (
          // Only Thorium Desktop Button remains
          <a
            href={library.catalogUrl.replace(/^https?:\/\//, 'opds://')}
            className="inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-sky-400 hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-colors"
            title={`Open ${library.name} in Thorium Desktop`}
            aria-label={`Open ${library.name} in Thorium Desktop`}
          >
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 01-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 111.414-1.414L15 13.586V12a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Thorium
          </a>
        ) : (
          <span className="text-sm text-gray-400 italic">Catalog unavailable</span>
        )}
      </div>
    </div>
  );
};