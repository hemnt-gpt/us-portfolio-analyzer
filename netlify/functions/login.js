import { createSession, json, normalizeUsername, users, verifyPassword } from './_auth.js';
export default async (req) => {
  if (req.method !== 'POST') return json({error:'Method not allowed'},405);
  try {
    const { username:raw, password } = await req.json();
    const username = normalizeUsername(raw);
    const user = await users().get(username, {type:'json', consistency:'strong'});
    if (!user || !verifyPassword(String(password||''), user.salt, user.hash)) return json({error:'Incorrect username or password'},401);
    const session = await createSession(username);
    return json({ok:true,username,...session});
  } catch { return json({error:'Login failed'},500); }
};
