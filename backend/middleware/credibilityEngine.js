const { evaluateCredibility } = require('../services/credibilityService');

/**
 * Express middleware to automatically calculate trust_score and evidence_log
 * for newly ingested or updated conferences.
 */
const credibilityMiddleware = (req, res, next) => {
  try {
    if (Array.isArray(req.body)) {
      req.body = req.body.map(item => {
        const evaluation = evaluateCredibility(item);
        return {
          ...item,
          trust_score: evaluation.trust_score,
          flags: [...new Set([...(item.flags || []), ...evaluation.flags])],
          evidence_log: evaluation.evidence_log
        };
      });
    } else if (req.body && typeof req.body === 'object') {
      const evaluation = evaluateCredibility(req.body);
      req.body.trust_score = evaluation.trust_score;
      req.body.flags = [...new Set([...(req.body.flags || []), ...evaluation.flags])];
      req.body.evidence_log = evaluation.evidence_log;
    }
    next();
  } catch (error) {
    console.error('Error in credibility middleware:', error);
    next(error);
  }
};

module.exports = credibilityMiddleware;
