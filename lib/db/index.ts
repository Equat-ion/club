import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import dns from "node:dns";
import * as schema from "./schema";

// Mandatory for Node.js environments
const resolver = new dns.Resolver();
resolver.setServers(["8.8.8.8", "1.1.1.1"]);

const publicDnsLookup = (
  hostname: string,
  options: unknown,
  callback: (...args: unknown[]) => void
) => {
  const normalized =
    typeof options === "number"
      ? { family: options as 0 | 4 | 6, all: false }
      : (options as {
          family?: number | "IPv4" | "IPv6";
          all?: boolean;
        });

  const family =
    normalized.family === "IPv4"
      ? 4
      : normalized.family === "IPv6"
      ? 6
      : normalized.family ?? 0;
  const all = normalized.all ?? false;

  const finish = (addresses: string[]) => {
    if (all) {
      const records = addresses.map((address) => ({
        address,
        family: address.includes(":") ? 6 : 4,
      }));
      callback(null, records);
      return;
    }

    const address = addresses[0];
    callback(null, address, address.includes(":") ? 6 : 4);
};

  const fail = (err: Error) => {
    if (all) {
      callback(err, []);
      return;
    }
    callback(err, "", 0);
  };

  if (family === 4) {
    resolver.resolve4(hostname, (err, addresses) => {
      if (err || addresses.length === 0) {
        fail(err ?? new Error(`Unable to resolve ${hostname} (A)`));
        return;
      }
      finish(addresses);
    });
    return;
  }

  if (family === 6) {
    resolver.resolve6(hostname, (err, addresses) => {
      if (err || addresses.length === 0) {
        fail(err ?? new Error(`Unable to resolve ${hostname} (AAAA)`));
        return;
      }
      finish(addresses);
    });
    return;
  }

  resolver.resolve4(hostname, (err4, addresses4) => {
    if (!err4 && addresses4.length > 0) {
      finish(addresses4);
      return;
    }

    resolver.resolve6(hostname, (err6, addresses6) => {
      if (!err6 && addresses6.length > 0) {
        finish(addresses6);
        return;
      }

      fail(err4 ?? err6 ?? new Error(`Unable to resolve ${hostname}`));
    });
  });
}

class NeonWebSocket extends ws {
  constructor(address: string | URL, protocols?: string | string[]) {
    super(address, protocols, { lookup: publicDnsLookup as never });
  }
}

neonConfig.webSocketConstructor = NeonWebSocket;

const sql = new Pool({ connectionString: process.env.DATABASE_URL! });

export const db = drizzle(sql, { schema });
