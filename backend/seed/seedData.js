const mongoose = require('mongoose');
const Conference = require('../models/Conference');
const { evaluateCredibility } = require('../services/credibilityService');

const initialConferences = [
  {
    name: 'IEEE International Conference on Acoustics, Speech, and Signal Processing',
    acronym: 'ICASSP',
    publisher: 'IEEE',
    description: 'The premier global signal processing and machine learning conference covering speech recognition, natural language processing, audio, bio-imaging, and multimodal architectures.',
    website_url: 'https://2026.ieeeicassp.org',
    location: {
      city: 'Barcelona',
      country: 'Spain',
      is_hybrid: true
    },
    deadlines: [
      { type: 'Abstract Submission', date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) },
      { type: 'Full Paper Submission', date: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000) },
      { type: 'Camera Ready Paper', date: new Date(Date.now() + 75 * 24 * 60 * 60 * 1000) }
    ],
    fees: {
      amount: 450,
      currency: 'EUR',
      is_free: false
    },
    topics: ['Signal Processing', 'Speech & Audio', 'Natural Language Processing', 'Machine Learning'],
    contact_email: 'secretariat@icassp2026.org',
    verified_indexing: {
      scopus: true,
      ieee_xplore: true,
      wos: true,
      acm_dl: false
    }
  },
  {
    name: 'Association for Computational Linguistics Annual Meeting',
    acronym: 'ACL',
    publisher: 'ACL',
    description: 'The flagship world conference on Natural Language Processing, Large Language Models, computational linguistics, multilingual speech, and deep representation learning.',
    website_url: 'https://2026.aclweb.org',
    location: {
      city: 'Vienna',
      country: 'Austria',
      is_hybrid: true
    },
    deadlines: [
      { type: 'Paper Submission', date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) },
      { type: 'Author Response Period', date: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000) },
      { type: 'Notification of Acceptance', date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) }
    ],
    fees: {
      amount: 350,
      currency: 'EUR',
      is_free: false
    },
    topics: ['Natural Language Processing', 'Large Language Models', 'Computational Linguistics', 'Machine Learning'],
    contact_email: 'acl2026@aclweb.org',
    verified_indexing: {
      scopus: true,
      wos: true,
      acm_dl: true,
      ieee_xplore: false
    }
  },
  {
    name: 'IEEE/CVF Conference on Computer Vision and Pattern Recognition',
    acronym: 'CVPR',
    publisher: 'IEEE',
    description: 'The highest-impact academic conference in Computer Vision, Pattern Recognition, Generative AI, Robotics Vision, and Neural Radiance Fields.',
    website_url: 'https://cvpr.thecvf.com',
    location: {
      city: 'Seattle',
      country: 'United States',
      is_hybrid: true
    },
    deadlines: [
      { type: 'Paper Submission Deadline', date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000) },
      { type: 'Rebuttal Due', date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000) }
    ],
    fees: {
      amount: 600,
      currency: 'USD',
      is_free: false
    },
    topics: ['Computer Vision', 'Generative Vision', 'Deep Learning', 'Robotics'],
    contact_email: 'chairs@cvpr2026.thecvf.com',
    verified_indexing: {
      scopus: true,
      ieee_xplore: true,
      wos: true,
      acm_dl: false
    }
  },
  {
    name: 'Neural Information Processing Systems',
    acronym: 'NeurIPS',
    publisher: 'NeurIPS Foundation',
    description: 'Premier interdisciplinary scientific conference covering foundational machine learning, neurobiology, theoretical deep learning, optimization, reinforcement learning, and AI safety.',
    website_url: 'https://neurips.cc',
    location: {
      city: 'Vancouver',
      country: 'Canada',
      is_hybrid: true
    },
    deadlines: [
      { type: 'Abstract Deadline', date: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000) },
      { type: 'Full Paper Submission', date: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000) }
    ],
    fees: {
      amount: 400,
      currency: 'USD',
      is_free: false
    },
    topics: ['Deep Learning Theory', 'Reinforcement Learning', 'AI Safety', 'Optimization'],
    contact_email: 'program@neurips.cc',
    verified_indexing: {
      scopus: true,
      wos: true,
      acm_dl: false,
      ieee_xplore: false
    }
  },
  {
    name: 'ACM Conference on Human Factors in Computing Systems',
    acronym: 'CHI',
    publisher: 'ACM',
    description: 'The premier international conference on Human-Computer Interaction, user experience research, conversational AI interfaces, and interactive systems.',
    website_url: 'https://chi2026.acm.org',
    location: {
      city: 'Yokohama',
      country: 'Japan',
      is_hybrid: true
    },
    deadlines: [
      { type: 'Round 1 Submission', date: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000) },
      { type: 'Camera-ready Notification', date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) }
    ],
    fees: {
      amount: 420,
      currency: 'USD',
      is_free: false
    },
    topics: ['Human-Computer Interaction', 'UX Engineering', 'Human-AI Collaboration'],
    contact_email: 'chi2026@acm.org',
    verified_indexing: {
      scopus: true,
      acm_dl: true,
      wos: true,
      ieee_xplore: false
    }
  },
  {
    name: 'International Conference on Medical Image Computing and Computer Assisted Intervention',
    acronym: 'MICCAI',
    publisher: 'Springer Nature',
    description: 'Top biomedical computing conference dedicated to medical image analysis, AI diagnosis, surgical robotics, and clinical translation.',
    website_url: 'https://miccai2026.org',
    location: {
      city: 'Marrakesh',
      country: 'Morocco',
      is_hybrid: false
    },
    deadlines: [
      { type: 'Full Paper Submission', date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }
    ],
    fees: {
      amount: 520,
      currency: 'EUR',
      is_free: false
    },
    topics: ['Medical Imaging', 'Healthcare AI', 'Biomedical Engineering'],
    contact_email: 'submissions@miccai2026.org',
    verified_indexing: {
      scopus: true,
      wos: true,
      acm_dl: false,
      ieee_xplore: false
    }
  },
  {
    name: 'WASET International Conference on Computer Science and Artificial Systems',
    acronym: 'ICCSAS',
    publisher: 'WASET (World Academy of Science, Engineering and Technology)',
    description: 'Universal multitrack conference offering instant peer review with fast-track acceptance in 48 hours and pay and publish options. All papers guaranteed publication in digital library.',
    website_url: 'https://waset.org/conference/iccsas-2026',
    location: {
      city: 'Dubai',
      country: 'United Arab Emirates',
      is_hybrid: false
    },
    deadlines: [
      { type: 'Rolling Submission', date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) }
    ],
    fees: {
      amount: 650,
      currency: 'EUR',
      is_free: false
    },
    topics: ['Computer Science', 'General Engineering'],
    contact_email: 'waset.submissions@gmail.com',
    verified_indexing: {
      scopus: false,
      wos: false,
      acm_dl: false,
      ieee_xplore: false
    }
  },
  {
    name: 'OMICS Global Summit on Advanced Deep Neural Networks and Data Analytics',
    acronym: 'GSADN',
    publisher: 'OMICS International',
    description: 'Commercial summit guaranteeing acceptance in 24 hours upon payment receipt. Open to all submission tracks with no formal double-blind review committee.',
    website_url: 'https://omicsonline.org/conferences/gsadn',
    location: {
      city: 'Rome',
      country: 'Italy',
      is_hybrid: false
    },
    deadlines: [
      { type: 'Immediate Review', date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) }
    ],
    fees: {
      amount: 999,
      currency: 'USD',
      is_free: false
    },
    topics: ['Neural Networks', 'Commercial AI'],
    contact_email: 'omics.editorial.team@yahoo.com',
    verified_indexing: {
      scopus: false,
      wos: false,
      acm_dl: false,
      ieee_xplore: false
    }
  }
];

const seedConferences = async () => {
  try {
    const count = await Conference.countDocuments();
    if (count > 0) {
      console.log(`ℹ️ Catalog already populated with ${count} conferences. Skipping seed.`);
      return;
    }

    console.log('🌱 Seeding initial academic conferences with Credibility Engine scoring...');
    
    const evaluatedList = initialConferences.map(item => {
      const evaluation = evaluateCredibility(item);
      return {
        ...item,
        trust_score: evaluation.trust_score,
        flags: evaluation.flags,
        evidence_log: evaluation.evidence_log
      };
    });

    await Conference.insertMany(evaluatedList);
    console.log(`✅ Successfully seeded ${evaluatedList.length} conferences with trust scores & evidence logs.`);
  } catch (error) {
    console.error('Error seeding conferences:', error);
  }
};

module.exports = { seedConferences, initialConferences };
