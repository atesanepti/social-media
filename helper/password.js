import bcryptjs from "bcryptjs";

export const passwordEncrypt = (password) => {
  try {
    const encryptedPassword = bcryptjs.hashSync(password, 10);
    return encryptedPassword;
  } catch (error) {
    throw error;
  }
};

export const passwordMatch = async (password, hashedPassword) => {
  try {
    const isPasswordMatched = await bcryptjs.compare(password, hashedPassword);
    return isPasswordMatched;
  } catch (error) {
    throw error;
  }
};
