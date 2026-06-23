import ReactMarkdown from "react-markdown";

export default function ChatMessage({ role, content, sources }) {
  const isUser = role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      <div
        className={`max-w-[80%] rounded-lg px-4 py-2 ${
          isUser ? "bg-primary-600 text-white" : "bg-white text-gray-800 border border-gray-200"
        }`}
      >
        <div className="prose prose-sm max-w-none">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>

        {!isUser && sources && sources.length > 0 && (
          <div className="mt-3 border-t border-gray-100 pt-2">
            <p className="text-xs font-semibold text-gray-500 mb-1">Sources:</p>
            <ul className="space-y-1">
              {sources.map((src, idx) => (
                <li key={idx} className="text-xs text-gray-500 bg-gray-50 rounded p-2">
                  <span className="font-medium text-gray-700">
                    {src.source}
                    {src.page ? ` — page ${src.page}` : ""}
                  </span>
                  <p className="mt-1 italic text-gray-400 line-clamp-3">{src.snippet}...</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
