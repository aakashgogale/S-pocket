/**
 * Dummy Redis Queue
 * Placeholder to allow backend to start.
 */
export const threatQueue = {
  add: async (name, data) => {
    console.log(`Redis Queue: Added job "${name}" with data:`, data);
    return { id: "dummy-job-id" };
  }
};
