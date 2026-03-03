const uploadImage = async (req, res) => {
  try {
    // 1. Check if the file exists in the request
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file selected!",
      });
    }

    // 2. Get the Cloudinary URL from the file object
    const imageUrl = req.file.path;

    // 3. Send the URL back to the client (Frontend)
    res.status(200).json({
      success: true,
      message: "Image uploaded successfully!",
      url: imageUrl,
    });
  } catch (error) {
    console.error("Upload Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error, please try again.",
      error: error.message,
    });
  }
};

const uploadMultipleImages = async (req, res) => {
  try {
    // ১. চেক করা অনেকগুলো ফাইল আছে কি না
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No files selected!",
      });
    }

    // ২. সব ছবির ক্লাউডিনারি ইউআরএল গুলোকে একটি অ্যারেতে নেওয়া
    const imageUrls = req.files.map((file) => file.path);

    // ৩. পুরো অ্যারেটা রেসপন্স হিসেবে পাঠানো
    res.status(200).json({
      success: true,
      message: "Images uploaded successfully!",
      urls: imageUrls, // এখানে এখন অনেকগুলো লিংক থাকবে
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Upload failed!",
      error: error.message,
    });
  }
};

module.exports = { uploadImage, uploadMultipleImages };


