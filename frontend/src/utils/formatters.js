export const formatDate = (isoString) => {
  if (!isoString) return '—';
  const d = new Date(isoString);
  return d.toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
};

export const formatDateTime = (isoString) => {
  if (!isoString) return '—';
  const d = new Date(isoString);
  return d.toLocaleString('en-IN', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit', hour12:true });
};

export const formatRelativeTime = (isoString) => {
  if (!isoString) return '—';
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
};

export const formatCoord = (num) => {
  if (num == null) return '—';
  return Number(num).toFixed(6);
};

export const formatAge = (months) => {
  if (!months) return '—';
  if (months < 12) return `${months} months`;
  const y = Math.floor(months / 12);
  const m = months % 12;
  return m > 0 ? `${y}y ${m}m` : `${y} year${y !== 1 ? 's' : ''}`;
};

export const capitalizeBreed = (breed) => {
  if (!breed) return '—';
  const str = breed.replace(/_/g, ' ').replace(/-/g, ' '); 
  return str.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
};

export const getConfidenceColor = (confidence) => {
  if (confidence >= 90) return 'var(--success)';
  if (confidence >= 75) return 'var(--info)';
  if (confidence >= 60) return 'var(--warning)';
  return 'var(--danger)';
};

export const getStatusColor = (status) => {
  return status === 'online' ? 'var(--success)' : 'var(--gray-500)';
};

export const truncateId = (id, length = 18) => {
  if (!id) return '—';
  return id.length > length ? id.slice(0, length) + '…' : id;
};

export const debounce = (fn, delay) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};

export const paginate = (array, page, perPage) => {
  const start = (page - 1) * perPage;
  return array.slice(start, start + perPage);
};

export const sortArray = (array, key, direction) => {
  return [...array].sort((a, b) => {
    let av = a[key]; let bv = b[key];
    if (typeof av === 'string') av = av.toLowerCase();
    if (typeof bv === 'string') bv = bv.toLowerCase();
    if (av < bv) return direction === 'asc' ? -1 : 1;
    if (av > bv) return direction === 'asc' ? 1 : -1;
    return 0;
  });
};
