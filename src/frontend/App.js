import "./App.css"
import { Uploader } from "./utils/upload"
import { useEffect, useState } from "react"
import {Progress, Button, Upload} from "antd"

function App() {
  const [file, setFile] = useState(undefined)
  const [uploader, setUploader] = useState(undefined)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (file) {
      const videoUploaderOptions = {
        fileName: "foo",
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
        .onError((error) => {
          setFile(undefined)
          console.error(error)
        })

      // uploader.start()
    }
  }, [file])

  const onCancel = () => {
    if (uploader) {
      uploader.abort()
      setFile(undefined)
    }
  }

  return (
    <div className="Container">
      <h1>Upload your file</h1>
      <div className="mt-1">
        {/* <input
          type="file"
          onChange={(e) => {
            setFile(e.target?.files?.[0])
          }}
        /> */}
        <Upload>
          
        </Upload>
      </div>

      {
        file && <>
          <Progress percent={progress}></Progress>
          <Button danger onClick={onCancel}>Cancel</Button>
        </>
      }      
      
    </div>
  )
}

export default App
