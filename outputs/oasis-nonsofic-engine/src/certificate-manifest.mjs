import { pathToFileURL } from "node:url";
import { ExactNonSoficGroupOracle } from "./group-oracle.mjs";
import { compileExpansionLefCertificate } from "./obstruction-certificate.mjs";

export function buildCertificateManifest() {
  const groupOracle = new ExactNonSoficGroupOracle();
  return compileExpansionLefCertificate(groupOracle).toJSON();
}

if (
  typeof process !== "undefined" &&
  Array.isArray(process.argv) &&
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  console.log(JSON.stringify(buildCertificateManifest(), null, 2));
}
