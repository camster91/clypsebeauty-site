// Copy fixes applied at build time on top of the captured WordPress HTML in html/.
// The original pages shipped with theme placeholder text (Lorem ipsum, "Use this
// section to...", "A frequently asked question"). Instead of hand-editing the
// large captured files, src/pages/[...slug].astro runs applyContentFixes() on each
// page before rendering. Placeholder copy written 2026-11-11 from what the rest of
// the site says; Terms & Privacy NEEDS OWNER REVIEW before it is relied on.

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Replace each match of `pattern` (two capture groups around the text) with the
// next item of `items`, in page order.
function seq(html, pattern, items, label, file) {
  let i = 0;
  const out = html.replace(pattern, (m, a, b) => (i < items.length ? a + esc(items[i++]) + b : m));
  if (i !== items.length) console.warn(`[content-fixes] ${file}: ${label} matched ${i}/${items.length}`);
  return out;
}

const P_LOREM = /(<p>)(?:Use this section to answer commonly asked questions that could help your visitor\. )?Lorem ipsum[^<]*(<\/p>)/g;
const LIST_LOREM = /(<span class="elementor-icon-list-text">)Lorem ipsum dolor sit amet, consectet adipiscing[\s ]elitsed do eiusm(<\/span>)/g;
const LIST_TEMPLATE = /(<span class="elementor-icon-list-text">)Use this section to outline your (?:shipping|return) policy\.[^<]*(<\/span>)/g;
const SHORT_META = /Lorem ipsum dolor sit amet, consectet adipiscing(?: |\\u00a0| |&nbsp;)elit,sed do eiusm por incididunt ut labore et dolore magna aliqua\. Ut enim ad minim veniam, quis nostrud/g;
const FAQ_Q = /(<a class="elementor-toggle-title"[^>]*>)A frequently asked question(<\/a>)/g;
const FAQ_A = /(<p>)A detailed answer to provide information about your business, build trust with potential customers, or help the visitor with a problem they may be encountering(<\/p>)/g;

const HELP_DESC = 'Help and info for Clypse Beauty: how to order, shipping and delivery, returns, and answers to common questions.';
const TERMS_DESC = 'Clypse Beauty terms of use and privacy notice: how this site works, how orders are arranged, and how we use the details you send us.';
const SERUM_DESC = 'The Eclypse Serum by Clypse Beauty. Skincare made with you in mind, for every skin type and tone. Contact us to order.';

const HELP_INTROS = [
  'Clypse Beauty is a contact-to-order shop. There is no online checkout, so delivery is arranged with you directly.',
  "If something isn't right with your order, talk to us. We'll sort it out with you one-to-one.",
];
const HELP_SUBHEADS = ['Delivery options and costs', 'Damaged or missing orders', 'Opened products', 'Skin reactions'];
const HELP_PS = [
  "To order, send us a message through the Contact page or use the “Contact to order” button on any product. We'll reply by email to confirm availability, your total and how your order will reach you.",
  "Shipping options, costs and delivery times depend on where you are. We confirm them with you before you pay, and nothing ships until you've agreed to the details.",
  "If your order arrives damaged, or doesn't arrive when expected, contact us as soon as you can with your name, what you ordered and, if possible, a photo of the problem. We'll work with you to make it right.",
  "Return and refund requests are handled individually. Get in touch through the Contact page with your name, what you ordered and what went wrong, and we'll reply with next steps.",
  "For hygiene reasons, skincare that has been opened or used generally can't be returned or resold. Please still tell us about any problem — we'd rather hear about it than have you live with it.",
  "Everyone's skin is different. Patch test new products before full use and stop using any product that irritates your skin. If you have a skin condition or concerns, speak with a healthcare professional.",
  "Answers to the questions we hear most often. Can't find what you need? Send us a message through the Contact page and we'll get back to you.",
];
const FAQ = [
  ['How do I place an order?', "Choose a product in our shop and select “Contact to order”, or send us a message through the Contact page. We'll reply by email to confirm your order, the total and delivery."],
  ['Can I pay online?', 'Not at the moment. There is no online checkout on this site. Payment is arranged directly with you when we confirm your order.'],
  ['Who are Clypse Beauty products for?', 'Anyone that has skin. We celebrate every skin type and tone, with a dedicated focus on the needs of melanin-rich complexions.'],
  ['Where can I find product details and directions?', "Ask us through the Contact page and we'll send you the details for any product, including how to use it."],
  ['Is a product right for my skin?', "We're happy to talk through your skin goals. Our products and this website aren't a substitute for medical advice, so if you have a skin condition or are managing a hormonal imbalance, check with a healthcare professional first."],
  ["What if there's a problem with my order?", 'Contact us as soon as you can with your name and what went wrong. See Shipping & Delivery and Returns & Refunds above for more.'],
  ['How do I contact Clypse Beauty?', "Use the form on our Contact page. We'll reply by email to the address you give us."],
];

