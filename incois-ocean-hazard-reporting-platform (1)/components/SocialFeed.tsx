import React, { useState, useEffect, useRef } from 'react';
import { SocialMediaPost } from '../types';
import { SENTIMENT_COLORS, SOCIAL_ICONS } from '../constants';
import { useLanguage } from '../contexts/LanguageContext';
import { NLPService } from '../services/nlpService';

const SocialFeed: React.FC<{ posts: SocialMediaPost[] }> = ({ posts }) => {
  const [newPostIds, setNewPostIds] = useState<Set<string>>(new Set());
  const prevPostIdsRef = useRef<Set<string>>(new Set(posts.map(p => p.id)));
  const { t } = useLanguage();

  useEffect(() => {
    const currentPostIds = new Set(posts.map(p => p.id));
    const trulyNewIds = posts
      .map(p => p.id)
      .filter(id => !prevPostIdsRef.current.has(id));

    if (trulyNewIds.length > 0) {
      setNewPostIds(prev => new Set([...Array.from(prev), ...trulyNewIds]));
      const timer = setTimeout(() => {
        setNewPostIds(prev => {
          const next = new Set(prev);
          trulyNewIds.forEach(id => next.delete(id));
          return next;
        });
      }, 1000);
    }

    prevPostIdsRef.current = currentPostIds;
  }, [posts]);

  // Sort posts by NLP relevance
  const sortedPosts = NLPService.sortByRelevance([...posts]);
  const hazardPosts = NLPService.filterHazardPosts(posts);

  return (
    <div>
      <div className="p-4 border-b border-slate-700 sticky top-0 bg-slate-800/80 backdrop-blur-sm z-10">
        <h2 className="text-lg font-bold text-white">{t('socialFeed.title')}</h2>
        <p className="text-sm text-slate-400">{t('socialFeed.subtitle')}</p>
        <div className="flex gap-4 mt-2 text-xs">
          <span className="text-amber-400">🔍 NLP Engine Active</span>
          <span className="text-green-400">📊 {hazardPosts.length} Hazard-Related</span>
          <span className="text-blue-400">📈 {posts.length} Total Posts</span>
        </div>
      </div>
      <div className="p-4 space-y-4">
        {sortedPosts.map(post => {
          const isNew = newPostIds.has(post.id);
          const nlpAnalysis = NLPService.analyzePost(post);
          
          return (
            <div 
              key={post.id} 
              className={`bg-slate-900/50 p-4 rounded-lg border transition-all duration-500 ${
                nlpAnalysis.isHazardRelated 
                  ? 'border-amber-500/50 bg-amber-900/10' 
                  : 'border-slate-700'
              } ${isNew ? ' transform -translate-y-2 opacity-50' : 'transform translate-y-0 opacity-100'}`}
              style={{ transitionProperty: 'transform, opacity' }}
            >
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{SOCIAL_ICONS[post.source]}</span>
                  <div>
                    <p className="font-semibold text-white">{post.author}</p>
                    <p className="text-xs text-slate-400">{post.location}</p>
                  </div>
                  {nlpAnalysis.isHazardRelated && (
                    <div className="flex items-center gap-1">
                      <span className="text-amber-400 text-xs">⚠️</span>
                      <span className="text-xs text-amber-300">Hazard Alert</span>
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-500">{new Date(post.timestamp).toLocaleString()}</div>
                  {nlpAnalysis.isHazardRelated && (
                    <div className="text-xs text-amber-400">
                      Confidence: {nlpAnalysis.confidence}% | Engagement: {nlpAnalysis.engagementScore}%
                    </div>
                  )}
                </div>
              </div>
              <p className="text-sm text-slate-300 mb-3">{post.content}</p>
              
              {/* NLP Analysis Results */}
              {nlpAnalysis.isHazardRelated && (
                <div className="mb-3 p-2 bg-slate-800/50 rounded border border-amber-500/30">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-amber-300">🤖 NLP Analysis:</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      nlpAnalysis.intensity === 'high' ? 'bg-red-500/20 text-red-300' :
                      nlpAnalysis.intensity === 'medium' ? 'bg-orange-500/20 text-orange-300' :
                      'bg-yellow-500/20 text-yellow-300'
                    }`}>
                      {nlpAnalysis.intensity.toUpperCase()} INTENSITY
                    </span>
                  </div>
                  {nlpAnalysis.detectedHazards.length > 0 && (
                    <div className="text-xs text-slate-300">
                      <span className="font-medium">Detected Hazards:</span> {nlpAnalysis.detectedHazards.join(', ')}
                    </div>
                  )}
                  {nlpAnalysis.locations.length > 0 && (
                    <div className="text-xs text-slate-300">
                      <span className="font-medium">Locations:</span> {nlpAnalysis.locations.join(', ')}
                    </div>
                  )}
                </div>
              )}
              
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 flex-wrap">
                  {(nlpAnalysis.keywords.length > 0 ? nlpAnalysis.keywords : post.keywords).map(kw => (
                    <span key={kw} className={`px-2 py-0.5 rounded-full ${
                      nlpAnalysis.isHazardRelated ? 'bg-amber-500/20 text-amber-300' : 'bg-sky-500/20 text-sky-300'
                    }`}>
                      {kw}
                    </span>
                  ))}
                </div>
                <span className={`font-semibold ${SENTIMENT_COLORS[post.sentiment]}`}>
                  {t(`analyticsPanel.${post.sentiment.toLowerCase()}`)}
                </span>
              </div>
            </div>
          );
        })}
        
        {posts.length === 0 && (
          <div className="text-center py-8 text-slate-400">
            <p>🔍 No social media posts available</p>
            <p className="text-xs mt-2">The NLP engine is ready to analyze hazard-related content</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SocialFeed;