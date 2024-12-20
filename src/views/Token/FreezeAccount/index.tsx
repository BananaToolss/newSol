import React from 'react'
import { getAllToken } from '@/utils/newSol'
import { Button } from 'antd'

function Burn() {
  const click = () => {
    getAllToken('HoeFkdmh4oKFwC1wLmCkC63bSuahRhvCPWYY8sybwEyn')
  }
  return (
    <div>index

      <Button onClick={click}>sdfsdf</Button>
    </div>
  )
}

export default Burn