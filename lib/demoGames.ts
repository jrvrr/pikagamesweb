const demoGameIds = new Set([99901, 99902, 99903, 99904, 99905, 99906]);

export const isDemoGameId = (id: number | string) => demoGameIds.has(Number(id));
