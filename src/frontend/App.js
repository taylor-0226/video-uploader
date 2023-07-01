import "./App.css"
import { Uploader } from "./utils/upload"
import { PlusOutlined } from '@ant-design/icons';
import { useEffect, useState } from "react"
import { Upload, Divider, Input, Button, Typography} from "antd"
const {Text} = Typography

function App() {
  const [file, setFile] = useState(undefined)
  const [uploadLoading, setUploadLoading] = useState(false);
  const [concatLoading, setConcatLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState();
  const [uploader, setUploader] = useState(undefined)
  const [progress, setProgress] = useState(0)
  const [inputUrls, setInputUrls] = useState('')
  const [outputUrl, setOutputUrl] = useState('')
  const [concatedUrl, setConcatedUrl] = useState('')
  const [invalid, setInvald] = useState(false)

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
          setUploadLoading(false)
          setFile(undefined)
        }) 
        .onError((error) => {
          setFile(undefined)
          console.error(error)
        })

      uploader.start()
    }
  }, [file])  
  
  const beforeUpload = (file) => {
  
    console.log('beforeUpload')
  };
  
    const handleChange = (e) => {
      
      setVideoUrl(false)
      setFile(e.file.originFileObj)
      setUploadLoading(true);
    };

    const handleClick = async () => {      

      try {
        if (inputUrls == '' || outputUrl == '') {
          console.log(inputUrls)
          console.log(outputUrl)
          setInvald(true)
          return;
        }

        setConcatedUrl('')
        setConcatLoading(true)
        const uploader = new Uploader()
        const result = await uploader.concate({inputUrls: inputUrls.split(','), outputUrl})
        
        
        setConcatLoading(false)
        setConcatedUrl(result)
      }catch(e) {
        console.log('err:', e)
        setConcatLoading(false)
      }
      
    }

    const handleReset = () => {
      setInputUrls('')
      setOutputUrl('')
      setConcatedUrl('')
    }
  
    const uploadButton = (
      <div>
        {uploadLoading ? <>{progress}%</> : <PlusOutlined />}
        <div style={{ marginTop: 8 }}>
          {file ? progress == 100 ? 'Uploaded' : 'Uploading' : 'Upload'}
        </div>
      </div>
    );
  
    return (
      <div className="container">
         <Divider style={{marginBottom: '24px'}}>Upload Video</Divider>
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

        <div style={{marginTop:'12px'}}>{videoUrl && <Text>{videoUrl}</Text>}</div>

        <Divider style={{margin: '24px'}}>Concat Videos</Divider>
        <div className="upload-container">
          <Text>ex:) https://clipppy.s3.us-west-2.amazonaws.com/vid1.mp4,https://clipppy.s3.us-west-2.amazonaws.com/vid2.mp4</Text> 
          <Input className="upload-input" placeholder="Input urls" status={invalid && !inputUrls? 'error':''} value={inputUrls} onChange={(e) => setInputUrls(e.target.value)}/>

          <Text>ex:) output.mp4</Text> 
          <Input className="upload-input" placeholder="Input output url" status={invalid && !outputUrl? 'error':''} value={outputUrl} onChange={(e) => setOutputUrl(e.target.value)}/>

          <Button className="upload-btn" type="primary" onClick={handleClick} loading={concatLoading} style={{marginRight: '10px'}}>Concate</Button>
          <Button className="upload-btn" type="primary" onClick={handleReset} loading={concatLoading}>Reset</Button>

          {invalid}
          <div style={{marginTop:'12px'}}>
            {concatedUrl && <Text>{concatedUrl}</Text>}
          </div>
          
        </div>
        
      </div>
    );
  };

export default App
