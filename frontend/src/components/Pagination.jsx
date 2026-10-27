export default function Pagination({ page, totalPages, totalItems, perPage, onPageChange }) {
  if (totalPages <= 1) return null;
  const start = (page - 1) * perPage + 1;
  const end = Math.min(page * perPage, totalItems);

  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - page) <= 1) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...');
    }
  }

  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 0', flexWrap:'wrap', gap:8 }}>
      <span style={{ fontSize:12, color:'var(--gray-500)' }}>
        Showing {start}–{end} of {totalItems} results
      </span>
      <div className="pagination">
        <button className="page-btn" disabled={page === 1} onClick={() => onPageChange(page - 1)}>‹</button>
        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`e-${i}`} className="page-btn" style={{ cursor:'default', border:'none', color:'var(--gray-400)' }}>…</span>
          ) : (
            <button key={p} className={`page-btn ${page === p ? 'active' : ''}`} onClick={() => onPageChange(p)}>{p}</button>
          )
        )}
        <button className="page-btn" disabled={page === totalPages} onClick={() => onPageChange(page + 1)}>›</button>
      </div>
    </div>
  );
}
