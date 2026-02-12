import { useState, useEffect, useCallback } from 'react';
import { MatchingService } from '@shared/src/core/utils/MatchingService';
import { User } from '@shared/src/core/models/User';
import { JobDescription } from '@shared/src/core/models/JobDescription';
import { CONNECTION_TABS } from '@shared/src/core/constants';

/**
 * Hook for managing matching logic and state.
 * @param {Object} currentUserDoc - The current user document
 * @param {Object} data - The data context containing lists of users and JDs
 * @param {string} activeMainTab - Current active main tab
 * @param {string} activeSubTab - Current active sub tab
 */
export const useMatching = (currentUserDoc, data, activeMainTab, activeSubTab) => {
    const [rankedJds, setRankedJds] = useState([]);
    const [rankedUsers, setRankedUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [debugInfo, setDebugInfo] = useState({ apiUrl: '', lastUpdated: null });

    useEffect(() => {
        // Set initial debug info
        setDebugInfo(prev => ({ ...prev, apiUrl: MatchingService.getApiUrl() }));
    }, []);

    const fetchRankedData = useCallback(async () => {
        if (!data || !currentUserDoc) return;

        setLoading(true);
        setError(null);

        try {
            // おすすめタブのロジック
            if (activeMainTab === CONNECTION_TABS.MAIN.RECOMMENDATION) {
                if (activeSubTab === CONNECTION_TABS.SUB.POSITION && data.jd) {
                    const ranked = await MatchingService.rankCandidates(currentUserDoc, data.jd, 'jd');

                    if (ranked.error) {
                        throw new Error(ranked.error);
                    }

                    // Merge matchingScore from API result into local full data
                    // If ranked is empty (API failure/empty return handled in Service), use original list
                    const effectiveRanked = (ranked && ranked.length > 0) ? ranked : data.jd.map(jd => ({ ...jd, matchingScore: 0 }));
                    
                    // Issue #300 Implementation Style:
                    // Use the API results (effectiveRanked) directly as the source of truth.
                    // Do not filter against data.jd to avoid dropping items due to ID mismatch.
                    const newRankedJds = effectiveRanked.map(item => {
                        const id = item.id || item.JD_Number;
                        // Use rawData if available, otherwise assume item is the data
                        const rawData = item.rawData || item;
                        
                        // Ensure matchingScore is in rawData
                        if (item.matchingScore !== undefined) {
                            rawData.matchingScore = item.matchingScore;
                        }

                        return JobDescription.fromFirestore(id, rawData, item.companyId || '');
                    });

                    // Sort by score descending
                    newRankedJds.sort((a, b) => {
                        const scoreA = a.rawData.matchingScore || 0;
                        const scoreB = b.rawData.matchingScore || 0;
                        return scoreB - scoreA;
                    });

                    setRankedJds(newRankedJds);
                } else if (activeSubTab === CONNECTION_TABS.SUB.PERSON && data.users) {
                    const ranked = await MatchingService.rankCandidates(currentUserDoc, data.users, 'user');

                    if (ranked.error) {
                        throw new Error(ranked.error);
                    }

                    // Issue #300 Implementation Style for Users as well
                    const newRankedUsers = ranked.map(item => {
                        const id = item.id;
                        const rawData = item.rawData || item;
                        
                        if (item.matchingScore !== undefined) {
                            rawData.matchingScore = item.matchingScore;
                        }

                        return User.fromFirestore(id, rawData);
                    });

                    newRankedUsers.sort((a, b) => {
                        const scoreA = a.rawData.matchingScore || 0;
                        const scoreB = b.rawData.matchingScore || 0;
                        return scoreB - scoreA;
                    });

                    setRankedUsers(newRankedUsers);
                }
            }
            // つながり済タブのロジック (現状は空)
            else if (activeMainTab === CONNECTION_TABS.MAIN.CONNECTED) {
                if (activeSubTab === CONNECTION_TABS.SUB.COMPANY) {
                    setRankedJds([]);
                } else if (activeSubTab === CONNECTION_TABS.SUB.PERSON) {
                    setRankedUsers([]);
                }
            }

            setDebugInfo(prev => ({ ...prev, lastUpdated: new Date().toLocaleTimeString() }));

        } catch (err) {
            console.log('[useMatching] Failed to rank candidates:', err);
            setError(err.message || 'Unknown error occurred');

            // エラー時はスコア0でフォールバック（画面クラッシュ回避）
            // ただしエラー内容はstateに残す
            if (activeSubTab === CONNECTION_TABS.SUB.POSITION) {
                setRankedJds(data.jd.map(jd => {
                    const mergedRawData = { ...(jd.rawData || {}), matchingScore: 0 };
                    return JobDescription.fromFirestore(jd.id, mergedRawData, jd.companyId);
                }));
            } else {
                setRankedUsers(data.users.map(u => {
                    const mergedRawData = { ...(u.rawData || {}), matchingScore: 0 };
                    return User.fromFirestore(u.id, { ...u, ...mergedRawData });
                }));
            }
        } finally {
            setLoading(false);
        }
    }, [data, currentUserDoc, activeMainTab, activeSubTab]);

    useEffect(() => {
        fetchRankedData();
    }, [fetchRankedData]);

    return {
        rankedJds,
        rankedUsers,
        loading,
        error,
        debugInfo,
        retry: fetchRankedData
    };
};
