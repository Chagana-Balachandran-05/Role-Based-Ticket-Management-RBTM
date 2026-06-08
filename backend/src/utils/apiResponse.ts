export const successResponse = (data: any, message?: string) => {
  return {
    success: true,
    data,
    ...(message && { message }),
  };
};

export const errorResponse = (message: string, errors: any[] | null = null) => {
  return {
    success: false,
    message,
    ...(errors && { errors }),
  };
};

