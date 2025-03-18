import nodemailer from "nodemailer";

export async function sendPurchaseEmail(to, bundleTitle, folderLink) {
  // Create a transporter using Gmail; ensure you have set GMAIL_USER and GMAIL_PASS in your .env file.
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.GMAIL_USER,
    to,
    subject: `Your ${bundleTitle} Purchase - Download Link`,
    text: `Thank you for your purchase! Access your coloring pages here: ${folderLink}`,
    html: `<p>Thank you for your purchase!</p>
           <p>Access your coloring pages by clicking the link below:</p>
           <a href="${folderLink}">Download Coloring Pages</a>`,
  };

  let info = await transporter.sendMail(mailOptions);
  console.log("Email sent to ", to, "with response", info.response);
  return info;
}
