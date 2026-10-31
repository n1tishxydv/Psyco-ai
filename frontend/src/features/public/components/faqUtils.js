/**
 * Pure filter utility for FAQ items.
 * Evaluates category matching and case-insensitive keyword search across question and answer.
 *
 * @param {Array<{id: string, category?: string, question: string, answer: string}>} faqs
 * @param {{category?: string, query?: string}} options
 * @returns {Array} Filtered list of FAQs
 */
export function filterFaqs(faqs = [], { category = 'All', query = '' } = {}) {
  if (!Array.isArray(faqs)) return [];
  const normalizedCategory = category || 'All';
  const trimmedQuery = typeof query === 'string' ? query.trim().toLowerCase() : '';

  return faqs.filter((faq) => {
    // 1. Category filter
    const matchesCategory =
      normalizedCategory === 'All' || (faq.category || 'General') === normalizedCategory;
    if (!matchesCategory) return false;

    // 2. Keyword search
    if (!trimmedQuery) return true;

    const q = (faq.question || '').toLowerCase();
    const a = (faq.answer || '').toLowerCase();
    return q.includes(trimmedQuery) || a.includes(trimmedQuery);
  });
}
