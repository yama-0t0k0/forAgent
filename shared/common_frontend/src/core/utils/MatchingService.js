import { HeatmapCalculator } from './HeatmapCalculator';

export const MatchingService = {
    /**
     * Calculates a matching score (0-100) between a user and a JD.
     * @param {Object} userDoc 
     * @param {Object} jdDoc 
     * @returns {number} 0-100
     */
    calculateScore(userDoc, jdDoc) {
        if (!userDoc || !jdDoc) return 0;

        const userGrid = HeatmapCalculator.calculate(userDoc);
        const jdGrid = HeatmapCalculator.calculate(jdDoc);

        let totalScore = 0;
        let activeTiles = 0;

        for (let i = 0; i < userGrid.length; i++) {
            // If JD requires this skill/aspiration (grid[i] > 0)
            if (jdGrid[i] > 0) {
                activeTiles++;
                // Add the minimum of user's skill and JD's requirement, 
                // but if user exceeds JD, it's a plus? 
                // Let's keep it simple: multiply the two values.
                totalScore += userGrid[i] * jdGrid[i];
            }
        }

        if (activeTiles === 0) return 0;

        // Return percentage
        return Math.min(100, Math.round((totalScore / activeTiles) * 100));
    },

    /**
     * Ranks a list of items (Users or JDs) against a target doc.
     */
    rankCandidates(targetDoc, candidates, type = 'jd') {
        const results = candidates.map(candidate => {
            const score = type === 'jd'
                ? this.calculateScore(targetDoc, candidate)
                : this.calculateScore(candidate, targetDoc);
            return { ...candidate, matchingScore: score };
        });

        return results.sort((a, b) => b.matchingScore - a.matchingScore);
    }
};
