import crypto from "crypto";

const ALGORITHM = "aes-256-cbc";

/**
 * Decrypt an AES-256-CBC encrypted password sent from the client.
 * @param {string} encryptedBase64 - Base64-encoded cipher text
 * @param {string} ivHex           - Hex-encoded IV
 * @returns {string}               - Decrypted plaintext
 */
export const decryptAES = (encryptedBase64, ivHex) => {
  const key = Buffer.from(process.env.AES_SECRET_KEY, "hex");
  const iv = Buffer.from(ivHex, "hex");
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  let decrypted = decipher.update(encryptedBase64, "base64", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
};
