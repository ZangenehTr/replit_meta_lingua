import { db } from '../db.js';
import { paymentGatewayConfigs } from '../../shared/schema.js';
import { eq } from 'drizzle-orm';
import { encryptCredential, decryptCredential, isCredentialSet } from '../utils/gateway-crypto.js';
import { storage } from '../storage.js';

export type GatewayName = 'shetab' | 'zarinpal' | 'idpay' | 'zibal' | 'mellat';

export interface GatewayCredentials {
  merchantId?: string;
  apiKey?: string;
  terminalId?: string;
  username?: string;
  password?: string;
}

export interface GatewaySettings {
  gatewayName: GatewayName;
  isEnabled: boolean;
  sandboxMode: boolean;
  credentials: GatewayCredentials;
  hasCredentials: boolean;
}

export interface ActiveGatewayPreference {
  activeGateway: GatewayName;
}

async function getOrCreateRow(gatewayName: GatewayName) {
  const [row] = await db.select().from(paymentGatewayConfigs).where(eq(paymentGatewayConfigs.gatewayName, gatewayName));
  if (row) return row;
  const [created] = await db.insert(paymentGatewayConfigs).values({ gatewayName }).returning();
  return created;
}

export async function getGatewaySettings(gatewayName: GatewayName): Promise<GatewaySettings> {
  const row = await getOrCreateRow(gatewayName);
  const creds = (row.encryptedCredentials ?? {}) as Record<string, string>;
  const credentials: GatewayCredentials = {
    merchantId: creds.merchantId ? decryptCredential(creds.merchantId) : undefined,
    apiKey: creds.apiKey ? decryptCredential(creds.apiKey) : undefined,
    terminalId: creds.terminalId ? decryptCredential(creds.terminalId) : undefined,
    username: creds.username ? decryptCredential(creds.username) : undefined,
    password: creds.password ? decryptCredential(creds.password) : undefined,
  };
  const hasCredentials = Object.values(credentials).some(v => !!v);
  return {
    gatewayName,
    isEnabled: row.isEnabled,
    sandboxMode: row.sandboxMode,
    credentials,
    hasCredentials,
  };
}

export async function getAllGatewaySettings(): Promise<Record<GatewayName, GatewaySettings>> {
  const gateways: GatewayName[] = ['shetab', 'zarinpal', 'idpay', 'zibal', 'mellat'];
  const results = await Promise.all(gateways.map(async g => [g, await getGatewaySettings(g)] as const));
  return Object.fromEntries(results) as Record<GatewayName, GatewaySettings>;
}

export async function updateGatewaySettings(
  gatewayName: GatewayName,
  updates: {
    isEnabled?: boolean;
    sandboxMode?: boolean;
    credentials?: Partial<GatewayCredentials>;
  }
): Promise<void> {
  const row = await getOrCreateRow(gatewayName);
  const existingCreds = (row.encryptedCredentials ?? {}) as Record<string, string>;
  const newCreds: Record<string, string> = { ...existingCreds };

  if (updates.credentials) {
    const { merchantId, apiKey, terminalId, username, password } = updates.credentials;
    if (merchantId) newCreds.merchantId = encryptCredential(merchantId);
    if (apiKey) newCreds.apiKey = encryptCredential(apiKey);
    if (terminalId) newCreds.terminalId = encryptCredential(terminalId);
    if (username) newCreds.username = encryptCredential(username);
    if (password) newCreds.password = encryptCredential(password);
  }

  await db.update(paymentGatewayConfigs)
    .set({
      isEnabled: updates.isEnabled ?? row.isEnabled,
      sandboxMode: updates.sandboxMode ?? row.sandboxMode,
      encryptedCredentials: newCreds,
      updatedAt: new Date(),
    })
    .where(eq(paymentGatewayConfigs.gatewayName, gatewayName));
}

export async function getActiveGatewayName(): Promise<GatewayName> {
  const settings = ((await storage.getAdminSettings()) ?? {}) as Record<string, unknown>;
  return (settings.activePaymentGateway as GatewayName) ?? 'shetab';
}

export async function setActiveGatewayName(gatewayName: GatewayName): Promise<void> {
  await storage.updateAdminSettings({ activePaymentGateway: gatewayName });
}
