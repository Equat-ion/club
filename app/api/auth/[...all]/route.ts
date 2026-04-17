import { auth } from "@/lib/auth/auth";
import { toNextJsHandler } from "better-auth/next-js";

const { GET, POST: authPost } = toNextJsHandler(auth);

function injectSuccessStatusIfMissing(xml: string) {
  if (xml.includes("StatusCode")) {
    return xml;
  }

  const responseTag = xml.match(/<([A-Za-z0-9_]+:)?Response\b[^>]*>/);
  if (!responseTag || responseTag.index === undefined) {
    return xml;
  }

  const prefix = responseTag[1] ?? "";
  const statusBlock = `<${prefix}Status><${prefix}StatusCode Value="urn:oasis:names:tc:SAML:2.0:status:Success"/></${prefix}Status>`;

  const insertAt = responseTag.index + responseTag[0].length;
  return `${xml.slice(0, insertAt)}${statusBlock}${xml.slice(insertAt)}`;
}

async function patchDummyIdpSamlResponse(req: Request) {
  if (process.env.NODE_ENV === "production") {
    return req;
  }

  const url = new URL(req.url);
  if (!url.pathname.includes("/api/auth/sso/saml2/sp/acs/")) {
    return req;
  }

  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.includes("application/x-www-form-urlencoded")) {
    return req;
  }

  const bodyText = await req.text();
  const params = new URLSearchParams(bodyText);
  const encodedResponse = params.get("SAMLResponse");

  if (!encodedResponse) {
    return req;
  }

  let decoded: string;
  try {
    decoded = Buffer.from(encodedResponse, "base64").toString("utf8");
  } catch {
    return req;
  }

  const patched = injectSuccessStatusIfMissing(decoded);
  if (patched === decoded) {
    return req;
  }

  params.set("SAMLResponse", Buffer.from(patched, "utf8").toString("base64"));

  const headers = new Headers(req.headers);
  headers.delete("content-length");

  return new Request(req.url, {
    method: req.method,
    headers,
    body: params.toString(),
  });
}

export { GET };

export async function POST(req: Request) {
  const patchedRequest = await patchDummyIdpSamlResponse(req);
  return authPost(patchedRequest);
}
