import { NextRequest, NextResponse } from "next/server";
import signpdf from "@signpdf/signpdf";
import { pdflibAddPlaceholder } from "@signpdf/placeholder-pdf-lib";
import { P12Signer } from "@signpdf/signer-p12";
import forge from "node-forge";
import { PDFDocument } from "pdf-lib";

// Generate a self-signed P12 certificate on the fly.
// We cache it so we only do the expensive RSA generation once per server start.
let cachedP12: Buffer | null = null;

function generateP12(): Buffer {
  const keys = forge.pki.rsa.generateKeyPair(2048);
  const cert = forge.pki.createCertificate();
  cert.publicKey = keys.publicKey;
  cert.serialNumber = '01';
  cert.validity.notBefore = new Date();
  cert.validity.notAfter = new Date();
  cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);
  const attrs = [
    { name: 'commonName', value: 'PDF Editor Verified Signature' },
    { name: 'countryName', value: 'US' },
    { shortName: 'ST', value: 'New York' },
    { name: 'localityName', value: 'New York' },
    { name: 'organizationName', value: 'PDF Editor' },
    { shortName: 'OU', value: 'Security' }
  ];
  cert.setSubject(attrs);
  cert.setIssuer(attrs);
  cert.sign(keys.privateKey, forge.md.sha256.create());

  const p12Asn1 = forge.pkcs12.toPkcs12Asn1(keys.privateKey, cert, 'password', { generateLocalKeyId: true, algorithm: '3des' });
  const p12Der = forge.asn1.toDer(p12Asn1).getBytes();
  return Buffer.from(p12Der, 'binary');
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    
    if (!cachedP12) {
      cachedP12 = generateP12();
    }

    // Load the PDF with pdf-lib
    const pdfDoc = await PDFDocument.load(arrayBuffer);

    // Add placeholder for the signature
    pdflibAddPlaceholder({
      pdfDoc,
      reason: "Digitally signed by PDF Editor to ensure integrity.",
      contactInfo: "hello@pdfeditor.com",
      name: "PDF Editor User",
      location: "Internet",
    });

    // Save the PDF doc with the placeholder added
    const pdfBytesWithPlaceholder = await pdfDoc.save();
    const pdfBuffer = Buffer.from(pdfBytesWithPlaceholder);

    // Create a signer instance
    const signer = new P12Signer(cachedP12, { passphrase: "password" });

    // Sign the PDF
    const signedPdf = await signpdf.sign(pdfBuffer, signer);

    return new NextResponse(signedPdf as any, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="signed.pdf"',
      },
    });
  } catch (err: any) {
    console.error("Digital Signing Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
