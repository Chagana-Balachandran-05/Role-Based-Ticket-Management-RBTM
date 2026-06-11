export const config = {
  rateLimit: {
    auth: {
      windowMs: process.env.NODE_ENV === 'development' ? 5 * 60 * 1000 : 15 * 60 * 1000,
      max: process.env.NODE_ENV === 'development' ? 100 : 10,
      message: process.env.NODE_ENV === 'development'
        ? 'Too many authentication attempts, please try again after 5 minutes'
        : 'Too many authentication attempts, please try again after 15 minutes',
    },
    general: {
      windowMs: 15 * 60 * 1000,
      max: process.env.NODE_ENV === 'development' ? 500 : 100,
      message: 'Too many requests from this IP, please try again after 15 minutes',
    },
  },
};
