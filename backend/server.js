require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const secureLogger = require("./utils/secureLogger"); 
const errorHandler = require("./middlewear/errorHandler"); 

const petOwnerRoutes = require("./routes/petOwnerRoutes");
const inventoryItemRoutes = require("./routes/inventoryitemsRoutes");
const lostPetNoticeRoutes = require("./routes/lostPetNoticeRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const adoptionFormRoutes = require("./routes/adoptionRoutes");
const petRoutes = require("./routes/petRoutes");
const doctorRoutes = require("./routes/doctorRoutes");
const medicalRecordRoute = require("./routes/medicalRecordRoute");
const messageRoutes = require("./routes/messageRoutes");
const supplierRoutes = require("./routes/supplierRoutes");
const salesRoutes = require("./routes/salesRoutes");
const oauthRoutes = require("./routes/oauthRoutes");
const adoptionRequestRoutes = require("./routes/adoptionRequestRoutes");
const { app, server } = require("./socket/socket");
const adminRoutes = require("./routes/adminRoutes");
const AdminModel = require("./models/adminModel");
const bcrypt = require("bcrypt");
const passport = require("./config/passport");

//const app = express()
const corsAccessUrl = [process.env.FRONTEND_URL || ""];

app.use(passport.initialize());

const corsOptions = {
  origin: corsAccessUrl,
  credentials: true,
  optionSuccessStatus: 200,
};

app.use(cors(corsOptions));

//middleware
app.use(express.json());

app.use((req, res, next) => {
  console.log(req.path, req.method);
  next();
});
app.use(express.static("Images"));

//Routes
app.use("/api/petOwner", petOwnerRoutes);
app.use("/api/inventoryItems", inventoryItemRoutes);
app.use("/api/lostPetNotice", lostPetNoticeRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/adoption", adoptionFormRoutes);
app.use("/api/adoptionRequest", adoptionRequestRoutes);
app.use("/api/pet", petRoutes);
app.use("/api/doctor", doctorRoutes);
app.use("/api/medicalRec", medicalRecordRoute);
app.use("/api/supplier", supplierRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/sales", salesRoutes);
app.use("/api/oauth", oauthRoutes);
app.use("/api/admin", adminRoutes);

// Replace any console.log statements with secure logger
const PORT = process.env.PORT || 4000;

// Database connection with secure logging
mongoose
  .connect(process.env.MONGOOSE_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    secureLogger.info("Database connected successfully", {
      component: "server",
      action: "database_connection",
    });
  })
  .catch((error) => {
    secureLogger.error("Database connection failed", {
      component: "server",
      action: "database_connection",
      error: error.message,
    });
  });

// Error handling middleware (should be last)
app.use(errorHandler);

app.listen(PORT, () => {
  secureLogger.info("Server started successfully", {
    component: "server",
    action: "server_start",
    port: PORT,
    environment: process.env.NODE_ENV || "development",
  });
});
