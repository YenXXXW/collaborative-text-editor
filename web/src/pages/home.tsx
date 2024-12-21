import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { CheckHealth } from '@/services/checkHealth'

export default function Home() {

  const navigate = useNavigate()
  const checkHealth = async () => {
    await CheckHealth()
  }
  return (
    <>
      <Button onClick={checkHealth}>Create A Room</Button>

      <Button>Join Room</Button>
    </>

  )
}
