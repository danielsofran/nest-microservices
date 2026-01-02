export const config = () => ({
  server: {
    port: 7001,
  },
  mail: {
    host: process.env.MAIL_HOST || "smtp.gmail.com",
    port: parseInt(process.env.MAIL_PORT || "587") || 587,
    secure: process.env.MAIL_SECURE === "true" || false,
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS, // Gmail App Password (16-character)
    from: process.env.FROM_EMAIL || "NestJSGatewayTeam@testing.com",
  },
})