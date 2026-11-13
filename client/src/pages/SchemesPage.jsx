import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import '../pageStyles/schemes.css';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

function normalizeScheme(item, index, source = 'database') {
  return {
    id: item.id ?? item.scheme_id ?? item.slug ?? `${source}-${index}`,
    slug: item.slug ?? item.code ?? item.id ?? `${source}-${index}`,
    name: item.name ?? item.scheme_name ?? item.title ?? 'Government scheme',
    type: item.scheme_type ?? item.type ?? item.category ?? 'central',
    summary: item.benefit_summary ?? item.description ?? item.benefits ?? item.short_description ?? 'Open the official scheme portal for eligibility and application details.',
    eligibility: item.eligibility ?? item.eligibility_criteria ?? '',
    officialUrl: item.official_url ?? item.url ?? item.link ?? item.apply_url ?? '',
    source
  };
}

export default function SchemesPage() {
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [type, setType] = useState('all');
  const [source, setSource] = useState('all');

  useEffect(() => {
    let cancelled = false;
    async function loadSchemes() {
      setLoading(true);
      setError('');
      const requests = [
        fetch(`${API_BASE}/api/government-schemes`).then(async r => {
          if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || 'Database schemes could not be loaded');
          return r.json();
        }).then(data => (data.schemes || []).map((item, i) => normalizeScheme(item, i, 'database'))),
        fetch(`${API_BASE}/api/external-government-schemes`).then(async r => {
          if (r.status === 404 || r.status === 503) return [];
          if (!r.ok) throw new Error('External schemes API returned an error');
          return r.json();
        }).then(data => (data.schemes || []).map((item, i) => normalizeScheme(item, i, 'external')))
      ];
      const results = await Promise.allSettled(requests);
      if (cancelled) return;
      const dbResult = results[0];
      const externalResult = results[1];
      const dbSchemes = dbResult.status === 'fulfilled' ? dbResult.value : [];
      const externalSchemes = externalResult.status === 'fulfilled' ? externalResult.value : [];
      const merged = [...dbSchemes];
      const seen = new Set(dbSchemes.map(s => s.slug.toString().toLowerCase()));
      externalSchemes.forEach(s => {
        const key = String(s.slug || s.name).toLowerCase();
        if (!seen.has(key)) { merged.push(s); seen.add(key); }
      });
      setSchemes(merged);
      if (dbResult.status === 'rejected' && externalResult.status === 'rejected') {
        setError('Could not load schemes. Check that the Express server and MySQL database are running.');
      } else if (dbResult.status === 'rejected') {
        setError('Database schemes are unavailable; showing external API results only.');
      }
      setLoading(false);
    }
    loadSchemes();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => schemes.filter(s => {
    const searchText = `${s.name} ${s.summary} ${s.type} ${s.eligibility}`.toLowerCase();
    const matchesQuery = searchText.includes(query.toLowerCase());
    const matchesType = type === 'all' || String(s.type).toLowerCase().includes(type);
    const matchesSource = source === 'all' || s.source === source;
    return matchesQuery && matchesType && matchesSource;
  }), [schemes, query, type, source]);

  return (
    <div className="schemes-page">
      <header className="schemes-header">
        <div className="schemes-header-inner">
          <Link className="schemes-brand" to="/">
            <img src="/assets/Gemini_Generated_Image_7lty6p7lty6p7lty-removebg-preview.png" alt="" />
            <span>BhoomiBandhu</span>
          </Link>
          <nav className="schemes-nav" aria-label="Main navigation">
            <Link to="/">Home</Link><Link to="/storage">Storage</Link><Link to="/insurance">Insurance</Link>
            <Link to="/schemes" aria-current="page">Government Schemes</Link><Link to="/financial">Financial</Link>
          </nav>
        </div>
      </header>

      <section className="schemes-hero">
        <span className="schemes-kicker">Government support for farmers</span>
        <h1>Government Schemes</h1>
        <p>Discover farmer welfare schemes, understand their benefits, and find official application links.</p>
        <div className="schemes-stats">
          <div><strong>{schemes.length}</strong><span>Available schemes</span></div>
          <div><strong>Live</strong><span>API-ready listing</span></div>
          <div><strong>Central & State</strong><span>Scheme categories</span></div>
        </div>
      </section>

      <main className="schemes-main">
        <section className="schemes-toolbar" aria-label="Filter government schemes">
          <label className="schemes-search">
            <span>Search schemes</span>
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by name, benefit or category…" />
          </label>
          <label>
            <span>Government</span>
            <select value={type} onChange={e => setType(e.target.value)}>
              <option value="all">Central and state</option><option value="central">Central</option><option value="state">State</option>
            </select>
          </label>
          <label>
            <span>Data source</span>
            <select value={source} onChange={e => setSource(e.target.value)}>
              <option value="all">All sources</option><option value="database">Local database</option><option value="external">External API</option>
            </select>
          </label>
        </section>

        {error && <p className="schemes-notice" role="status">{error}</p>}
        {loading ? <div className="schemes-empty" role="status">Loading government schemes…</div> : (
          filtered.length ? <section className="schemes-grid" aria-live="polite">
            {filtered.map(scheme => (
              <article className="scheme-card" key={`${scheme.source}-${scheme.id}`}>
                <div className="scheme-card-top">
                  <span className={`scheme-type ${String(scheme.type).toLowerCase().includes('state') ? 'state' : ''}`}>
                    {String(scheme.type).toLowerCase().includes('state') ? 'State scheme' : 'Central scheme'}
                  </span>
                  <span className={`scheme-source ${scheme.source}`}>{scheme.source === 'external' ? 'API data' : 'Database'}</span>
                </div>
                <h2>{scheme.name}</h2>
                <p>{scheme.summary}</p>
                {scheme.eligibility && <div className="scheme-eligibility"><strong>Eligibility</strong><p>{scheme.eligibility}</p></div>}
                <div className="scheme-card-actions">
                  {scheme.officialUrl ? <a href={scheme.officialUrl} target="_blank" rel="noreferrer">Official details <span aria-hidden="true">↗</span></a> : <span className="scheme-no-link">Official link not supplied by API</span>}
                </div>
              </article>
            ))}
          </section> : <div className="schemes-empty">No schemes match your search. Try another keyword or filter.</div>
        )}

        <section className="schemes-api-help">
          <div>
            <span className="schemes-kicker">Developer integration</span>
            <h2>Connect a government schemes API</h2>
            <p>The page already requests <code>/api/government-schemes</code> and <code>/api/external-government-schemes</code>. Configure your chosen provider in the backend environment file; API keys stay on the server and are never exposed in React.</p>
          </div>
          <Link to="/">Back to dashboard</Link>
        </section>
      </main>
      <footer className="schemes-footer">© BhoomiBandhu · Farmer support and scheme discovery</footer>
    </div>
  );
}
