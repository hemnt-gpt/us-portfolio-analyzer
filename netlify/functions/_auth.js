import { getStore } from '@netlify/blobs';
import crypto from 'node:crypto';

const users = () => getStore({ name: 'portfolio-users-v2', consistency: 'strong' });
const sessions = () => getStore({ name: 'portfolio-sessions-v2', consistency: 'strong' });
const portfolios = () => getStore({ name: 'portfolio-data-v2', consistency: 'strong' });

export const DEFAULT_PORTFOLIO = [
  ['AEHR','Aehr Test Systems',100.42,128.00],['ALAB','Astera Labs',351.31,389.95],
  ['AMD','Advanced Micro Devices',619.00,618.51],['AMZN','Amazon',246.74,329.54],
  ['ANET','Arista Networks',202.60,241.93],['ASML','ASML Holding',1820.21,2116.00],
  ['AVGO','Broadcom',356.78,531.85],['CLS','Celestica',362.88,471.20],
  ['COHR','Coherent',296.00,415.36],['CRDO','Credo Technology',195.30,280.10],
  ['FIX','Comfort Systems USA',1650.56,2197.00],['FLEX','Flex',113.08,160.50],
  ['GEV','GE Vernova',957.11,1237.00],['GOOG','Alphabet',336.00,422.34],
  ['INOD','Innodata',67.23,122.75],['IONQ','IonQ',44.19,67.14],
  ['LITE','Lumentum',978.90,1149.00],['LRCX','Lam Research',321.78,373.77],
  ['META','Meta Platforms',718.80,761.01],['MRVL','Marvell Technology',262.50,289.11],
  ['MSFT','Microsoft',509.09,576.40],['MU','Micron Technology',1068.41,1521.00],
  ['NBIS','Nebius Group',241.50,276.26],['NVDA','NVIDIA',230.06,327.70],
  ['PLTR','Palantir Technologies',186.15,195.57],['SKHY','SK hynix',187.30,252.21],
  ['SMH','VanEck Semiconductor ETF',612.68,null],['SNDK','SanDisk',1713.00,2137.00],
  ['STX','Seagate Technology',904.00,1125.00],['TER','Teradyne',404.53,446.47],
  ['TSM','Taiwan Semiconductor Manufacturing',456.93,552.26],['VRT','Vertiv',248.72,338.22]
].map(([ticker,name,currentPrice,targetPrice]) => ({
  ticker,name,currentPrice,targetPrice,allocationLakh:3.125,dataAsOf:'2026-09-29',source:'Default analyst snapshot'
}));

export function json(data, status=200) {
  return new Response(JSON.stringify(data), { status, headers: { 'content-type':'application/json; charset=utf-8', 'cache-control':'no-store' } });
}
export function normalizeUsername(value) {
  return String(value||'').trim().toLowerCase();
}
export function validUsername(value) { return /^[a-z0-9_.-]{3,32}$/.test(value); }
export function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { salt, hash };
}
export function verifyPassword(password, salt, expectedHex) {
  try {
    const actual = crypto.scryptSync(password, salt, 64);
    const expected = Buffer.from(expectedHex, 'hex');
    return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
  } catch { return false; }
}
export async function createSession(username) {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + 30*24*60*60*1000;
  await sessions().setJSON(token, { username, expiresAt });
  return { token, expiresAt };
}
export async function getSession(req) {
  const auth = req.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  if (!token) return null;
  const session = await sessions().get(token, { type:'json', consistency:'strong' });
  if (!session || !session.username || session.expiresAt < Date.now()) {
    if (token) await sessions().delete(token).catch(()=>{});
    return null;
  }
  return { ...session, token };
}
export { users, sessions, portfolios };
