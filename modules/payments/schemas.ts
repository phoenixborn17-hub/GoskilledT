// Zod boundaries (Golden Rule 4) — checkout + webhook payloads.
import { z } from "zod";

/** Indian mobile: 10 digits starting 6-9 (store E.164 as +91XXXXXXXXXX). */
export const phoneSchema = z
  .string()
  .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number");

export const checkoutStartSchema = z
  .object({
    packageSlug: z.enum(["skill-builder", "career-booster"]),
    chosenCourseId: z.string().min(1).optional(), // required for skill-builder — refined below
    phone: phoneSchema,
    referralCode: z.string().trim().toUpperCase().optional(),
  })
  .superRefine((v, ctx) => {
    if (v.packageSlug === "skill-builder" && !v.chosenCourseId)
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["chosenCourseId"],
        message: "Choose your course (Skill Builder includes 1 course)",
      });
  });

export const paymentCallbackSchema = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().regex(/^[0-9a-f]+$/i),
});

/** Minimal shape we consume from Razorpay webhooks (verify signature on RAW body first). */
export const webhookEnvelopeSchema = z.object({
  event: z.string(),
  payload: z.object({
    payment: z
      .object({
        entity: z.object({
          id: z.string(),
          order_id: z.string(),
          amount: z.number().int(),
          status: z.string(),
        }),
      })
      .optional(),
    refund: z
      .object({
        entity: z.object({
          id: z.string(),
          payment_id: z.string(),
          amount: z.number().int(),
        }),
      })
      .optional(),
  }),
});

export const withdrawalRequestSchema = z.object({
  amountInPaise: z.number().int().positive(),
});
