import Bundle from "../models/Bundle.js";
import Transaction from "../models/Transaction.js";

class BundleService {
  async getAllBundles() {
    return await Bundle.find().sort({ price: -1 });
  }
  async getBundleById(id) {
    return await Bundle.findById(id);
  }

  async createBundle(bundleData) {
    const bundle = new Bundle(bundleData);
    return await bundle.save();
  }

  async updateBundle(id, bundleData) {
    return await Bundle.findByIdAndUpdate(id, bundleData, { new: true });
  }

  async deleteBundle(id) {
    return await Bundle.findByIdAndDelete(id);
  }

  async purchaseBundle({ name, email, bundleId }) {
    // Optionally, verify that the bundle exists
    const bundle = await Bundle.findById(bundleId);
    if (!bundle) {
      throw new Error("Bundle not found");
    }
    const transaction = new Transaction({
      name,
      email,
      bundle: bundle._id,
    });
    return await transaction.save();
  }
}

export default new BundleService();
