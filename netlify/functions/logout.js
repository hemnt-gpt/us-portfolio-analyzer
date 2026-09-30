import { getSession, json, sessions } from './_auth.js';
export default async (req) => {
  const s = await getSession(req);
  if (s) await sessions().delete(s.token).catch(()=>{});
  return json({ok:true});
};
