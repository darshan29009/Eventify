const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs').promises;

// Ensure upload directory exists
const ensureUploadDir = async () => {
  const uploadDirs = [
    'uploads',
    'uploads/events',
    'uploads/employees',
    'uploads/bookings',
    'uploads/receipts',
    'uploads/tasks',
    'uploads/temp'
  ];

  for (const dir of uploadDirs) {
    try {
      await fs.access(dir);
    } catch {
      await fs.mkdir(dir, { recursive: true });
      console.log(`📁 Created directory: ${dir}`);
    }
  }
};

// Allowed file types
const fileTypes = {
  image: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'],
  document: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt', 'csv'],
  video: ['mp4', 'avi', 'mov', 'wmv', 'webm'],
  archive: ['zip', 'rar', '7z']
};

// Maximum file sizes (in bytes)
const maxSizes = {
  image: 5 * 1024 * 1024,      // 5MB
  document: 10 * 1024 * 1024,  // 10MB
  video: 100 * 1024 * 1024,    // 100MB
  archive: 50 * 1024 * 1024    // 50MB
};

// Storage configuration for images
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    await ensureUploadDir();

    // Determine destination folder based on file type and upload context
    let folder = 'temp';

    if (file.fieldname === 'eventImage' || file.fieldname === 'venueImage') {
      folder = 'events';
    } else if (file.fieldname === 'employeePhoto' || file.fieldname === 'employeeDocument') {
      folder = 'employees';
    } else if (file.fieldname === 'bookingAttachment' || file.fieldname === 'contract') {
      folder = 'bookings';
    } else if (file.fieldname === 'receipt' || file.fieldname === 'paymentProof') {
      folder = 'receipts';
    } else if (file.fieldname === 'taskAttachment' || file.fieldname === 'workPhoto') {
      folder = 'tasks';
    }

    cb(null, `uploads/${folder}`);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname).toLowerCase()}`;
    cb(null, uniqueName);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase().slice(1);
  const fieldName = file.fieldname;

  // Define allowed types based on field
  let allowedExtensions;

  switch (fieldName) {
    case 'eventImage':
    case 'venueImage':
    case 'employeePhoto':
    case 'workPhoto':
      allowedExtensions = fileTypes.image;
      break;
    case 'employeeDocument':
    case 'bookingAttachment':
    case 'contract':
    case 'receipt':
    case 'paymentProof':
    case 'taskAttachment':
      allowedExtensions = [...fileTypes.document, ...fileTypes.image, ...fileTypes.video];
      break;
    default:
      allowedExtensions = [...fileTypes.image, ...fileTypes.document, ...fileTypes.video, ...fileTypes.archive];
  }

  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed types: ${allowedExtensions.join(', ')}`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB global limit
    fields: 10 // Max number of fields
  }
});

// Multiple file upload
const uploadMultiple = upload.array('files', 10);

// Single file upload
const uploadSingle = upload.single('file');

// Field-specific uploads
const uploadEventImage = upload.single('eventImage');
const uploadEmployeePhoto = upload.single('employeePhoto');
const uploadEmployeeDocument = upload.array('employeeDocument', 5);
const uploadBookingAttachment = upload.array('bookingAttachment', 5);
const uploadContract = upload.single('contract');
const uploadReceipt = upload.single('receipt');
const uploadTaskAttachment = upload.array('taskAttachment', 10);
const uploadWorkPhoto = upload.array('workPhoto', 20);

// Middleware to handle upload errors
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 20MB.'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files uploaded.'
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected file field.'
      });
    }
  }

  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message || 'File upload failed'
    });
  }

  next();
};

// Utility to delete file
const deleteFile = async (filePath) => {
  try {
    if (!filePath) return false;
    await fs.unlink(filePath);
    return true;
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error('Error deleting file:', error);
      return false;
    }
    return true; // File didn't exist
  }
};

// Utility to get file info
const getFileInfo = (req, file) => {
  if (!file) return null;

  return {
    filename: file.filename,
    originalname: file.originalname,
    path: file.path,
    size: file.size,
    mimetype: file.mimetype,
    fieldname: file.fieldname,
    url: `${process.env.API_URL || 'http://localhost:5000'}/${file.path}`
  };
};

// Uploaded files list (from request)
const getUploadedFiles = (req) => {
  const files = [];

  if (req.file) files.push(req.file);
  if (req.files) {
    if (Array.isArray(req.files)) {
      files.push(...req.files);
    } else {
      files.push(req.files);
    }
  }

  return files.map(file => getFileInfo(req, file));
};

module.exports = {
  upload,
  uploadMultiple,
  uploadSingle,
  uploadEventImage,
  uploadEmployeePhoto,
  uploadEmployeeDocument,
  uploadBookingAttachment,
  uploadContract,
  uploadReceipt,
  uploadTaskAttachment,
  uploadWorkPhoto,
  handleUploadError,
  deleteFile,
  getFileInfo,
  getUploadedFiles,
  ensureUploadDir,
  fileTypes,
  maxSizes
};
