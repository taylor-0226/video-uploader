const AWS = require("aws-sdk")
const { json } = require("express")
const { orderBy } = require("lodash")

// TODO: insert the valid endpoint here
const s3Endpoint = new AWS.Endpoint("")

// TODO: insert your credentials here
const s3Credentials = new AWS.Credentials({
  accessKeyId: "AKIAWDF35LFWRT67TMYQ", //your access key : AKIAWDF35LFWRT67TMYQ 
  secretAccessKey: "ZDE4Y4Ow9Cc8ZI+KTPlaBv8UTmzLfkJKFJqXjEi2",//secret key : ZDE4Y4Ow9Cc8ZI+KTPlaBv8UTmzLfkJKFJqXjEi2
})

const s3 = new AWS.S3({
  // endpoint: s3Endpoint,
  credentials: s3Credentials,
})

// TODO: insert your bucket name here
const BUCKET_NAME = "clipppy" //your bucket name.

const UploadController = {
  test: async (req, res) => {
    const buckets = await s3.listBuckets().promise();
    // console.log(buckets);
    res.send(buckets)
  },
  initializeMultipartUpload: async (req, res) => {
    const { name } = req.body

    const multipartParams = {
      Bucket: BUCKET_NAME,
      Key: `${name}`,
      ACL: "public-read",
    }

    const multipartUpload = await s3.createMultipartUpload(multipartParams).promise()

    res.send({
      fileId: multipartUpload.UploadId,
      fileKey: multipartUpload.Key,
    })
  },

  getMultipartPreSignedUrls: async (req, res) => {
    const { fileKey, fileId, parts } = req.body

    const multipartParams = {
      Bucket: BUCKET_NAME,
      Key: fileKey,
      UploadId: fileId,
    }

    const promises = []

    for (let index = 0; index < parts; index++) {
      promises.push(
        s3.getSignedUrlPromise("uploadPart", {
          ...multipartParams,
          PartNumber: index + 1,
        }),
      )
    }

    const signedUrls = await Promise.all(promises)

    const partSignedUrlList = signedUrls.map((signedUrl, index) => {
      return {
        signedUrl: signedUrl,
        PartNumber: index + 1,
      }
    })

    res.send({
      parts: partSignedUrlList,
    })
  },

  finalizeMultipartUpload: async (req, res) => {
    const { fileId, fileKey, parts } = req.body

    const multipartParams = {
      Bucket: BUCKET_NAME,
      Key: fileKey,
      UploadId: fileId,
      MultipartUpload: {
        // ordering the parts to make sure they are in the right order
        Parts: orderBy(parts, ["PartNumber"], ["asc"]),
      },
    }

    const result = await s3.completeMultipartUpload(multipartParams).promise()    
    
    res.send(result)
  },
}

module.exports = { UploadController }
