import { FiLink } from "react-icons/fi";

interface SourcesButtonProps {
  showSources: boolean;
  setShowSources: (show: boolean) => void;
  discoveredUrls: string[];
}

const SourcesButton = ({ showSources, setShowSources, discoveredUrls }: SourcesButtonProps) => {
  const toggleSources = () => {
    setShowSources(!showSources);
  };

  return (
    <div className="absolute top-4 right-4">
      <button
        onClick={toggleSources}
        className="p-2 rounded-full hover:bg-[hsl(var(--card))] transition"
        aria-label="Toggle Discovered Sources"
      >
        <FiLink className="w-6 h-6 text-[hsl(var(--foreground))]" />
      </button>
      {showSources && (
        <div className="absolute top-12 right-0 w-60 max-h-60 overflow-y-auto bg-[hsl(var(--card))] border border-[hsl(var(--border))] p-2 rounded-lg shadow-lg">
          <h3 className="font-medium mb-2">Discovered Sources</h3>
          {discoveredUrls.length === 0 ? (
            <p className="text-sm text-gray-400">No sources discovered yet</p>
          ) : (
            <ul className="space-y-1">
              {discoveredUrls.map((url, index) => (
                <li key={index} className="text-sm">
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 break-all"
                  >
                    {url}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default SourcesButton;