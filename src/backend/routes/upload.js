const { Router } = require("express")
const { UploadController } = require("../controllers/upload")

const router = Router()

router.post("/uploads/initializeMultipartUpload", UploadController.initializeMultipartUpload)
router.post("/uploads/getMultipartPreSignedUrls", UploadController.getMultipartPreSignedUrls)
router.post("/uploads/finalizeMultipartUpload", UploadController.finalizeMultipartUpload)
router.post("/uploads/concat", UploadController.concatenateFiles)
// router.get("/uploads/test", UploadController.test)

module.exports = { router }
