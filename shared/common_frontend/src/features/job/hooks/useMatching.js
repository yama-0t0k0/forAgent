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
                    const rankedMap = new Map(ranked.map(item => [item.id || item.JD_Number, item]));
                    
                    const newRankedJds = data.jd
                        .filter(jd => {
                            const id = jd.id || jd.JD_Number;
                            return rankedMap.has(id);
                        })
                        .map(jd => {
                            const id = jd.id || jd.JD_Number;
                            const rankedItem = rankedMap.get(id);
                            // Create a new instance with merged data
                            const mergedRawData = { 
                                ...(jd.rawData || {}), 
                                matchingScore: rankedItem.matchingScore 
                            };
                            return JobDescription.fromFirestore(id, mergedRawData, jd.companyId);
                        })
                        .sort((a, b) => {
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

                    // Merge matchingScore for Users as well
                    const rankedMap = new Map(ranked.map(item => [item.id, item]));
                    
                    const newRankedUsers = data.users
                        .filter(user => rankedMap.has(user.id))
                        .map(user => {
                            const rankedItem = rankedMap.get(user.id);
                            const mergedRawData = {
                                ...(user.rawData || {}),
                                matchingScore: rankedItem.matchingScore
                            };
                            return User.fromFirestore(user.id, { ...user, ...mergedRawData });
                        })
                        .sort((a, b) => {
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
