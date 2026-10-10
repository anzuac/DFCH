(() => {
  // State and cap rules traced from official ARM64 3.16.0. A day is supplied
  // by the caller; this module does not invent a server reset timezone.
  const f = Math.fround;
  const count = n => {
    if (!Number.isSafeInteger(n) || n < 0) throw new RangeError('持有量必須為非負整數');
    return n;
  };
  const diamond = row => Math.floor(row.rewardId / 1000000) === 102;
  const ordinaryDiamond = row => diamond(row) && row.rarityType < 5;
  function begin(data, saved = {}) {
    const daily = count(saved.daily ?? 0);
    const owned = Object.fromEntries(Object.entries(saved.owned ?? {}).map(([id,n]) => [id,count(n)]));
    const flags = [...new Set((saved.flags ?? []).map(count))];
    return {daily, limitReached: data.master.dailyDiamondLimit > 0 && daily >= data.master.dailyDiamondLimit,
      owned, pending: {}, flags, pendingFlags: []};
  }
  function artifactFull(row, state, data) {
    const master = data.rewardMasters.find(m => m.rewardId === row.rewardId && m.sourceTable === 'ArtifactTable');
    return !!master && (state.owned[row.rewardId] ?? 0) + (state.pending[row.rewardId] ?? 0) >= master.maxLevel;
  }
  function pool(rows, state, data, suppressOrdinary = true) {
    return rows.map(row => ({...row, effectiveWeight: artifactFull(row,state,data) ||
      suppressOrdinary && state.limitReached && ordinaryDiamond(row) ? 0 : f(row.weight)}));
  }
  function fallbackGroups(data, affectionRatio = 1) {
    if (!Number.isFinite(affectionRatio) || affectionRatio < 1) throw new RangeError('羈絆倍率無效');
    return data.master.basicItemDropSampleGroupIds.flatMap((id,i) => {
      const rows = data.dropSamples.filter(r => r.dropItemSampleGroupId === id);
      const weight = f(data.master.basicItemDropWeights[i]);
      // Official fallback skips any group containing diamond, including God.
      if (id < 1 || weight <= 0 || rows.some(diamond)) return [];
      const affection = rows.some(r => r.weight > 0 && Math.floor(r.rewardId/1000000) === 305);
      return [{id, weight: affection ? f(weight*f(affectionRatio)) : weight}];
    });
  }
  function distribution(groupIds, state, data, affectionRatio = 1) {
    const positive = groupIds.filter(id => id > 0);
    const basic = positive.length > 0 && positive.every(id => data.master.basicItemDropSampleGroupIds.some(
      (g,i) => g === id && data.master.basicItemDropWeights[i] > 0));
    const rows = positive.flatMap(id => data.dropSamples.filter(r => r.dropItemSampleGroupId === id));
    const first = pool(rows,state,data,!basic);
    const total = first.reduce((s,r) => s+r.effectiveWeight,0);
    if (!total) return {rows: [], noDropProbability: 1, basic};
    const result = new Map();
    let missing = 0;
    const add = (row,p) => result.set(row.dropItemSampleId,{...row, probability: (result.get(row.dropItemSampleId)?.probability ?? 0)+p});
    for (const row of first) {
      const p = row.effectiveWeight/total;
      if (!p) continue;
      if (!(basic && state.limitReached && ordinaryDiamond(row))) {add(row,p); continue;}
      const groups = fallbackGroups(data,affectionRatio);
      const groupTotal = groups.reduce((s,g) => s+g.weight,0);
      if (!groupTotal) {missing += p; continue;}
      for (const group of groups) {
        const candidates = pool(data.dropSamples.filter(r => r.dropItemSampleGroupId === group.id),state,data);
        const sum = candidates.reduce((s,r) => s+r.effectiveWeight,0);
        if (!sum) {missing += p*group.weight/groupTotal; continue;}
        for (const candidate of candidates) if(candidate.effectiveWeight > 0)
          add(candidate,p*group.weight/groupTotal*candidate.effectiveWeight/sum);
      }
    }
    return {rows: [...result.values()], noDropProbability: missing, basic};
  }
  function register(state, row, quantity, data) {
    count(quantity);
    const next = {...state, pending: {...state.pending}, pendingFlags: [...state.pendingFlags]};
    next.pending[row.rewardId] = count((next.pending[row.rewardId] ?? 0)+quantity);
    if (ordinaryDiamond(row) && data.master.dailyDiamondLimit > 0) next.daily = count(state.daily+quantity);
    // limitReached remains the expedition-start snapshot. No clamp to 500.
    return next;
  }
  function unlock(state, flag) {
    if (flag === -1) return state;
    count(flag);
    if (state.flags.includes(flag) || state.pendingFlags.includes(flag)) return state;
    return {...state, pendingFlags: [...state.pendingFlags,flag]};
  }
  function flagPool(rows, state) {
    return rows.filter(r => r.flagType === -1 || !(state.flags.includes(r.flagType) || state.pendingFlags.includes(r.flagType)));
  }
  function commit(state) {
    const owned = {...state.owned};
    for (const [id,n] of Object.entries(state.pending)) owned[id] = count((owned[id] ?? 0)+n);
    return {daily:state.daily,owned,flags:[...new Set([...state.flags,...state.pendingFlags])]};
  }
  window.DFCHDropState = Object.freeze({begin,ordinaryDiamond,artifactFull,pool,fallbackGroups,distribution,register,unlock,flagPool,commit});
})();
