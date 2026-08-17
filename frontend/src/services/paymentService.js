/**
 * Payment & Subscription Service
 * Agrawal Matrimony Platform
 */

import { api } from './api';

export async function getPlans() {
  return api.get('/plans');
}

export async function createOrder(planId, billingCycle = 'monthly') {
  return api.post('/payments/create-order', { planId, billingCycle });
}

export async function verifyPayment(paymentData) {
  return api.post('/payments/verify', paymentData);
}

export async function getCurrentSubscription() {
  return api.get('/subscriptions/current');
}

export async function getSubscriptionHistory() {
  return api.get('/subscriptions/history');
}

export async function cancelSubscription() {
  return api.post('/subscriptions/cancel');
}

export async function getPaymentHistory(page = 1, limit = 10) {
  return api.get(`/payments/history?page=${page}&limit=${limit}`);
}

export const paymentService = {
  getPlans,
  createOrder,
  verifyPayment,
  getCurrentSubscription,
  getSubscriptionHistory,
  cancelSubscription,
  getPaymentHistory
};

export default paymentService;
