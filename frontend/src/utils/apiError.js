export const getApiError = (error, fallback = "Something went wrong") => {
    const data = error.response?.data;

    if (data?.errors?.length) {
        return data.errors
            .map((item) => item.msg)
            .filter(Boolean)
            .join("\n");
    }

    if (data?.message) {
        return data.message;
    }

    if (data?.error) {
        return data.error;
    }

    return fallback;
};