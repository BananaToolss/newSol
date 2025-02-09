import React, { Dispatch, useEffect, useState } from 'react';
import { PlusOutlined } from '@ant-design/icons';
import { Image, Upload, message } from 'antd';
import type { GetProp, UploadFile, UploadProps } from 'antd';
import { useTranslation } from "react-i18next";

type FileType = Parameters<GetProp<UploadProps, 'beforeUpload'>>[0];

const getBase64 = (file: FileType): Promise<string> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
    });

interface PropsType {
    setImageFile: Dispatch<any>
    image?: string
}

const App = (props: PropsType) => {
    const { t } = useTranslation()
    const { setImageFile, image } = props
    const [messageApi, contextHolder] = message.useMessage();
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewImage, setPreviewImage] = useState('');
    const [fileList, setFileList] = useState<UploadFile[]>([]);

    useEffect(() => {
        if (image) setPreviewImage(image)
    }, [image])

    const handlePreview = async (file: UploadFile) => {
        if (!file.url && !file.preview) {
            file.preview = await getBase64(file.originFileObj as FileType);
        }

        setPreviewImage(file.url || (file.preview as string));
        setPreviewOpen(true);
    };

    const handleChange: UploadProps['onChange'] = ({ fileList: newFileList }) => {
        if (newFileList[0] && newFileList[0].originFileObj) {
            console.log(newFileList[0].originFileObj.size)
            if (newFileList[0].originFileObj.size > 1024 * 100) return messageApi.error('图片大小不能超过100kb')
            setImageFile(newFileList[0].originFileObj)
        }
        setFileList(newFileList);
    }

    const uploadButton = (
        <button style={{ border: 0, background: 'none' }} type="button">
            <PlusOutlined />
            <div style={{ marginTop: 8 }}>{t('Click to upload')}</div>
        </button>
    );
    return (
        <>{contextHolder}
            <Upload
                listType="picture-card"
                fileList={fileList}
                onPreview={handlePreview}
                onChange={handleChange}
            >
                {(fileList.length == 0 && image) ?
                    <img src={image} alt='token_logo'/> :
                    fileList.length >= 1 ? null : uploadButton
                }
            </Upload>
            {previewImage && (
                <Image
                    wrapperStyle={{ display: 'none' }}
                    preview={{
                        visible: previewOpen,
                        onVisibleChange: (visible) => setPreviewOpen(visible),
                        afterOpenChange: (visible) => !visible && setPreviewImage(''),
                    }}
                    src={previewImage}
                />
            )}


        </>
    );
};

export default App;