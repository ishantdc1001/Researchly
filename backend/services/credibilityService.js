/**
 * Researchly Credibility Engine
 * Analyzes academic conferences against heuristic models, predatory journals/conferences lists (e.g. Beall's list heuristics),
 * publisher reputation, email domains, peer-review integrity signals, and indexing claims.
 */

const PREDATORY_PUBLISHERS = [
  'waset',
  'world academy of science, engineering and technology',
  'omics',
  'omics international',
  'science publishing group',
  'scirp',
  'scientific research publishing',
  'david publishing',
  'academic journals',
  'austin publishing',
  'baishideng',
  'euroscicon',
  'allied academies',
  'pulsus',
  'herald meetings',
  'conferencera',
  'magnus group'
];

const PRESTIGIOUS_PUBLISHERS = [
  'ieee',
  'acm',
  'association for computing machinery',
  'springer',
  'springer nature',
  'elsevier',
  'acl',
  'association for computational linguistics',
  'aaai',
  'usenix',
  'siam',
  'neurips foundation',
  'wiley',
  'nature',
  'oxford university press',
  'cambridge university press',
  'plos'
];

const GENERIC_EMAIL_DOMAINS = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', '163.com', 'mail.ru'];

const evaluateCredibility = (conferenceData) => {
  let score = 55; // baseline starting score
  const evidence_log = [];
  const flags = [];

  const nameLower = (conferenceData.name || '').toLowerCase();
  const acronymUpper = (conferenceData.acronym || '').toUpperCase();
  const publisherLower = (conferenceData.publisher || '').toLowerCase();
  const descLower = (conferenceData.description || '').toLowerCase();
  const emailLower = (conferenceData.contact_email || '').toLowerCase();
  const websiteUrl = (conferenceData.website_url || '').toLowerCase();

  // 1. Check against known predatory publishers
  const isPredatory = PREDATORY_PUBLISHERS.some(
    pred => publisherLower.includes(pred) || nameLower.includes(pred) || websiteUrl.includes(pred)
  );

  if (isPredatory) {
    score -= 45;
    flags.push('SUSPECTED_PREDATORY_ORGANIZER');
    evidence_log.push({
      rule: 'Predatory Watchlist Check',
      passed: false,
      scoreImpact: -45,
      message: 'Publisher or organizer matches flagged predatory conference network patterns.'
    });
  } else {
    evidence_log.push({
      rule: 'Predatory Watchlist Check',
      passed: true,
      scoreImpact: 0,
      message: 'No matches found in flagged predatory registries.'
    });
  }

  // 2. Check for prestigious / accredited publishers
  const isPrestigious = PRESTIGIOUS_PUBLISHERS.some(
    prest => publisherLower.includes(prest) || descLower.includes(prest)
  );

  if (isPrestigious) {
    score += 25;
    flags.push('ACCREDITED_PUBLISHER');
    evidence_log.push({
      rule: 'Publisher Accreditation',
      passed: true,
      scoreImpact: +25,
      message: `Recognized tier-1 academic publisher or society (${conferenceData.publisher}).`
    });
  } else {
    evidence_log.push({
      rule: 'Publisher Accreditation',
      passed: false,
      scoreImpact: 0,
      message: 'Publisher is independent or not indexed in top tier-1 societies.'
    });
  }

  // 3. Contact Email Domain Analysis
  const emailDomain = emailLower.split('@')[1];
  if (emailDomain) {
    if (GENERIC_EMAIL_DOMAINS.includes(emailDomain)) {
      score -= 20;
      flags.push('GENERIC_CONTACT_EMAIL');
      evidence_log.push({
        rule: 'Institutional Contact Check',
        passed: false,
        scoreImpact: -20,
        message: `Official contact uses free public email (@${emailDomain}) rather than university/publisher domain.`
      });
    } else if (emailDomain.endsWith('.edu') || emailDomain.endsWith('.ac.uk') || emailDomain.endsWith('.org')) {
      score += 10;
      evidence_log.push({
        rule: 'Institutional Contact Check',
        passed: true,
        scoreImpact: +10,
        message: `Official contact verified on academic domain (@${emailDomain}).`
      });
    }
  }

  // 4. Peer Review Integrity & Rapid Acceptance Promises
  const rapidReviewTerms = [
    'acceptance in 24 hours',
    'acceptance within 24h',
    'fast-track acceptance in 48 hours',
    'instant publication',
    'guaranteed acceptance',
    'pay and publish'
  ];

  const hasSuspiciousReview = rapidReviewTerms.some(term => descLower.includes(term));
  if (hasSuspiciousReview) {
    score -= 35;
    flags.push('UNREALISTIC_REVIEW_SPEED');
    evidence_log.push({
      rule: 'Peer Review Integrity',
      passed: false,
      scoreImpact: -35,
      message: 'Promises rapid, unvetted peer-review timeline indicative of paper mills.'
    });
  } else {
    evidence_log.push({
      rule: 'Peer Review Integrity',
      passed: true,
      scoreImpact: 0,
      message: 'Standard peer-review guidelines and double-blind / single-blind norms observed.'
    });
  }

  // 5. Verified Indexing Claims
  const indexing = conferenceData.verified_indexing || {};
  let indexingBonus = 0;
  if (indexing.scopus) indexingBonus += 8;
  if (indexing.ieee_xplore) indexingBonus += 8;
  if (indexing.acm_dl) indexingBonus += 8;
  if (indexing.wos) indexingBonus += 6;

  if (indexingBonus > 0) {
    score += Math.min(indexingBonus, 20);
    flags.push('VERIFIED_INDEXING');
    evidence_log.push({
      rule: 'Index Verification',
      passed: true,
      scoreImpact: Math.min(indexingBonus, 20),
      message: 'Conference proceedings indexed in recognized academic repositories (Scopus, IEEE Xplore, ACM DL).'
    });
  }

  // 6. Deadlines Validation
  if (!conferenceData.deadlines || conferenceData.deadlines.length === 0) {
    score -= 10;
    evidence_log.push({
      rule: 'Timeline Transparency',
      passed: false,
      scoreImpact: -10,
      message: 'No published Call For Papers deadlines found in submission record.'
    });
  } else {
    evidence_log.push({
      rule: 'Timeline Transparency',
      passed: true,
      scoreImpact: 0,
      message: `${conferenceData.deadlines.length} milestone deadline(s) catalogued.`
    });
  }

  // 7. Venue Transparency
  if (conferenceData.location && (conferenceData.location.city || conferenceData.location.country)) {
    if (conferenceData.location.city !== 'Virtual') {
      score += 5;
      evidence_log.push({
        rule: 'Venue Transparency',
        passed: true,
        scoreImpact: +5,
        message: `Physical host location documented: ${conferenceData.location.city}, ${conferenceData.location.country}.`
      });
    }
  }

  // Clamp trust_score strictly 0-100
  const finalTrustScore = Math.max(0, Math.min(100, Math.round(score)));

  return {
    trust_score: finalTrustScore,
    flags,
    evidence_log
  };
};

module.exports = {
  evaluateCredibility,
  PREDATORY_PUBLISHERS,
  PRESTIGIOUS_PUBLISHERS
};
