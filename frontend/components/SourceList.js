import { deleteSource } from "../lib/api";

export default function SourceList({ sources, totalChunks, selectedSource, onSelectSource, onSourcesChanged }) {
  const handleDelete = async (sourceName) => {
    if (!confirm(`Delete "${sourceName}" and all its indexed chunks?`)) return;
    try {
      await deleteSource(sourceName);
      onSourcesChanged();
      if (selectedSource === sourceName) {
        onSelectSource(null);
      }
    } catch (err) {
      alert("Failed to delete source.");
    }
  };

  return (
    <div className="bg-white rounded-lg p-4 mt-4">
      <h3 className="font-semibold text-gray-700 mb-2">
        Indexed PDFs <span className="text-gray-400 text-sm">({totalChunks} chunks)</span>
      </h3>
      {sources.length === 0 ? (
        <p className="text-gray-400 text-sm">No PDFs uploaded yet.</p>
      ) : (
        <ul className="space-y-1">
          <li>
            <button
              onClick={() => onSelectSource(null)}
              className={`w-full text-left px-2 py-1 rounded text-sm ${
                selectedSource === null ? "bg-primary-100 text-primary-700" : "hover:bg-gray-100"
              }`}
            >
              All documents
            </button>
          </li>
          {sources.map((source) => (
            <li key={source} className="flex items-center gap-1">
              <button
                onClick={() => onSelectSource(source)}
                className={`flex-1 text-left px-2 py-1 rounded text-sm truncate ${
                  selectedSource === source ? "bg-primary-100 text-primary-700" : "hover:bg-gray-100"
                }`}
                title={source}
              >
                {source}
              </button>
              <button
                onClick={() => handleDelete(source)}
                className="text-red-400 hover:text-red-600 text-xs px-1"
                title="Delete this PDF"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
