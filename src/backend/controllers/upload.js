const AWS = require("aws-sdk")
const { orderBy } = require("lodash")
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');

require('dotenv').config()

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
const s3Stream = require('s3-upload-stream')(s3);

// TODO: insert your bucket name here
const BUCKET_NAME = process.env.AWS_BUCKET //your bucket name.

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
    const { inputUrls, outputUrl } = req.body;

    try{
      const command = ffmpeg();

      console.log('start')
      for (let fileKey of inputUrls) {      
        console.log(fileKey.split('/').pop())
  
        await s3.headObject({
          Bucket: BUCKET_NAME,
          Key: fileKey.split('/').pop()
        }).promise()                  
        
        command.input(fileKey)
      }          
  
      console.log('start merging...')
      command      
        .mergeToFile('output.mp4')    
        .on('end', async () => {
          const result  = await s3.upload({
            Bucket: process.env.AWS_BUCKET,
            Key: outputUrl,
            Body: fs.readFileSync('output.mp4'),
            ACL: 'public-read' 
           }).promise() 
           res.send(result)
        })
        .on('error', (err) => {
          console.log('err:', err)
          res.send({error: err})
        })    
    }catch(e){
      console.log(e)
      if(e.code == "NotFound") {
        res.send({message:`Object doesn't exist`})
      } else {
        res.send({message:'something wrong'})
      }
      
    }
      
  }
}

module.exports = { UploadController }
