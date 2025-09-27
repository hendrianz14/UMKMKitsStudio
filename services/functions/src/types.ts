import { z } from 'zod';

export const AiJobRequestSchema = z.object({
  kind: z.enum(['caption', 'img_enhance', 'img2img', 'img2video']),
  input: z.record(z.any()),
  useUserGeminiKey: z.boolean().optional()
});

export const AiWebhookSchema = z.object({
  jobId: z.string().min(1),
  status: z.enum(['queued', 'running', 'succeeded', 'failed']),
  resultUrl: z.string().url().optional(),
  meta: z.record(z.any()).optional(),
  error: z.string().optional()
});

export const PaymentCreateSchema = z.object({
  amount: z.number().positive(),
  type: z.enum(['topup', 'subscription'])
});

export const PaymentWebhookSchema = z.object({
  order_id: z.string(),
  status_code: z.string(),
  gross_amount: z.string(),
  signature_key: z.string(),
  transaction_status: z.string(),
  fraud_status: z.string().optional(),
  settlement_time: z.string().optional(),
  custom_field1: z.string().optional()
});

export type AiJobRequest = z.infer<typeof AiJobRequestSchema>;
export type AiWebhookPayload = z.infer<typeof AiWebhookSchema>;
export type PaymentCreatePayload = z.infer<typeof PaymentCreateSchema>;
export type PaymentWebhookPayload = z.infer<typeof PaymentWebhookSchema>;
