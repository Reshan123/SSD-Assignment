const Supplier = require("../models/supplierDoc");
const mongoose = require("mongoose");

//get all supplier
const getallSupplier = async (req, res) => {
  const supplier = await Supplier.find({}).sort({ createdAt: -1 });
  //createdAt -1 will put the newly added suppliers on top

  res.status(200).json(supplier);
};
//get a single suppliers
const getSupplier = async (req, res) => {
  const { id } = req.params;
  const supplier = await Supplier.findById(id);

  if (!supplier) {
    return res.status(404).json({ error: "No such supplier" });
  }

  res.status(200).json(supplier);
};

//create supplier
const createSupplier = async (req, res) => {
  const {
    supplierName,
    supplierContact,
    supplierEmail,
    supplierCompany,
    itemName,
  } = req.body;

  try {
    const supplier = await Supplier.create({
      supplierName,
      supplierContact,
      supplierEmail,
      supplierCompany,
      itemName,
    });
    res.status(200).json(supplier);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

//update supplier
const updateSupplier = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: "No such supplier" });
  }

  // prevent arbitrary field injection
  const {
    supplierName,
    supplierContact,
    supplierEmail,
    supplierCompany,
    itemName,
  } = req.body;
  const updateFields = {};

  // Only include fields that are provided in the request
  if (supplierName !== undefined) updateFields.supplierName = supplierName;
  if (supplierContact !== undefined)
    updateFields.supplierContact = supplierContact;
  if (supplierEmail !== undefined) updateFields.supplierEmail = supplierEmail;
  if (supplierCompany !== undefined)
    updateFields.supplierCompany = supplierCompany;
  if (itemName !== undefined) updateFields.itemName = itemName;

  const supplier = await Supplier.findOneAndUpdate({ _id: id }, updateFields, {
    new: true,
  });
  if (!supplier) {
    return res.status(404).json({ error: "No such supplier" });
  }
  res.status(200).json(supplier);
};

//delete supplier
const deleteSupplier = async (req, res) => {
  const { id } = req.params;
  const supplier = await Supplier.findByIdAndDelete({ _id: id });

  if (!supplier) {
    return res.status(404).json({ error: "No such supplier" });
  }

  res.status(200).json(supplier);
};

module.exports = {
  getallSupplier,
  getSupplier,
  createSupplier,
  deleteSupplier,
  updateSupplier,
};
