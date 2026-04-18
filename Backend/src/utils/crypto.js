import crypto from 'crypto';

const getKey = () => Buffer.from(process.env.ENCRYPTION_KEY || 'default32bytekeyforlocaldevonlyneveruseprod', 'hex');

export const encryptFile = (buffer) => {
  const key = getKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipher('aes-256-gcm', key);
  cipher.setAAD(Buffer.from('secure-data-platform-v1'));

  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    iv: iv.toString('hex'),
    data: encrypted.toString('hex'),
    tag: authTag.toString('hex')
  };
};

export const decryptFile = ({ iv, data, tag }) => {
  const key = getKey();
  const decipher = crypto.createDecipher('aes-256-gcm', key);
  decipher.setAAD(Buffer.from('secure-data-platform-v1'));
  decipher.setAuthTag(Buffer.from(tag, 'hex'));

  const decrypted = Buffer.concat([decipher.update(Buffer.from(data, 'hex')), decipher.final()]);
  return decrypted;
};