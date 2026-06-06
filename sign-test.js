import signpdf from "@signpdf/signpdf";
import { plainAddPlaceholder } from "@signpdf/placeholder-plain";
import { P12Signer } from "@signpdf/signer-p12";
import forge from "node-forge";

console.log("signpdf:", typeof signpdf.sign);
console.log("plainAddPlaceholder:", typeof plainAddPlaceholder);
console.log("P12Signer:", typeof P12Signer);
