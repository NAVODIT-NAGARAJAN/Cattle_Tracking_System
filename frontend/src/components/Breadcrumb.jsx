import { Link } from 'react-router-dom';

export default function Breadcrumb({ items }) {
  return (
    <nav aria-label="Breadcrumb" className="breadcrumb" style={{ marginBottom:16 }}>
      {items.map((item, i) => (
        <span key={i} style={{ display:'flex', alignItems:'center', gap:6 }}>
          {i > 0 && <span className="crumb-sep">/</span>}
          {item.to ? (
            <Link to={item.to}>{item.label}</Link>
          ) : (
            <span className="crumb-active">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
