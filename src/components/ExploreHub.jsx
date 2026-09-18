import React, { useState, useEffect } from 'react';
import { Search, Play, GitFork, Edit3, Trash2, Download, Sparkles, Globe, User, Loader2 } from 'lucide-react';
import { DEFAULT_8VALUES_TEST } from '../utils/default8values';
import { TestCard } from './TestCard';
import { Spinner } from './Spinner';

export function ExploreHub({ onSelectTest, onEditTest, user, authToken, onViewProfile }) {
  const [tests, setTests] = useState([]);
  const [search, setSearch] = useState('');
  const [sortMode, setSortMode] = useState('hot');
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const sortOptions = [
    { value: 'hot', label: 'Hot' },
    { value: 'new', label: 'New' },
    { value: 'top', label: 'Top' }
  ];

  const fetchTests = async (pageNum = 1, append = false) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tests?page=${pageNum}&limit=50`);
      const data = await res.json();
      if (data.success && Array.isArray(data.tests)) {
        setTests(prev => append ? [...prev, ...data.tests] : data.tests);
        setHasMore(data.hasMore || false);
        setPage(pageNum);
      }
    } catch (err) {
      // Backend server offline, fallback to preset tests
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTests(1, false);
  }, []);

  const getHotScore = (test) => {
    const views = test.views || 0;
    const plays = test.plays || 0;
    const publishedAt = new Date(test.publishedAt || Date.now());
    const hoursSincePublished = Math.max(0, (Date.now() - publishedAt) / (1000 * 60 * 60));
    return (views + (plays * 5)) / Math.pow(hoursSincePublished + 2, 1.5);
  };

  const getSortValue = (test) => {
    if (sortMode === 'hot') return getHotScore(test);
    if (sortMode === 'new') return new Date(test.publishedAt || 0).getTime();
    if (sortMode === 'top') return (test.views || 0) + ((test.plays || 0) * 5);
    return 0;
  };

  const filteredTests = tests.filter(q => {
    const s = search.toLowerCase();
    const tagsStr = typeof q.tags === 'string' ? q.tags.toLowerCase() : JSON.stringify(q.tags || []).toLowerCase();
    return q.title?.toLowerCase().includes(s) ||
           q.description?.toLowerCase().includes(s) ||
           tagsStr.includes(s);
  }).sort((a, b) => getSortValue(b) - getSortValue(a));

  return (
    <div className="container">
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <h1>MoreValues</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', maxWidth: '650px', margin: '0.5rem auto' }}>
          Explore community-made tests, or make your own!
        </p>

        {/* Search & Sort Options */}
        <div style={{ display: 'flex', gap: '1rem', maxWidth: '600px', margin: '1.5rem auto' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '2.5rem' }}
              placeholder="Search tests or tags..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div style={{ position: 'relative', width: '140px' }}>
            <button 
              className="btn btn-secondary" 
              style={{ width: '100%', justifyContent: 'space-between', padding: '0.65rem 1rem' }}
              onClick={() => setIsSortOpen(!isSortOpen)}
              onBlur={() => setTimeout(() => setIsSortOpen(false), 200)}
            >
              {sortOptions.find(o => o.value === sortMode)?.label}
              <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>▼</span>
            </button>
            {isSortOpen && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                marginTop: '4px',
                background: '#cccccc',
                borderRadius: '6pt',
                overflow: 'hidden',
                zIndex: 10,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
              }}>
                {sortOptions.map((opt, idx) => (
                  <div 
                    key={opt.value}
                    style={{
                      padding: '0.65rem 1rem',
                      cursor: 'pointer',
                      fontWeight: 700,
                      fontFamily: "'Montserrat', sans-serif",
                      color: '#333333',
                      borderBottom: idx === sortOptions.length - 1 ? 'none' : '1px solid #b3b3b3',
                      background: sortMode === opt.value ? '#b3b3b3' : 'transparent',
                      textAlign: 'left'
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setSortMode(opt.value);
                      setIsSortOpen(false);
                    }}
                    onMouseEnter={(e) => {
                      if (sortMode !== opt.value) e.target.style.background = '#bfbfbf';
                    }}
                    onMouseLeave={(e) => {
                      if (sortMode !== opt.value) e.target.style.background = 'transparent';
                    }}
                  >
                    {opt.label}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Grid of Tests or Loading Throbber */}
      {loading && tests.length === 0 ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '5rem 0', minHeight: '300px' }}>
          <Spinner size={44} />
        </div>
      ) : filteredTests.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'var(--container-bg)', borderRadius: '12px', color: 'var(--text-muted)' }}>
          {search ? `No tests found matching "${search}".` : 'No community tests found.'}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {filteredTests.map((test) => (
            <TestCard 
              key={test.id} 
              test={test} 
              isOwner={user && test.ownerId === user.id} 
              onSelectTest={onSelectTest} 
              onEditTest={onEditTest} 
              onViewProfile={onViewProfile} 
            />
          ))}
        </div>
      )}

      {/* Load More */}
      {hasMore && !search && (
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <button
            className="btn btn-secondary"
            onClick={() => fetchTests(page + 1, true)}
            disabled={loading}
            style={{ padding: '0.75rem 2rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: '120px' }}
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
}
