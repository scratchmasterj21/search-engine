import React, { useState } from 'react';
import axios from 'axios';
import classNames from 'classnames';

interface SearchResult {
  name: string;
  url: string;
  snippet: string;
  displayUrl?: string;
  faviconUrl?: string;
  contentUrl?: string;
  thumbnailUrl?: string;
}

const SearchComponent: React.FC = () => {
  const [query, setQuery] = useState<string>('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [tab, setTab] = useState<'web' | 'images'>('web');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalResults, setTotalResults] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState<boolean>(false);

  const apiKey = import.meta.env.VITE_BING_API_KEY;
  const resultsPerPage = 20; // Number of results to show per page

  const inappropriateKeywords = ['keyword1', 'keyword2', 'keyword3'];
  const excludedDomains = ['example.com', 'anotherexample.com'];

  const isContentAppropriate = (content: string): boolean => {
    for (const keyword of inappropriateKeywords) {
      if (content.toLowerCase().includes(keyword)) {
        return false;
      }
    }
    return true;
  };

  const isDomainExcluded = (link: string): boolean => {
    const url = new URL(link);
    return excludedDomains.includes(url.hostname);
  };

  const getFaviconUrl = (link: string): string => {
    const url = new URL(link);
    return `https://www.google.com/s2/favicons?domain=${url.hostname}`;
  };

  const filterResults = (items: any[]): SearchResult[] => {
    return items.filter(item => {
      const title = item.name || '';
      const snippet = item.snippet || '';
      const link = item.url || item.contentUrl || '';
      return isContentAppropriate(title) && isContentAppropriate(snippet) && !isDomainExcluded(link);
    }).map(item => ({
      name: item.name,
      url: item.url || item.contentUrl,
      snippet: item.snippet,
      displayUrl: item.displayUrl || item.contentUrl,
      faviconUrl: getFaviconUrl(item.url || item.contentUrl),
      contentUrl: item.contentUrl,
      thumbnailUrl: item.thumbnailUrl
    }));
  };

  const handleSearch = async (searchType: 'web' | 'images', page: number = 1) => {
    setLoading(true);
    setError(null);
    const offset = (page - 1) * resultsPerPage;
    const url = searchType === 'images'
      ? `https://api.bing.microsoft.com/v7.0/images/search`
      : `https://api.bing.microsoft.com/v7.0/search`;
    const searchParams = {
      q: query,
      count: resultsPerPage,
      offset: offset,
    };
    try {
      const response = await axios.get(url, {
        params: searchParams,
        headers: { 'Ocp-Apim-Subscription-Key': apiKey }
      });

      const items = searchType === 'images' ? response.data.value : response.data.webPages.value;
      const total = response.data.totalEstimatedMatches || response.data.webPages?.totalEstimatedMatches || 0;

      setResults(filterResults(items));
      setTotalResults(total);
      setCurrentPage(page);
      setHasSearched(true);
    } catch (error) {
      console.error('Error fetching search results:', error);
      setError('An error occurred while fetching search results.');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (newTab: 'web' | 'images') => {
    setTab(newTab);
    setResults([]); // Clear results when changing tabs to avoid confusion
    handleSearch(newTab, 1);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= Math.ceil(totalResults / resultsPerPage)) {
      handleSearch(tab, newPage);
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen p-4 bg-custom-bg bg-cover bg-center">
      <img src="https://i.imgur.com/J0CKBhr.png" alt="Logo" className=" bg-white bg-opacity-80 rounded"/>
      <div className="w-full max-w-3xl mt-10 bg-white bg-opacity-80 p-6 rounded">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search..."
          className="w-full p-4 border border-gray-300 rounded shadow-md"
        />
        <button
          onClick={() => handleSearch(tab)}
          className="w-full mt-4 py-2 bg-blue-500 text-white rounded shadow-md hover:bg-blue-600"
          disabled={loading}
        >
          Search
        </button>
      </div>
      {error && <div className="w-full max-w-3xl mt-4 text-red-500">{error}</div>}
      {hasSearched && (
        <div className="w-full max-w-5xl mt-8 bg-white bg-opacity-80 rounded shadow-md">
          <div className="flex justify-around p-4 border-b">
            <button
              className={classNames("text-lg font-semibold", { 'text-blue-500 border-b-2 border-blue-500': tab === 'web' })}
              onClick={() => handleTabChange('web')}
            >
              Web
            </button>
            <button
              className={classNames("text-lg font-semibold", { 'text-blue-500 border-b-2 border-blue-500': tab === 'images' })}
              onClick={() => handleTabChange('images')}
            >
              Images
            </button>
          </div>
          {loading ? (
            <div className="p-4 text-center">Loading...</div>
          ) : (
            <>
              {tab === 'web' && (
                <ul className="divide-y divide-gray-200">
                  {results.map((item, index) => (
                    <li key={index} className="p-4 flex items-start">
                      <img src={item.faviconUrl} alt={`${item.name} favicon`} className="w-6 h-6 mr-2" />
                      <div className="flex flex-col">
                        <a href={item.url} className="text-blue-600 text-lg font-medium">
                          {item.name}
                        </a>
                        <p className="text-sm text-gray-500">{item.displayUrl}</p>
                        <p className="text-gray-600">{item.snippet}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              {tab === 'images' && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
                  {results.map((item, index) => (
                    <div key={index} className="flex flex-col items-center">
                      <a href={item.contentUrl}>
                        <img
                          src={item.thumbnailUrl || 'https://via.placeholder.com/150'}
                          alt={item.name}
                          className="w-full h-auto rounded shadow-md"
                          onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/150')}
                        />
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
          <div className="flex justify-between p-4 border-t">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              className="py-2 px-4 bg-gray-300 text-gray-700 rounded shadow-md hover:bg-gray-400"
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <span className="py-2 px-4 text-gray-700">
              Page {currentPage} of {Math.ceil(totalResults / resultsPerPage)}
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              className="py-2 px-4 bg-gray-300 text-gray-700 rounded shadow-md hover:bg-gray-400"
              disabled={currentPage === Math.ceil(totalResults / resultsPerPage)}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchComponent;
