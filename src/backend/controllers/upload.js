const AWS = require("aws-sdk")
const { json } = require("express")
const { orderBy } = require("lodash")
require('dotenv').config()
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const { Transform } = require('stream');
const { S3UploadStream } = require('s3-upload-stream');

// TODO: insert the valid endpoint here
const s3Endpoint = new AWS.Endpoint("")

// TODO: insert your credentials here
const s3Credentials = new AWS.Credentials({
  accessKeyId: process.env.AWS_ACCESS_KEY, //your access key 
  secretAccessKey: process.env.AWS_SECRET_KEY,//secret key 
})

const s3 = new AWS.S3({
  // endpoint: s3Endpoint,
  region: 'us-west-2',
  credentials: s3Credentials,
})

// TODO: insert your bucket name here
const BUCKET_NAME = "clipppy" //your bucket name.

const UploadController = {
  test: async (req, res) => {
    const buckets = await s3.listBuckets().promise();
    console.log(buckets)
    
    res.send(`${buckets}`)
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

  concatenateFiles: async (req, res) => {
    const { fileKeys, outputKey } = req.body;

    const command = ffmpeg();

    for (let fileKey of fileKeys) {      
      const fileStream = s3.getObject({ Bucket: BUCKET_NAME, Key: fileKey }).createReadStream();
      command.input(fileStream);
    }

    // // Transform stream that removes metadata from the output stream
    // const removeMetadata = new Transform({
    //   transform(chunk, encoding, callback) {
    //     this.push(chunk.slice(chunk.indexOf('mdat')));
    //     callback();
    //   }
    // });

    // const concatStream = command
    //   .on('error', function(err) {
    //     console.log('An error occurred: ' + err.message);
    //     res.status(500).send({ error: 'Failed to concatenate files' });
    //   })
    //   .format('mp4')
    //   .stream()
    //   .pipe(removeMetadata); // remove metadata

    // const upload = new S3UploadStream({ Bucket: BUCKET_NAME, Key: outputKey, ACL: 'public-read' });

    // concatStream.pipe(upload)
    //   .on('uploaded', function(details) {
    //     console.log('Successfully uploaded data');
    //     res.send({ fileKey: outputKey });
    //   })
    //   .on('error', function(error) {
    //     console.log('Error uploading data: ', error);
    //     res.status(500).send({ error: 'Failed to upload file' });
    //   });
    res.send({fileKeys, outputKey})
  }
}

module.exports = { UploadController }
