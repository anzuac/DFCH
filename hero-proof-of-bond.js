/* Proof of Bond eligibility based on the presence of EvReceiveReward (ID 301005300, quantity 1) in each six-star hero's chapter-5 affection story. */
/* Verified against all 31 chapter-5 story objects in 3.18.0 sharedassets1.assets; 14 yes, 17 no. */
/* This marks a chapter reward, not an unconditional reward from recruiting the hero. */
window.DFCHHeroProofOfBond = Object.freeze({
  source: '3.18.0 Unity story-kizuna chapter-5 EvReceiveReward (cross-validated with original 23-hero 2026-10-17 chart)',
  yes: Object.freeze([13,16,19,21,27,32,33,34,39,45,46,51,52,58]),
  no: Object.freeze([22,23,43,44,47,53,54,59,60,70,71,72,73,74,75,80,81])
});
