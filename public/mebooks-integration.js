/**
 * MeBooks Integration Library
 * Provides a simple API for integrating with the MeBooks web reader
 */
class MeBooksIntegration {
  constructor(mebooksUrl = 'https://jamesenglish1028.github.io/JamesEnglish1028-My-Ebook-Reader/') {
    this.baseUrl = mebooksUrl.endsWith('/') ? mebooksUrl : `${mebooksUrl}/`;
  }

  /**
   * Import an OPDS catalog into MeBooks
   * @param {string} catalogUrl - The OPDS catalog URL
   * @param {string} catalogName - Display name for the catalog
   * @param {object} options - Additional options
   * @returns {Promise<void>}
   */
  async importCatalog(catalogUrl, catalogName, options = {}) {
    const params = new URLSearchParams({
      import: catalogUrl,
      name: catalogName,
      ...(options.theme && { theme: options.theme }),
      ...(options.autoNavigate && { navigate: 'true' })
    });

    const targetUrl = `${this.baseUrl}?${params.toString()}`;

    if (options.newWindow !== false) {
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
    } else {
      window.location.href = targetUrl;
    }
  }

  /**
   * Generate a direct link to open a catalog in MeBooks
   * @param {string} catalogUrl - The OPDS catalog URL
   * @param {string} catalogName - Display name for the catalog
   * @returns {string} - The complete URL to open in MeBooks
   */
  getCatalogLink(catalogUrl, catalogName) {
    const params = new URLSearchParams({
      import: catalogUrl,
      name: catalogName
    });
    return `${this.baseUrl}?${params.toString()}`;
  }

  /**
   * Check if MeBooks integration is available
   * @returns {boolean}
   */
  isAvailable() {
    return typeof window !== 'undefined';
  }
}

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MeBooksIntegration;
}

if (typeof window !== 'undefined') {
  window.MeBooksIntegration = MeBooksIntegration;
}
