import bundleService from "../services/bundleService.js";

class BundleController {
  async getAllBundles(req, res, next) {
    try {
      const bundles = await bundleService.getAllBundles();
      res.json(bundles);
    } catch (error) {
      next(error);
    }
  }

  async getBundleById(req, res, next) {
    try {
      const bundle = await bundleService.getBundleById(req.params.id);
      if (!bundle) {
        return res.status(404).json({ message: "Bundle not found" });
      }
      res.json(bundle);
    } catch (error) {
      next(error);
    }
  }

  async createBundle(req, res, next) {
    try {
      const newBundle = await bundleService.createBundle(req.body);
      res.status(201).json(newBundle);
    } catch (error) {
      next(error);
    }
  }

  async updateBundle(req, res, next) {
    try {
      const updatedBundle = await bundleService.updateBundle(
        req.params.id,
        req.body
      );
      if (!updatedBundle) {
        return res.status(404).json({ message: "Bundle not found" });
      }
      res.json(updatedBundle);
    } catch (error) {
      next(error);
    }
  }

  async deleteBundle(req, res, next) {
    try {
      const deletedBundle = await bundleService.deleteBundle(req.params.id);
      if (!deletedBundle) {
        return res.status(404).json({ message: "Bundle not found" });
      }
      res.json({ message: "Bundle deleted successfully" });
    } catch (error) {
      next(error);
    }
  }

  async purchaseBundle(req, res, next) {
    try {
      const { name, email, bundleId } = req.body;
      if (!name || !email || !bundleId) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      const purchase = await bundleService.purchaseBundle({
        name,
        email,
        bundleId,
      });
      res.status(201).json(purchase);
    } catch (error) {
      next(error);
    }
  }
}

export default new BundleController();
