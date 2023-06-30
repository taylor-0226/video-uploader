import "./App.css"
import { Uploader } from "./utils/upload"
import { LoadingOutlined, PlusOutlined } from '@ant-design/icons';
import { useEffect, useState } from "react"
import {Button, Upload, message, Progress} from "antd"
import { UploadChangeParam } from 'antd/es/upload';
import { RcFile, UploadFile, UploadProps } from 'antd/es/upload/interface';

function App1() {
  const [file, setFile] = useState(undefined)
  const [loading, setLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState();
  const [uploader, setUploader] = useState(undefined)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (file) {
      const videoUploaderOptions = {
        fileName: file.name,
        file: file,
      }

      let percentage = undefined

      const uploader = new Uploader(videoUploaderOptions)
      setUploader(uploader)

      uploader
        .onProgress(({ percentage: newPercentage }) => {
          // to avoid the same percentage to be logged twice
          if (newPercentage !== percentage) {
            percentage = newPercentage
            console.log(`${percentage}%`)
            setProgress(percentage)
          }
        })
        .onFinish(data => {
          console.log(`Finished ${data}`)
          setVideoUrl(data.Location) 
          setLoading(false)
          setFile(undefined)
        }) 
        .onError((error) => {
          setFile(undefined)
          console.error(error)
        })

      uploader.start()
    }
  }, [file])

  const onCancel = () => {
    if (uploader) {
      uploader.abort()
      setFile(undefined)
    }
  }  
  
  const beforeUpload = (file) => {
    // const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
    // if (!isJpgOrPng) {
    //   message.error('You can only upload JPG/PNG file!');
    // }
    // const isLt2M = file.size / 1024 / 1024 < 2;
    // if (!isLt2M) {
    //   message.error('Image must smaller than 2MB!');
    // }
    // return isJpgOrPng && isLt2M;
    console.log('beforeUpload')
  };
  
    const handleChange = (e) => {
      
      setVideoUrl(false)
      setFile(e.file.originFileObj)
      setLoading(true);
    };
  
    const uploadButton = (
      <div>
        {loading ? <>{progress}%</> : <PlusOutlined />}
        <div style={{ marginTop: 8 }}>
          {file ? progress == 100 ? 'Uploaded' : 'Uploading' : 'Upload'}
        </div>
      </div>
    );
  
    return (
      <div className="Container">
        <Upload
          name="avatar"
          listType="picture-card"
          className="avatar-uploader"
          showUploadList={false}          
          beforeUpload={beforeUpload}
          onChange={handleChange}
          progress={progress}          
        >
          { uploadButton }
        </Upload>        

        {videoUrl && <>{videoUrl}</>}
      </div>
    );
  };

export default App1
