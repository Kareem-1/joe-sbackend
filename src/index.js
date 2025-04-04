import { config } from "dotenv";
import express from "express";
import mongoose from "mongoose";
import cors from "cors"; // Import CORS
import adminRoutes from "./routes/adminRoutes.js";
import orderRoutes from "./routes/ordersRoutes.js";
import reviewsRoutes from "./routes/reviewsRoutes.js";
import newsletterRoutes from "./routes/newsletterRoutes.js";
import paymobRoutes from "./routes/paymob.js";

config();

const app = express();

// Enable CORS for requests from localhost:5173
app.use(
  cors({
    origin: ["https://joe-ruby.vercel.app", "http://localhost:5173"], // Allow frontend URL
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // Allowed HTTP methods
    credentials: true, // Allow cookies and authentication headers if needed
  })
);

app.options("*", cors());

app.use(express.json());


mongoose
  .connect(`${process.env.DB_URI}`)
  .then(() => console.log("MONGODB CONNECTED"))
  .catch((err) => console.log(err));

app.use("/admin", adminRoutes);
app.use("/order", orderRoutes);
app.use("/reviews", reviewsRoutes);
app.use("/newsletter", newsletterRoutes);
app.use("/paymob", paymobRoutes);

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log("server is running on ", port);
});
