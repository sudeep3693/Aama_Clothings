import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const connectDB = async () => {
  try {
    await prisma.$connect();
    console.log("MySQL DB connected via Prisma");
  } catch (error) {
    console.error("Error connecting to MySQL DB:", error.message);
  }
};

export { prisma };
export default connectDB;
