/* DFCH Bond30 test engine — APK 3.16.1 candidate data; eligibility is provisional. */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DFCHBond30Engine = api;
})(typeof window !== "undefined" ? window : null, function () {
  "use strict";
  const asId = (value) => Number.isSafeInteger(Number(value)) && Number(value) > 0 ? Number(value) : null;
  function normalizePool(records) {
    if (!Array.isArray(records)) return [];
    return records.filter((record) => record && Number(record.chooseGroupType) === 1)
      .map((record) => ({
        abilityId: asId(record.abilityId),
        weight: Number(record.weight),
        exclusiveGroupId: Number(record.exclusiveGroupIdRaw) || 0,
        chooseGroupType: 1
      }))
      .filter((record) => record.abilityId && Number.isFinite(record.weight) && record.weight > 0);
  }
  function eligible(records, options) {
    const opts = options || {};
    const excluded = new Set((opts.excludedIds || []).map(asId).filter(Boolean));
    const blockedGroups = new Set((opts.blockedGroups || []).map(Number).filter((value) => Number.isInteger(value) && value > 0));
    const seen = new Set();
    return normalizePool(records).filter((record) => {
      if (seen.has(record.abilityId)) return false;
      seen.add(record.abilityId);
      if (excluded.has(record.abilityId)) return false;
      return !(opts.applyGroupExclusions && record.exclusiveGroupId > 0 && blockedGroups.has(record.exclusiveGroupId));
    });
  }
  function withRates(records) {
    const total = records.reduce((value, record) => value + record.weight, 0);
    return records.map((record) => ({ ...record, percent: total > 0 ? record.weight / total * 100 : 0 }));
  }
  function choose(records, random) {
    const total = records.reduce((value, record) => value + record.weight, 0);
    if (!(total > 0)) return null;
    const roll = (typeof random === "function" ? random() : Math.random()) * total;
    if (!(roll >= 0 && roll < total)) throw new RangeError("Random value must be in [0,1)");
    let sum = 0;
    for (const record of records) {
      sum += record.weight;
      if (roll < sum) return record;
    }
    return records[records.length - 1];
  }
  function parseIdList(value) {
    return [...new Set(String(value || "").split(/[\\s,，、;；]+/).map(asId).filter(Boolean))];
  }
  return Object.freeze({ normalizePool, eligible, withRates, choose, parseIdList });
});