const TERMS_INTROS = [
  'By using clypsebeauty.com you agree to these terms. Please read them together with the privacy notice below.',
  'We collect as little personal information as we can and use it only to reply to you.',
];
const TERMS_SUBHEADS = ['Orders and payment', 'Content and liability', 'How your information is stored', 'Analytics, cookies and your choices'];
const TERMS_PS = [
  'This website shares information about Clypse Beauty and our products. Product details, images and prices are for information and may change without notice. Showing a product here is not an offer to sell: there is no online checkout, and an order is only confirmed once we agree the details with you directly.',
  "To order, contact us through the website. We'll confirm availability, price, delivery and payment with you before anything is charged or shipped. We may decline or cancel an order, for example if a product is unavailable.",
  "The text, images, logos and other content on this site belong to Clypse Beauty or are used with permission, and may not be copied or reused without our written consent. Information on this site is general and is not medical advice. We aim to keep it accurate but can't guarantee it is complete or up to date, and to the extent the law allows we are not liable for losses arising from use of this site. We may update these terms at any time; the version on this page applies.",
  'When you use our contact or newsletter forms we receive the details you enter, such as your name, email address and message. We use them only to reply to your enquiry and, if you place an order, to arrange it. If you sign up for our newsletter we use your email address only to send it, and you can ask to be removed at any time. We do not sell, rent or share your information for marketing.',
  'Form submissions are stored securely by our website provider so that we can reply to you, and are deleted after about 90 days unless we need them for an ongoing order. Our forms use Cloudflare Turnstile to check that submissions come from a real person.',
  'This site uses Google Analytics to understand, in aggregate, how visitors use it, plus the cookies needed for the site and its spam protection to work. You can block or delete cookies in your browser settings. To ask what information we hold about you, or to have it corrected or deleted, contact us through the Contact page.',
];

const SERUM_LOREM = 'Lorem ipsum dolor sit amet, te has solet postea. Voluptua quaestio dissentias has ex, no eum aliquid tibique petentium, agam mucius liberavisse eos idt.';
const SERUM_PLACEHOLDER = 'A description of the product. Use this space to explain the features and benefits of the product to help convert the visitor into a buyer.';
const SERUM_VISIBLE = 'The Eclypse Serum from Clypse Beauty, made with you in mind. Like everything we make, it is created for every skin type and tone, with a dedicated focus on the needs of melanin-rich complexions — no greenwashing, myths or fast fixes. Contact us to order, or to ask for full product details and directions.';

function policyPage(html, file, { intros, subheads, ps, desc }) {
  html = seq(html, P_LOREM, ps, 'paragraphs', file);
  html = seq(html, LIST_LOREM, subheads, 'sub-headings', file);
  html = seq(html, LIST_TEMPLATE, intros, 'intros', file);
  return html.replace(SHORT_META, () => desc);
}

const FIXES = {
  'help-info.html': (html, file) => {
    html = policyPage(html, file, { intros: HELP_INTROS, subheads: HELP_SUBHEADS, ps: HELP_PS, desc: HELP_DESC });
    html = seq(html, FAQ_Q, FAQ.map((f) => f[0]), 'faq questions', file);
    return seq(html, FAQ_A, FAQ.map((f) => f[1]), 'faq answers', file);
  },
  'terms-privacy.html': (html, file) =>
    policyPage(html, file, { intros: TERMS_INTROS, subheads: TERMS_SUBHEADS, ps: TERMS_PS, desc: TERMS_DESC }),
  'product__the-eclypse-serum.html': (html) =>
    html.split(SERUM_LOREM).join(SERUM_DESC).split(SERUM_PLACEHOLDER).join(esc(SERUM_VISIBLE)),
};

export function applyContentFixes(file, html) {
  const fix = FIXES[file];
  const out = fix ? fix(html, file) : html;
  if (/lorem ipsum/i.test(out)) console.warn(`[content-fixes] ${file}: placeholder "Lorem ipsum" text is still present`);
  return out;
}
