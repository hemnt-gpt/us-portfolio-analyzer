import { DEFAULT_PORTFOLIO, createSession, hashPassword, json, normalizeUsername, portfolios, users, validUsername } from './_auth.js';
export default async (req) => {
  if (req.method !== 'POST') return json({error:'Method not allowed'},405);
  try {
    const { username:raw, password } = await req.json();
    const username = normalizeUsername(raw);
    if (!validUsername(username)) return json({error:'Username must be 3–32 characters using letters, numbers, . _ or -'},400);
    if (typeof password !== 'string' || password.length < 8 || password.length > 128) return json({error:'Password must be 8–128 characters'},400);
    const store = users();
    if (await store.get(username, {type:'json', consistency:'strong'})) return json({error:'Username is already registered'},409);
    const { salt, hash } = hashPassword(password);
    await store.setJSON(username, { username, salt, hash, createdAt:new Date().toISOString() });
    await portfolios().setJSON(username, { totalCapitalLakh:100, holdings:DEFAULT_PORTFOLIO, updatedAt:new Date().toISOString() });
    const session = await createSession(username);
    return json({ ok:true, username, ...session });
  } catch (e) { return json({error:'Could not create account'},500); }
};
