import { useState, useCallback } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

/**
 * Custom hook for Razorpay payment integration.
 * Handles order creation, Checkout modal, and payment verification.
 */
export const useRazorpayPayment = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null); // null | 'success' | 'failed'

  const getToken = () => localStorage.getItem("accessToken");
  const getUser = () => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return {};
    }
  };

  /**
   * Initiate payment for a booking.
   * Opens Razorpay Checkout and handles the full payment flow.
   *
   * @param {Object} params
   * @param {string} params.bookingId - Booking ID
   * @param {string} params.razorpayOrderId - Razorpay order ID (from booking creation)
   * @param {string} params.razorpayKeyId - Razorpay key ID
   * @param {number} params.amount - Amount in paise
   * @param {string} [params.description] - Payment description
   * @returns {Promise<Object>} Payment result
   */
  const initiatePayment = useCallback(
    ({ bookingId, razorpayOrderId, razorpayKeyId, amount, description }) => {
      return new Promise((resolve, reject) => {
        setLoading(true);
        setError(null);
        setPaymentStatus(null);

        const user = getUser();

        if (!window.Razorpay) {
          const err = "Razorpay SDK not loaded. Please refresh the page.";
          setError(err);
          setLoading(false);
          reject(new Error(err));
          return;
        }

        const options = {
          key: razorpayKeyId || import.meta.env.VITE_RAZORPAY_KEY_ID,
          amount,
          currency: "INR",
          name: "RevibeFit",
          description: description || "Lab Test Booking Payment",
          order_id: razorpayOrderId,
          prefill: {
            name: user?.name || "",
            email: user?.email || "",
            contact: user?.phone || "",
          },
          theme: {
            color: "#2563eb",
          },
          handler: async (response) => {
            // Payment success callback
            try {
              const verifyRes = await fetch(`${API_URL}/api/payments/verify`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${getToken()}`,
                },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  bookingId,
                }),
              });

              const data = await verifyRes.json();
              if (data.success) {
                setPaymentStatus("success");
                setLoading(false);
                resolve(data.data);
              } else {
                throw new Error(data.message || "Payment verification failed");
              }
            } catch (verifyErr) {
              setError(verifyErr.message);
              setPaymentStatus("failed");
              setLoading(false);
              reject(verifyErr);
            }
          },
          modal: {
            ondismiss: () => {
              setError("Payment cancelled by user");
              setPaymentStatus("failed");
              setLoading(false);
              reject(new Error("Payment cancelled"));
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on("payment.failed", (response) => {
          setError(
            response.error?.description || "Payment failed. Please try again."
          );
          setPaymentStatus("failed");
          setLoading(false);
          reject(new Error(response.error?.description || "Payment failed"));
        });
        rzp.open();
      });
    },
    []
  );

  /**
   * Create a payment order for a booking (if not already created during booking).
   *
   * @param {string} bookingId
   * @returns {Promise<Object>} { razorpayOrderId, razorpayKeyId, amount, currency }
   */
  const createOrder = useCallback(async (bookingId) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/api/payments/create-order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ bookingId }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || "Failed to create payment order");
      }

      setLoading(false);
      return data.data;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      throw err;
    }
  }, []);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setPaymentStatus(null);
  }, []);

  return {
    initiatePayment,
    createOrder,
    reset,
    loading,
    error,
    paymentStatus,
  };
};

export default useRazorpayPayment;
