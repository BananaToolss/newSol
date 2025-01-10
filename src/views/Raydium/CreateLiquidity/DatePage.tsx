import React from 'react';
import { DatePicker, Space } from 'antd';
import type { DatePickerProps, GetProps } from 'antd';

const onChange: DatePickerProps['onChange'] = (date, dateString) => {
  console.log(date, dateString);
};

const App: React.FC = () => (
  <Space direction="vertical" size={12}>
    <DatePicker
      showTime
      onChange={onChange}
      size='large'
    />

  </Space>
);

export default App;