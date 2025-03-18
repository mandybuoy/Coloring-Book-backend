const Transaction = require("../models/Transaction");
const Bundle = require("../models/Bundle");
const { verifyPayment } = require("../services/paymentService");
const { sendPurchaseEmail } = require("../services/emailService");
const { shareFolderWithUser } = require("../services/driveService");

// 1. Initiate Payment
const initiatePayment = async (req, res) => {
  try {
    const { name, email, bundleName } = req.body;

    // Validate request
    if (!name || !email || !bundleName) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Find the bundle
    const bundle = await Bundle.findOne({ title: bundleName });
    if (!bundle) {
      return res.status(404).json({ error: "Bundle not found" });
    }

    // Create transaction
    const transaction = await Transaction.create({
      name,
      email,
      bundle: bundle._id,
      status: "pending",
      amount: bundle.price,
      paymentId: "TBD",
    });

    // Build callback URL
    // Dodo Payments will redirect here after the user completes or cancels payment.
    // We'll include both the transactionId and possibly the paymentId from Dodo
    // in query params. For example:
    const callbackUrl = encodeURIComponent(
      `${process.env.BASE_URL}/api/confirm-payment?transactionId=${transaction._id}`
    );

    // Payment link from the bundle
    // e.g. "https://checkout.dodopayments.com/buy/pdt_jb6VKF9thGWi4BIeLQ190?quantity=1"
    // We just append &redirect_url=<callbackUrl> to it:
    const paymentUrl = `${bundle.paymentLink}&redirect_url=${callbackUrl}`;

    return res.json({ paymentUrl });
  } catch (error) {
    console.error("Error initiating payment:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// 2. Confirm Payment
const confirmPayment = async (req, res) => {
  try {
    // We expect the 'transactionId' and possibly 'paymentId' in the query.
    // In many flows, Dodo might pass the paymentId automatically.
    // For example, your link might look like:
    //   /api/payments/confirm?transactionId=12345&paymentId=pay_abcdef
    // Adjust according to how Dodo actually returns data.
    const { transactionId, payment_id } = req.query;

    // Find transaction
    const transaction = await Transaction.findById(transactionId).populate(
      "bundle"
    );
    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    // If already processed, stop here
    if (transaction.status !== "pending") {
      return res.status(400).json({ error: "Transaction already processed" });
    }

    // Verify payment with Dodo
    const paymentStatus = await verifyPayment(payment_id);
    if (paymentStatus.success) {
      // Share folder with user
      await shareFolderWithUser(
        transaction.bundle.driveFolderId,
        transaction.email
      );

      // Send email with coloring pages (or a download link)
      // You might store the actual PDF paths or a link in the DB
      // For demonstration, we'll just do:
      const to = transaction.email;
      const bundleTitle = transaction.bundle.title;
      const folderLink = `https://drive.google.com/drive/folders/${transaction.bundle.driveFolderId}`;
      await sendPurchaseEmail(to, bundleTitle, folderLink);

      // Payment success
      transaction.status = "completed";
      transaction.paymentId = payment_id;
      transaction.updatedAt = new Date();
      transaction.transactionDate = new Date();
      await transaction.save();

      // Redirect to your "Thank you" page with transaction ID as query parameter
      return res.redirect(
        `${process.env.CLIENT_URL}/payment-success?transactionId=${transaction._id}`
      );
    } else {
      // Payment failed
      transaction.status = "failed";
      transaction.updatedAt = new Date();
      await transaction.save();

      // Redirect to your "Failure" page
      return res.redirect(`${process.env.CLIENT_URL}/payment-failure`);
    }
  } catch (error) {
    console.error("Error confirming payment:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const getTransaction = async (req, res) => {
  const { transactionId } = req.query;
  const transaction = await Transaction.findById(transactionId);
  const { name, email, bundle } = transaction;
  return res.json({ name, email, bundle });
};

module.exports = { initiatePayment, confirmPayment, getTransaction };
