import dotenv from "dotenv";

dotenv.config();

const verifyPayment = async (paymentId) => {
  const baseUrl = `https://${process.env.DODO_PAYMENTS_ENV}.dodopayments.com/payments`;
  const bearerToken = process.env.DODO_PAYMENTS_BEARER_TOKEN;

  try {
    const response = await fetch(`${baseUrl}/${paymentId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${bearerToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const payment = await response.json();

    if (payment.status === "succeeded") {
      return { success: true, payment };
    } else {
      return { success: false, payment };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export { verifyPayment };
