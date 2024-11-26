import createHttpError from "http-errors";
import multer from "multer";
import path from "path";

const _dirname = path.resolve();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(_dirname + "/upload"));
  },
  filename: (req, file, cb) => {
    const filename =
      file.originalname.replace(path.extname(file.originalname), "") +
      Date.now() +
      path.extname(file.originalname);
    cb(null, filename);
  },
});

export const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const acceptable = process.env.ACCEPT_IMAGE_TYPES.split(" ");
    if (!acceptable.includes(file.mimetype)) {
      return cb(createHttpError(400, "Invalid file type"), false);
    }
    cb(null, true);
  },
});
