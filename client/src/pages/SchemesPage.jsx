import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
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

      externalSchemes.forEach(ext => {
        const alreadyExists = merged.some(item =>
          item.slug.toLowerCase() === ext.slug.toLowerCase() ||
          item.name.toLowerCase() === ext.name.toLowerCase()
        );
        if (!alreadyExists) {
          merged.push(ext);
        }
      });

      if (!merged.length && (dbResult.status === 'rejected' || externalResult.status === 'rejected')) {
        const msg = [dbResult.reason?.message, externalResult.reason?.message].filter(Boolean).join('; ');
        setError(msg || 'Failed to load schemes from both local and external providers.');
      }

      setSchemes(merged);
      setLoading(false);
    }
    loadSchemes();
    return () => { cancelled = true; };
  }, []);

  const filteredSchemes = useMemo(() => {
    return schemes.filter(item => {
      const q = query.trim().toLowerCase();
      const matchesQuery = !q ||
        item.name.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q) ||
        item.eligibility.toLowerCase().includes(q);
      const matchesType = type === 'all' || item.type.toLowerCase() === type.toLowerCase();
      const matchesSource = source === 'all' || item.source.toLowerCase() === source.toLowerCase();
      return matchesQuery && matchesType && matchesSource;
    });
  }, [schemes, query, type, source]);

  return (
    <div className="schemes-page">
      <Navbar />

      <header className="schemes-hero">
        <span className="schemes-kicker">Unified Kisan Welfare Directory</span>
        <h1>Central & State Agricultural Schemes</h1>
        <p>
          Search verified government subsidies, input assistance programs, and credit facilities directly linked to official application portals.
        </p>
        <div className="schemes-stats">
          <div>
            <strong>{schemes.length || '15+'}</strong>
            <span>Active Schemes</span>
          </div>
          <div>
            <strong>100%</strong>
            <span>Direct Benefit (DBT)</span>
          </div>
          <div>
            <strong>Zero Fee</strong>
            <span>Public Agricultural Info</span>
          </div>
        </div>
      </header>

      <main className="schemes-main">
        <section className="schemes-toolbar" aria-label="Scheme filters">
          <div className="schemes-search">
            <label htmlFor="scheme-query">Search Schemes or Keywords</label>
            <input
              id="scheme-query"
              type="search"
              placeholder="e.g. drip irrigation, tractor subsidy, kisan credit, solar"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="scheme-type">Authority Level</label>
            <select id="scheme-type" value={type} onChange={e => setType(e.target.value)}>
              <option value="all">All Authorities</option>
              <option value="central">Central Government</option>
              <option value="state">State Specific</option>
            </select>
          </div>
          <div>
            <label htmlFor="scheme-source">Registry Source</label>
            <select id="scheme-source" value={source} onChange={e => setSource(e.target.value)}>
              <option value="all">All Sources</option>
              <option value="database">Database Verified</option>
              <option value="external">External Live Feeds</option>
            </select>
          </div>
        </section>

        {error && (
          <div className="schemes-notice" role="alert">
            {error}
          </div>
        )}

        {loading ? (
          <div className="schemes-empty">
            <h3>Loading verified government schemes...</h3>
            <p>Fetching real-time subsidy rules and eligibility databases.</p>
          </div>
        ) : filteredSchemes.length === 0 ? (
          <div className="schemes-empty">
            <h3>No schemes match your criteria</h3>
            <p>Try broadening your search keyword or clearing the filters above.</p>
          </div>
        ) : (
          <div className="schemes-grid">
            {filteredSchemes.map(item => (
              <article key={item.id} className="scheme-card">
                <div className="scheme-card-top">
                  <span className={`scheme-type ${item.type.toLowerCase() === 'state' ? 'state' : 'central'}`}>
                    {item.type}
                  </span>
                  <span className={`scheme-source ${item.source === 'external' ? 'external' : 'verified'}`}>
                    {item.source === 'external' ? 'Live External' : 'Verified'}
                  </span>
                </div>
                <h2>{item.name}</h2>
                <p>{item.summary}</p>
                {item.eligibility && (
                  <div className="scheme-eligibility">
                    <strong>Eligibility:</strong>
                    <p>{item.eligibility}</p>
                  </div>
                )}
                <div className="scheme-card-actions">
                  {item.officialUrl ? (
                    <a href={item.officialUrl} target="_blank" rel="noopener noreferrer">
                      <span>Official Portal</span>
                      <span aria-hidden="true">→</span>
                    </a>
                  ) : (
                    <span className="scheme-no-link">Contact Regional Krishi Bhawan</span>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}

        <section className="schemes-api-help">
          <div>
            <span className="schemes-kicker">Developer & Agronomist Integration</span>
            <h2>Access Schemes Programmatically</h2>
            <p>
              Use our REST API endpoints to build state-level custom portals, mobile apps, or local panchayat kiosk displays with live scheme feeds.
            </p>
          </div>
          <a href="/api/government-schemes" target="_blank" rel="noreferrer">
            View JSON Feed
          </a>
        </section>
      </main>

      <Footer />
    </div>
  );
}
