import { config } from "dotenv";
import express from "express";
import axios from "axios";
import Order from "../models/orders.js"; // Ensure your Order model is imported
import crypto from 'crypto';

config();

const router = express.Router();

async function getAuthToken() {
  const rawApiKey = process.env.PAYMOB_API_KEY || "";
  const apiKey = rawApiKey.trim();
  const payload = { api_key: apiKey };

  try {
    const response = await axios.post(
      `${process.env.PAYMOB_BASE_URL}/auth/tokens`,
      payload,
      { headers: { "Content-Type": "application/json" } }
    );
    return response.data.token;
  } catch (error) {
    console.error(
      "Error in getAuthToken:",
      error.response ? error.response.data : error.message
    );
    throw error;
  }
}

async function createOrder(authToken, orderDetails) {
  const payload = {
    auth_token: authToken,
    delivery_needed: false, // use a Boolean
    amount_cents: orderDetails.amountCents,
    currency: orderDetails.currency,
    merchant_order_id: orderDetails.merchantOrderId,
    items: orderDetails.items,
  };

  try {
    const response = await axios.post(
      `${process.env.PAYMOB_BASE_URL}/ecommerce/orders`,
      payload,
      { headers: { "Content-Type": "application/json" } }
    );
    return response.data.id;
  } catch (error) {
    console.error(
      "Error in createOrder:",
      error.response ? error.response.data : error.message
    );
    throw error;
  }
}

async function getPaymentKey(
  authToken,
  orderId,
  billingData,
  amountCents,
  currency
) {
  const payload = {
    auth_token: authToken,
    amount_cents: amountCents,
    expiration: 3600,
    order_id: orderId,
    billing_data: billingData,
    currency: currency,
    integration_id: Number(process.env.PAYMOB_CARD_INTEGRATION_ID), // ensure it's a number
  };

  try {
    const response = await axios.post(
      `${process.env.PAYMOB_BASE_URL}/acceptance/payment_keys`,
      payload,
      { headers: { "Content-Type": "application/json" } }
    );
    return response.data.token;
  } catch (error) {
    console.error(
      "Error in getPaymentKey:",
      error.response ? error.response.data : error.message
    );
    throw error;
  }
}

router.post("/api/initiate-payment", async (req, res) => {
  try {
    const orderDetails = {
      amountCents: req.body.amountCents,
      currency: req.body.currency || "EGP",
      merchantOrderId: req.body.merchantOrderId,
      items: req.body.items || [],
    };

    const billingData = {
      first_name: req.body.firstName,
      last_name: req.body.lastName,
      phone_number: req.body.phoneNumber,
      country: req.body.country || "EG",
      city: req.body.city,
      email: req.body.email,
      street: req.body.street,
      building: req.body.building,
      floor: req.body.floor,
      apartment: req.body.apartment,
    };

    const authToken = await getAuthToken();
    const orderId = await createOrder(authToken, orderDetails);
    const paymentKey = await getPaymentKey(
      authToken,
      orderId,
      billingData,
      orderDetails.amountCents,
      orderDetails.currency
    );

    res.json({
      paymentKey,
      iframeId: process.env.PAYMOB_IFRAME_ID,
    });
  } catch (error) {
    console.error(
      "Error in /api/initiate-payment:",
      error.response ? error.response.data : error.message
    );
    res.status(500).json({
      error: "Payment initiation failed. Please try again later.",
      details: error.response ? error.response.data : error.message,
    });
  }
});

router.post("/callback", async (req, res) => {
  try {
    const callbackData = req.body;

    // Bypass HMAC verification for testing (or use your verification function)
    if (!callbackData.hmac) {
      console.warn("No HMAC provided, bypassing signature verification for testing.");
    } else if (!verifyPaymobHmac(callbackData)) {
      console.error("Invalid Paymob signature:", callbackData);
      return res.status(400).send("Invalid callback data");
    }
    
    // Extract the transaction details
    const transaction = callbackData.obj;
    if (!transaction) {
      console.error("No transaction data found in callback.");
      return res.status(400).send("No transaction data");
    }
    
    // Check if the payment was successful
    const paymentSuccessful = transaction.success === true || 
                              (transaction.order && transaction.order.payment_status === "PAID");
    if (!paymentSuccessful) {
      console.warn("Payment not successful:", transaction);
      return res.status(400).send("Payment not successful");
    }
    
    // Map customer/billing details from payment_key_claims.billing_data (or shipping_data)
    const billingData = transaction.payment_key_claims?.billing_data || transaction.order?.shipping_data || {};
    
    // Create the order data object using mapped fields
    const orderData = {
      status: "Pending",
      merchant_order_id: transaction.order?.merchant_order_id, // Unique order ID from Paymob
      item: (transaction.order && transaction.order.items && transaction.order.items[0] && transaction.order.items[0].name) || "Not Provided",
      customer_name: billingData.first_name || "Not Provided",
      clinic_name: billingData.last_name || "Not Provided", // If you expect clinic name here
      phone_number: billingData.phone_number || "Not Provided",
      city: billingData.city || "Not Provided",
      state: billingData.state || "Not Provided",
      additional_details: billingData.extra_description || ""
    };

    // Update existing order (if stored during payment initiation) or create a new one
    const existingOrder = await Order.findOne({ merchant_order_id: orderData.merchant_order_id });
    if (existingOrder) {
      Object.assign(existingOrder, orderData);
      await existingOrder.save();
      console.log("Order updated:", existingOrder);
    } else {
      const newOrder = new Order(orderData);
      await newOrder.save();
      console.log("New order created:", newOrder);
    }
    
    return res.status(200).send("Payment successful and order updated");
  } catch (error) {
    console.error("Error in /paymob/callback:", error.response ? error.response.data : error.message);
    return res.status(500).send("Server error in processing callback");
  }
});



// 5) Example HMAC verification function

function verifyPaymobHmac(data) {
  // If the callback does not include a signature, log a warning and return true for testing.
  if (!data.hmac) {
    console.warn("No HMAC found in callback data. Bypassing signature verification for testing.");
    return true;
  }
  const secret = process.env.PAYMOB_HMAC_SECRET;
  const message =
    String(data.merchant_order_id || "") +
    String(data.order_id || "") +
    String(data.amount_cents || "") +
    String(data.currency || "") +
    String(data.status || "");
  const computedHmac = crypto
    .createHmac("sha512", secret)
    .update(message)
    .digest("hex");

  console.log("Computed HMAC:", computedHmac, "Received HMAC:", data.hmac);
  return computedHmac === data.hmac;
}


export default router;
