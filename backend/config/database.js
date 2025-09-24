const mongoose = require("mongoose");

/**
 * Secure database connection with environment variable validation
 * Fixes: Exposed Database Credentials vulnerability (CVSS: 9.1 - Critical)
 */
const connectDB = async () => {
  try {
    // SECURITY: Validate required environment variables
    const requiredEnvVars = [
      "DB_USERNAME",
      "DB_PASSWORD",
      "DB_NAME",
      "DB_CLUSTER",
    ];
    const missingVars = requiredEnvVars.filter(
      (envVar) => !process.env[envVar]
    );

    if (missingVars.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missingVars.join(", ")}`
      );
    }

    // SECURITY: Construct secure connection string from individual components
    const mongoURI = `mongodb+srv://${
      process.env.DB_USERNAME
    }:${encodeURIComponent(process.env.DB_PASSWORD)}@${
      process.env.DB_CLUSTER
    }/${process.env.DB_NAME}?retryWrites=true&w=majority&appName=Cluster0`;

    // SECURITY: Enhanced connection options for security
    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverApi: { version: "1", strict: true, deprecationErrors: true },
    });

    console.log(`MongoDB Connected Securely: ${conn.connection.host}`);

    // SECURITY: Log connection without exposing credentials
    console.log(`Database: ${process.env.DB_NAME}`);
  } catch (error) {
    console.error(" Database connection failed:", error.message);

    // SECURITY: Don't expose connection details in production
    if (process.env.NODE_ENV !== "production") {
      console.error("Connection details (dev mode only):", {
        username: process.env.DB_USERNAME ? "***" : "MISSING",
        password: process.env.DB_PASSWORD ? "***" : "MISSING",
        database: process.env.DB_NAME || "MISSING",
        cluster: process.env.DB_CLUSTER || "MISSING",
      });
    }

    process.exit(1);
  }
};

/**
 * Graceful shutdown handler
 */
const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    console.log("MongoDB connection closed.");
  } catch (error) {
    console.error("Error closing MongoDB connection:", error.message);
  }
};

// ✅ SECURITY: Handle process termination gracefully
process.on("SIGINT", async () => {
  console.log("\n SIGINT received, shutting down gracefully...");
  await disconnectDB();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\n SIGTERM received, shutting down gracefully...");
  await disconnectDB();
  process.exit(0);
});

module.exports = { connectDB, disconnectDB };
