export const logActivity = async (payload) => {
  const activity = {
    ...payload,
    timestamp: new Date().toISOString(),
  };
  if (globalThis.__activityLogStore) {
    globalThis.__activityLogStore.push(activity);
  }
  return activity;
};
