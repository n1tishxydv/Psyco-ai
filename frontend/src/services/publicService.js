import { apiRequest } from './apiClient';

export const publicService = {
  /**
   * Fetches published FAQs from the backend
   */
  getPublishedFaqs: async () => {
    return await apiRequest('/public/faqs');
  },

  /**
   * Submits a public contact inquiry
   */
  submitContactForm: async (formData) => {
    return await apiRequest('/public/contact', {
      method: 'POST',
      body: JSON.stringify(formData),
    });
  },

  /**
   * Submits a question for public FAQ consideration
   */
  submitFaqQuestion: async (questionData) => {
    return await apiRequest('/public/faq-submissions', {
      method: 'POST',
      body: JSON.stringify(questionData),
    });
  },
};
