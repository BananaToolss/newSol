import { CloudFilled } from '@ant-design/icons'
import { Upload, message } from 'antd'
import * as XLSX from 'xlsx'


const { Dragger } = Upload

const App = ({ uploadFileHandler }) => {
  const [messageApi, contextHolder] = message.useMessage()

  const onChange = (info) => {
    const file = info.file.originFileObj
    onImportExcel(file)
  }
  const onDrop = (e) => {
    console.log('Dropped files', e.dataTransfer.files)
  }
  const onImportExcel = (file) => {
    // 获取上传的文件对象
    // const { files } = file.target;
    // 通过FileReader对象读取文件
    const fileReader = new FileReader()
    fileReader.onload = (event) => {
      try {
        const { result } = event.target
        let data = [] // 存储获取到的数据
        if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
          // 以二进制流方式读取得到整份excel表格对象
          const workbook = XLSX.read(result, { type: 'binary' })
          // 遍历每张工作表进行读取（这里默认只读取第一张表）
          for (const sheet in workbook.Sheets) {
            if (workbook.Sheets.hasOwnProperty(sheet)) {
              // 利用 sheet_to_json 方法将 excel 转成 json 数据
              data = data.concat(XLSX.utils.sheet_to_json(workbook.Sheets[sheet]))
              break // 如果只取第一张表，就取消注释这行
            }
          }
        }
        if (file.type === 'text/plain' || file.type === 'text/csv') {
          const _data = result.toString().split(/[(\r\n)\r\n]+/)
          _data.forEach((item, index) => {
            if (index > 0) {
              const arr = item.split(/[,，]+/)
              if (arr[0]) {
                const obj = { Address: arr[0], Amount: arr[1] || '' }
                data.push(obj)
              }
            }
          })
        }
        uploadFileHandler(data)
      } catch (e) {
        // 这里可以抛出文件类型错误不正确的相关提示
        messageApi.error('文件类型不正确')
      }
    }
    // 以二进制方式打开文件
    fileReader.readAsBinaryString(file)
  }

  return (
    <>
      {contextHolder}
      <Dragger onChange={onChange} onDrop={onDrop} style={{ height: 300 }}>
        <p className="ant-upload-drag-icon">
          <CloudFilled />
        </p>
        <p>将文件拖到此处或上传</p>
      </Dragger>
    </>
  )
}
export default App
