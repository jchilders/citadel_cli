type FormatterFunction = (value: unknown) => React.ReactNode;

interface FormatterRegistry {
  [key: string]: FormatterFunction;
}

const formatters: FormatterRegistry = {
  object: (value: unknown) => {
    if (!value || typeof value !== 'object') return null;

    const entries = Object.entries(value);
    const isArray = Array.isArray(value);

    return (
      <div className="pl-4 text-sm">
        {entries.map(([key, val], index) => (
          <div key={key} className={isArray ? "text-gray-400" : ""}>
            <strong className="text-gray-300">{key}</strong>
            <span className="text-gray-400">: {formatResponse(val)}</span>
            {index < entries.length - 1 && (
              <span className="text-gray-400">{isArray ? "," : ", "}</span>
            )}
          </div>
        ))}
      </div>
    );
  },

  default: (value: unknown) => (
    <span className="text-gray-400">{String(value)}</span>
  ),
};

export const formatResponse = (response: unknown): React.ReactNode => {
  if (typeof response === 'object' && response !== null) {
    return formatters.object(response);
  }

  return formatters.default(response);
};

// Helper to register new formatters
export const registerFormatter = (type: string, formatter: FormatterFunction) => {
  formatters[type] = formatter;
};