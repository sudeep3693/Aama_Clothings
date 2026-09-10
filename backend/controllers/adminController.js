import { prisma } from "../config/db.js";
import bcrypt from "bcryptjs";
import { decryptAES } from "../utils/crypto.js";

/**
 * POST /api/user/admin/change-password
 * Protected by authAdmin middleware.
 * Body: { currentEncryptedPassword, currentIv, newEncryptedPassword, newIv }
 */
const adminChangePassword = async (req, res) => {
  try {
    const {
      adminId,
      currentEncryptedPassword,
      currentIv,
      newEncryptedPassword,
      newIv,
    } = req.body;

    if (
      !currentEncryptedPassword ||
      !currentIv ||
      !newEncryptedPassword ||
      !newIv
    ) {
      return res.json({
        success: false,
        message: "All password fields are required",
      });
    }

    // Decrypt incoming AES-encrypted passwords
    const currentPassword = decryptAES(currentEncryptedPassword, currentIv);
    const newPassword = decryptAES(newEncryptedPassword, newIv);

    if (!newPassword || newPassword.length < 8) {
      return res.json({
        success: false,
        message: "New password must be at least 8 characters",
      });
    }

    // Find admin record
    const admin = await prisma.admin.findUnique({ where: { id: adminId } });
    if (!admin) {
      return res.json({ success: false, message: "Admin not found" });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, admin.password);
    if (!isMatch) {
      return res.json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // Hash and save new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await prisma.admin.update({
      where: { id: adminId },
      data: { password: hashedPassword },
    });

    res.json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export { adminChangePassword };
