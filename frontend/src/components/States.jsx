export function EmptyState({ icon = '📭', title = 'No results found', description = 'Try adjusting your search or filters.', action }) {
  return (
    <div className="state-container">
      <div className="state-icon">{icon}</div>
      <div className="state-title">{title}</div>
      <div className="state-desc">{description}</div>
      {action && <div style={{ marginTop:12 }}>{action}</div>}
    </div>
  );
}

export function LoadingState({ message = 'Loading data...' }) {
  return (
    <div className="state-container">
      <div className="spinner lg" />
      <div className="state-desc" style={{ marginTop:8 }}>{message}</div>
    </div>
  );
}

export function ErrorState({ message = 'Something went wrong.', onRetry }) {
  return (
    <div className="state-container">
      <div className="state-icon"></div>
      <div className="state-title">Failed to load data</div>
      <div className="state-desc">{message}</div>
      {onRetry && (
        <button className="btn btn-secondary" style={{ marginTop:12 }} onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}
