require('dotenv').config();

module.exports = {
  MONGODB_URI: process.env.MONGODB_URI,
  port: process.env.PORT || 5000,
  VENDOR1: {
    EMAIL: process.env.VENDOR1_EMAIL,
    PASSWORD: process.env.VENDOR1_PASSWORD,
    LOGIN_URL: process.env.VENDOR1_LOGIN_URL
  },
  VENDOR2: {
    EMAIL: process.env.VENDOR2_EMAIL,
    PASSWORD: process.env.VENDOR2_PASSWORD,
    LOGIN_URL: process.env.VENDOR2_LOGIN_URL
  }
}; 