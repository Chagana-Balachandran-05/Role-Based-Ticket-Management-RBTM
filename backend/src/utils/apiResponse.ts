export const successResponse = <T>(data: T, message?: string) => {
  return {
    success: true,
    data,
    ...(message && { message }),
  };
};

export const errorResponse = (message: string, errors: unknown[] | null = null) => {
  return {
    success: false,
    message,
    ...(errors && { errors }),
  };
};
