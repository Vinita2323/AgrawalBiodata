/**
 * KYC Verification Service
 * Agrawal Matrimony Platform
 */

import { api } from './api';

export async function submitVerification(formDataOrObject) {
  if (formDataOrObject instanceof FormData) {
    return api.upload('/verification/submit', formDataOrObject);
  }
  return api.post('/verification/submit', formDataOrObject);
}

export async function getVerificationStatus() {
  return api.get('/verification/status');
}

export async function getMySubmissions() {
  return api.get('/verification/my-submissions');
}

export const verificationService = {
  submitVerification,
  getVerificationStatus,
  getMySubmissions
};

export default verificationService;
