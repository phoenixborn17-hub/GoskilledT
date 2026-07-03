// Single source of truth for public FAQ content (shared by /faq and the homepage teaser).
// RULE: only REAL answers we can stand behind today. D-29: no income promises, no numbers on
// the affiliate answer. No "(DR-..." or internal decision codes in customer copy.
//
// FOUNDER CONTENT REQUIRED — these questions are intentionally NOT rendered until the founder
// confirms the answers. Do not invent answers (DR-027 "implementation never invents"):
//   • Which languages are the courses taught in? (Hinglish/Hindi/English mix — confirm exact)
//   • Do I get a certificate on completion? (product decision pending)
//   • When exactly is the next webinar? (scheduled per-webinar; /webinar shows the live date)

export interface FaqItem {
  q: string;
  a: string;
  /** true = also surfaced in the homepage top-FAQ teaser. */
  top?: boolean;
}

export interface FaqCategory {
  title: string;
  items: FaqItem[];
}

export const FAQ_CATEGORIES: FaqCategory[] = [
  {
    title: "Pricing & payments",
    items: [
      {
        q: "Do I pay GST on top of the price?",
        a: "No. The price you see is the final price — GST is already included. Koi hidden charge nahi.",
        top: true,
      },
      {
        q: "Which payment methods can I use?",
        a: "Payments are handled securely by Razorpay — UPI, debit and credit cards, net banking, and popular wallets all work.",
      },
      {
        q: "How does course choice work across the packages?",
        a: "Skill Builder includes one launch course of your choice. Career Booster includes both launch courses, plus future courses as they are released.",
        top: true,
      },
    ],
  },
  {
    title: "Refunds",
    items: [
      {
        q: "What is your refund policy?",
        a: "Full refund within 48 hours of purchase — no questions asked. After 48 hours, purchases are final.",
        top: true,
      },
      {
        q: "How do I request a refund?",
        a: "Contact us within 48 hours of your purchase from your registered mobile number, and we'll process the refund back to your original payment method.",
      },
    ],
  },
  {
    title: "Courses & access",
    items: [
      {
        q: "How soon do I get access after paying?",
        a: "Almost instantly. Your courses unlock within about 60 seconds of a successful payment.",
        top: true,
      },
      {
        q: "Can I learn on my phone?",
        a: "Yes. GoSkilled is built mobile-first — lessons are short and designed to be finished comfortably on a budget Android phone.",
      },
      {
        q: "Is there a free preview before I buy?",
        a: "Yes. Selected lessons are free to preview so you can see the teaching style before deciding.",
      },
    ],
  },
  {
    title: "Account & login",
    items: [
      {
        q: "How do I log in?",
        a: "Enter your mobile number and we'll send a one-time password (OTP) by SMS. Type it in to log in — there's no password to remember.",
      },
      {
        q: "I didn't receive my OTP — what do I do?",
        a: "Wait a few seconds and request it again. Make sure the 10-digit number is correct and that you have network coverage. If it still doesn't arrive, contact us and we'll help.",
      },
    ],
  },
  {
    title: "Earning with GoSkilled",
    items: [
      {
        q: "Can I earn by referring others?",
        a: "We're building a way for learners to share GoSkilled with others. It opens after our review is complete. Join the waitlist on the Earn page and you'll be first to know when it goes live.",
      },
    ],
  },
];

/** The homepage teaser shows the flagged `top` items (kept to the first four). */
export const TOP_FAQS: FaqItem[] = FAQ_CATEGORIES.flatMap((c) => c.items)
  .filter((i) => i.top)
  .slice(0, 4);
